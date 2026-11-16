import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { GZCommentRow, GZSticker, gz } from "../kit/gz";
import { COMMENTS, FRIENDS, creator, fmt, friendsOn, post, poster } from "./data";
import { CommentInput, ShareCircle, ShareItem } from "./parts";
import { useV2 } from "./store";
import { BottomSheet, Face } from "./ui";
import { BrandIcon, USER } from "./v1";

const c = gz.color;

/** 示例账号头像图(评论里用) */
const AV: Record<string, string> = { mochi: "poodle", neon: "kpop", reel: "gatsby", oddhistory: "napoleon", fruitdrama: "fruit", kai: "scooter", luna: "alice" };
const avatarOf = (id: string) => poster(AV[id] ?? "poodle");

/* ---------- 评论(朋友的评论置顶，带青柠 Friend 小贴纸;作者回复带橙色 Creator) ---------- */

function Comments({ postId }: { postId: string }) {
  const { d } = useV2();
  const p = post(postId);
  const fr = friendsOn(postId)[0] ?? FRIENDS[0];
  const [mine, setMine] = useState<string[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [text, setText] = useState("");
  const send = () => {
    if (!text.trim()) return;
    setMine((m) => [text.trim(), ...m]);
    setText("");
  };
  const like = (id: string) => setLikes((x) => (x.includes(id) ? x.filter((v) => v !== id) : [...x, id]));
  return (
    <BottomSheet title={`${fmt(p.comments + mine.length + 1)} comments`} onClose={() => d({ type: "closeSheet" })} flush maxH={0.72}>
      <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        {mine.map((x, i) => (
          <GZCommentRow key={"m" + i} avatar={USER.avatar} name="You" text={x} meta="now" likes="0" />
        ))}
        {/* 朋友的评论排在最前，带 Friend 贴纸 */}
        <GZCommentRow avatar={fr.avatar} name={fr.name.toLowerCase()} tag={<GZSticker label="Friend" color="lime" size="s" rotate={-3} />} text="ok I'm remixing this with my cat tonight" meta="12m" likes={String(8 + (likes.includes("fr") ? 1 : 0))} liked={likes.includes("fr")} onLike={() => like("fr")} />
        {COMMENTS.map((x) => (
          <View key={x.id}>
            <GZCommentRow avatar={avatarOf(x.who)} name={creator(x.who).name} text={x.text} meta={x.ago} likes={String(x.likes + (likes.includes(x.id) ? 1 : 0))} liked={likes.includes(x.id)} onLike={() => like(x.id)} />
            {x.reply ? (
              <View style={{ marginLeft: 44 }}>
                <GZCommentRow avatar={avatarOf(p.author)} name={creator(p.author).name} tag={<Text style={[gz.display.tiny, { color: c.orange }]}>Creator</Text>} text={x.reply.text} meta={x.reply.ago} likes={String(x.reply.likes)} />
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
      <CommentInput avatar={USER.avatar} value={text} onChangeText={setText} onSend={send} />
    </BottomSheet>
  );
}

/* ---------- 分享:第一排发给朋友，第二排外部平台(天蓝 = 分享;没有分享奖励)，第三排操作 ---------- */

function Share({ postId, mine }: { postId: string; mine?: string }) {
  const { s, d } = useV2();
  const close = (text: string) => {
    d({ type: "closeSheet" });
    d({ type: "toast", text });
  };
  return (
    <BottomSheet title="Share to" onClose={() => d({ type: "closeSheet" })}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {FRIENDS.map((f) => (
          <ShareItem key={f.id} label={f.name.toLowerCase()} onPress={() => close(`Sent to ${f.name}`)}>
            <Face uri={f.avatar} size={52} />
          </ShareItem>
        ))}
      </ScrollView>
      <View style={styles.sep} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <ShareItem label="TikTok" onPress={() => close("Opened TikTok")}>
          <BrandIcon brand="tiktok" size={52} style={{ borderRadius: 26 }} />
        </ShareItem>
        <ShareItem label="Instagram" onPress={() => close("Opened Instagram")}>
          <BrandIcon brand="instagram" size={52} style={{ borderRadius: 26 }} />
        </ShareItem>
        <ShareItem label="WhatsApp" onPress={() => close("Opened WhatsApp")}>
          <BrandIcon brand="whatsapp" size={52} style={{ borderRadius: 26 }} />
        </ShareItem>
        <ShareItem label="Copy link" onPress={() => close("Link copied")}>
          <ShareCircle icon="link" color="sky" />
        </ShareItem>
      </ScrollView>
      <View style={styles.sep} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <ShareItem label="Remix" onPress={() => d({ type: "push", route: { name: "template", postId } })}>
          <ShareCircle icon="wand-sparkles" color="orange" />
        </ShareItem>
        <ShareItem label="Save video" onPress={() => close("Saved to Photos")}>
          <ShareCircle icon="download" />
        </ShareItem>
        <ShareItem label="Not interested" onPress={() => close("We'll show you less like this")}>
          <ShareCircle icon="x" />
        </ShareItem>
        <ShareItem label="Report" onPress={() => close("Thanks, we'll take a look")}>
          <ShareCircle icon="flag" />
        </ShareItem>
      </ScrollView>
    </BottomSheet>
  );
}

export default function Sheets2() {
  const { s } = useV2();
  const sh = s.sheet;
  if (!sh) return null;
  // key:换面板时重新进场
  if (sh.name === "comments") return <Comments key={"c" + sh.postId} postId={sh.postId} />;
  return <Share key={"s" + sh.postId} postId={sh.postId} mine={sh.mine} />;
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, gap: 14, paddingVertical: 14 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: c.line, marginHorizontal: 16 },
});
