"""Protocol tests: inference is stubbed, no GPU/model download required."""
import io
import os
import sys
import time
import types
from pathlib import Path
from PIL import Image
from fastapi.testclient import TestClient
sys.path.insert(0, str(Path(__file__).resolve().parent))
os.environ['QWEN_API_TOKEN'] = 'test-only-token-' * 3
os.environ['QWEN_ALLOWED_ORIGIN'] = 'https://demo.example.com'

def generate(*args):
    time.sleep(0.1)
    return Image.new('RGBA', (2, 2), (0, 255, 0, 0))
sys.modules['inference'] = types.SimpleNamespace(load_pipeline=lambda: object(), generate=generate)
from server import app
headers = {'Authorization': 'Bearer ' + os.environ['QWEN_API_TOKEN']}
with TestClient(app) as client:
    assert client.get('/health').status_code == 401
    assert client.get('/health', headers=headers).json()['ready']
    response = client.options('/health', headers={'Origin': 'https://evil.example.com', 'Access-Control-Request-Method': 'GET'})
    assert 'access-control-allow-origin' not in response.headers
    response = client.options('/health', headers={'Origin': 'https://demo.example.com', 'Access-Control-Request-Method': 'GET'})
    assert response.headers['access-control-allow-origin'] == 'https://demo.example.com'
    assert client.post('/jobs', headers=headers, data={'prompt': 'test', 'size': '12'}).status_code == 400
    assert client.post('/jobs', headers=headers, data={'prompt': 'test'}, files={'files': ('bad.png', b'bad', 'image/png')}).status_code == 400
    response = client.post('/jobs', headers=headers, data={'prompt': 'test'})
    assert response.status_code == 202, response.text
    job = response.json()['id']
    assert client.post('/jobs', headers=headers, data={'prompt': 'test'}).status_code == 409
    for _ in range(100):
        state = client.get('/jobs/' + job, headers=headers).json()['status']
        if state == 'complete': break
        time.sleep(.02)
    assert state == 'complete'
    assert client.get('/jobs/' + job + '/image').status_code == 401
    response = client.get('/jobs/' + job + '/image', headers=headers)
    image = Image.open(io.BytesIO(response.content))
    assert image.mode == 'RGBA' and image.getchannel('A').getextrema() == (0, 0)
print('Authentication, CORS, validation, busy lock, job polling and PNG alpha passed (stub inference).')
