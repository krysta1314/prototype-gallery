let counter = 0;

/** 组件发 action 前生成 id,reducer 保持纯函数(测试里直接传固定 id) */
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}
