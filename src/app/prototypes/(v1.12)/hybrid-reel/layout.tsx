/* 这一段路由里不显示滚动条(样式见 globals.css .hide-scrollbars);contents 不影响页面自己的布局 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="hide-scrollbars contents">{children}</div>;
}
