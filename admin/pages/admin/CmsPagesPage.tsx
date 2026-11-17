import React, { useEffect, useState } from 'react';
import { FileText, Save } from 'lucide-react';
import type { CmsPage } from '@/types/admin';
import { listCmsPages, saveCmsPage } from '@/lib/api/admin/content';
import { formatDateTime } from '@/lib/api/admin/client';
import { useToast } from '@/components/admin/ToastProvider';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { FormField, inputClass, textareaClass } from '@/components/admin/FormField';

export function CmsPagesPage() {
  const { showToast } = useToast();

  const [pages, setPages] = useState<CmsPage[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [draft, setDraft] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    listCmsPages()
      .then((rows) => {
        setPages(rows);
        if (rows[0]) {
          setActiveId(rows[0].id);
          setDraft(rows[0]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const selectPage = (page: CmsPage) => {
    setActiveId(page.id);
    setDraft(page);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    try {
      const updated = await saveCmsPage(draft);
      setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setDraft(updated);
      showToast({ title: `Saved "${updated.title}"`, variant: 'success' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Pages (CMS)</h1>
        <p className="mt-0.5 text-sm text-[#5B6B82]">
          Edit About, Contact, Shipping Policy, Returns &amp; Refunds, Rental Terms, Privacy Policy, and Terms of Use.
        </p>
      </div>

      {loading ? (
        <div className="h-96 rounded-xl bg-slate-200 animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Page List */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white p-2 space-y-1 h-fit">
            {pages.map((p) => {
              const active = p.id === activeId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPage(p)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#1D5FAF] text-white'
                      : 'text-[#12263F] hover:bg-[#EAF2FC]'
                  }`}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate">{p.title}</p>
                    <p
                      className={`font-mono text-[10px] truncate ${
                        active ? 'text-white/75' : 'text-[#5B6B82]'
                      }`}
                    >
                      /{p.slug}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Editor */}
          {draft && (
            <form
              onSubmit={handleSave}
              className="lg:col-span-3 rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE6F2] pb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#12263F]">{draft.title}</h2>
                  <p className="text-xs text-[#5B6B82]">
                    Slug: <span className="font-mono">/{draft.slug}</span> · Last updated:{' '}
                    {formatDateTime(draft.updatedAt)}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Page'}
                </button>
              </div>

              <FormField label="Page Heading" required>
                <input
                  type="text"
                  required
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Page Body Content (Rich Text)">
                <RichTextEditor
                  value={draft.contentHtml}
                  onChange={(html) => setDraft({ ...draft, contentHtml: html })}
                  placeholder="Write policy or informational content..."
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#DCE6F2]">
                <FormField label="SEO Meta Title">
                  <input
                    type="text"
                    value={draft.seoTitle}
                    onChange={(e) => setDraft({ ...draft, seoTitle: e.target.value })}
                    className={inputClass}
                  />
                </FormField>
                <FormField label="SEO Meta Description">
                  <textarea
                    rows={2}
                    value={draft.seoDescription}
                    onChange={(e) =>
                      setDraft({ ...draft, seoDescription: e.target.value })
                    }
                    className={textareaClass}
                  />
                </FormField>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
