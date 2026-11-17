import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getBlogPosts } from '@/lib/api';
import { BookOpen, Calendar, Clock, ChevronRight, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Clinical Knowledge Hub & Guides | Buy Denmed India',
  description: 'Evidence-based articles on dental clinic setup, Class B autoclave validation, sleep apnea CPAP titration, and medical procurement.'
};

export default async function BlogListPage() {
  const posts = await getBlogPosts();

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DCE6F2] shadow-xs">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D5FAF] uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Denmed Clinical Insights</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-[#12263F] tracking-tight">
          Equipment Guides & Clinical Best Practices
        </h1>
        <p className="text-xs sm:text-sm text-[#5B6B82] mt-2 max-w-2xl leading-relaxed">
          Written in collaboration with practicing prosthodontists, pulmonologists, and hospital sterilization auditors across India.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group bg-white rounded-3xl border border-[#DCE6F2] hover:border-[#1D5FAF] hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
          >
            <div className="relative aspect-16/10 bg-[#F6F9FD] overflow-hidden">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-[#0B2545]/90 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                {post.category}
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 text-[12px] text-[#5B6B82] mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {post.publishedAt}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readTime}
                  </span>
                </div>

                <h2 className="font-bold text-base text-[#12263F] group-hover:text-[#1D5FAF] transition-colors leading-snug">
                  {post.title}
                </h2>

                <p className="text-xs text-[#5B6B82] line-clamp-3 mt-2 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-[#DCE6F2] flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#12263F]">{post.author}</div>
                  <div className="text-[11px] text-[#5B6B82]">{post.authorRole}</div>
                </div>
                <span className="font-bold text-[#1D5FAF] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Read Article →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
