/* 剪辑器访问 /api/hybrid-reel/* 的入口。开发版用真实 fetch;评审原型注入演示用的 fetch(review/fixtureFetch.ts)。
   只用于这几个接口 —— 读本地素材(blob / 公开目录)的 fetch 不走这里。 */
export type Fetcher = typeof fetch;
export const liveFetch: Fetcher = (input, init) => fetch(input, init);
