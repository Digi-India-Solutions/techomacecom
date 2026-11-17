import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Images, Loader2, RefreshCw, Trash2, Upload, X } from 'lucide-react';
import type { ProductImage } from '@/types/admin';
import { api, validateVariantImageFile } from '@/lib/api/admin/products';
import { SafeImage } from './SafeImage';

interface VariantImagePickerProps {
  imageUrl: string;
  productImages: ProductImage[];
  variantLabel?: string;
  onChange: (url: string) => void;
}

export function VariantImagePicker({
  imageUrl,
  productImages,
  variantLabel,
  onChange,
}: VariantImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const validationError = validateVariantImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const res = await api.admin.uploadImage(file);
      onChange(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const openPopover = () => {
    if (popoverOpen) {
      setPopoverOpen(false);
      return;
    }
    const rect = triggerBtnRef.current?.getBoundingClientRect();
    if (rect) {
      const popoverWidth = 264;
      const clampedLeft = Math.max(
        12,
        Math.min(rect.left - popoverWidth + rect.width, window.innerWidth - popoverWidth - 12)
      );
      const spaceBelow = window.innerHeight - rect.bottom;
      const estimatedHeight = 230;
      const top =
        spaceBelow >= estimatedHeight
          ? rect.bottom + 6
          : Math.max(12, rect.top - estimatedHeight - 6);
      setPopoverPos({ top, left: clampedLeft });
    }
    setPopoverOpen(true);
  };

  useEffect(() => {
    if (!popoverOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        triggerBtnRef.current?.contains(target)
      ) {
        return;
      }
      setPopoverOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPopoverOpen(false);
    };
    const handleScroll = () => setPopoverOpen(false);

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [popoverOpen]);

  return (
    <div className="flex flex-col items-start gap-1">
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingOver(true);
          }
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          setIsDraggingOver(false);
        }}
        onDrop={(e) => {
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingOver(false);
            void handleFile(e.dataTransfer.files[0]);
          }
        }}
        className={`group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition-colors ${
          isDraggingOver
            ? 'border-[#1D5FAF] bg-[#EAF2FC]'
            : error
            ? 'border-red-400 bg-red-50/40'
            : 'border-[#DCE6F2] bg-[#F6F9FD]'
        }`}
      >
        {uploading ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#1D5FAF]">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-[9px] font-medium">Uploading</span>
          </div>
        ) : imageUrl ? (
          <>
            <SafeImage
              src={imageUrl}
              alt={variantLabel || 'Variant thumbnail'}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-[#0B2545]/65 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Change image"
                aria-label="Change image"
                className="rounded-md bg-white/95 p-1 text-[#12263F] shadow hover:bg-[#EAF2FC] hover:text-[#1D5FAF]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  onChange('');
                }}
                title="Remove image"
                aria-label="Remove image"
                className="rounded-md bg-white/95 p-1 text-red-600 shadow hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Choose File (JPG, PNG, WEBP, max 2 MB)"
            className="flex h-full w-full flex-col items-center justify-center gap-0.5 px-1 text-[#5B6B82] hover:bg-[#EAF2FC]/60 hover:text-[#1D5FAF]"
          >
            <Upload className="h-4 w-4" />
            <span className="text-[10px] font-medium leading-tight">Choose File</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      <button
        ref={triggerBtnRef}
        type="button"
        onClick={openPopover}
        className="inline-flex w-16 items-center justify-center gap-1 rounded border border-[#DCE6F2] bg-white px-1 py-0.5 text-[10px] font-medium text-[#1D5FAF] hover:bg-[#EAF2FC]"
        title="Select from product images"
      >
        <Images className="h-3 w-3 shrink-0" />
        <span className="truncate">Gallery</span>
      </button>

      {error && (
        <p className="w-[74px] text-[10px] leading-tight text-red-600" title={error}>
          {error}
        </p>
      )}

      {popoverOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ top: popoverPos.top, left: popoverPos.left }}
            className="fixed z-50 w-[264px] rounded-xl border border-[#DCE6F2] bg-white p-3 shadow-xl"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#12263F]">
                Select from product images
              </span>
              <button
                type="button"
                onClick={() => setPopoverOpen(false)}
                className="rounded p-0.5 text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {productImages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#DCE6F2] bg-[#F6F9FD] px-3 py-4 text-center text-[11px] text-[#5B6B82]">
                No product images yet. Upload images in the Images tab or drop a file on the thumbnail box.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-0.5">
                {productImages.map((img) => {
                  const selected = img.url === imageUrl;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => {
                        setError(null);
                        onChange(img.url);
                        setPopoverOpen(false);
                      }}
                      className={`group/pick relative aspect-square overflow-hidden rounded-lg border transition-all ${
                        selected
                          ? 'border-[#1D5FAF] ring-2 ring-[#1D5FAF]/25'
                          : 'border-[#DCE6F2] hover:border-[#1D5FAF]'
                      }`}
                      title={img.altText || 'Product image'}
                    >
                      <SafeImage
                        src={img.url}
                        alt={img.altText || 'Product image'}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
