import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react';
import type { FaqGroup, FaqItem } from '@/types/admin';
import { deleteFaq, listFaqs, reorderFaqs, saveFaq } from '@/lib/api/admin/content';
import { useToast } from '@/components/admin/ToastProvider';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Drawer } from '@/components/admin/Drawer';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';

const FAQ_GROUPS: FaqGroup[] = ['General', 'Rental', 'Sleep Test'];

export function FaqsPage() {
  const { showToast } = useToast();

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [activeGroup, setActiveGroup] = useState<FaqGroup>('General');
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null);

  const [group, setGroup] = useState<FaqGroup>('General');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [active, setActive] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setFaqs(await listFaqs());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const groupFaqs = useMemo(
    () => faqs.filter((f) => f.group === activeGroup),
    [faqs, activeGroup]
  );

  const moveInGroup = async (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= groupFaqs.length || fromIdx === toIdx) return;
    const reorderedGroup = [...groupFaqs];
    const [moved] = reorderedGroup.splice(fromIdx, 1);
    reorderedGroup.splice(toIdx, 0, moved);

    const others = faqs.filter((f) => f.group !== activeGroup);
    const nextAll = [...others, ...reorderedGroup];
    setFaqs(nextAll);
    const saved = await reorderFaqs(nextAll);
    setFaqs(saved);
    showToast({ title: 'FAQ order updated', variant: 'success' });
  };

  const openNew = () => {
    setEditingId(undefined);
    setGroup(activeGroup);
    setQuestion('');
    setAnswer('');
    setActive(true);
    setDrawerOpen(true);
  };

  const openEdit = (item: FaqItem) => {
    setEditingId(item.id);
    setGroup(item.group);
    setQuestion(item.question);
    setAnswer(item.answer);
    setActive(item.active);
    setDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = await saveFaq({
      id: editingId,
      group,
      question,
      answer,
      active,
    });
    setFaqs(next);
    setDrawerOpen(false);
    showToast({
      title: editingId ? 'FAQ updated' : 'FAQ added',
      variant: 'success',
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const next = await deleteFaq(deleteTarget.id);
    setFaqs(next);
    setDeleteTarget(null);
    showToast({ title: 'FAQ deleted', variant: 'success' });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">FAQs</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Organize General, Rental, and Sleep Test FAQs and drag to control display order.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
        >
          <Plus className="h-4 w-4" />
          Add FAQ
        </button>
      </div>

      {/* Group Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-[#DCE6F2] bg-white p-1.5 w-fit">
        {FAQ_GROUPS.map((g) => {
          const count = faqs.filter((f) => f.group === g).length;
          const isActive = activeGroup === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setActiveGroup(g)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-[#1D5FAF] text-white'
                  : 'text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]'
              }`}
            >
              <span>{g}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] tabular-nums ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#F6F9FD] text-[#5B6B82]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* FAQ List */}
      <div className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            <div className="h-16 rounded-lg bg-slate-200" />
            <div className="h-16 rounded-lg bg-slate-200" />
          </div>
        ) : groupFaqs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5B6B82]">
            No FAQs in {activeGroup}. Click &ldquo;Add FAQ&rdquo; to create one.
          </div>
        ) : (
          <div className="divide-y divide-[#DCE6F2]">
            {groupFaqs.map((item, idx) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDragId(item.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  const fromIdx = groupFaqs.findIndex((f) => f.id === dragId);
                  if (fromIdx !== -1 && fromIdx !== idx) moveInGroup(fromIdx, idx);
                  setDragId(null);
                }}
                onDragEnd={() => setDragId(null)}
                className={`flex items-start justify-between gap-4 p-4 transition-colors ${
                  dragId === item.id ? 'bg-[#EAF2FC]' : 'hover:bg-[#F6F9FD]'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <GripVertical className="mt-1 h-4 w-4 text-[#5B6B82] cursor-grab shrink-0" />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#12263F]">{item.question}</p>
                      <StatusBadge status={item.active ? 'active' : 'inactive'} />
                    </div>
                    <p className="text-xs text-[#5B6B82] leading-relaxed">{item.answer}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveInGroup(idx, idx - 1)}
                    className="rounded-lg border border-[#DCE6F2] p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] disabled:opacity-35"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === groupFaqs.length - 1}
                    onClick={() => moveInGroup(idx, idx + 1)}
                    className="rounded-lg border border-[#DCE6F2] p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] disabled:opacity-35"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="rounded-lg border border-[#DCE6F2] p-1.5 text-[#1D5FAF] hover:bg-[#EAF2FC]"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="rounded-lg border border-[#DCE6F2] p-1.5 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? 'Edit FAQ' : 'Add FAQ'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="FAQ Category Group" required>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as FaqGroup)}
              className={selectClass}
            >
              {FAQ_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Question" required>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className={inputClass}
            />
          </FormField>

          <FormField label="Answer" required>
            <textarea
              rows={5}
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className={textareaClass}
            />
          </FormField>

          <label className="flex items-center gap-2 text-xs font-medium text-[#12263F] cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-[#DCE6F2] text-[#1D5FAF]"
            />
            Visible on FAQ page
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#DCE6F2]">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
            >
              Save FAQ
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete FAQ"
        description={`Delete "${deleteTarget?.question}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
