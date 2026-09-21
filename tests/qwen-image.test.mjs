import test from 'node:test';import assert from 'node:assert/strict';
import {inputSchema,dataFor} from '../app/qwen-image/api.ts';
const input={prompt:'Test transparent image',size:'1024',seed:42,enhance:false,references:[]};
test('official API argument order preserves prompt, size and seed',()=>{assert.deepEqual(dataFor(input),[[],input.prompt,false,true,'./generation_logs_paper_case',42,false,1024,1024,' ']);});
test('reference paths are uploaded files only and at most ten',()=>{for(const refs of [['https://example.com/a.png'],['/etc/passwd'],Array(11).fill('/tmp/gradio/abc/a.png')])assert.equal(inputSchema.safeParse({...input,references:refs}).success,false);const valid=inputSchema.parse({...input,references:['/tmp/gradio/abc/ref.png']});assert.equal(dataFor(valid)[0][0].image.path,valid.references[0]);});
