import {getSiteAccess} from '@/lib/site-access';
import {chatGPTSignInPath,chatGPTSignOutPath} from '@/app/chatgpt-auth';
export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json({...await getSiteAccess(),signInUrl:chatGPTSignInPath('/'),signOutUrl:chatGPTSignOutPath('/')}, {
    headers: {'Cache-Control': 'private, no-store', Vary: 'Cookie'},
  });
}
