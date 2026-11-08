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
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6B00] uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Denmed Clinical Insights</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-[#2B2B2B] tracking-tight">
          Equipment Guides & Clinical Best Practices
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          Written in collaboration with practicing prosthodontists, pulmonologists, and hospital sterilization auditors across India.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group bg-white rounded-3xl border border-gray-200 hover:border-[#FF6B00] hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
          >
            <div className="relative aspect-16/10 bg-gray-100 overflow-hidden">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-[#2B2B2B]/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                {post.category}
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-2">
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

                <h2 className="font-bold text-base text-gray-900 group-hover:text-[#FF6B00] transition-colors leading-snug">
                  {post.title}
                </h2>

                <p className="text-xs text-gray-600 line-clamp-3 mt-2 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-gray-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-gray-900">{post.author}</div>
                  <div className="text-[10px] text-gray-400">{post.authorRole}</div>
                </div>
                <span className="font-bold text-[#FF6B00] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
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
