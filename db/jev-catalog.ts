// Install this requested collection once. Subsequent owner edits/deletions are preserved.
const release = 'jev-use-cases-2026-09-21';
const origin = 'https://demo-atlas-kouki.koki-uchida.chatgpt.site';
export const newJevSites = [
  {id:'jev-reviews',name:'Jev レビュー分析',path:'/jev/reviews',description:'レビューの感情・満足度・フォローの必要性を判定。改善すべき声を見つけるデモ。',tags:'Jev,レビュー,顧客体験'},
  {id:'jev-leads',name:'Jev 営業リード判定',path:'/jev/leads',description:'問い合わせや商談メモから検討段階・導入意欲・デモ提案の適切さを判定。',tags:'Jev,営業,商談'},
  {id:'jev-tasks',name:'Jev タスク優先度判定',path:'/jev/tasks',description:'依頼文から優先度・業務への影響・期限の有無を判定し、対応順の判断を補助。',tags:'Jev,タスク,優先度'},
];
export async function ensureJevCatalog(db:D1Database){
  if(await db.prepare('SELECT key FROM catalog_installs WHERE key = ?').bind(release).first())return;
  const now=new Date().toISOString();
  await db.batch([
    ...newJevSites.map(s=>db.prepare(`INSERT OR IGNORE INTO sites
      (id,name,url,category,description,tags,status,created_at)
      SELECT ?,?,?,?,?,?,?,?
      WHERE NOT EXISTS (SELECT 1 FROM catalog_installs WHERE key = ?)
      AND NOT EXISTS (SELECT 1 FROM sites WHERE url = ?)`)
      .bind(s.id,s.name,origin+s.path,'その他',s.description,s.tags,'利用中',now,release,origin+s.path)),
    db.prepare('INSERT OR IGNORE INTO catalog_installs (key,applied_at) VALUES (?,?)').bind(release,now),
  ]);
}
