import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getBlogPostBySlug, getBlogPosts } from '@/lib/api';
import { Calendar, Clock, ChevronRight, User, Share2, ArrowLeft } from 'lucide-react';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found | Buy Denmed',
      description: 'The requested guide was not found.'
    };
  }

  return {
    title: `${post.title} | Buy Denmed Clinical Guide`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage }]
    }
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#5B6B82]">
        <Link href="/" className="hover:text-[#1D5FAF]">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#5B6B82]" />
        <Link href="/blog" className="hover:text-[#1D5FAF]">Clinical Guides</Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#5B6B82]" />
        <span className="font-semibold text-[#12263F] truncate max-w-sm">{post.title}</span>
      </nav>

      {/* Main Post Header */}
      <div className="space-y-4">
        <span className="bg-[#EAF2FC] text-[#174E90] border border-[#DCE6F2] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
          {post.category}
        </span>

        <h1 className="text-2xl sm:text-4xl font-black text-[#12263F] tracking-tight leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[#5B6B82] pt-2 border-b border-[#DCE6F2] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1D5FAF] text-white flex items-center justify-center font-bold text-xs">
              {post.author[0]}
            </div>
            <div>
              <div className="font-bold text-[#12263F]">{post.author}</div>
              <div className="text-[11px] text-[#5B6B82]">{post.authorRole}</div>
            </div>
          </div>
          <span className="text-[#DCE6F2] hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {post.publishedAt}
          </span>
          <span className="text-[#DCE6F2] hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {post.readTime}
          </span>
        </div>
      </div>

      {/* Cover Image */}
      <div className="relative aspect-16/9 rounded-3xl overflow-hidden shadow-lg border border-[#DCE6F2]">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover"
          priority
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Body Content */}
      <div className="bg-white rounded-3xl border border-[#DCE6F2] p-6 sm:p-10 shadow-xs space-y-6 text-sm sm:text-base text-[#5B6B82] leading-relaxed">
        <p className="font-semibold text-base sm:text-lg text-[#12263F] leading-relaxed border-l-4 border-[#1D5FAF] pl-4">
          {post.excerpt}
        </p>

        <p>
          {post.content}
        </p>

        <h2 className="text-xl font-bold text-[#12263F] pt-4">Clinical Infrastructure & Safety Standards</h2>
        <p>
          Healthcare providers in India are governed by rigorous state pollution control board (PCB), AERB radiation protection clearances, and biomedical waste handling regulations. When selecting autoclaves, ensure Class B validation records (EN 13060) with automated data logs to provide legal proof of sterilization in case of medicolegal audits.
        </p>

        <h2 className="text-xl font-bold text-[#12263F] pt-4">Procurement & GST Input Tax Credit (ITC)</h2>
        <p>
          Always ensure your supplier provides an official GST tax invoice with the correct 8-digit HSN code (e.g., 9018 for medical and dental instruments). Purchasing from authorized distributors like Buy Denmed guarantees that 12% or 18% GST can be set off against your clinic’s tax obligations.
        </p>

        {/* Tags */}
        <div className="pt-6 border-t border-[#DCE6F2] flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="bg-[#F6F9FD] hover:bg-[#EAF2FC] hover:text-[#174E90] text-[#5B6B82] border border-[#DCE6F2] text-xs px-3 py-1 rounded-lg font-semibold transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <Link
          href="/blog"
          className="text-xs font-bold text-[#5B6B82] hover:text-[#1D5FAF] flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Knowledge Hub</span>
        </Link>
        <Link
          href="/bulk-enquiry"
          className="text-xs font-bold text-[#1D5FAF] hover:underline"
        >
          Consult Equipment Specialist →
        </Link>
      </div>
    </article>
  );
}
