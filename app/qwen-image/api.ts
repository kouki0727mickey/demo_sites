import {z} from 'zod';
export const HOST='https://qwen-qwen-image-2-1.hf.space';
export const inputSchema=z.object({prompt:z.string().trim().min(1).max(5000),size:z.enum(['1024','2048']),seed:z.number().int().min(0).max(2147483647),enhance:z.boolean(),references:z.array(z.string().regex(/^\/tmp\/gradio\/[a-f0-9]+\/[^/\\]+$/)).max(10)});
export function dataFor(input:z.infer<typeof inputSchema>){return [input.references.map(path=>({image:{path,meta:{_type:'gradio.FileData'}},caption:null})),input.prompt,input.enhance,true,'./generation_logs_paper_case',input.seed,false,Number(input.size),Number(input.size),' '];}
export function sameOrigin(request:Request){return !request.headers.get('origin')||request.headers.get('origin')===new URL(request.url).origin;}
export const noStore={'Cache-Control':'no-store'};
