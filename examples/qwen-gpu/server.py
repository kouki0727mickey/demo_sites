"""Single-worker GPU service. Put behind HTTPS; never run as a public Colab service."""
import asyncio
import io
import os
import secrets
import time
from contextlib import asynccontextmanager
from PIL import Image, UnidentifiedImageError
from fastapi import FastAPI, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware

TOKEN = os.environ.get('QWEN_API_TOKEN', '')
if len(TOKEN) < 32:
    raise RuntimeError('Set QWEN_API_TOKEN to a random secret of at least 32 characters.')
ORIGIN = os.environ.get('QWEN_ALLOWED_ORIGIN', '')
if not ORIGIN.startswith('https://') or ORIGIN.endswith('/'):
    raise RuntimeError('Set QWEN_ALLOWED_ORIGIN to the exact HTTPS site origin (no trailing slash).')

jobs = {}
lock = asyncio.Lock()
pipe = None

@asynccontextmanager
async def lifespan(app):
    global pipe
    from inference import load_pipeline
    pipe = await asyncio.to_thread(load_pipeline)
    yield

app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=[ORIGIN], allow_methods=['GET', 'POST'],
                   allow_headers=['Authorization', 'Content-Type'])
bearer = HTTPBearer(auto_error=False)

def auth(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if not credentials or not secrets.compare_digest(credentials.credentials, TOKEN):
        raise HTTPException(401, 'Invalid token')


def prune():
    for key, job in list(jobs.items()):
        if job['status'] != 'running' and time.monotonic() - job['created'] > 1800:
            del jobs[key]

@app.get('/health', dependencies=[Depends(auth)])
async def health():
    return {'ready': pipe is not None, 'model': 'Qwen/Qwen-Image-2.1', 'busy': lock.locked()}

async def run(job_id, prompt, size, seed, steps, images):
    try:
        from inference import generate
        image = await asyncio.to_thread(generate, pipe, prompt, size, seed, steps, images)
        buf = io.BytesIO()
        image.save(buf, format='PNG')
        jobs[job_id].update(status='complete', image=buf.getvalue())
    except Exception:
        jobs[job_id].update(status='error', error='生成に失敗しました。GPUメモリ・サーバーログを確認してください。')
    finally:
        for image in images:
            image.close()
        lock.release()

@app.post('/jobs', dependencies=[Depends(auth)], status_code=202)
async def create_job(prompt: str = Form(min_length=1, max_length=5000),
                     size: int = Form(1024), seed: int = Form(42, ge=0, le=2147483647),
                     steps: int = Form(40, ge=1, le=50), files: list[UploadFile] = File(default=[])):
    if size not in (1024, 2048) or len(files) > 10 or not prompt.strip():
        raise HTTPException(400, 'Invalid settings')
    if lock.locked():
        raise HTTPException(409, 'GPUは生成中です。完了後に再実行してください。')
    await lock.acquire()
    images = []
    try:
        total = 0
        for file in files:
            data = await file.read(4 * 1024 * 1024 + 1)
            total += len(data)
            if len(data) > 4 * 1024 * 1024 or total > 20 * 1024 * 1024:
                raise HTTPException(413, 'Images too large')
            try:
                image = Image.open(io.BytesIO(data))
                if image.format not in ('PNG', 'JPEG', 'WEBP') or image.width * image.height > 20_000_000:
                    raise HTTPException(400, 'Invalid image')
                image.load()
                images.append(image)
            except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
                raise HTTPException(400, 'Invalid image')
        prune()
        # Bound retained output memory, while retaining the newest completed results.
        while len(jobs) >= 4:
            del jobs[next(iter(jobs))]
        job_id = secrets.token_hex(24)
        jobs[job_id] = {'status': 'running', 'created': time.monotonic()}
        asyncio.create_task(run(job_id, prompt, size, seed, steps, images))
        return {'id': job_id}
    except BaseException:
        for image in images:
            image.close()
        lock.release()
        raise
    finally:
        for file in files:
            await file.close()

@app.get('/jobs/{job_id}', dependencies=[Depends(auth)])
async def job_status(job_id: str):
    prune()
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, 'Result expired or server restarted')
    return {'status': job['status'], 'error': job.get('error')}

@app.get('/jobs/{job_id}/image', dependencies=[Depends(auth)])
async def job_image(job_id: str):
    prune()
    job = jobs.get(job_id)
    if not job or job['status'] != 'complete':
        raise HTTPException(404, 'Image unavailable')
    return Response(job['image'], media_type='image/png', headers={'Cache-Control': 'no-store'})
