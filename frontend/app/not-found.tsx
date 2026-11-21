'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Home,
  PackageSearch,
  FolderOpen,
  ArrowRight,
  Phone,
  MessageCircle,
  HelpCircle,
  Stethoscope,
  Activity,
  Bed,
  Layers
} from 'lucide-react';

const POPULAR_DEPARTMENTS = [
  { name: 'Oxygen Concentrators', href: '/category/oxygen-concentrators', icon: Activity, count: '5L & 10L Units' },
  { name: 'Dental Chairs & Units', href: '/category/dental-chairs', icon: Stethoscope, count: 'Operatory Setup' },
  { name: 'Patient Monitors', href: '/category/patient-monitors', icon: Layers, count: 'Multipara Vitals' },
  { name: 'ICU Beds & Mobility', href: '/category/icu-beds', icon: Bed, count: 'Motorized Care' },
  { name: 'Medical Rentals', href: '/rent', icon: PackageSearch, count: 'Doorstep Dispatch' },
  { name: 'Dental Autoclaves', href: '/category/dental-autoclaves', icon: HelpCircle, count: 'Class B Sterilization' }
];

export default function GlobalNotFound() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-12 sm:py-16 bg-gradient-to-b from-[#F6F9FD] via-white to-[#F6F9FD]">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Visual Badge & Icon */}
        <div className="inline-flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#EAF2FC] to-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center shadow-lg shadow-blue-500/10">
              <PackageSearch className="w-12 h-12 sm:w-14 sm:h-14 text-[#1D5FAF]" />
            </div>
            <span className="absolute -bottom-2.5 -right-2 bg-[#EA580C] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm font-heading">
              404
            </span>
          </div>
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545] font-heading tracking-tight">
            Page, Category or Product Not Found
          </h1>
          <p className="text-sm sm:text-base text-[#475569] max-w-lg mx-auto leading-relaxed">
            The link you followed may be outdated, or the clinical equipment might have been renamed or moved.
          </p>
        </div>

        {/* Live Search Bar */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search 1,000+ medical devices, categories or brands..."
              className="w-full pl-11 pr-24 py-3 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D5FAF] focus:border-transparent shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-4 py-2 bg-[#1D5FAF] hover:bg-[#174D8F] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              Search
            </button>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#13335E] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow"
          >
            <Home className="w-4 h-4" />
            Return to Homepage
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#0F172A] text-xs sm:text-sm font-semibold transition-all shadow-xs"
          >
            <FolderOpen className="w-4 h-4 text-[#1D5FAF]" />
            Explore All Products
          </Link>
        </div>

        {/* Popular Clinical Departments */}
        <div className="pt-6 border-t border-[#E2E8F0]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
            Popular Clinical Departments
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-left">
            {POPULAR_DEPARTMENTS.map((dept) => (
              <Link
                key={dept.name}
                href={dept.href}
                className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#1D5FAF] hover:bg-[#F0F7FF] transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EAF2FC] group-hover:bg-[#1D5FAF] text-[#1D5FAF] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <dept.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#0F172A] group-hover:text-[#1D5FAF] truncate transition-colors">
                    {dept.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{dept.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Need Urgent Support Strip */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-[#475569]">
          <span className="font-medium">Need immediate assistance with equipment?</span>
          <div className="flex items-center gap-3">
            <a
              href="tel:+919131734930"
              className="inline-flex items-center gap-1 font-semibold text-[#1D5FAF] hover:underline"
            >
              <Phone className="w-3.5 h-3.5" />
              +91 9131734930
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="https://wa.me/919131734930"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:underline"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp Specialist
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

