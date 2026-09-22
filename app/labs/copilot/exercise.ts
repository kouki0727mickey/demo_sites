import {z} from 'zod';
export const ruleSchema=z.object({freeShippingFrom:z.number().int().min(0).max(100000),includeBoundary:z.boolean(),shippingFee:z.number().int().min(0).max(10000),rejectNegative:z.boolean()}).strict();
export const initialRules={freeShippingFrom:5000,includeBoundary:false,shippingFee:500,rejectNegative:false};
export const fixedRules={freeShippingFrom:5000,includeBoundary:true,shippingFee:500,rejectNegative:true};
export const cases=[{amount:0,expected:500},{amount:4999,expected:500},{amount:5000,expected:0},{amount:5001,expected:0},{amount:-1,expected:'error'}];
export function testRules(input:unknown){const r=ruleSchema.parse(input);return cases.map(c=>{const actual=c.amount<0&&r.rejectNegative?'error':(r.includeBoundary?c.amount>=r.freeShippingFrom:c.amount>r.freeShippingFrom)?0:r.shippingFee;return {...c,actual,passed:c.expected===actual};});}
export const buggyCode='function shipping(amount) {\n  return amount > 5000 ? 0 : 500;\n}';
export const requirement='注文額が5000円以上なら送料無料、それ未満は500円。負の注文額はエラーにする。';
export function makePrompt(withSpec:boolean,withTests:boolean){return ['Grok 4.7でこの送料計算の不具合を調べ、修正案を説明してください。',buggyCode,withSpec?'仕様: '+requirement:'仕様書は添付していません。',withTests?'テストケース: '+JSON.stringify(cases):'テストは添付していません。','検証用として、最後に次の4キーだけを持つJSONも返してください。freeShippingFrom（数値）、includeBoundary（しきい値を含めるboolean）、shippingFee（数値）、rejectNegative（負数を拒否するboolean）。'].join('\n\n');}
