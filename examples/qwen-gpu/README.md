# Qwen Image 2.1 GPU実行

## 1. Colabで確認

[Colabで開く](https://colab.research.google.com/github/kouki0727mickey/demo_sites/blob/main/public/notebooks/qwen-image-2.1.ipynb)

GPUランタイムを選び、上から実行。古いランタイムを再起動し、最新版を開いて512px・40steps・seed42で生成、PNGを保存します。
T4ではサブモジュール単位のCPUオフロード、VAEタイル処理、KVキャッシュ無効化を使います。遅くなる代わりにVRAM使用量を抑えます。まだ不足する場合は再起動後384px／256pxに下げてください。通常RAMにも数十GBの余裕が必要になるため、無料GPUの動作保証はありません。最低VRAM/RAMは未検証です。CPUオフロードは通常RAMを消費します。
このノートブックは対話的な実験専用で、公開APIやトンネルは起動しません。

## 2. 専用GPUからサイトへ接続

Linux + CUDA GPUの環境にこのフォルダーを配置します。有料GPUの契約や起動は自動では行いません。

```bash
pip install -r requirements.txt
# 十分長いランダムキーを生成し、サーバーのシークレット設定に保存
python -c "import secrets; print(secrets.token_urlsafe(32))"
# 環境変数をサーバーのシークレット管理画面等で設定:
# QWEN_API_TOKEN=<上で生成したキー>
# QWEN_ALLOWED_ORIGIN=https://demo-atlas-kouki.koki-uchida.chatgpt.site
# QWEN_CPU_OFFLOAD=1   (初期値。0なら全モデルをGPUに配置)
uvicorn server:app --host 0.0.0.0 --port 8000 --workers 1
```

GPUホスト側のHTTPSリバースプロキシを8000番へ接続し、アップロード上限を25MBに設定してください。
HTTPSのURL（例: `https://your-gpu.example.com`）とキーをAlpha Labの「専用GPU」に入力し、「接続を確認」を押します。
このアプリ同梱のserver.py用の通信形式です。vLLM等のURLにそのまま接続するものではありません。

- モデルは起動時にダウンロード・読み込みします。起動完了までhealthに接続できません。
- 文章・参照画像・キーはブラウザから指定したGPUへ直接送信。キーはブラウザメモリのみ保持し、再読み込みで消えます。
- GPU APIは全操作にBearer認証が必要。キーを知る人は生成できます。サイト閲覧者にキーは配布しないでください。
- CORSは指定したサイトのみ許可。CORS自体は認証の代わりにはなりません。
- 同時生成は1件、実行中は409を返します。受信停止はGPU処理のキャンセルではありません。
- PNG結果はRAMに最大4件、30分経過後のアクセスで削除。再起動すると消えます。永続保存しません。
- プロンプト補強モデルは含めません。テキスト生成・最大10枚の編集・透過PNGに対応します。
- 画像生成モデルのGPU実行はこの開発環境では未検証です。ライセンスは公式を確認してください。

[公式手順](https://github.com/QwenLM/Qwen-Image-2.1) / [Colabの制限](https://research.google.com/colaboratory/faq.html)
