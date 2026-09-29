import App from "../app/App";
import { AppProvider, InsetsProvider } from "../app/provider";

const APPLE_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

/** 全屏 APP:用浏览器的手机模式预览,没有外框 */
export default function Shell() {
  return (
    <AppProvider>
      <div className="flex h-dvh flex-col bg-[#fffaf6]" style={{ fontFamily: APPLE_FONT }}>
        {/* 浏览器里没有真实状态栏 / Home 条,安全区只留一点呼吸空间 */}
        <InsetsProvider value={{ top: 12, bottom: 12 }}>
          <App />
        </InsetsProvider>
      </div>
    </AppProvider>
  );
}
