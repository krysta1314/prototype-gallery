/* mammoth 的浏览器构建没带类型声明,这里补一个最小面。
   只用到 convertToHtml,别的用法要先扩这里。 */
declare module "mammoth/mammoth.browser" {
  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer },
    options?: { styleMap?: string[] },
  ): Promise<{ value: string; messages: { type: string; message: string }[] }>;
}
