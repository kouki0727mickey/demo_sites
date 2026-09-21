import {z} from 'zod';
export const kinds=['comfyui','inference','prompt-rewrite','evals'] as const;
export type LabKind=typeof kinds[number];
export const configSchema=z.object({schema:z.literal('atlas-colab-config-v1'),kind:z.enum(kinds),prompt:z.string().trim().min(1).max(4500),mode:z.enum(['generate','edit']),transparent:z.boolean(),size:z.union([z.literal(1024),z.literal(2048)]),steps:z.number().int().min(1).max(50),seed:z.number().int().min(0).max(2147483647),repetitions:z.number().int().min(1).max(20),evidence:z.string().max(4500),answer:z.string().max(4500),human_pass:z.boolean()});
const finite=z.number().finite().nonnegative().max(1e7);
const probability=z.number().finite().min(0).max(1);
export const reportSchema=z.object({schema:z.literal('atlas-colab-result-v1'),kind:z.enum(kinds),created_at:z.string().datetime({offset:true}),engine:z.enum(['comfyui','vllm-omni','sglang','qwen-pe','jev']),model:z.string().min(1).max(500),elapsed_seconds:finite,environment:z.object({gpu:z.string().min(1).max(2000),python:z.string().max(100),revision:z.string().max(100).optional(),transformers:z.string().max(100).optional(),torch:z.string().max(100).optional(),dtype:z.string().max(100).optional()}),config:configSchema,timing_scope:z.enum(['startup_and_generation_excludes_download','generation_only','process_including_model_load','api_round_trip']),image:z.string().max(23*1024*1024).regex(/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/).optional(),rewrite:z.object({rewritten_prompt:z.string().min(1).max(50000),wh_ratio:z.string().max(30).optional(),ratio_follow:z.string().max(30).optional()}).optional(),rows:z.array(z.object({probability,score:probability,seconds:finite})).min(1).max(20).optional()}).superRefine((r,ctx)=>{
 const engines:Record<LabKind,string[]>={comfyui:['comfyui'],inference:['vllm-omni','sglang'],'prompt-rewrite':['qwen-pe'],evals:['jev']};
 if(r.config.kind!==r.kind||!engines[r.kind].includes(r.engine))ctx.addIssue({code:'custom',message:'結果の種類とモデルが一致しません。'});
 if((r.kind==='comfyui'||r.kind==='inference')&&!r.image)ctx.addIssue({code:'custom',message:'生成画像がありません。'});
 if(r.kind==='prompt-rewrite'&&!r.rewrite)ctx.addIssue({code:'custom',message:'書き換え文がありません。'});
 if(r.kind==='evals'&&(!r.rows||r.rows.length!==r.config.repetitions))ctx.addIssue({code:'custom',message:'評価回数が一致しません。'});
 const scopes={comfyui:'startup_and_generation_excludes_download',inference:'process_including_model_load','prompt-rewrite':'generation_only',evals:'api_round_trip'};
 if(r.timing_scope!==scopes[r.kind])ctx.addIssue({code:'custom',message:'計測範囲が一致しません。'});
});
export type ColabReport=z.infer<typeof reportSchema>;
export function parseReport(raw:string,kind:LabKind){if(raw.length>26*1024*1024)throw Error('結果JSONは26MB以下にしてください。');const result=reportSchema.safeParse(JSON.parse(raw));if(!result.success)throw Error('このノートブックの結果JSONではないか、必要なデータが欠けています。');if(result.data.kind!==kind)throw Error('別のデモの結果です。対応するサイトで読み込んでください。');return result.data;}
export function evalStats(r:ColabReport){const rows=r.rows!;const mean=rows.reduce((s,x)=>s+x.score,0)/rows.length;return {mean,variance:rows.reduce((s,x)=>s+(x.score-mean)**2,0)/rows.length,agreement:rows.filter(x=>(x.probability>=.5)===r.config.human_pass).length/rows.length,seconds:rows.reduce((s,x)=>s+x.seconds,0)/rows.length};}
export function comparable(a:ColabReport,b:ColabReport){return a.environment.gpu===b.environment.gpu&&a.timing_scope===b.timing_scope&&(['prompt','seed','size','steps','transparent','mode'] as const).every(key=>a.config[key]===b.config[key]);}
