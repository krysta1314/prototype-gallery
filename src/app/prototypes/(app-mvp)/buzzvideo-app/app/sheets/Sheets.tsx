import { useNav } from "../provider";

/** 根据 nav.sheet 渲染当前打开的弹层 */
export default function Sheets() {
  const { nav, navigate } = useNav();
  const sheet = nav.sheet;
  if (!sheet) return null;
  const close = () => navigate({ type: "closeSheet" });
  switch (sheet.name) {
    default:
      void close;
      return null;
  }
}
