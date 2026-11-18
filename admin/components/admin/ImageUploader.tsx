import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  GripVertical,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import type { ProductImage, ProductImageType } from '@/types/admin';
import { PRODUCT_IMAGES } from '@/lib/api/admin/mockData';
import { uploadImages } from '@/lib/api/admin/client';
import { useToast } from './ToastProvider';
import { SafeImage } from './SafeImage';
import { inputClass, selectClass } from './FormField';

const IMAGE_TYPE_OPTIONS: { value: ProductImageType; label: string }[] = [
  { value: 'main', label: 'Main' },
  { value: 'angle', label: 'Angle' },
  { value: 'detail', label: 'Detail' },
  { value: 'in_use', label: 'In Use' },
  { value: 'box_contents', label: 'Box Contents' },
  { value: 'infographic', label: 'Infographic' },
];

interface ImageUploaderProps {
  images: ProductImage[];
  onChange: (next: ProductImage[]) => void;
  maxImages?: number;
}

export function ImageUploader({
  images,
  onChange,
  maxImages = 6,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDraggingOverDropzone, setIsDraggingOverDropzone] = useState(false);
  const { showToast } = useToast();
  // Latest list, so async upload results never overwrite edits made meanwhile
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const normalizeOrder = (list: ProductImage[]): ProductImage[] =>
    list.map((img, i) => ({
      ...img,
      sortOrder: i,
      type: i === 0 ? 'main' : img.type === 'main' ? 'angle' : img.type,
    }));

  /**
   * Shows a local preview immediately, uploads to the API (converted to WebP there),
   * then swaps the preview for the server URL.
   */
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = maxImages - images.length;
    const selected = Array.from(files).slice(0, Math.max(0, remaining));
    if (!selected.length) return;
    const stamp = Date.now();
    const additions: ProductImage[] = selected.map((file, idx) => ({
      id: `img-${stamp}-${idx}`,
      url: URL.createObjectURL(file),
      uploading: true,
      type: images.length === 0 && idx === 0 ? 'main' : 'angle',
      altText: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      sortOrder: images.length + idx,
    }));
    onChange(normalizeOrder([...images, ...additions]));

    const ids = new Set(additions.map((a) => a.id));
    try {
      const uploaded = await uploadImages(selected, 'products');
      const byId = new Map(additions.map((a, i) => [a.id, uploaded[i]]));
      onChange(
        imagesRef.current.map((img) => {
          const up = byId.get(img.id);
          if (!up) return img;
          URL.revokeObjectURL(img.url);
          return { ...img, url: up.url, path: up.path, placeholder: up.placeholder, uploading: false };
        })
      );
      const saved = uploaded.reduce((s, u) => s + (u.originalBytes - u.bytes), 0);
      showToast({
        title: `${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded as WebP`,
        description: saved > 0 ? `${Math.round(saved / 1024)} KB smaller than the originals` : undefined,
        variant: 'success',
      });
    } catch (err) {
      additions.forEach((a) => URL.revokeObjectURL(a.url));
      onChange(normalizeOrder(imagesRef.current.filter((img) => !ids.has(img.id))));
      showToast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'error',
      });
    }
  };

  const addSampleMedicalImage = () => {
    if (images.length >= maxImages) return;
    const pool = Object.values(PRODUCT_IMAGES);
    const chosen = pool[images.length % pool.length];
    const next: ProductImage = {
      id: `img-${Date.now()}`,
      url: chosen,
      type: images.length === 0 ? 'main' : 'angle',
      altText: 'Medical equipment studio photo',
      sortOrder: images.length,
    };
    onChange(normalizeOrder([...images, next]));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const copy = [...images];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    onChange(normalizeOrder(copy));
  };

  const updateImage = (id: string, patch: Partial<ProductImage>) => {
    onChange(
      images.map((img) => (img.id === id ? { ...img, ...patch } : img))
    );
  };

  const removeImage = (id: string) => {
    onChange(normalizeOrder(images.filter((img) => img.id !== id)));
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOverDropzone(true);
        }}
        onDragLeave={() => setIsDraggingOverDropzone(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOverDropzone(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors ${
          isDraggingOverDropzone
            ? 'border-[#1D5FAF] bg-[#EAF2FC]'
            : 'border-[#DCE6F2] bg-[#F6F9FD]'
        }`}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-[#DCE6F2] text-[#1D5FAF]">
          <UploadCloud className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-semibold text-[#12263F]">
          Drag &amp; drop product images here ({images.length}/{maxImages})
        </p>
        <p className="mt-1 text-xs text-[#5B6B82]">
          JPG, PNG, WebP, GIF or AVIF up to 10 MB each — converted to fast-loading WebP automatically. Drag cards below to reorder; the first image is the Main listing photo.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= maxImages}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-medium text-white hover:bg-[#174D8F] disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Choose Files
          </button>
          <button
            type="button"
            onClick={addSampleMedicalImage}
            disabled={images.length >= maxImages}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-4 py-2 text-xs font-medium text-[#12263F] hover:bg-[#EAF2FC] disabled:opacity-50"
          >
            Add Studio Sample
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img, idx) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null && dragIdx !== idx) {
                  moveImage(dragIdx, idx);
                }
                setDragIdx(null);
              }}
              onDragEnd={() => setDragIdx(null)}
              className={`group rounded-xl border bg-white p-3 transition-all ${
                dragIdx === idx
                  ? 'border-[#1D5FAF] opacity-70'
                  : 'border-[#DCE6F2] hover:border-[#1D5FAF]/50'
              }`}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]">
                <SafeImage src={img.url} alt={img.altText || 'Product photo'} />
                {img.uploading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/75 text-xs font-semibold text-[#12263F]" role="status">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#DCE6F2] border-t-[#1D5FAF]" />
                    Converting to WebP…
                  </div>
                )}

                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      idx === 0
                        ? 'bg-[#1D5FAF] text-white'
                        : 'bg-[#0B2545]/80 text-white'
                    }`}
                  >
                    {idx === 0 ? 'Main Image' : `#${idx + 1}`}
                  </span>
                </div>

                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewUrl(img.url)}
                    className="rounded-md bg-white/95 p-1.5 text-[#12263F] shadow-sm hover:bg-[#EAF2FC] hover:text-[#1D5FAF]"
                    title="Preview image"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="rounded-md bg-white/95 p-1.5 text-red-600 shadow-sm hover:bg-red-50"
                    title="Remove image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-xs text-[#5B6B82] cursor-grab">
                    <GripVertical className="h-4 w-4" />
                    <span>Drag or move</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveImage(idx, idx - 1)}
                      className="rounded border border-[#DCE6F2] p-1 text-[#5B6B82] hover:bg-[#EAF2FC] disabled:opacity-35"
                      aria-label="Move earlier"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => moveImage(idx, idx + 1)}
                      className="rounded border border-[#DCE6F2] p-1 text-[#5B6B82] hover:bg-[#EAF2FC] disabled:opacity-35"
                      aria-label="Move later"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <select
                  value={idx === 0 ? 'main' : img.type}
                  disabled={idx === 0}
                  onChange={(e) =>
                    updateImage(img.id, { type: e.target.value as ProductImageType })
                  }
                  className={selectClass}
                  aria-label="Image type"
                >
                  {IMAGE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Type: {opt.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={img.altText}
                  onChange={(e) => updateImage(img.id, { altText: e.target.value })}
                  placeholder="Descriptive alt text for SEO & accessibility"
                  className={inputClass}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Lightbox */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/75 p-6"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-h-[85vh] max-w-2xl overflow-hidden rounded-xl bg-white p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute right-3 top-3 rounded-lg bg-white/90 p-1.5 text-[#12263F] shadow hover:bg-[#EAF2FC]"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-[78vh] w-auto rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
