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
    <article className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/" className="hover:text-[#FF6B00]">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link href="/blog" className="hover:text-[#FF6B00]">Clinical Guides</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-semibold text-gray-900 truncate max-w-sm">{post.title}</span>
      </nav>

      {/* Main Post Header */}
      <div className="space-y-4">
        <span className="bg-orange-50 text-[#FF6B00] border border-orange-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
          {post.category}
        </span>

        <h1 className="text-2xl sm:text-4xl font-black text-[#2B2B2B] tracking-tight leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-2 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FF6B00] text-white flex items-center justify-center font-bold text-xs">
              {post.author[0]}
            </div>
            <div>
              <div className="font-bold text-gray-900">{post.author}</div>
              <div className="text-[10px] text-gray-400">{post.authorRole}</div>
            </div>
          </div>
          <span className="text-gray-300 hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {post.publishedAt}
          </span>
          <span className="text-gray-300 hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {post.readTime}
          </span>
        </div>
      </div>

      {/* Cover Image */}
      <div className="relative aspect-16/9 rounded-3xl overflow-hidden shadow-lg border border-gray-200">
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
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-xs space-y-6 text-sm sm:text-base text-gray-700 leading-relaxed">
        <p className="font-semibold text-base sm:text-lg text-gray-900 leading-relaxed border-l-4 border-[#FF6B00] pl-4">
          {post.excerpt}
        </p>

        <p>
          {post.content}
        </p>

        <h2 className="text-xl font-bold text-gray-900 pt-4">Clinical Infrastructure & Safety Standards</h2>
        <p>
          Healthcare providers in India are governed by rigorous state pollution control board (PCB), AERB radiation protection clearances, and biomedical waste handling regulations. When selecting autoclaves, ensure Class B validation records (EN 13060) with automated data logs to provide legal proof of sterilization in case of medicolegal audits.
        </p>

        <h2 className="text-xl font-bold text-gray-900 pt-4">Procurement & GST Input Tax Credit (ITC)</h2>
        <p>
          Always ensure your supplier provides an official GST tax invoice with the correct 8-digit HSN code (e.g., 9018 for medical and dental instruments). Purchasing from authorized distributors like Buy Denmed guarantees that 12% or 18% GST can be set off against your clinic’s tax obligations.
        </p>

        {/* Tags */}
        <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="bg-gray-100 hover:bg-orange-50 hover:text-[#FF6B00] text-gray-700 text-xs px-3 py-1 rounded-lg font-semibold transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <Link
          href="/blog"
          className="text-xs font-bold text-gray-700 hover:text-[#FF6B00] flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Knowledge Hub</span>
        </Link>
        <Link
          href="/bulk-enquiry"
          className="text-xs font-bold text-[#FF6B00] hover:underline"
        >
          Consult Equipment Specialist →
        </Link>
      </div>
    </article>
  );
}
