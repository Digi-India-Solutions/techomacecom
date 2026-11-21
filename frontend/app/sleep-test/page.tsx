import React from 'react';
import type { Metadata } from 'next';
import SleepTestLanding from '@/components/sleep-test/SleepTestLanding';
import { getSiteSettings } from '@/lib/settings/server';

export const metadata: Metadata = {
  title: 'Sleep Study at Home — Diagnose Sleep Apnea in Bed | Buy Denmed',
  description:
    'Certified Level 2 & Level 3 at-home sleep apnea testing across India. Doorstep equipment setup by trained technicians and doctor-verified reports in 24-48 hours.',
  keywords: [
    'sleep study at home',
    'home sleep apnea test india',
    'level 2 polysomnography home',
    'level 3 sleep test',
    'sleep apnea diagnosis delhi mumbai bangalore',
    'snoring test at home',
    'CPAP titration study',
    'Buy Denmed sleep test'
  ],
  alternates: {
    canonical: '/sleep-test'
  },
  openGraph: {
    title: 'Sleep Study at Home — Diagnose Sleep Apnea in Bed | Buy Denmed',
    description:
      'Certified Level 2 & Level 3 home sleep tests across India. Doorstep setup by medical technicians & doctor-verified reports in 24–48 hours.',
    url: '/sleep-test',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Buy Denmed',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'Buy Denmed Home Sleep Study Diagnostics'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sleep Study at Home — Diagnose Sleep Apnea in Bed | Buy Denmed',
    description:
      'Certified Level 2 & Level 3 home sleep tests with doorstep equipment setup & doctor-verified reports.',
    images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80']
  }
};

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the difference between a home sleep test and an overnight hospital sleep study?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A home sleep apnea test allows you to sleep naturally in your own bed in your familiar bedroom environment, eliminating the disruption and anxiety of staying overnight in an unfamiliar hospital room. Modern Level 2 and Level 3 home diagnostic units provide clinical-grade data matching hospital lab accuracy for Obstructive Sleep Apnea.'
      }
    },
    {
      '@type': 'Question',
      name: 'How do I prepare for the sleep test at home?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Maintain your normal daily routine. Avoid caffeine after 2:00 PM and avoid alcohol on test night as it can artificially relax airway muscles. Take a warm shower in the evening and avoid heavy facial or body lotions so electrodes and sensors stay firmly in place. Have dinner at your usual hour.'
      }
    },
    {
      '@type': 'Question',
      name: 'Will the equipment feel uncomfortable or prevent me from sleeping?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our modern diagnostic equipment is ultra-lightweight, compact, and wireless. You are not wired to a wall socket and can comfortably turn onto your back or side, or get up to use the washroom. Most patients fall asleep within 15–25 minutes without feeling restricted.'
      }
    },
    {
      '@type': 'Question',
      name: 'How quickly will I receive my sleep study report?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our technician collects the equipment the following morning. Raw signals are scored by certified polysomnography technologists and evaluated by a board-certified Pulmonologist. Your detailed diagnostic PDF report is delivered to your email and WhatsApp within 24 to 48 hours.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I get a CPAP or BiPAP trial if my report confirms sleep apnea?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Buy Denmed is India’s leading respiratory equipment specialist. If your report indicates mild, moderate, or severe sleep apnea, our clinical team can coordinate a complimentary CPAP titration trial, help you test comfortable masks, or offer flexible weekly/monthly rentals.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is a doctor’s prescription required to book a sleep study?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A prescription is helpful but not mandatory to initiate an enquiry. Our clinical advisor will evaluate your symptoms (snoring, daytime sleepiness score, nocturnal choking) during our initial consultation call and advise you whether Level 2 or Level 3 testing is appropriate.'
      }
    }
  ]
};

const MEDICAL_BUSINESS_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  name: 'Buy Denmed Sleep Diagnostics India',
  description: 'Pan-India at-home sleep apnea testing, Level 2 and Level 3 polysomnography, and respiratory care equipment.',
  url: 'https://buydenmed.com/sleep-test',
  currenciesAccepted: 'INR',
  paymentAccepted: 'Direct Bank Transfer, UPI, Credit Card, Debit Card',
  priceRange: '₹₹',
  areaServed: {
    '@type': 'Country',
    name: 'India'
  },
  availableService: {
    '@type': 'MedicalTest',
    name: 'Home Sleep Apnea Test (HSAT)',
    usedToDiagnose: [
      {
        '@type': 'MedicalCondition',
        name: 'Obstructive Sleep Apnea'
      },
      {
        '@type': 'MedicalCondition',
        name: 'Central Sleep Apnea'
      }
    ]
  }
};

export default async function SleepTestPage() {
  // Phone number in the structured data comes from Settings → Store
  const { store } = await getSiteSettings();
  const businessSchema = { ...MEDICAL_BUSINESS_SCHEMA, name: `${store.brandName} Sleep Diagnostics India`, telephone: store.supportPhone };
  return (
    <>
      {/* Schema.org FAQPage structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      {/* Schema.org MedicalBusiness structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />

      <SleepTestLanding />
    </>
  );
}
