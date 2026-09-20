import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'DEMO ATLAS — デモサイト管理',description:'デモサイトをひとつの場所に。登録、整理、編集ができるサイト管理ワークスペース。',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ja"><body>{children}</body></html>}
