export function gpuUrl(value: string) {
  const url = new URL(value.trim());
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw Error('専用GPUのHTTPS URLを入力してください（パスは不要です）。');
  return url.origin;
}
export async function gpuRequest(base: string, token: string, path: string, options: RequestInit = {}) {
  if (!token.trim()) throw Error('接続キーを入力してください。');
  const response = await fetch(gpuUrl(base) + path, {...options, credentials: 'omit', redirect: 'error', headers: {...options.headers, Authorization: 'Bearer ' + token.trim()}});
  if (!response.ok) {
    throw Error(response.status === 401 || response.status === 403 ? '接続キーを確認してください。' : response.status === 409 ? '専用GPUは生成中です。完了後に再実行してください。' : response.status === 404 ? '結果が期限切れか、サーバーが再起動されました。' : '専用GPUが処理を受け付けませんでした（' + response.status + '）。');
  }
  return response;
}
export async function generateGpu(base: string, token: string, input: {prompt: string; size: string; seed: number; files: File[]}, signal: AbortSignal, status: (message: string) => void) {
  const form = new FormData();
  form.append('prompt', input.prompt); form.append('size', input.size); form.append('seed', String(input.seed)); form.append('steps', '40');
  input.files.forEach(file => form.append('files', file));
  status('専用GPUへ送信中…');
  const job: any = await (await gpuRequest(base, token, '/jobs', {method: 'POST', body: form, signal})).json();
  if (typeof job.id !== 'string' || !/^[a-f0-9]{48}$/.test(job.id)) throw Error('GPUサーバーの応答形式を確認してください。');
  status('専用GPUで生成中…（最大20分）');
  while (true) {
    signal.throwIfAborted();
    const result: any = await (await gpuRequest(base, token, '/jobs/' + job.id, {signal})).json();
    if (result.status === 'error') throw Error('GPUで生成に失敗しました。GPUメモリとサーバーログを確認してください。');
    if (result.status === 'complete') {
      const response = await gpuRequest(base, token, '/jobs/' + job.id + '/image', {signal});
      if (!response.headers.get('Content-Type')?.startsWith('image/png')) throw Error('生成結果がPNG画像ではありません。');
      return URL.createObjectURL(await response.blob());
    }
    if (result.status !== 'running') throw Error('GPUサーバーの状態を確認できませんでした。');
    await new Promise<void>((resolve, reject) => {
      const cancel = () => {clearTimeout(timer); reject(signal.reason);};
      const timer = setTimeout(() => {signal.removeEventListener('abort', cancel); resolve();}, 2500);
      signal.addEventListener('abort', cancel, {once: true});
      if (signal.aborted) cancel();
    });
  }
}
