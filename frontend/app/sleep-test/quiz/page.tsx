import React from 'react';
import type { Metadata } from 'next';
import SleepApneaQuiz from '@/components/sleep-test/SleepApneaQuiz';

export const metadata: Metadata = {
  title: 'Sleep Apnea Risk Quiz (STOP-BANG) — 2 Minutes | Buy Denmed',
  description:
    'Answer 8 quick questions to check your risk of obstructive sleep apnea with the STOP-BANG screening questionnaire, then talk to a sleep advisor about a home sleep study.',
  alternates: { canonical: '/sleep-test/quiz' },
};

/** /sleep-test/quiz — STOP-BANG risk quiz with the callback form on the result. */
export default function SleepApneaQuizPage() {
  return (
    <div className="bg-[#F6F9FD] min-h-[70vh]">
      <SleepApneaQuiz />
    </div>
  );
}
