/* 贴纸风新原型：状态和第二版共用(Provider2 / useV2 / 路由 / 签到 / 火苗 / 发布)。登录、付费、创作(第一版的 Create)仍由第一版 store 管 */
export * from "../../buzzvideo-app-v2/v2/store";

import type { Job } from "../../buzzvideo-app-v2/v2/store";
/** 新版设计的任务：多一个失败原因(生成失败时成品页显示失败界面，积分退回) */
export type JobS = Job & { failed?: string };
