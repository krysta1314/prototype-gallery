/* 原生端：真实 APP 直接调系统 Share API(Share.share / react-native-share),面板由 iOS 画;这里不渲染 */
export default function IosShareSheet(_: { title: string; thumb: string; isVideo: boolean; link?: string; onClose: () => void; onDone: (toast: string) => void }) {
  return null;
}
