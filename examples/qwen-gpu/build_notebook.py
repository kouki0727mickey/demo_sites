from pathlib import Path
import json
root=Path(__file__).resolve().parents[2]
cells=[]
def md(s):cells.append(dict(cell_type='markdown',metadata={},source=s.splitlines(True)))
def code(s):cells.append(dict(cell_type='code',execution_count=None,metadata={},outputs=[],source=s.splitlines(True)))
md('''# Qwen Image 2.1 — Colabで透過画像を生成（T4省メモリ版）
**旧ノートブックでCUDA OOMが出た場合は、まずランタイムを再起動してください。** 古いpipeをGPUに残したままモデル読み込みセルを再実行しないでください。GitHubの最新版から開き直し、上から実行します。

T4向けに、層単位のCPUオフロード・VAEタイル分割・512px・KVキャッシュ無効化を採用します。転送が増えるため低速になります。モデルはCPUにも保持するため、通常RAMにも余裕が必要です。T4実機での修正版実行は未検証で、無料Colabでの動作保証ではありません。

[公式モデル](https://github.com/QwenLM/Qwen-Image-2.1) / [Diffusers省メモリ手順](https://huggingface.co/docs/diffusers/optimization/memory)
''')
code('%pip install "torch>=2.4.0" "transformers>=5.17" accelerate pillow psutil\n%pip install git+https://github.com/huggingface/diffusers\n')
md('インストール後に再起動を求められたら再起動し、次のセルから進みます。GPUはランタイム設定で選択してください。')
code('''import gc, torch, psutil, shutil
assert torch.cuda.is_available(), 'GPUランタイムを選択してください。'
print('GPU:', torch.cuda.get_device_name(0))
free, total = torch.cuda.mem_get_info()
print('VRAM 空き/合計 GiB:', round(free / 2**30, 1), '/', round(total / 2**30, 1))
ram = psutil.virtual_memory()
print('通常RAM 空き/合計 GiB:', round(ram.available / 2**30, 1), '/', round(ram.total / 2**30, 1))
print('ディスク空き GiB:', round(shutil.disk_usage('/content').free / 2**30, 1))
if ram.available < 36 * 2**30:
    print('注意：非量子化のモデルは通常RAMを数十GB使います。高RAM環境を検討してください。36GiBは注意表示の目安で、必要量の保証ではありません。')
''')
md('## モデルを1つだけ読み込む\n`sequential`では層ごとにGPUへ転送します。`.to("cuda")`を追加しないでください。セルをやり直す前にランタイムを再起動してください。')
code((root/'examples/qwen-gpu/inference.py').read_text(encoding='utf-8-sig')+'''
if 'pipe' in globals():
    raise RuntimeError('pipeが既に存在します。読み込み直す場合はランタイムを再起動してください。')
pipe = load_pipeline(memory_mode='sequential')
''')
md('## 512pxで生成\nこの実行では大きなKVキャッシュを保持せず、VAEはタイル単位で処理します。40ステップは画質設定です。ステップ数を減らすだけではピークメモリは大きく減りません。')
code('''prompt = "This is an RGBA image with transparency. A cute cartoon dragon sticker. The image has alpha channel and the background is transparent."
size = 512
seed = 42
steps = 40
# Previous failed/successful output must not be downloaded as this run's result.
from pathlib import Path
Path('/content/qwen-transparent.png').unlink(missing_ok=True)
image = generate(pipe, prompt, size, seed, steps)
image.save('/content/qwen-transparent.png')
display(image)
print('Mode:', image.mode, 'Size:', image.size)
print('Alpha range:', image.getchannel('A').getextrema() if 'A' in image.getbands() else 'No alpha channel')
''')
code("from google.colab import files\nfrom pathlib import Path\nassert Path('/content/qwen-transparent.png').exists(), 'まず画像生成を正常完了してください。'\nfiles.download('/content/qwen-transparent.png')\n")
md('## 任意：参照画像を1枚だけ編集\nT4ではまず1枚・512pxで確認します。入力も512px相当へ縮小して処理するため、原寸の細部は保持されない場合があります。')
code('''from PIL import Image
import io
uploaded = files.upload()
assert len(uploaded) == 1, 'T4の省メモリモードでは参照画像は1枚です。'
reference = Image.open(io.BytesIO(next(iter(uploaded.values()))))
reference.thumbnail((512, 512))
edit_prompt = "This is an RGBA image with transparency. Extract the main subject and preserve its details. The image has alpha channel and the background is transparent."
Path('/content/qwen-edited.png').unlink(missing_ok=True)
edited = generate(pipe, edit_prompt, size, seed, steps, [reference])
edited.save('/content/qwen-edited.png')
display(edited)
files.download('/content/qwen-edited.png')
''')
md('## それでもOOMになる場合\nランタイムを再起動し、参照画像なし・size=384または256で実行してください。画質・細部は低下します。通常RAM不足はGPUの省メモリ化だけでは解決しないため、高RAM環境や大容量GPUへの変更が必要です。完了後は「接続を解除してランタイムを削除」で資源を解放します。')
(root/'public/notebooks/qwen-image-2.1.ipynb').write_text(json.dumps(dict(cells=cells,metadata=dict(colab=dict(name='Qwen Image 2.1 — T4 memory safe',provenance=[]),kernelspec=dict(display_name='Python 3',name='python3'),language_info=dict(name='python'),accelerator='GPU'),nbformat=4,nbformat_minor=5),ensure_ascii=False,indent=2),encoding='utf-8')
