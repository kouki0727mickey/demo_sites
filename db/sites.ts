import {env} from 'cloudflare:workers';
export function siteDatabase(){if(!env.DB)throw new Error('Site database unavailable');return env.DB;}
