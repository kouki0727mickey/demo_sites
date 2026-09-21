# Colab実行デモ

4サイトの実処理を5冊のノートブックで提供します。

1. サイトから設定JSONを保存する。
2. Colabを開き、GPU（JevはCPU）を選び、セルを上から実行する。
3. 設定JSONを読み込む。編集では参照画像もアップロードする。
4. 最後に結果JSONを保存し、サイトで読み込む。

公開API・トンネルは起動しません。ComfyUIのAPIは127.0.0.1でノートブック内からだけ利用し、処理後に停止します。結果のサイトへの読み込みはブラウザ内で処理し、サーバーに保存しません。

## 実行対象

- `atlas-comfyui.ipynb`: 公式ComfyUI + Comfy-Org/Qwen-Image-2.1。公式テンプレートを参考にしたAPIグラフ、INT8 DiT/エンコーダ、生成・最大10枚の参照編集。独自のComfyUI互換シミュレーターではありません。
- `atlas-vllm.ipynb`: vLLM-Omniの公式レシピで指定されるPR #7759とvLLM 0.29.0。1GPU・基本設定で実行。
- `atlas-sglang.ipynb`: SGLang公式ソースのdiffusion版。上記とは新しいColabランタイムに分けます。
- `atlas-prompt-rewrite.ipynb`: QwenのPE-T2I / PE-I2I 9Bと、モデルに付属するsystem_prompt.txtを使用。
- `atlas-jev-evals.ipynb`: TypeSafeの実APIに1件の依頼・根拠・回答を1〜20回送信。APIキーはgetpassで受け取り、結果に含めません。品質ルーブリック0〜4を0〜1へ正規化。記事の実験の再現・Claudeとの比較は行いません。

## 計測範囲と制約

推論エンジン比較では最初のダウンロード・試運転を除き、2回目のプロセス起動・モデル読込・生成・画像保存を計測します。純粋な定常推論速度ではありません。GPU・プロンプト・ステップ・シード等の不一致をサイトで表示します。同一設定でも依存関係や計算精度によって画像は異なり得ます。

ComfyUIはモデル取得後からの起動・モデル読込・生成時間、PEはモデル読込後の文章生成時間、JevはAPI往復時間です。異なる種類の時間を直接比較しないでください。VRAM使用量や課金額の実測は行いません。

この開発環境ではGPU・有効なTypeSafeキーによる実行は未検証です。ノートブック構文、設定検証、結果形式、サイト操作は別途検証しています。依存関係は開発版を含むため、公式の対応状況に応じた調整が必要な場合があります。失敗時は例外で停止し、ダミー結果を保存しません。

## GPUの候補

まずColabで実験する構成です。無料T4での動作は保証しません。余裕を持たせる候補としてA100 80GB等の大容量GPUと十分な通常RAM・ディスクを推奨しますが、最低要件・動作保証ではありません。

継続的に同じGPU・依存関係を維持して比較する場合は[Runpod Pods](https://docs.runpod.io/pods/overview)が代案です。組織内Google Cloud運用では[Colab Enterprise](https://cloud.google.com/colab/docs/introduction)も候補。費用・空き状況は各サービスで確認し、実行後は停止します。契約や有料GPUの起動をこのコードは自動で行いません。

RunpodのJupyterへ移す際はgoogle.colab.filesのupload/downloadを通常のパス読み書きへ変更してください。

## 開発

`python examples/colab-labs/build_notebooks.py` で、各Python実装を埋め込んだノートブックを再生成します。実装を更新したら必ず再生成してください。出力にはAPIキー・実行結果をコミットしません。
