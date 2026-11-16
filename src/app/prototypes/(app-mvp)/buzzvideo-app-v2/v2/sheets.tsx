import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { COMMENTS, FRIENDS, creator, fmt, friendsOn, post, poster } from "./data";
import { KCommentInput, KCommentRow, KShareCircle, KShareItem } from "./kit/components";
import { tk } from "./kit/tokens";
import { useV2 } from "./store";
import { BottomSheet, Face } from "./ui";
import { BrandIcon, USER } from "./v1";

const c = tk.color;
const t = tk.type;

/** 示例账号头像图(评论里用) */
const AV: Record<string, string> = { mochi: "poodle", neon: "kpop", reel: "gatsby", oddhistory: "napoleon", fruitdrama: "fruit", kai: "scooter", luna: "alice" };
const avatarOf = (id: string) => poster(AV[id] ?? "poodle");

/* ---------- 评论(朋友的评论置顶) ---------- */

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
          <KCommentRow key={"m" + i} avatar={USER.avatar} name="You" text={x} meta="now" likes="0" />
        ))}
        {/* 朋友的评论排在最前，带 Friend 标 */}
        <View>
          <KCommentRow avatar={fr.avatar} name={`${fr.name} · Friend`} text="ok I'm remixing this with my cat tonight" meta="12m" likes={String(8 + (likes.includes("fr") ? 1 : 0))} liked={likes.includes("fr")} onLike={() => like("fr")} />
        </View>
        {COMMENTS.map((x) => (
          <View key={x.id}>
            <KCommentRow avatar={avatarOf(x.who)} name={creator(x.who).name} text={x.text} meta={x.ago} likes={String(x.likes + (likes.includes(x.id) ? 1 : 0))} liked={likes.includes(x.id)} onLike={() => like(x.id)} />
            {x.reply ? <KCommentRow avatar={avatarOf(p.author)} name={creator(p.author).name} creator reply text={x.reply.text} meta={x.reply.ago} likes={String(x.reply.likes)} /> : null}
          </View>
        ))}
      </ScrollView>
      <KCommentInput avatar={USER.avatar} value={text} onChangeText={setText} onSend={send} />
    </BottomSheet>
  );
}

/* ---------- 分享:第一排发给朋友，第二排外部平台，第三排操作 ---------- */

function Share({ postId, mine }: { postId: string; mine?: string }) {
  const { s, d } = useV2();
  const close = (text: string) => {
    d({ type: "closeSheet" });
    d({ type: "toast", text });
  };
  const bonus = (k: "shareTikTok" | "shareInstagram") => (mine && !s.claimed.includes(k) ? 30 : undefined);
  return (
    <BottomSheet title="Share to" onClose={() => d({ type: "closeSheet" })}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {FRIENDS.map((f) => (
          <KShareItem key={f.id} label={f.name} onPress={() => close(`Sent to ${f.name}`)}>
            <Face uri={f.avatar} size={48} />
          </KShareItem>
        ))}
      </ScrollView>
      <View style={styles.sep} />
      {mine ? <Text style={[t.caption, { color: c.text3, textAlign: "center", marginTop: 10 }]}>Share your video to earn credits, once a day per platform</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <KShareItem label="TikTok" bonus={bonus("shareTikTok")} onPress={() => d({ type: "shareOut", to: "tiktok", mine })}>
          <BrandIcon brand="tiktok" size={48} style={{ borderRadius: 24 }} />
        </KShareItem>
        <KShareItem label="Instagram" bonus={bonus("shareInstagram")} onPress={() => d({ type: "shareOut", to: "instagram", mine })}>
          <BrandIcon brand="instagram" size={48} style={{ borderRadius: 24 }} />
        </KShareItem>
        <KShareItem label="WhatsApp" onPress={() => close("Opened WhatsApp")}>
          <BrandIcon brand="whatsapp" size={48} style={{ borderRadius: 24 }} />
        </KShareItem>
        <KShareItem label="Copy link" onPress={() => close("Link copied")}>
          <KShareCircle icon="link" />
        </KShareItem>
      </ScrollView>
      <View style={styles.sep} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <KShareItem label="Remix" onPress={() => d({ type: "push", route: { name: "template", postId } })}>
          <KShareCircle icon="wand-sparkles" />
        </KShareItem>
        <KShareItem label="Save video" onPress={() => close("Saved to Photos")}>
          <KShareCircle icon="download" />
        </KShareItem>
        <KShareItem label="Not interested" onPress={() => close("We'll show you less like this")}>
          <KShareCircle icon="x" />
        </KShareItem>
        <KShareItem label="Report" onPress={() => close("Thanks, we'll take a look")}>
          <KShareCircle icon="flag" />
        </KShareItem>
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
  row: { paddingHorizontal: 16, gap: 16, paddingVertical: 12 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: c.line, marginHorizontal: 16 },
});

