import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/types';
import { ArrowRight, Clock, Calendar } from 'lucide-react';

interface BlogPreviewSectionProps {
  posts: BlogPost[];
}

export const BlogPreviewSection: React.FC<BlogPreviewSectionProps> = ({ posts }) => {
  return (
    <section className="py-12 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
          <div>
            <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">
              Clinical Insights & Guides
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2B2B2B] tracking-tight">
              From the Denmed Knowledge Hub
            </h2>
          </div>
          <Link
            href="/blog"
            className="text-xs font-bold text-[#FF6B00] hover:text-[#E65D00] flex items-center gap-1 group"
          >
            <span>Read All Articles</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.slice(0, 3).map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-white rounded-2xl border border-gray-200 hover:border-[#FF6B00] hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
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
                <div className="absolute top-3 left-3 bg-[#2B2B2B]/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {post.category}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.publishedAt}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-[#FF6B00] transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs text-gray-500 line-clamp-2 mt-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 truncate max-w-[70%]">
                    {post.author}
                  </span>
                  <span className="font-bold text-[#FF6B00] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Read →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogPreviewSection;
