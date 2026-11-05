export type KV = { k: string; v: string };

export type MapMode = {
  name: string;
  /** v1.12 新增的模式 */
  isNew?: boolean;
  /** 该模型是这个模式的默认模型 */
  isDefault?: boolean;
  params: KV[];
};

export type MapModel = {
  name: string;
  /** 视频模型在 video-gen-modes 里的 key(「看 UI」用) */
  key?: string;
  provider: string;
  /** v1.12 新上的模型 */
  isNew?: boolean;
  price?: string;
  /** 演示说明(中文) */
  note?: string;
  modes: MapMode[];
  /** 额外设置(Thinking、Prompt Enhance 等,来自 skill 的 Extra settings 表) */
  settings?: KV[];
  limits: KV[];
};

export type MapGroup = {
  key: string;
  label: string;
  zh: string;
  color: string;
  tint: string;
  models: MapModel[];
};
