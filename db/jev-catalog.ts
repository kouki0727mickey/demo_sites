// Install this requested collection once. Subsequent owner edits/deletions are preserved.
const release = 'jev-use-cases-2026-09-21';
const origin = 'https://demo-atlas-kouki.koki-uchida.chatgpt.site';
export const newJevSites = [
  {id:'jev-reviews',name:'Jev レビュー分析',path:'/jev/reviews',description:'レビューの感情・満足度・フォローの必要性を判定。改善すべき声を見つけるデモ。',tags:'Jev,レビュー,顧客体験'},
  {id:'jev-leads',name:'Jev 営業リード判定',path:'/jev/leads',description:'問い合わせや商談メモから検討段階・導入意欲・デモ提案の適切さを判定。',tags:'Jev,営業,商談'},
  {id:'jev-tasks',name:'Jev タスク優先度判定',path:'/jev/tasks',description:'依頼文から優先度・業務への影響・期限の有無を判定し、対応順の判断を補助。',tags:'Jev,タスク,優先度'},
];
export const harnessSites=[{id:'jev-harness',name:'Jev Harness Lab',path:'/jev/harness',description:'モデルルーティングとツールのリスク判定を3ステップで体験。しきい値を動かして実行・停止の分岐を学ぶデモ。',tags:'Jev,LangChain,ミドルウェア'}];
export async function ensureJevCatalog(db:D1Database){
 await install(db,'release-labs-2026-09-23',[
 {id:'jev-gateway-lab',name:'Jev × Gateway — 確率で判断',path:'/labs/jev-gateway',description:'Vercel経由の実判定。Choice・Score・Booleanをまとめて実行し、振り分け基準を体験します。',tags:'Jev,Vercel,Gateway,判断'},
 {id:'grok-bedrock-lab',name:'Grok 4.6 × Bedrock — AWSで実行',path:'/labs/bedrock',description:'経路・モデルID・処理地域の違いを比較し、Bedrock APIキーで実際に依頼します。',tags:'Grok,AWS,Bedrock,実API'},
 {id:'grok-copilot-lab',name:'Grok 4.7 × Copilot — 修正を検証',path:'/labs/copilot',description:'仕様とテストを添えてCopilotへ依頼し、持ち帰った設定を境界値テストで検証する演習。',tags:'Grok,Copilot,テスト,演習'},
 {id:'mimo-lab',name:'MiMo V2.6 — 公開ウェイトとAPI',path:'/labs/mimo',description:'Pro・FlashのMoE構造とメモリの規模を比較。自分のGPUなしでMiMo APIを試せます。',tags:'MiMo,Xiaomi,MoE,公開ウェイト'}
 ]);
 await install(db,'release-labs-2026-09-22',[
 {id:'grok-lab',name:'Grok — 実APIと提供経路',path:'/labs/grok',description:'Grok 4.7へ実際に依頼。Copilot・Bedrockとの違いと、料金の目安を確認します。',tags:'Grok,xAI,Copilot,Bedrock'},
 {id:'kev-lab',name:'Kev — 3つの判断を同時に',path:'/labs/kev',description:'公開モデルで問い合わせを判定。担当部署・緊急性・不満度を同時に確かめます。',tags:'Kev,判断,確率,実モデル'},
 {id:'python-workers-lab',name:'Python Workers — APIを体験',path:'/labs/python-workers',description:'ブラウザ内のPythonで見積もりを計算。APIの入力チェックとCloudflare連携の役割を学びます。',tags:'Python,Cloudflare,FastAPI,GPU不要'},
 {id:'langsmith-jev-lab',name:'LangSmith × Jev — 履歴を評価',path:'/labs/langsmith',description:'実行履歴をJevの実APIで評価。評価値と確認基準、LangSmithへの導入手順を理解します。',tags:'Jev,LangSmith,評価,実行履歴'}
 ]);

 await install(db,'interactive-notes-2026-09-21',[
 {id:'qwen-comfyui',name:'ComfyUI — 透過ワークフロー',path:'/qwen-image/comfyui',description:'ColabでComfyUIとQwenの実モデルを実行。生成・編集したPNGを読み込み、透過を確認します。',tags:'Qwen,ComfyUI,透過,学習'},
 {id:'qwen-inference',name:'推論Lab — vLLM-Omni / SGLang',path:'/qwen-image/inference',description:'ColabでvLLM-OmniとSGLangを実行。同じ設定で得た画像と、モデル読込を含む実行時間を比較します。',tags:'Qwen,vLLM,SGLang,GPU'},
 {id:'qwen-prompt-rewrite',name:'Prompt Lab — 依頼を具体化',path:'/qwen-image/prompt-rewrite',description:'ColabでPE-T2I・PE-I2Iを実行。実モデルの書き換え文を読み込み、Alpha Labへ引き継ぎます。',tags:'Qwen,プロンプト,編集,学習'},
 {id:'jev-evals',name:'Jev Eval Lab — 正しさと安定性',path:'/jev/evals',description:'サイト内からJevの実APIで繰り返し判定。GPU・Colab不要で、一致率・スコア分散・応答時間を確認します。',tags:'Jev,LangChain,評価,比較'}
 ]);

 await install(db,'qwen-image-2026-09-21',[{id:'qwen-image',name:'Qwen Image 2.1 — Alpha Lab',path:'/qwen-image',description:'公式デモで画像生成・最大10枚の参照画像編集。背景切り替えと画素解析で透過を確認できます。',tags:'Qwen,画像生成,透過,RGBA'}]);
 await install(db,'jev-2048-plus-2026-09-21',[{id:'jev-2048-plus',name:'2048 Arena＋ — 先読み比較',path:'/jev/2048-plus',description:'元の2048を残した改良版。従来のJev・先読み付きJev・先読みのみを同じシードで比較。',tags:'Jev,2048,先読み,比較'}]);
 await install(db,'jev-2048-2026-09-21',[{id:'jev-2048',name:'2048 Arena — 人間 vs Jev',path:'/jev/2048',description:'同じ初期盤面から2048をプレイ。人間の操作とJevの判断を、スコア・手数・最大タイルで比較。',tags:'Jev,2048,ゲーム,比較'}]);
 await install(db,'jev-shopping-2026-09-21',[{id:'jev-shopping',name:'Jev Shopping Lab',path:'/jev/shopping',description:'カテゴリ・予算・並び順を自動操作し、商品を検索・比較。Jevによる操作選択と実行履歴を確認できます。',tags:'Jev,ブラウザ操作,商品比較'}]);
 await install(db,release,newJevSites);
 await install(db,'jev-harness-2026-09-21',harnessSites);
 await install(db,'jev-browser-2026-09-21',[{id:'jev-browser',name:'Jev Browser Lab',path:'/jev/browser',description:'フライト検索画面を自動操作。DOMの観測・Jevの操作選択・実行履歴を見ながらブラウザエージェントを体験。',tags:'Jev,ブラウザ操作,エージェント'}]);
 await refreshColabDescriptions(db);
 await refreshWebEvalDescription(db);
}
async function install(db:D1Database,release:string,entries:typeof newJevSites){
  if(await db.prepare('SELECT key FROM catalog_installs WHERE key = ?').bind(release).first())return;
  const now=new Date().toISOString();
  await db.batch([
    ...entries.map(s=>db.prepare(`INSERT OR IGNORE INTO sites
      (id,name,url,category,description,tags,status,created_at)
      SELECT ?,?,?,?,?,?,?,?
      WHERE NOT EXISTS (SELECT 1 FROM catalog_installs WHERE key = ?)
      AND NOT EXISTS (SELECT 1 FROM sites WHERE url = ?)`)
      .bind(s.id,s.name,origin+s.path,'その他',s.description,s.tags,'利用中',now,release,origin+s.path)),
    db.prepare('INSERT OR IGNORE INTO catalog_installs (key,applied_at) VALUES (?,?)').bind(release,now),
  ]);
}

async function refreshColabDescriptions(db:D1Database){
 const key='colab-labs-descriptions-2026-09-21';
 if(await db.prepare('SELECT key FROM catalog_installs WHERE key = ?').bind(key).first())return;
 const updates=[["qwen-comfyui", "生成・編集の4工程をたどり、公式PNGのアルファを解析。ComfyUIの透過生成を学ぶデモ。", "ColabでComfyUIとQwenの実モデルを実行。生成・編集したPNGを読み込み、透過を確認します。"], ["qwen-inference", "キャッシュ・FP8・GPU並列化を操作して理解。計算の再利用を可視化する学習シミュレーション。", "ColabでvLLM-OmniとSGLangを実行。同じ設定で得た画像と、モデル読込を含む実行時間を比較します。"], ["qwen-prompt-rewrite", "生成用と編集用の違いを体験。条件を足して文章を組み立て、Alpha Labに引き継ぐデモ。", "ColabでPE-T2I・PE-I2Iを実行。実モデルの書き換え文を読み込み、Alpha Labへ引き継ぎます。"], ["jev-evals", "合成スコアで正解率と分散の違いを体験。LangChainの検証値とコスト試算も確認できます。", "ColabからJevの実APIで繰り返し判定。人間の合否との一致率・スコア分散・応答時間を確認します。"]];
 await db.batch([
  ...updates.map(([id,oldDescription,newDescription])=>db.prepare('UPDATE sites SET description = ? WHERE id = ? AND description = ?').bind(newDescription,id,oldDescription)),
  db.prepare('INSERT OR IGNORE INTO catalog_installs (key,applied_at) VALUES (?,?)').bind(key,new Date().toISOString()),
 ]);
}

async function refreshWebEvalDescription(db:D1Database){
 const key='jev-web-evals-2026-09-21';
 if(await db.prepare('SELECT key FROM catalog_installs WHERE key = ?').bind(key).first())return;
 await db.batch([
 db.prepare('UPDATE sites SET description = ? WHERE id = ? AND description = ?').bind('サイト内からJevの実APIで繰り返し判定。GPU・Colab不要で、一致率・スコア分散・応答時間を確認します。','jev-evals','ColabからJevの実APIで繰り返し判定。人間の合否との一致率・スコア分散・応答時間を確認します。'),
 db.prepare('INSERT OR IGNORE INTO catalog_installs (key,applied_at) VALUES (?,?)').bind(key,new Date().toISOString()),
 ]);
}
