import test from 'node:test';
import assert from 'node:assert/strict';
import {judge} from '../app/jev/evals/engine.ts';
const input={request:'weather',evidence:'sunny',answer:'sunny',apiKey:'test-secret'};
test('judge normalizes score and keeps credentials outside evaluation state/results',async()=>{let calls=0;const result=await judge(input,async(url,options)=>{calls++;assert.equal(url,'https://api.typesafe.ai/v1/systemone');const body=JSON.parse(options.body);assert.equal(body.state.includes('test-secret'),false);return Response.json({model:'jev-latest',answers:{does_pass:{type:'noul',noul:.9},quality:{type:'score',score:3}}});});assert.equal(calls,1);assert.equal(result.score,.75);assert.equal(result.probability,.9);assert.equal(JSON.stringify(result).includes('test-secret'),false);});
test('judge rejects invalid inputs and malformed upstream scores',async()=>{await assert.rejects(judge({...input,request:''},()=>{throw Error('must not call')}));await assert.rejects(judge(input,async()=>Response.json({model:'jev',answers:{does_pass:{type:'noul',noul:.8},quality:{type:'score',score:5}}})),/応答形式/);});
