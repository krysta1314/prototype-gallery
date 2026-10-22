import { useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from "react-native";
import Gradient from "../components/Gradient";
import Icon from "../components/Icon";
import MediaVideo from "../components/MediaVideo";
import IosShareSheet from "../components/IosShareSheet";
import ShareGlyph, { DownloadGlyph } from "../components/ShareGlyph";
import { pressScale } from "../components/motion";
import { USE_CASES, type UseCase } from "../data";
import { nextId } from "../ids";
import { useInsets, useNav, useStore } from "../provider";
import { composerFromUseCase } from "../store";
import { colors, radius, space, type } from "../theme";

/** 右侧一列(点赞 / 分享 / More)的宽度 */
const SIDE_W = 48;
const fmtCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n));

/**
 * 灵感详情(2026-10-21 按即梦模板详情重做):整屏成片，像短视频流一样上下滑切上一个 / 下一个
 * (顺序 = 从灵感流哪个分类点进来的那个列表);多张图的作品左右滑翻图，底部分段进度条。
 * 左上 ✕ 关闭;右侧点赞(数字)+ 分享;左下标题 + 一句说明(不放 Template 标签和订阅提示);底部白色大按钮做同款 + More(举报)
 */
export default function UseCaseDetail({ id, list }: { id: string; list?: string[] }) {
  const { navigate } = useNav();
  const insets = useInsets();
  const items = (list ?? USE_CASES.map((u) => u.id)).map((x) => USE_CASES.find((u) => u.id === x)).filter(Boolean) as UseCase[];
  const start = Math.max(0, items.findIndex((u) => u.id === id));
  const [h, setH] = useState(0);
  const [w, setW] = useState(0);
  const [index, setIndex] = useState(start);
  const ref = useRef<ScrollViewInstance>(null);
  /** 正在分享的模板：弹 iOS 系统分享面板(盖在整页上，✕ 也在它下面) */
  const [sharing, setSharing] = useState<UseCase | null>(null);
  const { dispatch } = useStore();
  // 量到高度后跳到点进来的那一个
  useEffect(() => {
    if (h) ref.current?.scrollTo({ y: start * h, animated: false });
  }, [h, start]);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!h) return;
    const i = Math.round(e.nativeEvent.contentOffset.y / h);
    if (i !== index) setIndex(i);
  };

  return (
    <View
      style={styles.root}
      onLayout={(e) => {
        setH(e.nativeEvent.layout.height);
        setW(e.nativeEvent.layout.width);
      }}
    >
      {h ? (
        <ScrollView ref={ref} pagingEnabled showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={32} decelerationRate="fast">
          {items.map((uc, i) => (
            <View key={uc.id} style={{ height: h, width: w }}>
              {/* 只渲染当前和相邻两页的视频，其余放封面，省性能 */}
              <Page uc={uc} width={w} active={Math.abs(i - index) <= 1} onShare={() => setSharing(uc)} />
            </View>
          ))}
        </ScrollView>
      ) : null}
      {/* 左上 ✕:固定在最上层，不跟着滑 */}
      <Pressable
        onPress={() => navigate({ type: "pop" })}
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={8}
        style={({ pressed }) => [styles.close, { top: insets.top + 6 }, pressScale(pressed)]}
      >
        <Icon name="x" size={20} color={colors.white} strokeWidth={2.2} />
      </Pressable>
      {sharing ? (
        <IosShareSheet
          title={sharing.title}
          thumb={sharing.cover}
          isVideo={!!sharing.video}
          onClose={() => setSharing(null)}
          onDone={(text) => {
            setSharing(null);
            dispatch({ type: "showToast", text });
          }}
        />
      ) : null}
    </View>
  );
}

function Page({ uc, width, active, onShare }: { uc: UseCase; width: number; active: boolean; onShare: () => void }) {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const images = uc.images ?? [uc.cover];
  const [img, setImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const onSwipe = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== img) setImg(i);
  };
  const tryIt = () => {
    dispatch({ type: "selectSession", id: null });
    dispatch({ type: "setComposer", patch: composerFromUseCase(uc, nextId) });
    navigate({ type: "tab", tab: "create" });
  };

  return (
    <View style={styles.page}>
      {uc.video && images.length === 1 ? (
        active ? (
          <MediaVideo uri={uc.video} poster={uc.cover} style={StyleSheet.absoluteFill} />
        ) : (
          <Image source={{ uri: uc.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        )
      ) : (
        // 组图：左右滑翻图
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onSwipe} scrollEventThrottle={32} style={StyleSheet.absoluteFill}>
          {images.map((src) => (
            <Image key={src} source={{ uri: src }} style={{ width, height: "100%" }} resizeMode="cover" />
          ))}
        </ScrollView>
      )}
      <Gradient colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)"]} style={[styles.topScrim, { height: insets.top + 72 }]} pointerEvents="none" />
      <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.9)"]} style={styles.bottomScrim} pointerEvents="none" />

      {/* 右侧一列：点赞 + 分享 + 下载 + More */}
      {/* 一列等间距：最下面的 More 和底部大按钮垂直居中(按钮高 50、More 高 38 → 上下各差 6;组图多一条进度条 14) */}
      <View style={[styles.side, { bottom: insets.bottom + space.md + 6 + (images.length > 1 ? 14 : 0) }]}>
        <Pressable onPress={() => setLiked((v) => !v)} accessibilityRole="button" accessibilityLabel={liked ? "Unlike" : "Like"} style={styles.sideBtn}>
          <Icon name="heart" size={30} color={liked ? "#ff375f" : colors.white} fill={liked ? "#ff375f" : colors.white} strokeWidth={1.5} />
          <Text style={styles.sideText}>{fmtCount(uc.made + (liked ? 1 : 0))}</Text>
        </Pressable>
        <Pressable onPress={onShare} accessibilityRole="button" accessibilityLabel="Share" style={styles.sideBtn}>
          <ShareGlyph size={30} color={colors.white} />
          <Text style={styles.sideText}>Share</Text>
        </Pressable>
        {/* 下载成片到相册(2026-10-21 加);第一次会走系统相册权限 */}
        <Pressable onPress={() => dispatch({ type: "saveToPhotos" })} accessibilityRole="button" accessibilityLabel="Download" style={styles.sideBtn}>
          <DownloadGlyph size={28} color={colors.white} />
          <Text style={styles.sideText}>Download</Text>
        </Pressable>
        <Pressable
          onPress={() => navigate({ type: "sheet", sheet: { name: "report", target: uc.id } })}
          accessibilityRole="button"
          accessibilityLabel="More"
          style={styles.more}
        >
          <Icon name="ellipsis" size={22} color={colors.white} strokeWidth={2.4} />
          <Text style={styles.sideText}>More</Text>
        </Pressable>
      </View>

      {/* box-none:这一块的空白处不拦点击(它盖在右侧那一列上面，否则 More / 点赞点不到) */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.md }]} pointerEvents="box-none">
        {/* 左下：标题 + 一句说明 + Template 标签 */}
        <View style={styles.info} pointerEvents="box-none">
          <View style={styles.titleRow}>
            <Icon name="sparkles" size={14} color={colors.white} fill={colors.white} strokeWidth={1.4} />
            <Text style={styles.title} numberOfLines={1}>
              {uc.title}
            </Text>
          </View>
          {/* 说明默认两行;手机上点一下展开 / 收起全文，网页原型鼠标悬停也展开 */}
          <Pressable
            onPress={() => setOpen((v) => !v)}
            onHoverIn={() => setHover(true)}
            onHoverOut={() => setHover(false)}
            accessibilityRole="button"
            accessibilityLabel={open ? "Show less" : "Show full description"}
          >
            <Text style={styles.desc} numberOfLines={open || hover ? undefined : 2}>
              {uc.prompt}
            </Text>
          </Pressable>
        </View>

        {/* 底部：白色大按钮做同款 + More */}
        <View style={styles.actions} pointerEvents="box-none">
          <Pressable onPress={tryIt} accessibilityRole="button" style={({ pressed }) => [styles.cta, pressScale(pressed)]}>
            {/* 2026-10-21 定：所有类型统一「Use this template」(和 CapCut 一致，不和 Banner 的 Try it now 撞) */}
            <Text style={styles.ctaText}>Use this template</Text>
          </Pressable>
          {/* 右侧那一列占位(More 在那一列里，和按钮垂直居中) */}
          <View style={{ width: SIDE_W }} pointerEvents="none" />
        </View>

        {/* 组图：分段进度条(第几张高亮) */}
        {images.length > 1 ? (
          <View style={styles.segments}>
            {images.map((src, i) => (
              <View key={src} style={[styles.segment, i === img && styles.segmentOn]} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  page: { flex: 1, backgroundColor: colors.black },
  topScrim: { position: "absolute", left: 0, right: 0, top: 0 },
  bottomScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "45%" },
  close: { position: "absolute", left: space.md, width: 40, height: 40, borderRadius: radius.full, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", zIndex: 10 },
  // 点赞 / 分享和底部的 More 在同一列：同样 48 宽、同样离右边 12,中线对齐
  side: { position: "absolute", right: space.md, width: SIDE_W, alignItems: "center", gap: space.lg },
  sideBtn: { alignItems: "center", gap: 2 },
  sideText: { fontSize: 11, lineHeight: 14, fontWeight: "600", color: colors.white, textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 3 },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: space.md, gap: space.md },
  info: { paddingRight: 64, gap: 6 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  // 标题 17 → 15、说明 15 → 13(2026-10-21 字调小)
  title: { fontSize: 15, lineHeight: 20, fontWeight: "600", color: colors.white, flexShrink: 1 },
  desc: { fontSize: 13, lineHeight: 18, color: "rgba(255,255,255,0.88)" },
  actions: { flexDirection: "row", alignItems: "center", gap: space.md },
  cta: { flex: 1, height: 50, borderRadius: radius.full, backgroundColor: colors.white, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  // 不加粗(2026-10-21)
  ctaText: { fontSize: 17, lineHeight: 22, fontWeight: "500", color: "#16161d" },
  more: { width: SIDE_W, height: 38, alignItems: "center", justifyContent: "center", gap: 2 },
  segments: { flexDirection: "row", gap: 4 },
  segment: { flex: 1, height: 2, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  segmentOn: { backgroundColor: colors.white },
});
