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
 await install(db,'interactive-notes-2026-09-21',[
 {id:'qwen-comfyui',name:'ComfyUI — 透過ワークフロー',path:'/qwen-image/comfyui',description:'生成・編集の4工程をたどり、公式PNGのアルファを解析。ComfyUIの透過生成を学ぶデモ。',tags:'Qwen,ComfyUI,透過,学習'},
 {id:'qwen-inference',name:'推論Lab — vLLM-Omni / SGLang',path:'/qwen-image/inference',description:'キャッシュ・FP8・GPU並列化を操作して理解。計算の再利用を可視化する学習シミュレーション。',tags:'Qwen,vLLM,SGLang,GPU'},
 {id:'qwen-prompt-rewrite',name:'Prompt Lab — 依頼を具体化',path:'/qwen-image/prompt-rewrite',description:'生成用と編集用の違いを体験。条件を足して文章を組み立て、Alpha Labに引き継ぐデモ。',tags:'Qwen,プロンプト,編集,学習'},
 {id:'jev-evals',name:'Jev Eval Lab — 正しさと安定性',path:'/jev/evals',description:'合成スコアで正解率と分散の違いを体験。LangChainの検証値とコスト試算も確認できます。',tags:'Jev,LangChain,評価,比較'}
 ]);

 await install(db,'qwen-image-2026-09-21',[{id:'qwen-image',name:'Qwen Image 2.1 — Alpha Lab',path:'/qwen-image',description:'公式デモで画像生成・最大10枚の参照画像編集。背景切り替えと画素解析で透過を確認できます。',tags:'Qwen,画像生成,透過,RGBA'}]);
 await install(db,'jev-2048-plus-2026-09-21',[{id:'jev-2048-plus',name:'2048 Arena＋ — 先読み比較',path:'/jev/2048-plus',description:'元の2048を残した改良版。従来のJev・先読み付きJev・先読みのみを同じシードで比較。',tags:'Jev,2048,先読み,比較'}]);
 await install(db,'jev-2048-2026-09-21',[{id:'jev-2048',name:'2048 Arena — 人間 vs Jev',path:'/jev/2048',description:'同じ初期盤面から2048をプレイ。人間の操作とJevの判断を、スコア・手数・最大タイルで比較。',tags:'Jev,2048,ゲーム,比較'}]);
 await install(db,'jev-shopping-2026-09-21',[{id:'jev-shopping',name:'Jev Shopping Lab',path:'/jev/shopping',description:'カテゴリ・予算・並び順を自動操作し、商品を検索・比較。Jevによる操作選択と実行履歴を確認できます。',tags:'Jev,ブラウザ操作,商品比較'}]);
 await install(db,release,newJevSites);
 await install(db,'jev-harness-2026-09-21',harnessSites);
 await install(db,'jev-browser-2026-09-21',[{id:'jev-browser',name:'Jev Browser Lab',path:'/jev/browser',description:'フライト検索画面を自動操作。DOMの観測・Jevの操作選択・実行履歴を見ながらブラウザエージェントを体験。',tags:'Jev,ブラウザ操作,エージェント'}]);
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
