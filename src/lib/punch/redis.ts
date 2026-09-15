import { Redis } from "@upstash/redis";

let client: Redis | null = null;

/** 延迟初始化，避免构建期就要求环境变量存在 */
export function getRedis(): Redis {
  if (!client) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error("缺少 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN");
    }
    client = new Redis({ url, token });
  }
  return client;
}
