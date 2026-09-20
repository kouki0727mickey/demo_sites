import type {Metadata} from 'next';
import JevDemo from '../jev-demo';
export const metadata:Metadata={title:"営業リード判定 — Jev Lab",description:"商談の検討段階・導入意欲・デモ提案の適切さをJevで評価します。"};
export default function Page(){return <JevDemo scenarioId="leads"/>;}
