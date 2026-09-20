import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {isSiteOwner} from '@/lib/site-owner';
export async function getSiteAccess() {
  const user = await getChatGPTUser();
  return {signedIn: Boolean(user), canEdit: isSiteOwner(user, env.SITE_OWNER_EMAIL)};
}
export async function authorizeSiteEdit() {
  const access = await getSiteAccess();
  if (access.canEdit) return null;
  return Response.json({error: access.signedIn ? 'サイトを編集できるのは管理者だけです。' : '編集するには管理者アカウントでログインしてください。'}, {
    status: access.signedIn ? 403 : 401,
    headers: {'Cache-Control': 'no-store', Vary: 'Cookie'},
  });
}
