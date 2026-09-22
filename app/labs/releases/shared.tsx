"use client";
import {LabShell} from '../shared';
import type {ReactNode} from 'react';
import './release.css';
export const links=[['/labs/grok','Grok / 提供経路'],['/labs/kev','Kev / 判断'],['/labs/python-workers','Python / API'],['/labs/langsmith','LangSmith / 評価']];
export function ReleaseShell({index,title,lead,children,sources}:{index:number;title:string;lead:string;children:ReactNode;sources:[string,string][]}){return <LabShell number={'SEP 21 / 0'+(index+1)} title={title} lead={lead} path={links[index][0]} links={links} checked="2026年9月22日" sources={sources}>{children}</LabShell>}
export async function postJson(url:string,body:unknown,signal?:AbortSignal){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});const data:any=await r.json();if(!r.ok)throw Error(data.error||'実行できませんでした。');return data;}
export function saveJson(name:string,data:unknown){const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
