import type {Metadata} from 'next';
import JevDemo from '../jev-demo';
export const metadata:Metadata={title:"タスク優先度判定 — Jev Lab",description:"依頼文の対応優先度・業務への影響・期限の有無をJevで評価します。"};
export default function Page(){return <JevDemo scenarioId="tasks"/>;}
