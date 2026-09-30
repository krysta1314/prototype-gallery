import { LIBRARY_ASSETS, TEAM_ASSETS } from "./data";
import { jobProgress, type Job, type JobStatus, type StoreState, type Upload } from "./store";

/** Me · Assets:把 AI 作品(jobs)和用户上传(uploads / 素材库)合成一张表,再筛选、排序。全部是纯函数。 */

export type AssetType = "image" | "video" | "audio" | "doc";
export type AssetSource = "ai" | "upload";
export type AssetScope = "my" | "team";

export type AssetItem = {
  id: string;
  source: AssetSource;
  type: AssetType;
  title: string;
  cover: string;
  video?: string;
  /** 作品:生成状态;上传:uploading / done */
  status: JobStatus | "uploading";
  /** 0–1,只有 running / uploading 时有意义 */
  progress: number;
  favorite: boolean;
  modifiedAt: number;
  /** 团队素材的作者;「我的」素材没有 */
  author?: string;
  /** source 为 ai 且属于当前用户时,对应 Job 的 id(用来打开结果页 / 重试) */
  jobId?: string;
};

export type AssetFilters = { favorites: boolean; type: "all" | AssetType; source: "all" | AssetSource };
export const NO_FILTERS: AssetFilters = { favorites: false, type: "all", source: "all" };

const jobType = (j: Job): AssetType => (j.mode === "image" ? "image" : j.mode === "audio" ? "audio" : "video");
const uploadType = (u: Upload): AssetType => (u.kind === "pdf" ? "doc" : u.kind === "video" ? "video" : "image");

/** 合并:当前工作区的作品 + 上传(+ 个人空间的素材库),按最后修改倒序,同序号保持原顺序 */
export function myAssets(s: StoreState): AssetItem[] {
  const fav = new Set(s.favorites);
  const jobs: AssetItem[] = s.jobs
    .filter((j) => j.workspace === s.workspace)
    .map((j) => ({
      id: j.id,
      source: "ai",
      type: jobType(j),
      title: j.title,
      cover: j.cover,
      video: j.video,
      status: j.status,
      progress: jobProgress(j),
      favorite: fav.has(j.id),
      modifiedAt: j.modifiedAt ?? 0,
      jobId: j.id,
    }));
  const uploads: AssetItem[] = s.uploads
    .filter((u) => u.workspace === s.workspace)
    .map((u) => ({
      id: u.id,
      source: "upload",
      type: uploadType(u),
      title: u.kind === "pdf" ? "Document" : "Upload",
      cover: u.uri,
      status: u.progress < 1 ? "uploading" : "done",
      progress: u.progress,
      favorite: fav.has(u.id),
      modifiedAt: u.modifiedAt ?? 0,
    }));
  const library: AssetItem[] =
    s.workspace === "personal"
      ? LIBRARY_ASSETS.map((a) => ({
          id: a.id,
          source: "upload",
          type: a.kind === "video" ? "video" : "image",
          title: a.label,
          cover: a.uri,
          status: "done",
          progress: 1,
          favorite: fav.has(a.id),
          modifiedAt: a.modifiedAt,
        }))
      : [];
  return sortAssets([...jobs, ...uploads, ...library]);
}

/** 团队素材:只有组织工作区有 */
export function teamAssets(s: StoreState): AssetItem[] {
  if (s.workspace === "personal") return [];
  const fav = new Set(s.favorites);
  return sortAssets(
    TEAM_ASSETS.map((a) => ({
      id: a.id,
      source: a.source,
      type: a.type,
      title: a.title,
      cover: a.cover,
      video: a.video,
      status: "done" as const,
      progress: 1,
      favorite: fav.has(a.id),
      modifiedAt: a.modifiedAt,
      author: a.author,
    })),
  );
}

export const sortAssets = (items: AssetItem[]) =>
  items.map((x, i) => ({ x, i })).sort((a, b) => b.x.modifiedAt - a.x.modifiedAt || a.i - b.i).map(({ x }) => x);

export const filterAssets = (items: AssetItem[], f: AssetFilters) =>
  items.filter((x) => (!f.favorites || x.favorite) && (f.type === "all" || x.type === f.type) && (f.source === "all" || x.source === f.source));

export const assetsFor = (s: StoreState, scope: AssetScope, f: AssetFilters = NO_FILTERS) =>
  filterAssets(scope === "team" ? teamAssets(s) : myAssets(s), f);
