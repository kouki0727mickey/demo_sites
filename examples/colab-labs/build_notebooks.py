import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
OUTPUT=ROOT.parents[1]/'public/notebooks'
common=(ROOT/'common.py').read_text(encoding='utf-8-sig')

def make(name,title,kind,install,runner,call,gpu=True,extra=''):
    cells=[]
    def md(text): cells.append(dict(cell_type='markdown',metadata={},source=text.splitlines(True)))
    def code(text): cells.append(dict(cell_type='code',execution_count=None,metadata={},outputs=[],source=text.splitlines(True)))
    md(f'''# {title}
サイトで保存した設定を読み込み、実モデルを実行して結果JSONをダウンロードします。

{'「ランタイム → ランタイムのタイプを変更」でCUDA GPUを選んでください。無料T4での動作は未保証です。余裕のあるGPUメモリ・通常RAM・ディスクが必要です。' if gpu else 'GPUは不要です。CPUランタイムで実行してください。TypeSafe APIキーと利用料金が必要です。'}

この開発環境ではGPU・有効キーでの実行は未検証です。失敗時はエラーで停止し、模擬結果を生成しません。依存関係は公式開発版を含み、環境によって調整が必要です。

Colabは対話的な実験用です。このノートブックは公開URL・トンネルを作りません。実行後はランタイムを停止してください。
{extra}
''')
    md('## 1. インストール\nパッケージを更新した後にランタイム再起動を求められた場合は、再起動し、次のセルから進んでください。')
    code(install)
    md('## 2. 設定を読み込む\nサイトから保存した設定JSONを1つ選びます。参照画像は後の実行セルで選びます。')
    code(common+f"\nconfig=load_config('{kind}')\nprint(json.dumps(config,ensure_ascii=False,indent=2))\nprint(gpu_info({gpu}))\n")
    md('## 3. 実モデルを実行\n初回はモデルのダウンロードに時間がかかります。表示される画像・スコアは実行したモデルの結果です。')
    code((ROOT/runner).read_text(encoding='utf-8-sig')+f'\nresult={call}\n')
    md('## 4. 結果を保存してサイトへ戻る\n結果JSONには入力文や生成物が含まれます。対象のデモで「結果JSONを読み込む」を選びます。サイトの読み込みはブラウザ内だけで処理します。')
    code('save_report(result)\n')
    metadata=dict(colab=dict(name=title,provenance=[]),kernelspec=dict(display_name='Python 3',name='python3'),language_info=dict(name='python'))
    if gpu: metadata['accelerator']='GPU'
    (OUTPUT/name).write_text(json.dumps(dict(cells=cells,metadata=metadata,nbformat=4,nbformat_minor=5),ensure_ascii=False,indent=2),encoding='utf-8')

make('atlas-comfyui.ipynb','ComfyUI × Qwen Image 2.1','comfyui','''%pip install huggingface_hub requests pillow
import subprocess, sys
from pathlib import Path
if not Path('/content/ComfyUI/.git').exists():
    subprocess.run(['git','clone','https://github.com/Comfy-Org/ComfyUI.git','/content/ComfyUI'],check=True)
subprocess.run([sys.executable,'-m','pip','install','-r','/content/ComfyUI/requirements.txt'],check=True)
Path('/content/ComfyUI/input').mkdir(exist_ok=True)
''','comfy.py','run_comfy(config)',extra='[公式テンプレート](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/image_qwen_image_2_1_t2i.json)のノード構成を参考に、ローカルAPIで実行します。INT8版のDiT・エンコーダを使用します。生成も編集も対応。ComfyUIのWeb UIは公開しません。')
make('atlas-prompt-rewrite.ipynb','Qwen PE — 実モデルで文章書き換え','prompt-rewrite','%pip install "torch>=2.4.0" "transformers>=5.17" accelerate pillow huggingface_hub\n','rewrite.py','run_rewrite(config)',extra='[PE-T2I](https://huggingface.co/Qwen/Qwen-Image-2.1-PE-T2I) / [PE-I2I](https://huggingface.co/Qwen/Qwen-Image-2.1-PE-I2I)。編集モードでは実画像も入力します。生成するのは文章であり、画像生成モデルはここでは起動しません。')
base='''%pip install uv requests pillow
import subprocess
from pathlib import Path
'''
make('atlas-vllm.ipynb','vLLM-Omni — Qwen実行計測','inference',base+'''if not Path('/content/vllm-omni/.git').exists():
    subprocess.run(['git','clone','https://github.com/vllm-project/vllm-omni.git','/content/vllm-omni'],check=True)
subprocess.run(['git','-C','/content/vllm-omni','fetch','origin','pull/7759/head'],check=True)
subprocess.run(['git','-C','/content/vllm-omni','checkout','--detach','FETCH_HEAD'],check=True)
subprocess.run(['uv','venv','--python','3.12','--seed','/content/atlas-vllm'],check=True)
subprocess.run(['uv','pip','install','--python','/content/atlas-vllm/bin/python','vllm==0.29.0','--torch-backend=auto'],check=True)
subprocess.run(['uv','pip','install','--python','/content/atlas-vllm/bin/python','-e','/content/vllm-omni'],check=True)
''','inference.py',"run_inference(config,'vllm-omni')",extra='[公式レシピ](https://recipes.vllm.ai/Qwen/Qwen-Image-2.1)指定のPR #7759を使用。推論は1GPU・基本設定です。FP8/TP/Ulyssesの切替実験は含めません。初回のダウンロード・試運転を除き、2回目のプロセス起動から画像保存までを計測します。SGLangとは新しいランタイムに分け、同じ設定JSONを使ってください。')
make('atlas-sglang.ipynb','SGLang — Qwen実行計測','inference',base+'''if not Path('/content/sglang/.git').exists():
    subprocess.run(['git','clone','https://github.com/sgl-project/sglang.git','/content/sglang'],check=True)
subprocess.run(['uv','venv','--python','3.12','--seed','/content/atlas-sglang'],check=True)
subprocess.run(['uv','pip','install','--python','/content/atlas-sglang/bin/python','--prerelease=allow','-e','/content/sglang/python[diffusion]'],check=True)
''','inference.py',"run_inference(config,'sglang')",extra='[公式インストール手順](https://github.com/sgl-project/sglang/blob/main/docs/docs/sglang-diffusion/installation.mdx)。1GPU・基本設定で実行します。vLLM-Omniとは新しいランタイムに分けてください。モデル読込を含む時間なので、純粋な生成速度の比較ではありません。')
make('atlas-jev-evals.ipynb','Jev — 実APIによる繰り返し評価','evals','%pip install requests\n','evals.py','run_evals(config)',gpu=False,extra='[TypeSafe公式API](https://docs.typesafe.ai/introduction/quickstart)を使用します。APIキーは非表示入力し、保存しません。実行セルで送信内容・回数を確認してください。LangChain記事の500回実験の再現ではなく、自分で指定した1件を繰り返し評価します。')
print('Wrote five Colab notebooks.')
