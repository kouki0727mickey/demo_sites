import requests
from PIL import Image
from huggingface_hub import hf_hub_download
import uuid

def run_comfy(c):
    env = gpu_info()
    root = Path('/content/ComfyUI')
    root.mkdir(exist_ok=True)
    weights = ['diffusion_models/qwen_image_2.1_int8_convrot.safetensors',
               'text_encoders/qwen3vl_8b_int8_convrot.safetensors',
               'vae/qwen_image_2.1_vae_bf16.safetensors']
    for filename in weights:
        hf_hub_download('Comfy-Org/Qwen-Image-2.1', filename, local_dir=str(root / 'models'))
    env['revision'] = subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip()
    refs = upload_images() if c['mode'] == 'edit' else []
    prompt = effective_prompt(c)
    graph = {
      '1': {'class_type':'UNETLoader', 'inputs':{'unet_name':Path(weights[0]).name, 'weight_dtype':'default'}},
      '2': {'class_type':'CLIPLoader', 'inputs':{'clip_name':Path(weights[1]).name, 'type':'qwen_image', 'device':'default'}},
      '3': {'class_type':'VAELoader', 'inputs':{'vae_name':Path(weights[2]).name}},
      '4': {'class_type':'TextEncodeQwenImage21', 'inputs':{'clip':['2',0], 'vae':['3',0], 'prompt':prompt, 'negative_prompt':'', 'resolution':c['size']}},
      '5': {'class_type':'KSampler', 'inputs':{'model':['1',0], 'positive':['4',0], 'negative':['4',1], 'latent_image':['4',2], 'seed':c['seed'], 'steps':c['steps'], 'cfg':1.0, 'sampler_name':'euler', 'scheduler':'simple', 'denoise':1.0}},
      '6': {'class_type':'VAEDecode', 'inputs':{'samples':['5',0], 'vae':['3',0]}},
      '7': {'class_type':'SaveImage', 'inputs':{'images':['6',0], 'filename_prefix':'atlas_qwen'}}
    }
    ref_hashes = []
    for i, img in enumerate(refs, 1):
        name = 'atlas-' + uuid.uuid4().hex + '.png'
        img.save(root / 'input' / name)
        ref_hashes.append(hashlib.sha256((root / 'input' / name).read_bytes()).hexdigest())
        graph[str(10+i)] = {'class_type':'LoadImage', 'inputs':{'image':name}}
        graph['4']['inputs']['images.image_' + str(i)] = [str(10+i), 0]
    log_path = Path('/content/atlas-comfy.log')
    start = time.perf_counter()
    with log_path.open('w') as log:
        proc = subprocess.Popen([sys.executable, 'main.py', '--listen', '127.0.0.1', '--port', '8188', '--disable-auto-launch'], cwd=root, stdout=log, stderr=subprocess.STDOUT)
        try:
            for _ in range(180):
                if proc.poll() is not None:
                    raise RuntimeError('ComfyUIが終了しました。/content/atlas-comfy.log を確認してください。')
                try:
                    info = requests.get('http://127.0.0.1:8188/object_info', timeout=5)
                    if info.ok:
                        assert 'TextEncodeQwenImage21' in info.json(), 'ComfyUIの対応ノードがありません。最新版で確認してください。'
                        break
                except requests.RequestException:
                    pass
                time.sleep(2)
            else:
                raise TimeoutError('ComfyUI起動がタイムアウトしました。')
            r = requests.post('http://127.0.0.1:8188/prompt', json={'prompt':graph, 'client_id':uuid.uuid4().hex}, timeout=30)
            if not r.ok:
                print(r.text[:3000])
                raise RuntimeError('ワークフローを実行できません。上のノードエラーを確認してください。')
            job_id = r.json()['prompt_id']
            for _ in range(1200):
                history = requests.get('http://127.0.0.1:8188/history/' + job_id, timeout=10).json().get(job_id)
                if history:
                    if history.get('status', {}).get('status_str') == 'error':
                        raise RuntimeError('GPU実行でエラー。/content/atlas-comfy.log を確認してください。')
                    outputs = history.get('outputs', {}).get('7', {}).get('images', [])
                    if outputs:
                        image_info = outputs[0]
                        content = requests.get('http://127.0.0.1:8188/view', params=image_info, timeout=60)
                        content.raise_for_status()
                        image = Image.open(io.BytesIO(content.content)); image.load()
                        elapsed = time.perf_counter() - start
                        display(image)
                        return report(c, 'comfyui', 'Comfy-Org/Qwen-Image-2.1 (INT8)', elapsed, env, image=image_data(image), timing_scope='startup_and_generation_excludes_download', reference_hashes=ref_hashes)
                time.sleep(2)
            raise TimeoutError('40分以内に結果を受信できませんでした。')
        finally:
            proc.terminate()
            try: proc.wait(timeout=20)
            except subprocess.TimeoutExpired: proc.kill(); proc.wait()
