/* 补拍 prompt 里参考图的编号:Seedance 按传入顺序把参考图当成 @Image 1、@Image 2…
   模型偶尔会写错:从 @Image 0 开始,或者按素材在列表里的序号写(只传了 1 张图却写 @Image 3)。
   这里统一纠正:从 1 开始;编号超出实际参考图张数时,按出现顺序重新编成 1、2、3… */
export function fixImageRefs(prompt: string, refCount?: number): string {
  const RE = /@Image\s*(\d+)/gi;
  const nums = [...prompt.matchAll(RE)].map((m) => Number(m[1]));
  if (!nums.length) return prompt;
  const shift = Math.min(...nums) === 0 ? 1 : 0;
  const shifted = nums.map((n) => n + shift);
  if (refCount !== undefined && refCount > 0 && Math.max(...shifted) > refCount) {
    const order = [...new Set(shifted)];
    return prompt.replace(RE, (_, n: string) => `@Image ${Math.min(order.indexOf(Number(n) + shift) + 1, refCount)}`);
  }
  return shift ? prompt.replace(RE, (_, n: string) => `@Image ${Number(n) + 1}`) : prompt;
}
