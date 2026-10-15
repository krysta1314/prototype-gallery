/* 成片下载(异常处理 spec 第 12 条):先把文件取下来再存,取不到(网络断了 / 地址失效)就返回 false,
   调用方出 toast「Download failed — try again」+ Retry。成片出片后已自动存进资产库,不会过期。 */

export const DOWNLOAD_FAILED = "Download failed — try again";
/** 成片下方「Open in Assets」:原型没有资产库页面 */
export const ASSETS_TOAST = "Assets isn't part of this prototype";

/** 下载 url,存成 fileName;成功 true,失败 false(不抛) */
export async function downloadFile(url: string, fileName: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    return true;
  } catch {
    return false;
  }
}
