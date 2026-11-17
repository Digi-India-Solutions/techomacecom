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
    <section className="py-12 sm:py-16 bg-white border-t border-[#DCE6F2]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold text-[#12263F] font-heading">
              From the Denmed Knowledge Hub
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6B82] font-body mt-1.5">
              Equipment calibration tips, sleep apnea guidelines, and clinic setup tutorials
            </p>
          </div>
          <Link
            href="/blog"
            className="text-xs sm:text-sm font-bold text-[#1D5FAF] hover:text-[#174E90] flex items-center gap-1.5 group font-heading transition-colors"
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
              className="group bg-white rounded-2xl border border-[#DCE6F2] hover:border-[#1D5FAF] hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1"
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
                <div className="absolute top-3 left-3 bg-[#0B2545]/90 backdrop-blur-xs text-white text-[12px] font-bold px-2.5 py-0.5 rounded-md font-heading">
                  {post.category}
                </div>
              </div>

              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-xs text-[#5B6B82] mb-2 font-body">
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

                  <h3 className="font-heading font-bold text-base sm:text-lg text-[#12263F] group-hover:text-[#1D5FAF] transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#5B6B82] font-body line-clamp-2 mt-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#DCE6F2] flex items-center justify-between text-xs sm:text-sm font-heading">
                  <span className="font-semibold text-[#12263F] truncate max-w-[70%]">
                    {post.author}
                  </span>
                  <span className="font-bold text-[#1D5FAF] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
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
