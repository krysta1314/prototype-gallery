'use client';

/* 活动卡的配色预设。跟节日无关 —— 运营挑一套配色,不是挑一个节日。
   没上传背景图时当卡片背景用;上传了真图就不生效。

   设计约束(这几条决定了为什么不是简单的两色渐变):
   1. 左侧必须够深。文案和 CTA 压在左半边,卡片本身还叠了一层暗色蒙层,
      左端浅了字就发虚。所以每套的起点都在明度 12% 以下。
   2. 彩度放右侧 35~40%。这样卡片有色彩记忆点,又不跟左边的文字抢。
   3. 高光用锚在右上角外侧的大半径径向渐变,不是画一个圆 ——
      半径超出画框才是光,落在画框里就成了球(上一版就是这个毛病)。
   4. 每套是一次刻意的配对,不是同一公式换色相:冷→暖、双色→近单色都有,
      放在一起能看出是五种不同的气质。 */

import type { ArtKey } from '../_lib/types';

/* 顺序按色相走(冷 → 暖 → 绿 → 中性),运营扫一眼就能找到想要的那一档,
   而不是按我添加的先后顺序排。 */
export const ART_OPTIONS: { id: ArtKey; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'aurora', label: 'Aurora' },
  { id: 'cobalt', label: 'Cobalt' },
  { id: 'lagoon', label: 'Lagoon' },
  { id: 'nebula', label: 'Nebula' },
  { id: 'berry', label: 'Berry' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'citrus', label: 'Citrus' },
  { id: 'clay', label: 'Clay' },
  { id: 'moss', label: 'Moss' },
  { id: 'mint', label: 'Mint' },
  { id: 'graphite', label: 'Graphite' },
  { id: 'onyx', label: 'Onyx' },
];

/* 每套配色自带一个强调色,活动卡的标签和大标题用它。
   不给强调色的话,深色底配品牌橙是唯一组合 —— 像 Onyx 这种近黑 + 洋红的路子就出不来。 */
export const ART_ACCENT: Record<string, string> = {
  aurora: '#5AD6F0',
  cobalt: '#5AA9FF',
  lagoon: '#3FD3CE',
  nebula: '#C57BFF',
  berry: '#FF5C93',
  sunset: '#FF8A5C',
  citrus: '#FFA13C',
  clay: '#E8A186',
  moss: '#A8CC4F',
  mint: '#4FD38C',
  graphite: '#B9C0D4',
  onyx: '#FF1F6B',
};

/** 卡片强调色:配色带的那个,没有就退回品牌橙 */
export function accentOf(art: string | undefined): string {
  return (art && ART_ACCENT[art]) || '#ff7a3d';
}

/** 右上角外侧的大半径高光,给渐变一点光的方向感 */
const SHEEN = (rgba: string) => `radial-gradient(95% 130% at 102% -8%, ${rgba} 0%, transparent 62%)`;

const ART: Record<string, string> = {
  // 冷调双色:靛蓝 → 紫 → 青。AI 产品最通用的一套,也是最不容易过时的
  aurora: [
    SHEEN('rgba(120,235,255,0.42)'),
    'linear-gradient(112deg,#0A0A1F 0%,#1B1247 34%,#4B2CA8 62%,#2F8FD6 88%,#41D6E3 100%)',
  ].join(','),
  // 暖调双色:近黑梅 → 洋红 → 琥珀。促销力度最强的一套
  sunset: [
    SHEEN('rgba(255,214,140,0.38)'),
    'linear-gradient(112deg,#120612 0%,#3A0B33 32%,#8E1B5B 60%,#D64545 84%,#F5A25A 100%)',
  ].join(','),
  // 品牌邻近色:浓咖 → 焦橙 → 金。和 Buzz 的暖橙同族,最"自家"
  citrus: [
    SHEEN('rgba(255,224,168,0.40)'),
    'linear-gradient(112deg,#1A0B04 0%,#4A1A06 30%,#A33A0B 58%,#F0761C 84%,#FFC048 100%)',
  ].join(','),
  // 冷调近单色:墨绿 → 翡翠 → 青柠。适合"上新/解锁"这类正向消息
  mint: [
    SHEEN('rgba(190,255,214,0.36)'),
    'linear-gradient(112deg,#04120E 0%,#07362A 32%,#0E6B4A 60%,#1FA36A 84%,#6FE0A0 100%)',
  ].join(','),
  // 纯蓝,不带紫。Aurora 的青蓝里有紫,这套是干净的电光蓝,更"可信"不"炫"
  cobalt: [
    SHEEN('rgba(160,215,255,0.40)'),
    'linear-gradient(112deg,#04102B 0%,#0B2560 32%,#1A4FB5 60%,#2E86F0 86%,#7CC4FF 100%)',
  ].join(','),
  // 青绿:墨蓝绿 → 湖水青 → 浅水蓝。Cobalt 太"蓝"、Mint 太"绿"时的中间档
  lagoon: [
    SHEEN('rgba(175,245,255,0.38)'),
    'linear-gradient(112deg,#04151A 0%,#0A3540 32%,#12707F 60%,#22A8B0 86%,#7BE3E0 100%)',
  ].join(','),
  // 紫罗兰:深紫 → 品红紫 → 淡紫。最"活动感"的一套,适合大促
  nebula: [
    SHEEN('rgba(238,190,255,0.40)'),
    'linear-gradient(112deg,#0A0713 0%,#2A1250 32%,#6A2AA8 60%,#A94CDE 86%,#E3A6FF 100%)',
  ].join(','),
  // 粉系:近黑酒红 → 树莓 → 蜜桃粉。和 Sunset 的分别是它不走到暖黄
  berry: [
    SHEEN('rgba(255,196,220,0.38)'),
    'linear-gradient(112deg,#16060F 0%,#46092F 32%,#A5185F 60%,#E24A86 86%,#FFA9C6 100%)',
  ].join(','),
  // 陶土:低彩度暖棕 → 砖红 → 浅陶。Citrus 太亮的时候用这套,同样暖但沉得下来
  clay: [
    SHEEN('rgba(255,220,198,0.34)'),
    'linear-gradient(112deg,#150A07 0%,#3E1C14 32%,#7E3A29 60%,#C2705A 86%,#EDBCA4 100%)',
  ].join(','),
  // 橄榄绿:墨绿 → 苔绿 → 芥末黄绿。和 Mint 的分别是它偏黄、更"自然"不"科技"
  moss: [
    SHEEN('rgba(224,240,170,0.34)'),
    'linear-gradient(112deg,#0A0F06 0%,#1E3512 32%,#456E1C 60%,#77A335 86%,#C3D97A 100%)',
  ].join(','),
  /* 近黑 + 暗酒红,靠细点阵出质感,彩度全部交给洋红的标题。
     参考竞品那版促销卡:背景几乎不发声,信息全靠强调色顶起来。 */
  onyx: [
    'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
    SHEEN('rgba(255,90,150,0.22)'),
    'linear-gradient(112deg,#0B060A 0%,#160A12 42%,#2A0C1C 72%,#43102A 100%)',
  ].join(','),
  // 安静的一套:纯中性深灰 + 冷光。不是每个活动都要彩色
  graphite: [
    SHEEN('rgba(210,222,255,0.22)'),
    'linear-gradient(112deg,#0B0B0F 0%,#16171D 38%,#282A34 68%,#3E4150 88%,#585C6E 100%)',
  ].join(','),
};

export function CampaignArt({ art, className = '' }: { art: ArtKey | undefined; className?: string }) {
  // 旧数据里可能还是节日名或上一版的配色名,取不到就按无配色处理,不要崩
  const bg = art && art !== 'none' ? ART[art] : undefined;
  if (!bg) {
    return <div className={`bg-[#f4f4f6] ${className}`} aria-hidden />;
  }
  // 点阵那一层要给尺寸,否则 1px 的圆会被拉成整块
  const sized = art === 'onyx' ? '9px 9px, auto, auto' : undefined;
  return (
    <div
      className={className}
      aria-hidden
      style={{ backgroundImage: bg, backgroundSize: sized, backgroundRepeat: art === 'onyx' ? 'repeat, no-repeat, no-repeat' : undefined }}
    />
  );
}
