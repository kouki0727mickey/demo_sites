from PIL import Image
import uuid

def run_inference(c, engine):
    env = gpu_info()
    if c['mode'] != 'generate':
        raise ValueError('推論比較はテキストからの生成に限定しています。')
    out = Path('/content/atlas-inference-' + uuid.uuid4().hex)
    out.mkdir()
    if engine == 'vllm-omni':
        repo = Path('/content/vllm-omni')
        command = ['/content/atlas-vllm/bin/python', str(repo / 'examples/offline_inference/text_to_image/text_to_image.py'),
                   '--model','Qwen/Qwen-Image-2.1','--prompt', effective_prompt(c),
                   '--width',str(c['size']),'--height',str(c['size']),
                   '--num-inference-steps',str(c['steps']),'--cfg-scale','1.0',
                   '--seed',str(c['seed']),'--output',str(out / 'image.png')]
        env['revision'] = subprocess.check_output(['git','-C',str(repo),'rev-parse','HEAD'],text=True).strip()
    elif engine == 'sglang':
        repo = Path('/content/sglang')
        command = ['/content/atlas-sglang/bin/sglang','generate','--model-path','Qwen/Qwen-Image-2.1',
                   '--prompt',effective_prompt(c),'--height',str(c['size']),'--width',str(c['size']),
                   '--num-inference-steps',str(c['steps']),'--guidance-scale','1',
                   '--seed',str(c['seed']),'--save-output','--output-path',str(out),'--output-file-name','image.png']
        env['revision'] = subprocess.check_output(['git','-C',str(repo),'rev-parse','HEAD'],text=True).strip()
    else:
        raise ValueError('Unknown engine')
    # A first run populates the model cache; it is deliberately not measured.
    print('初回のモデル取得・動作確認。時間は比較対象にしません。')
    subprocess.run(command, check=True)
    first = list(out.glob('*.png'))
    if not first: raise RuntimeError('PNGが出力されませんでした。CLIログを確認してください。')
    before = {str(p):p.stat().st_mtime_ns for p in first}
    print('2回目を計測：プロセス起動・モデル読込・生成・保存を含みます。')
    start = time.perf_counter()
    subprocess.run(command, check=True)
    elapsed = time.perf_counter() - start
    candidates = [p for p in out.glob('*.png') if str(p) not in before or p.stat().st_mtime_ns != before[str(p)]]
    if not candidates: raise RuntimeError('2回目の出力が見つかりません。古い画像は結果に使用しません。')
    path = max(candidates, key=lambda p:p.stat().st_mtime_ns)
    image = Image.open(path); image.load(); display(image)
    return report(c, engine, 'Qwen/Qwen-Image-2.1', elapsed, env, image=image_data(image), timing_scope='process_including_model_load', warmup_runs=1)
