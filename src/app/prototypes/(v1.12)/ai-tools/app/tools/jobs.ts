// 新工具页(Resize & Expand / Video Resize / Auto Captions)共用的任务列表 reducer(纯函数,node 测试直接跑)。
// 一条 job = 一次要跑模型的产出(比如一个版位的一张图、一个比例的一条视频)。
// 积分不在这里:钱包在外壳(ProductApp,和 Upscale Image 同一个余额),
// 调用方先 wallet.charge(cost) 成功才 start / restart;跑失败时调用方 wallet.refund(job.cost)(全额退)。

export type JobStatus = "running" | "done" | "failed";

export type ToolJob<I> = {
  id: string;
  /** 同一次 Generate 产出的一组(结果区按组显示) */
  batch: string;
  input: I;
  /** 这一条扣了多少积分(0 = 免费,如 Crop / Fit) */
  cost: number;
  status: JobStatus;
  startedAt: number;
};

export type JobsAction<I> =
  | { type: "start"; jobs: Omit<ToolJob<I>, "status" | "startedAt">[]; now: number }
  | { type: "done"; id: string }
  | { type: "fail"; id: string }
  /** 重做 / 失败重试 / 微调后重新生成:回到 running;可换 input 和 cost */
  | { type: "restart"; id: string; now: number; input?: I; cost?: number }
  /** 不用跑模型的改动(如 Crop 结果挪位置):直接改 input */
  | { type: "patch"; id: string; input: I }
  /** 生成中取消(调用方自己退积分) */
  | { type: "remove"; id: string }
  | { type: "reset" };

export function jobsReduce<I>(jobs: ToolJob<I>[], a: JobsAction<I>): ToolJob<I>[] {
  switch (a.type) {
    case "start": {
      const fresh = a.jobs.filter((j) => !jobs.some((x) => x.id === j.id));
      if (!fresh.length) return jobs;
      return [...jobs, ...fresh.map((j) => ({ ...j, status: "running" as const, startedAt: a.now }))];
    }
    case "done":
    case "fail": {
      const j = jobs.find((x) => x.id === a.id);
      if (!j || j.status !== "running") return jobs;
      const status = a.type === "done" ? "done" : "failed";
      return jobs.map((x) => (x.id === a.id ? { ...x, status } : x));
    }
    case "restart": {
      const j = jobs.find((x) => x.id === a.id);
      if (!j || j.status === "running") return jobs;
      return jobs.map((x) =>
        x.id === a.id ? { ...x, status: "running", startedAt: a.now, input: a.input ?? x.input, cost: a.cost ?? x.cost } : x,
      );
    }
    case "patch":
      return jobs.map((x) => (x.id === a.id ? { ...x, input: a.input } : x));
    case "remove":
      return jobs.filter((x) => x.id !== a.id);
    case "reset":
      return [];
  }
}

/** 一组 job 按 batch 分组,最新一组在前(组内保持提交顺序) */
export function groupBatches<I>(jobs: ToolJob<I>[]): { batch: string; jobs: ToolJob<I>[] }[] {
  const order: string[] = [];
  const map = new Map<string, ToolJob<I>[]>();
  for (const j of jobs) {
    if (!map.has(j.batch)) {
      map.set(j.batch, []);
      order.push(j.batch);
    }
    map.get(j.batch)!.push(j);
  }
  return order.reverse().map((batch) => ({ batch, jobs: map.get(batch)! }));
}

/** 外壳的钱包:扣费成功返回 true;余额不够返回 false(外壳弹「Not enough credits」,不扣费) */
export type Wallet = {
  balance: number;
  charge: (cost: number) => boolean;
  refund: (cost: number) => void;
};

/** 事件里取当前时间(开跑时间);包一层免得 react-hooks/purity 误报 */
export const nowMs = () => Date.now();
