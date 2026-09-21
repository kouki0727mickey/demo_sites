export function cacheWork(steps:number,prefixPercent:number,enabled:boolean){
 const prefix=prefixPercent/100;
 const baseline=steps;
 const work=enabled?prefix+steps*(1-prefix):baseline;
 return {baseline,work,saved:100*(1-work/baseline),prefixRuns:enabled?1:steps};
}
export function scoreStats(values:number[],truth:number,threshold:number){
 const mean=values.reduce((sum,x)=>sum+x,0)/values.length;
 return {mean,variance:values.reduce((sum,x)=>sum+(x-mean)**2,0)/values.length,agreement:values.filter(x=>(x>=threshold)===(truth>=threshold)).length/values.length};
}
export function syntheticScores(kind:'stable'|'variable'|'wrong',count:number,truth:number){
 return Array.from({length:count},(_,i)=>Math.max(0,Math.min(1,(kind==='wrong'?1-truth:truth)+Math.sin((i+1)*2.399963)*(kind==='variable'?.22:.008))));
}
export function rewritePrompt(mode:string,request:string,details:{style:string;composition:string;lighting:string;preserve:string;ratio:string;transparent:boolean}){
 const text=mode==='t2i'
  ? `${request.trim()}\nStyle: ${details.style}. Composition: ${details.composition}. Lighting: ${details.lighting}.`
  : `Edit <image1>: ${request.trim()}\nPreserve ${details.preserve}. Change only the requested elements. Keep unrelated details consistent with the reference.`;
 return {rewritten_prompt:text+(details.transparent?'\nUse an RGBA image with an alpha channel and a transparent background.':''),wh_ratio:mode==='i2i'?'':details.ratio,ratio_follow:mode==='i2i'?'<image1>':''};
}
