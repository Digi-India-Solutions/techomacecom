import React from 'react';
import { Metadata } from 'next';
import { getFaqs } from '@/lib/api/cms';
import FaqClient from './FaqClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) | Buy Denmed India',
  description:
    'Everything doctors and healthcare procurement teams need to know about purchasing, rentals, warranties, and GST invoicing.',
};

export default async function FaqPage() {
  const faqs = await getFaqs();
  return <FaqClient initialFaqs={faqs} />;
}
