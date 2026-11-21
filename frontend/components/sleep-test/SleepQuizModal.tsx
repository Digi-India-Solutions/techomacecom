'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  Moon,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  EMPTY_BODY,
  QUIZ_QUESTIONS,
  RISK_COPY,
  bmiFrom,
  scoreQuiz,
  toMetric,
  type BodyInput,
  type QuizAnswers,
  type RiskLevel,
  type YesNoKey,
} from '@/lib/sleepQuiz';
import RiskGauge from './RiskGauge';
import SleepTestEnquiryForm from './SleepTestEnquiryForm';

/**
 * Full STOP-BANG quiz running inside an interactive modal overlay.
 * Opens directly on Question 1 (intro screen removed as requested).
 *
 * Result screen features only the clean Sleep Result on the left and
 * the Sleep Advisor callback enquiry form on the right.
 */

type Stage = 'question' | 'result';
const AUTO_ADVANCE_MS = 320;
const TOTAL = QUIZ_QUESTIONS.length;

const RISK_STYLE: Record<RiskLevel, { pill: string; text: string; icon: React.ElementType }> = {
  low: {
    pill: 'bg-[#16A34A]/10 border-[#16A34A]/30 text-[#15803D]',
    text: 'text-[#15803D]',
    icon: CheckCircle2,
  },
  moderate: {
    pill: 'bg-[#F59E0B]/10 border-[#F59E0B]/40 text-[#B45309]',
    text: 'text-[#B45309]',
    icon: AlertTriangle,
  },
  high: {
    pill: 'bg-[#DC2626]/10 border-[#DC2626]/30 text-[#B91C1C]',
    text: 'text-[#B91C1C]',
    icon: AlertTriangle,
  },
};

const primaryBtn =
  'inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#1D5FAF] hover:bg-[#174E90] text-white text-sm font-bold font-heading shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#DCE6F2] bg-white text-[#12263F] hover:bg-[#EAF2FC] text-sm font-bold font-heading transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

interface Props {
  onClose: () => void;
}

export const SleepQuizModal: React.FC<Props> = ({ onClose }) => {
  // Directly open to Question 1
  const [stage, setStage] = useState<Stage>('question');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [body, setBody] = useState<BodyInput>(EMPTY_BODY);
  const [advancing, setAdvancing] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const question = QUIZ_QUESTIONS[index];
  const metric = useMemo(() => toMetric(body), [body]);
  const bmi = metric ? bmiFrom(metric.heightCm, metric.weightKg) : null;
  const isLast = index === TOTAL - 1;

  // Lock body scroll, handle Escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Scroll inner content to top on question change & focus heading
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    headingRef.current?.focus();
  }, [stage, index]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const restart = () => {
    setAnswers({});
    setBody(EMPTY_BODY);
    setIndex(0);
    setStage('question');
  };

  const goNext = () => {
    if (isLast) setStage('result');
    else setIndex((i) => i + 1);
  };

  const goBack = () => {
    if (timer.current) clearTimeout(timer.current);
    setAdvancing(false);
    if (index > 0) setIndex((i) => i - 1);
  };

  const answer = (key: YesNoKey, value: boolean) => {
    if (advancing) return;
    setAnswers((a) => ({ ...a, [key]: value }));
    if (isLast) return;
    setAdvancing(true);
    timer.current = setTimeout(() => {
      setAdvancing(false);
      setIndex((i) => i + 1);
    }, AUTO_ADVANCE_MS);
  };

  const result = useMemo(
    () => (stage === 'result' && bmi !== null ? scoreQuiz(answers, bmi) : null),
    [stage, answers, bmi]
  );

  const progress = stage === 'question' ? ((index + 1) / TOTAL) * 100 : 100;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-[#07192F]/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sleep-quiz-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-5xl max-h-[96vh] flex flex-col rounded-2xl sm:rounded-3xl bg-[#F6F9FD] shadow-2xl overflow-hidden border border-[#DCE6F2]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Header Bar ── */}
        <div className="shrink-0 bg-[#0B2545] text-white px-5 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Moon className="w-4 h-4 text-[#93C5FD]" />
            <span className="text-xs font-bold font-heading tracking-wider text-[#93C5FD] uppercase">
              Sleep Apnea Risk Assessment
            </span>
            <span className="text-[#EAF2FC]/40 text-xs hidden sm:inline">· STOP-BANG</span>
          </div>

          {/* Progress bar */}
          <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#1D5FAF] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {stage === 'question' ? (
            <span className="text-[11px] font-semibold text-[#EAF2FC]/80 font-heading shrink-0">
              Question {index + 1} of {TOTAL}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-[#93C5FD] font-heading shrink-0">
              Completed
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close quiz"
            className="shrink-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {/* ── QUESTIONS (Directly opens to Question 1) ── */}
          {stage === 'question' && (
            <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
              <div key={question.key} className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-7">
                {/* Question index tag */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF2FC] border border-[#DCE6F2] text-[11px] font-bold font-heading text-[#1D5FAF] uppercase tracking-widest">
                  Question {index + 1} of {TOTAL}
                </div>

                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  id="sleep-quiz-modal-title"
                  className="text-xl sm:text-3xl font-bold text-[#12263F] font-heading leading-snug outline-none"
                >
                  {question.text}
                </h2>

                {question.help && (
                  <div className="flex items-start gap-2 p-3.5 rounded-xl bg-white border border-[#DCE6F2] text-xs text-[#5B6B82] font-body leading-relaxed">
                    <Info className="w-4 h-4 text-[#1D5FAF] shrink-0 mt-0.5" />
                    {question.help}
                  </div>
                )}

                {question.kind === 'yesno' ? (
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    role="radiogroup"
                    aria-label={question.text}
                  >
                    {[
                      { label: 'Yes', value: true, emoji: '✓' },
                      { label: 'No', value: false, emoji: '✗' },
                    ].map((opt) => {
                      const selected = answers[question.key] === opt.value;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => answer(question.key, opt.value)}
                          className={`py-7 rounded-2xl border-2 text-xl font-bold font-heading transition-all duration-200 cursor-pointer flex flex-col items-center gap-2 ${
                            selected
                              ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90] shadow-lg scale-[1.02]'
                              : 'border-[#DCE6F2] bg-white text-[#12263F] hover:border-[#1D5FAF]/60 hover:bg-[#F6F9FD] hover:scale-[1.01]'
                          }`}
                        >
                          <span
                            className={`text-3xl font-black ${
                              selected ? 'text-[#1D5FAF]' : 'text-[#DCE6F2]'
                            }`}
                          >
                            {opt.emoji}
                          </span>
                          {selected && <CheckCircle2 className="w-5 h-5 text-[#1D5FAF]" />}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <BmiInput body={body} onChange={setBody} bmi={bmi} />
                )}
              </div>

              {/* Navigation row */}
              <div className="mt-10 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={index === 0}
                  className={secondaryBtn}
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                {isLast ? (
                  <button
                    type="button"
                    onClick={() => setStage('result')}
                    disabled={question.kind === 'yesno' ? answers[question.key] === undefined : bmi === null}
                    className={primaryBtn}
                  >
                    See My Results <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  (question.kind === 'bmi' || (answers[question.key] !== undefined && !advancing)) && (
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={question.kind === 'yesno' ? answers[question.key] === undefined : bmi === null}
                      className={primaryBtn}
                    >
                      Next <ArrowRight className="w-4 h-4" />
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* ── RESULT (Only Sleep Result on Left + Enquiry Form on Right) ── */}
          {stage === 'result' && result && metric && (() => {
            const copy = RISK_COPY[result.risk];
            const style = RISK_STYLE[result.risk];
            const Icon = style.icon;
            const summary = `Sleep apnea risk quiz: ${copy.label} risk (STOP-BANG score ${result.score}/8, BMI ${result.bmi}).`;

            return (
              <div className="px-4 sm:px-8 py-8 sm:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  {/* ── Left Column: Clean Premium Sleep Result Card ── */}
                  <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE6F2] shadow-xl flex flex-col justify-between space-y-6">
                    <div className="space-y-6">
                      {/* Badge & Title */}
                      <div className="text-center sm:text-left border-b border-[#DCE6F2]/60 pb-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#1D5FAF] bg-[#EAF2FC] border border-[#DCE6F2] px-3 py-1 rounded-full font-heading">
                          <Activity className="w-3.5 h-3.5" /> STOP-BANG Assessment Result
                        </span>
                        <h2
                          ref={headingRef}
                          tabIndex={-1}
                          className="text-2xl sm:text-3xl font-bold font-heading text-[#12263F] mt-2 outline-none"
                        >
                          Your Sleep Apnea Risk
                        </h2>
                      </div>

                      {/* Semicircle Gauge & Risk Badge */}
                      <div className="text-center space-y-4 py-2">
                        <RiskGauge level={result.risk} className="w-full max-w-[280px] mx-auto" />
                        <div>
                          <span className="text-xs font-semibold text-[#5B6B82] uppercase tracking-wider block mb-1">
                            Assessed Risk Level
                          </span>
                          <div
                            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full border text-xl sm:text-2xl font-black font-heading ${style.pill}`}
                          >
                            <Icon className="w-6 h-6" /> {copy.label} RISK
                          </div>
                        </div>
                      </div>

                      {/* Score & BMI Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-[#F6F9FD] border border-[#DCE6F2] p-4 text-center">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6B82] block font-heading">
                            STOP-BANG Score
                          </span>
                          <span className="text-2xl font-black font-heading text-[#12263F] mt-1 block">
                            {result.score} <span className="text-sm font-normal text-[#5B6B82]">/ 8</span>
                          </span>
                        </div>
                        <div className="rounded-2xl bg-[#F6F9FD] border border-[#DCE6F2] p-4 text-center">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6B82] block font-heading">
                            Calculated BMI
                          </span>
                          <span className="text-2xl font-black font-heading text-[#1D5FAF] mt-1 block">
                            {result.bmi}
                          </span>
                        </div>
                      </div>

                      {/* Clinical Guidance Text */}
                      <div className="rounded-2xl bg-[#EAF2FC]/70 border border-[#DCE6F2] p-4 space-y-1">
                        <h3 className="text-sm font-bold font-heading text-[#12263F]">
                          {copy.tagline}
                        </h3>
                        <p className="text-xs text-[#5B6B82] font-body leading-relaxed">
                          {copy.body}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Retake Quiz */}
                    <div className="pt-3 border-t border-[#DCE6F2]/60 flex items-center justify-between">
                      <span className="text-xs text-[#5B6B82] font-body">
                        Need to change your answers?
                      </span>
                      <button
                        type="button"
                        onClick={restart}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-heading text-[#1D5FAF] hover:bg-[#EAF2FC] transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Retake Test
                      </button>
                    </div>
                  </div>

                  {/* ── Right Column: Enquiry / Callback Form ── */}
                  <div className="lg:col-span-6">
                    <SleepTestEnquiryForm
                      heading="Talk to a Sleep Advisor"
                      subheading="Free diagnostic consultation. Our clinical team will review your result and coordinate next steps."
                      defaultMessage={summary}
                      quiz={{
                        answers: {
                          snoring: Boolean(answers.snoring),
                          tired: Boolean(answers.tired),
                          observed: Boolean(answers.observed),
                          pressure: Boolean(answers.pressure),
                          age: Boolean(answers.age),
                          neck: Boolean(answers.neck),
                          male: Boolean(answers.male),
                        },
                        heightCm: metric.heightCm,
                        weightKg: metric.weightKg,
                        unit: body.unit,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// BMI input (height + weight)
// ---------------------------------------------------------------------------

const numInput =
  'w-full pl-4 pr-12 py-4 rounded-2xl border-2 border-[#DCE6F2] bg-white text-lg font-semibold text-[#12263F] font-heading focus:border-[#1D5FAF] focus:outline-none focus:ring-2 focus:ring-[#1D5FAF]/20';

const UnitField: React.FC<{
  id: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  max: number;
  decimals?: boolean;
}> = ({ id, unit, value, onChange, label, max, decimals }) => (
  <div className="relative flex-1">
    <input
      id={id}
      type="text"
      inputMode={decimals ? 'decimal' : 'numeric'}
      aria-label={label}
      value={value}
      onChange={(e) => {
        const v = e.target.value.replace(decimals ? /[^\d.]/g : /\D/g, '');
        if (v === '' || Number(v) <= max) onChange(v);
      }}
      className={numInput}
    />
    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5B6B82] pointer-events-none">
      {unit}
    </span>
  </div>
);

const BmiInput: React.FC<{ body: BodyInput; onChange: (b: BodyInput) => void; bmi: number | null }> = ({
  body,
  onChange,
  bmi,
}) => {
  const set = (patch: Partial<BodyInput>) => onChange({ ...body, ...patch });
  const touched = body.unit === 'imperial' ? Boolean(body.feet && body.pounds) : Boolean(body.cm && body.kg);

  return (
    <div className="mt-4 space-y-5">
      {/* Unit toggle */}
      <div className="inline-flex p-1 rounded-2xl bg-[#EAF2FC] border border-[#DCE6F2]" role="tablist" aria-label="Units">
        {(
          [
            ['imperial', 'Imperial (ft / lbs)'],
            ['metric', 'Metric (cm / kg)'],
          ] as const
        ).map(([unit, label]) => (
          <button
            key={unit}
            type="button"
            role="tab"
            aria-selected={body.unit === unit}
            onClick={() => set({ unit })}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold font-heading transition-all cursor-pointer ${
              body.unit === unit ? 'bg-white text-[#1D5FAF] shadow-sm' : 'text-[#12263F] hover:text-[#1D5FAF]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <p className="text-sm font-bold text-[#12263F] font-heading mb-2">Height</p>
          {body.unit === 'imperial' ? (
            <div className="flex gap-3">
              <UnitField id="q-ft" unit="ft" label="Height in feet" value={body.feet} max={8} onChange={(feet) => set({ feet })} />
              <UnitField id="q-in" unit="in" label="Height in inches" value={body.inches} max={11} onChange={(inches) => set({ inches })} />
            </div>
          ) : (
            <UnitField id="q-cm" unit="cm" label="Height in centimetres" value={body.cm} max={250} decimals onChange={(cm) => set({ cm })} />
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-[#12263F] font-heading mb-2">Weight</p>
          {body.unit === 'imperial' ? (
            <UnitField id="q-lbs" unit="lbs" label="Weight in pounds" value={body.pounds} max={770} decimals onChange={(pounds) => set({ pounds })} />
          ) : (
            <UnitField id="q-kg" unit="kg" label="Weight in kilograms" value={body.kg} max={350} decimals onChange={(kg) => set({ kg })} />
          )}
        </div>
      </div>

      <p className="text-base text-[#12263F] font-body" aria-live="polite">
        Calculated BMI: <strong className="font-heading text-[#1D5FAF]">{bmi ?? '—'}</strong>
        {touched && bmi === null && (
          <span className="block text-xs text-[#DC2626] mt-1">
            Please check your height and weight — they look out of range.
          </span>
        )}
      </p>
    </div>
  );
};

export default SleepQuizModal;
