import test from 'node:test';
import assert from 'node:assert/strict';
import {gpuUrl, gpuRequest, generateGpu} from '../app/qwen-image/gpu.ts';
test('GPU endpoint requires HTTPS origin without credentials or paths',()=>{
 assert.equal(gpuUrl('https://gpu.example.com/'),'https://gpu.example.com');
 for(const url of ['http://gpu.example.com','https://key@gpu.example.com','https://gpu.example.com/api','https://gpu.example.com/?key=secret'])assert.throws(()=>gpuUrl(url));
});
test('GPU jobs send bearer and references, then fetch authenticated PNG',async()=>{
 const previous=globalThis.fetch;let n=0;
 globalThis.fetch=async(url,options)=>{
  assert.equal(options.headers.Authorization,'Bearer test-key');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');
  if(n++===0){assert.equal(options.body.get('steps'),'40');assert.equal(options.body.get('files').name,'ref.png');return Response.json({id:'a'.repeat(48)});}
  if(n===2)return Response.json({status:'complete'});
  return new Response(new Blob(['png'],{type:'image/png'}),{headers:{'Content-Type':'image/png'}});
 };
 try{const url=await generateGpu('https://gpu.example.com','test-key',{prompt:'test',size:'1024',seed:42,files:[new File(['png'],'ref.png',{type:'image/png'})]},new AbortController().signal,()=>{});assert.match(url,/^blob:/);URL.revokeObjectURL(url);assert.equal(n,3);}finally{globalThis.fetch=previous;}
});
test('busy GPU and invalid key produce actionable errors',async()=>{
 const previous=globalThis.fetch;
 try{for(const [status,message]of [[401,/接続キー/],[409,/生成中/]]){globalThis.fetch=async()=>new Response('',{status});await assert.rejects(gpuRequest('https://gpu.example.com','test','/health'),message);}}finally{globalThis.fetch=previous;}
});
