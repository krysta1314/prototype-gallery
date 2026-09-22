'use client';

/* 活动详情页。原来是个四步向导弹窗,改成独立路由:
   列表点一行直接进来,四段流程从上到下排开,右侧预览跟着滚。 */

import { Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCampaigns } from '../../_lib/store';
import { CampaignEditor } from '../../_components/CampaignEditor';
import { AdminSidebar } from '../../_components/AdminSidebar';
import { ViewBar } from '../../_components/ViewBar';

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

const SAVED_TOAST: Record<string, string> = {
  published: 'Published — it is live for eligible users now.',
  draft: 'Saved as draft.',
};

function CampaignDetailInner() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const { campaigns, save, ready } = useCampaigns();
  const savedFlag = useSearchParams()?.get('saved') ?? '';

  const back = () => router.push('/prototypes/promo-campaigns/admin');
  const existing = campaigns.find(c => c.id === id) ?? null;
  const isNew = id === 'new';

  return (
    <div style={{ fontFamily: APPLE_FONT }} className="min-h-screen bg-[#faf8f6]">
      <ViewBar />
      <div className="flex">
        <AdminSidebar view="campaigns" />
        <main className="min-w-0 flex-1">
          <div>
            {!ready ? (
              <p className="px-6 py-10 text-sm text-[#9a9aa6]">Loading…</p>
            ) : !isNew && !existing ? (
              <div className="mx-6 mt-10 rounded-2xl border border-[#ececf1] bg-white p-8 text-center">
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
                initialToast={SAVED_TOAST[savedFlag] ?? null}
                onSave={(c, opts) => {
                  const exists = campaigns.some(x => x.id === c.id);
                  save(exists ? campaigns.map(x => (x.id === c.id ? c : x)) : [c, ...campaigns]);
                  if (opts?.stay) {
                    /* 留在本页,只把 /new 换成真实 id,后续保存更新同一条而不是不断新建。
                       这次替换会重挂编辑器,所以把「保存成功」带在 URL 上,让新实例接着提示。 */
                    if (isNew) {
                      router.replace(
                        `/prototypes/promo-campaigns/admin/${c.id}?saved=${c.published ? 'published' : 'draft'}`,
                      );
                    }
                    return;
                  }
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

export default function CampaignDetailPage() {
  return (
    <Suspense fallback={null}>
      <CampaignDetailInner />
    </Suspense>
  );
}
