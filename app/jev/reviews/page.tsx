import type {Metadata} from 'next';
import JevDemo from '../jev-demo';
export const metadata:Metadata={title:"レビュー分析 — Jev Lab",description:"レビューの傾向・満足度・フォローの必要性をJevで評価します。"};
export default function Page(){return <JevDemo scenarioId="reviews"/>;}
