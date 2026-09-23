import test from 'node:test';
import assert from 'node:assert/strict';
import {execute,buildText,normalizeUsage} from '../app/labs/frontier/engine.ts';
import {cost,cliCommand,shellQuote} from '../app/labs/frontier/data.ts';
const input={kind:'text',apiKey:'fake-test-key',model:'gpt-6-luna',prompt:'Test',prefix:'Fixed rules',cache:true};
test('cache writes and reads are counted exactly once for both providers',()=>{
 const a=normalizeUsage('claude-opus-5-5',{input_tokens:100,output_tokens:50,cache_creation_input_tokens:1000,cache_read_input_tokens:2000});
 assert.deepEqual(a,{ordinary:100,output:50,write:1000,read:2000});
 assert.equal(cost('claude-opus-5-5',a),.0068);
 const b=normalizeUsage('gpt-6-sol',{input_tokens:3100,output_tokens:50,input_tokens_details:{cached_tokens:2000,cache_write_tokens:1000}});
 assert.deepEqual(b,a);assert.equal(cost('gpt-6-sol',b),.0036);
 assert.throws(()=>normalizeUsage('gpt-6-sol',{input_tokens:10,output_tokens:1,input_tokens_details:{cached_tokens:20,cache_write_tokens:0}}));
});
test('stable prefix gets explicit boundary and user content stays outside',()=>{
 const c=buildText(input);assert.equal(c.url,'https://api.openai.com/v1/responses');
 assert.equal(c.body.store,false);assert.equal(c.body.prompt_cache_options.mode,'explicit');
 assert.deepEqual(c.body.input[0].content[0].prompt_cache_breakpoint,{mode:'explicit'});assert.equal(c.body.input[1].content,'Test');
 const a=buildText({...input,model:'claude-opus-5-5'});assert.equal(a.body.thinking.type,'adaptive');assert.equal(a.body.system[0].cache_control.type,'ephemeral');
});
test('real responses normalize text and missing usage stays unknown',async()=>{
 const r=await execute(input,async(url,options)=>{assert.equal(options.redirect,'manual');assert.equal(options.headers.Authorization,'Bearer fake-test-key');return Response.json({status:'completed',output:[{type:'reasoning',summary:[]},{type:'message',content:[{type:'output_text',text:'Answer'}]}]});});
 assert.equal(r.text,'Answer');assert.equal(r.usd,null);assert.equal(r.usage,null);assert.equal(r.incomplete,false);
});
test('provider errors do not expose credentials or upstream bodies',async()=>{
 await assert.rejects(execute(input,async()=>Response.json({error:'fake-test-key'}, {status:401})),e=>!e.message.includes('fake-test-key')&&e.message.includes('APIキー'));
 await assert.rejects(execute({...input,model:'unknown'},async()=>{throw Error('must not call')}),e=>e.status===400);
});
test('Jev uses selected query and rejects malformed probabilities',async()=>{
 let body;const r=await execute({kind:'cli',query:'noul',state:'refund',apiKey:'fake-test-key'},async(url,o)=>{body=JSON.parse(o.body);return Response.json({answers:{result:{type:'noul',noul:.9}}})});
 assert.equal(body.questions.result.type,'noul');assert.equal(r.answer.noul,.9);
 await assert.rejects(execute({kind:'cli',query:'noul',state:'refund',apiKey:'fake-test-key'},async()=>Response.json({answers:{result:{type:'noul',noul:2}}})));
 assert.match(cliCommand('score'),/-o answer_type score/);assert.match(cliCommand('choice'),/< message.txt$/);assert.equal(shellQuote("a'b"), "'a'\"'\"'b'");
});

test('long answers use selected limits for both APIs and enforce a bounded maximum',async()=>{
 for(const model of ['claude-opus-5-5','gpt-6-sol','gpt-6-luna']){
  const r=await execute({...input,model,maxOutput:32768},async(url,o)=>{
   const b=JSON.parse(o.body);assert.equal(b.max_tokens??b.max_output_tokens,32768);
   return Response.json(model==='claude-opus-5-5'?{stop_reason:'max_tokens',content:[{type:'text',text:'Partial'}]}:{status:'incomplete',incomplete_details:{reason:'max_output_tokens'},output:[{type:'message',content:[{type:'output_text',text:'Partial'}]}]});
  });
  assert.equal(r.maxOutput,32768);assert.equal(r.limitReached,true);assert.equal(r.incomplete,true);
 }
 await assert.rejects(execute({...input,maxOutput:999999},async()=>{throw Error('must not call')}),e=>e.status===400);
 const r=await execute({...input,maxOutput:16384},async()=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'Full answer'}]}]}));
 assert.equal(r.incomplete,false);assert.equal(r.limitReached,false);
});
