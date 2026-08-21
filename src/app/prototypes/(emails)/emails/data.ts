/**
 * 邮件模板总表 —— 每封邮件的正文在各自目录的 template.ts 里,
 * 这里只把它们聚成一个数组,给侧栏导航和排序用。
 * 类型与示例数据在 ./types.ts。
 */
import type { Template } from "./types";
import { TEMPLATE as invite_member } from "./invite-member/content";
import { TEMPLATE as invite_finance } from "./invite-finance/content";
import { TEMPLATE as role_changed } from "./role-changed/content";
import { TEMPLATE as removed } from "./removed/content";
import { TEMPLATE as ownership_new } from "./ownership-new/content";
import { TEMPLATE as ownership_previous } from "./ownership-previous/content";
import { TEMPLATE as team_deleted } from "./team-deleted/content";
import { TEMPLATE as pool_80 } from "./pool-80/content";
import { TEMPLATE as pool_100 } from "./pool-100/content";
import { TEMPLATE as member_limit_80 } from "./member-limit-80/content";
import { TEMPLATE as member_limit_100 } from "./member-limit-100/content";
import { TEMPLATE as autotopup_failed } from "./autotopup-failed/content";
import { TEMPLATE as autotopup_paused } from "./autotopup-paused/content";
import { TEMPLATE as autotopup_cap } from "./autotopup-cap/content";
import { TEMPLATE as generation_blocked_apology } from "./generation-blocked-apology/content";
import { TEMPLATE as enterprise_activated } from "./enterprise-activated/content";
import { TEMPLATE as renewal_reminder } from "./renewal-reminder/content";
import { TEMPLATE as seedance_25_teaser } from "./seedance-25-teaser/content";
import { TEMPLATE as seedance_25_launch } from "./seedance-25-launch/content";
import { TEMPLATE as asset_library_launch } from "./asset-library-launch/content";
import { TEMPLATE as seed_audio_launch } from "./seed-audio-launch/content";

export const TEMPLATES: Template[] = [
  invite_member,
  invite_finance,
  role_changed,
  removed,
  ownership_new,
  ownership_previous,
  team_deleted,
  pool_80,
  pool_100,
  member_limit_80,
  member_limit_100,
  autotopup_failed,
  autotopup_paused,
  autotopup_cap,
  enterprise_activated,
  renewal_reminder,
  generation_blocked_apology,
  seedance_25_teaser,
  seedance_25_launch,
  asset_library_launch,
  seed_audio_launch,
];
