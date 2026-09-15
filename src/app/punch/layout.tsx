import type { Metadata, Viewport } from "next";
import { PunchNav } from "./_components/nav";

export const metadata: Metadata = {
  title: "打卡",
  manifest: "/punch-manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "打卡" },
};

export const viewport: Viewport = {
  themeColor: "#171717",
  viewportFit: "cover",
};

export default function PunchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-neutral-50 pb-[calc(6rem+env(safe-area-inset-bottom))] text-neutral-900">
      <div className="mx-auto max-w-md">{children}</div>
      <PunchNav />
    </div>
  );
}
