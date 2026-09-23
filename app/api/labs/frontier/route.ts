import {execute,EvaluationError} from '@/app/labs/frontier/engine';
const headers={'Cache-Control':'no-store'};
export async function POST(request:Request){
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'この操作は許可されていません。'},{status:403,headers});
 try{const raw=await request.text();if(raw.length>75000)return Response.json({error:'入力が長すぎます。'},{status:413,headers});let input;try{input=JSON.parse(raw)}catch{return Response.json({error:'JSONの形式を確認してください。'},{status:400,headers})}return Response.json(await execute(input),{headers});}
 catch(e){return Response.json({error:e instanceof EvaluationError?e.message:'実行結果を確認できませんでした。'},{status:e instanceof EvaluationError?e.status:502,headers});}
}
