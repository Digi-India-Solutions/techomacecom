import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Trash2, Upload } from 'lucide-react';
import type { BlogPost, BlogStatus } from '@/types/admin';
import { deleteBlogPost, listBlogPosts, saveBlogPost } from '@/lib/api/admin/content';
import { formatShortDate, slugify } from '@/lib/api/admin/client';
import { PRODUCT_IMAGES } from '@/lib/api/admin/mockData';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SafeImage } from '@/components/admin/SafeImage';
import { Drawer } from '@/components/admin/Drawer';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';

export function BlogPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string>(PRODUCT_IMAGES.oxygenConcentrator);
  const [excerpt, setExcerpt] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [category, setCategory] = useState('Respiratory Care');
  const [tagsText, setTagsText] = useState('');
  const [status, setStatus] = useState<BlogStatus>('draft');
  const [publishDate, setPublishDate] = useState('2026-11-18');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  useEffect(() => {
    setLoading(true);
    listBlogPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  const openNew = () => {
    setEditingId(undefined);
    setTitle('');
    setSlug('');
    setCoverImageUrl(PRODUCT_IMAGES.oxygenConcentrator);
    setExcerpt('');
    setContentHtml('<p></p>');
    setCategory('Respiratory Care');
    setTagsText('');
    setStatus('draft');
    setPublishDate('2026-11-18');
    setSeoTitle('');
    setSeoDescription('');
    setDrawerOpen(true);
  };

  const openEdit = (p: BlogPost) => {
    setEditingId(p.id);
    setTitle(p.title);
    setSlug(p.slug);
    setCoverImageUrl(p.coverImageUrl);
    setExcerpt(p.excerpt);
    setContentHtml(p.contentHtml);
    setCategory(p.category);
    setTagsText(p.tags.join(', '));
    setStatus(p.status);
    setPublishDate(p.publishDate);
    setSeoTitle(p.seoTitle);
    setSeoDescription(p.seoDescription);
    setDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = await saveBlogPost({
      id: editingId,
      title,
      slug: slug || slugify(title),
      coverImageUrl,
      excerpt,
      contentHtml,
      category,
      tags: tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      status,
      publishDate,
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || excerpt,
      author: user?.name || 'Clinical Team',
    });
    setPosts(next);
    setDrawerOpen(false);
    showToast({
      title: editingId ? 'Blog post updated' : 'Blog post saved',
      variant: 'success',
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const next = await deleteBlogPost(deleteTarget.id);
    setPosts(next);
    setDeleteTarget(null);
    showToast({ title: 'Blog post deleted', variant: 'success' });
  };

  const columns: DataTableColumn<BlogPost>[] = useMemo(
    () => [
      {
        key: 'title',
        header: 'Article',
        sortable: true,
        sortValue: (p) => p.title,
        render: (p) => (
          <div className="flex items-center gap-3 min-w-[260px]">
            <div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]">
              <SafeImage src={p.coverImageUrl} alt={p.title} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#12263F] line-clamp-1">{p.title}</p>
              <p className="text-xs text-[#5B6B82]">
                {p.category} · By {p.author}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'tags',
        header: 'Tags',
        render: (p) => (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {p.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded bg-[#EAF2FC] px-1.5 py-0.5 text-[10px] font-medium text-[#1D5FAF]"
              >
                {tag}
              </span>
            ))}
          </div>
        ),
      },
      {
        key: 'publishDate',
        header: 'Publish Date',
        sortable: true,
        sortValue: (p) => p.publishDate,
        render: (p) => (
          <span className="text-xs text-[#5B6B82] tabular-nums whitespace-nowrap">
            {formatShortDate(p.publishDate)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        sortValue: (p) => p.status,
        render: (p) => <StatusBadge status={p.status} />,
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (p) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => openEdit(p)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC]"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(p)}
              className="rounded-lg border border-[#DCE6F2] bg-white p-1.5 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Blog</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Publish clinical equipment buyer guides, homecare articles, and scheduled SEO posts.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
        >
          <Plus className="h-4 w-4" />
          New Blog Post
        </button>
      </div>

      <DataTable
        data={posts}
        columns={columns}
        getRowId={(p) => p.id}
        loading={loading}
        searchKeys={(p) => `${p.title} ${p.category} ${p.tags.join(' ')}`}
        searchPlaceholder="Search article title, category, or tag..."
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? 'Edit Blog Post' : 'Create Blog Post'}
        widthClass="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Article Title" required>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!editingId) setSlug(slugify(e.target.value));
              }}
              className={inputClass}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="URL Slug">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </FormField>
            <FormField label="Category" required>
              <input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              />
            </FormField>
          </div>

          <FormField label="Cover Image">
            <div className="flex items-center gap-4">
              <div className="h-20 w-32 overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]">
                <SafeImage src={coverImageUrl} alt="Cover" />
              </div>
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                Upload Cover
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setCoverImageUrl(URL.createObjectURL(f));
                  }}
                />
              </label>
            </div>
          </FormField>

          <FormField label="Short Excerpt" required>
            <textarea
              rows={2}
              required
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className={textareaClass}
            />
          </FormField>

          <FormField label="Article Content">
            <RichTextEditor
              value={contentHtml}
              onChange={setContentHtml}
              placeholder="Write clinical guide..."
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Tags (comma-separated)">
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="Oxygen, Home ICU"
                className={inputClass}
              />
            </FormField>
            <FormField label="Publish Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BlogStatus)}
                className={selectClass}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </FormField>
            <FormField label="Publish Date">
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className={inputClass}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#DCE6F2]">
            <FormField label="SEO Title">
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="SEO Description">
              <input
                type="text"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className={inputClass}
              />
            </FormField>
          </div>

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
              Save Post
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Blog Post"
        description={`Delete article "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
