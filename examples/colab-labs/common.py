"""Shared helpers embedded into the Colab notebooks. No public server or tunnel."""
import base64
import datetime
import hashlib
import io
import json
import math
import os
from pathlib import Path
import platform
import subprocess
import sys
import time

KINDS = ('comfyui', 'inference', 'prompt-rewrite', 'evals')

def validate_config(c, expected):
    if c.get('schema') != 'atlas-colab-config-v1' or c.get('kind') != expected:
        raise ValueError('別のデモの設定ファイルです。対象サイトから保存し直してください。')
    if not isinstance(c.get('prompt'), str) or not 1 <= len(c['prompt'].strip()) <= 4500:
        raise ValueError('プロンプトを確認してください。')
    for key, minimum, maximum in [('seed', 0, 2147483647), ('steps', 1, 50), ('repetitions', 1, 20)]:
        if type(c.get(key)) is not int or not minimum <= c[key] <= maximum:
            raise ValueError('設定値が不正です: ' + key)
    if c.get('size') not in (1024, 2048) or c.get('mode') not in ('generate', 'edit'):
        raise ValueError('サイズ・モードが不正です。')
    if not isinstance(c.get('transparent'), bool):
        raise ValueError('透過設定が不正です。')
    return c

def load_config(expected):
    from google.colab import files
    print('サイトから保存した atlas-' + expected + '-config.json を選択してください。')
    uploaded = files.upload()
    if len(uploaded) != 1:
        raise ValueError('設定JSONは1件だけ選択してください。')
    raw = next(iter(uploaded.values()))
    if len(raw) > 20000:
        raise ValueError('設定ファイルが大きすぎます。')
    return validate_config(json.loads(raw), expected)

def gpu_info(required=True):
    try:
        result = subprocess.check_output(['nvidia-smi', '--query-gpu=name,memory.total,driver_version', '--format=csv,noheader'], text=True).strip()
    except (FileNotFoundError, subprocess.CalledProcessError):
        if required:
            raise RuntimeError('CUDA GPUランタイムを選択してください。')
        result = 'CPU (API evaluation)'
    return {'gpu': result, 'python': platform.python_version()}

def effective_prompt(c):
    return ('This is an RGBA image with transparency. ' + c['prompt'] + ' The image has alpha channel and the background is transparent.') if c['transparent'] else c['prompt']

def upload_images(maximum=10):
    from google.colab import files
    from PIL import Image
    uploaded = files.upload()
    if not 1 <= len(uploaded) <= maximum:
        raise ValueError(f'画像は1〜{maximum}枚です。')
    images = []
    total = 0
    for data in uploaded.values():
        total += len(data)
        if len(data) > 4 * 1024**2 or total > 20 * 1024**2:
            raise ValueError('画像は1枚4MB、合計20MBまでです。')
        img = Image.open(io.BytesIO(data))
        if img.format not in ('PNG', 'JPEG', 'WEBP') or img.width * img.height > 20_000_000:
            raise ValueError('PNG/JPEG/WebP、2000万画素以下を選択してください。')
        img.load()
        images.append(img)
    return images

def image_data(image):
    output = io.BytesIO()
    image.save(output, format='PNG')
    if len(output.getvalue()) > 16 * 1024**2:
        raise ValueError('結果が16MBを超えました。1024pxで再実行してください。')
    return 'data:image/png;base64,' + base64.b64encode(output.getvalue()).decode('ascii')

def report(c, engine, model, elapsed, env, **extra):
    return {'schema': 'atlas-colab-result-v1', 'kind': c['kind'],
            'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'engine': engine, 'model': model, 'elapsed_seconds': elapsed,
            'environment': env, 'config': c, **extra}

def save_report(result):
    from google.colab import files
    path = Path('/content/atlas-' + result['kind'] + '-' + result['engine'] + '-result.json')
    path.write_text(json.dumps(result, ensure_ascii=False, allow_nan=False), encoding='utf-8')
    files.download(str(path))
    print('結果JSONをサイトに読み込んでください。APIキーは結果に含めません。')
