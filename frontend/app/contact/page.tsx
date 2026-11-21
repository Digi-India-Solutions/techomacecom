import React from 'react';
import { Metadata } from 'next';
import { getCmsPage } from '@/lib/api/cms';
import ContactClient from './ContactClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('contact');
  return {
    title: page?.seoTitle || 'Contact Buy Denmed India - Clinical Support & Helpline',
    description:
      page?.seoDescription ||
      'Need assistance with order tracking, warranty claims, equipment rentals, or hospital tenders? Contact Buy Denmed.',
  };
}

export default async function ContactPage() {
  const page = await getCmsPage('contact');
  return <ContactClient initialPage={page} />;
}
