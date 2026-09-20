declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    SITE_OWNER_EMAIL?: string;
    BUCKET?: R2Bucket;
  }
}
