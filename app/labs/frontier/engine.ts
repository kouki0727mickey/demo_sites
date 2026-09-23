import {z} from 'zod';
import {models,cost,cliQuestions} from './data.ts';
import {requestTypeSafe,EvaluationError} from '../../jev/engine.ts';
export {EvaluationError};
const key=z.string().trim().min(1).max(8192).regex(/^[\x21-\x7e]+$/);
export const schema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('text'),model:z.enum(['claude-opus-5-5','gpt-6-sol','gpt-6-luna']),apiKey:key,prompt:z.string().trim().min(1).max(12000),prefix:z.string().max(50000).default(''),cache:z.boolean().default(false),maxOutput:z.union([z.literal(4096),z.literal(8192),z.literal(16384),z.literal(32768)]).default(4096)}),
 z.object({kind:z.literal('cli'),apiKey:key,state:z.string().trim().min(1).max(5000),query:z.enum(['noul','choice','score'])}),
]);
const count=z.number().finite().int().nonnegative();
const prob=z.number().finite().min(0).max(1);
const cliSchemas={noul:z.object({type:z.literal('noul'),noul:prob}),choice:z.object({type:z.literal('choice'),choice:z.enum(['billing','technical','other']),confidence:prob.optional(),probabilities:z.object({billing:prob,technical:prob,other:prob})}),score:z.object({type:z.literal('score'),score:z.number().finite().min(0).max(2),confidence:prob.optional(),probabilities:z.record(prob)})};
export function buildText(input:Extract<z.infer<typeof schema>,{kind:'text'}>){
 const {model,prompt,prefix,cache,apiKey}=input;const maxOutput=input.maxOutput??4096;
 if(model==='claude-opus-5-5')return {url:'https://api.anthropic.com/v1/messages',headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:{model,max_tokens:maxOutput,thinking:{type:'adaptive'},messages:[{role:'user',content:prompt}],...(prefix?{system:[{type:'text',text:prefix,...(cache?{cache_control:{type:'ephemeral'}}:{})}]}:{})}};
 return {url:'https://api.openai.com/v1/responses',headers:{Authorization:'Bearer '+apiKey},body:{model,store:false,max_output_tokens:maxOutput,reasoning:{effort:'medium'},input:[...(prefix?[{role:'developer',content:[{type:'input_text',text:prefix,...(cache?{prompt_cache_breakpoint:{mode:'explicit'}}:{})}]}]:[]),{role:'user',content:prompt}],...(cache?{prompt_cache_options:{mode:'explicit'}}:{})}};
}
export function normalizeUsage(model:keyof typeof models,raw:unknown){
 if(model==='claude-opus-5-5'){const u=z.object({input_tokens:count,output_tokens:count,cache_read_input_tokens:count.optional().default(0),cache_creation_input_tokens:count.optional().default(0)}).parse(raw);return {ordinary:u.input_tokens,read:u.cache_read_input_tokens,write:u.cache_creation_input_tokens,output:u.output_tokens};}
 const u=z.object({input_tokens:count,output_tokens:count,input_tokens_details:z.object({cached_tokens:count,cache_write_tokens:count})}).parse(raw);
 const ordinary=u.input_tokens-u.input_tokens_details.cached_tokens-u.input_tokens_details.cache_write_tokens;if(ordinary<0)throw Error('Invalid counts');return {ordinary,read:u.input_tokens_details.cached_tokens,write:u.input_tokens_details.cache_write_tokens,output:u.output_tokens};
}
export async function execute(input:unknown,transport:typeof fetch=fetch){
 const parsed=schema.safeParse(input);if(!parsed.success)throw new EvaluationError('入力・モデル・APIキーを確認してください。',400);
 const p=parsed.data,start=performance.now();
 if(p.kind==='cli'){const raw:any=await requestTypeSafe({model:'jev-latest',state:p.state,questions:{result:cliQuestions[p.query]}},p.apiKey,transport);const result=cliSchemas[p.query].safeParse(raw?.answers?.result);if(!result.success)throw new EvaluationError('Jevの判定形式を確認できませんでした。');return {kind:'cli',answer:result.data,seconds:(performance.now()-start)/1000};}
 const config=buildText(p);const timeoutMs=p.maxOutput>4096?300000:90000;let raw:any;
 try{const r=await transport(config.url,{method:'POST',headers:Object.fromEntries(Object.entries({...config.headers,'Content-Type':'application/json'}).filter((x):x is [string,string]=>typeof x[1]==='string')),body:JSON.stringify(config.body),redirect:'manual',signal:AbortSignal.timeout(timeoutMs)});
 if(!r.ok)throw new EvaluationError([401,403].includes(r.status)?'APIキーとモデルの利用権限を確認してください。':r.status===429?'混雑または利用上限です。時間をおいて再実行してください。':'提供元がリクエストを受け付けませんでした。残高・モデルの提供状況を確認してください。');
 raw=await r.json();}catch(e){if(e instanceof EvaluationError)throw e;throw new EvaluationError('接続できないか受信期限（'+(timeoutMs/1000)+'秒）を超えました。提供元で処理・課金が続く場合があります。',504);}
 const anthropic=p.model==='claude-opus-5-5';
 const text=anthropic?(Array.isArray(raw.content)?raw.content.filter((x:any)=>x.type==='text'&&typeof x.text==='string').map((x:any)=>x.text).join('\n'):''):(Array.isArray(raw.output)?raw.output.filter((x:any)=>x.type==='message').flatMap((x:any)=>Array.isArray(x.content)?x.content:[]).filter((x:any)=>x.type==='output_text'&&typeof x.text==='string').map((x:any)=>x.text).join('\n'):'');
 let usage=null,usd=null;try{usage=normalizeUsage(p.model,raw.usage);usd=cost(p.model,usage);}catch{/* Missing usage must never appear as zero cost. */}
 const limitReached=anthropic?raw.stop_reason==='max_tokens':raw.incomplete_details?.reason==='max_output_tokens';
 return {kind:'text',maxOutput:p.maxOutput,limitReached,model:p.model,text:text||'回答本文がありません。推論中に上限へ達した可能性があります。',seconds:(performance.now()-start)/1000,usage,usd,incomplete:anthropic?raw.stop_reason!=='end_turn':raw.status!=='completed'};
}
