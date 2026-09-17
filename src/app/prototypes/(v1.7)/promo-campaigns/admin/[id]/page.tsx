'use client';

/* 活动详情页。原来是个四步向导弹窗,改成独立路由:
   列表点一行直接进来,四段流程从上到下排开,右侧预览跟着滚。 */

import { useParams, useRouter } from 'next/navigation';
import { useCampaigns } from '../../_lib/store';
import { CampaignEditor } from '../../_components/CampaignEditor';
import { AdminSidebar } from '../../_components/AdminSidebar';
import { ViewBar } from '../../_components/ViewBar';

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const { campaigns, save, ready } = useCampaigns();

  const back = () => router.push('/prototypes/promo-campaigns/admin');
  const existing = campaigns.find(c => c.id === id) ?? null;
  const isNew = id === 'new';

  return (
    <div style={{ fontFamily: APPLE_FONT }} className="min-h-screen bg-[#faf8f6]">
      <ViewBar />
      <div className="flex">
        <AdminSidebar view="campaigns" />
        <main className="min-w-0 flex-1 px-6 py-10">
          <div className="mx-auto max-w-[1180px]">
            {!ready ? (
              <p className="text-sm text-[#9a9aa6]">Loading…</p>
            ) : !isNew && !existing ? (
              <div className="rounded-2xl border border-[#ececf1] bg-white p-8 text-center">
                <p className="text-sm font-semibold text-[#1a1a2e]">This campaign no longer exists.</p>
                <button
                  type="button"
                  onClick={back}
                  className="mt-3 text-sm font-semibold text-[#ff5e1a] hover:underline"
                >
                  Back to all campaigns
                </button>
              </div>
            ) : (
              <CampaignEditor
                initial={isNew ? 'new' : (existing as NonNullable<typeof existing>)}
                onCancel={back}
                onSave={c => {
                  const exists = campaigns.some(x => x.id === c.id);
                  save(exists ? campaigns.map(x => (x.id === c.id ? c : x)) : [c, ...campaigns]);
                  back();
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
