import React from 'react';
import Link from 'next/link';
import { BlogPost } from '@/types';
import { Clock, Calendar, ChevronRight } from 'lucide-react';
import SkeletonImage from '@/components/common/SkeletonImage';

interface BlogPreviewSectionProps {
  posts: BlogPost[];
  title?: string;
}

export const BlogPreviewSection: React.FC<BlogPreviewSectionProps> = ({ posts, title = 'From the Denmed Knowledge Hub' }) => {
  return (
    <section className="py-8 sm:py-16 bg-white border-t border-[#DCE6F2]">
      <div className="max-w-[1320px] mx-auto px-3 sm:px-6">
        <div className="flex items-start sm:items-end justify-between mb-4 sm:mb-8 gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#12263F] font-heading relative inline-block">
              {title || 'Clinical Buyer Guides'}
              <span className="absolute bottom-[-3px] sm:bottom-[-4px] left-0 w-8 sm:w-10 h-[2.5px] sm:h-[3px] bg-[#1D5FAF] rounded-full" />
            </h2>
            <p className="text-[11px] sm:text-sm text-[#5B6B82] font-body mt-1 sm:mt-1.5 line-clamp-1 sm:line-clamp-none">
              Equipment calibration tips, sleep apnea guidelines, and clinic setup tutorials
            </p>
          </div>
          <Link
            href="/blog"
            className="text-xs sm:text-sm font-bold text-[#1D5FAF] hover:text-[#174E90] flex items-center gap-0.5 sm:gap-1 shrink-0 pt-0.5 sm:pt-0 font-heading transition-colors whitespace-nowrap"
          >
            <span>Read All</span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>

        {/* Mobile: Horizontal swipeable snap track (2.5 cards visible in front) -> Desktop 3-column grid */}
        <div className="flex gap-3 sm:gap-6 overflow-x-auto pb-3 sm:pb-0 pt-1 scroll-smooth snap-x no-scrollbar md:grid md:grid-cols-3 md:gap-6">
          {posts.slice(0, 3).map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-white rounded-xl sm:rounded-2xl border border-[#DCE6F2] hover:border-[#1D5FAF] hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden hover:-translate-y-1 shrink-0 snap-start w-[calc((100%-24px)/2.5)] sm:w-[320px] md:w-auto shadow-2xs"
            >
              <div className="relative aspect-16/10 bg-[#F6F9FD] overflow-hidden">
                <SkeletonImage
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 40vw, 33vw"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#0B2545]/90 backdrop-blur-xs text-white text-[9px] sm:text-[12px] font-bold px-1.5 sm:px-2.5 py-0.5 rounded-md font-heading max-w-[85%] truncate">
                  {post.category}
                </div>
              </div>

              <div className="p-2.5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs text-[#5B6B82] mb-1 sm:mb-2 font-body">
                    <span className="flex items-center gap-1 truncate">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                      <span className="truncate">{post.publishedAt}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                      <span>{post.readTime}</span>
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-xs sm:text-lg text-[#12263F] group-hover:text-[#1D5FAF] transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-[10px] sm:text-sm text-[#5B6B82] font-body line-clamp-2 mt-1 sm:mt-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-2 sm:pt-4 mt-2 sm:mt-4 border-t border-[#DCE6F2] flex items-center justify-between text-[10px] sm:text-sm font-heading">
                  <span className="font-semibold text-[#12263F] truncate max-w-[65%]">
                    {post.author}
                  </span>
                  <span className="font-bold text-[#1D5FAF] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform shrink-0">
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
