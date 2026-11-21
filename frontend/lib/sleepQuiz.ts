/**
 * Sleep apnea risk quiz — STOP-BANG questionnaire (Chung F. et al., Chest 2016).
 *
 * The API recomputes the same score when the result is sent with the enquiry form
 * (backend/src/modules/enquiries/stop-bang.js) — keep the two in sync.
 *
 *   Score = number of "yes" (0–8)
 *   0–2 LOW · 3–4 MODERATE (HIGH if 2+ of S/T/O/P and male / BMI > 35 / neck > 40 cm) · 5–8 HIGH
 *
 * Screening only — it does not diagnose sleep apnea.
 */

export type YesNoKey = 'snoring' | 'tired' | 'observed' | 'pressure' | 'age' | 'neck' | 'male';
export type RiskLevel = 'low' | 'moderate' | 'high';

export type QuizQuestion =
  | { kind: 'yesno'; key: YesNoKey; text: string; help?: string }
  | { kind: 'bmi'; key: 'bmi'; text: string; help: string };

/** Same order and wording as the STOP-BANG quiz on sleepapnea.org */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { kind: 'yesno', key: 'snoring', text: 'Do you snore loudly enough to be heard in another room or to awaken a bed partner?' },
  { kind: 'yesno', key: 'tired', text: 'Do you regularly feel tired or fall asleep during the day?' },
  { kind: 'yesno', key: 'observed', text: 'Has anyone observed you choking, gasping, or experiencing breathing interruptions during sleep?' },
  { kind: 'yesno', key: 'pressure', text: 'Do you have high blood pressure?' },
  { kind: 'bmi', key: 'bmi', text: 'What is your height and weight?', help: "We'll calculate your BMI for you. This stays on your device." },
  { kind: 'yesno', key: 'age', text: 'Are you over the age of 50?' },
  {
    kind: 'yesno',
    key: 'neck',
    text: 'Is your neck circumference greater than 16 inches (40 cm)?',
    help: "To measure your neck circumference, take a flexible measuring tape and place it just below your Adam's apple. If you don't have a flexible measuring tape, you can use a string to measure the circumference, then lay the string flat and measure it with a ruler.",
  },
  { kind: 'yesno', key: 'male', text: 'Were you born male?' },
];

export const BMI_THRESHOLD = 35;

/** Chip labels for "Your possible signs of sleep apnea" (same as the API). */
export const SIGN_LABELS: Record<YesNoKey | 'bmi', string> = {
  snoring: 'Loud snoring',
  tired: 'Daytime tiredness',
  observed: 'Observed breathing pauses',
  pressure: 'High blood pressure',
  bmi: 'BMI over 35',
  age: 'Over age 50',
  neck: 'Neck over 16 in (40 cm)',
  male: 'Born male',
};

// ---------------------------------------------------------------------------
// BMI
// ---------------------------------------------------------------------------

export type UnitSystem = 'imperial' | 'metric';

export interface BodyInput {
  unit: UnitSystem;
  feet: string;
  inches: string;
  pounds: string;
  cm: string;
  kg: string;
}

export const EMPTY_BODY: BodyInput = { unit: 'imperial', feet: '', inches: '', pounds: '', cm: '', kg: '' };

/** Height (cm) + weight (kg) from either unit system; null when incomplete or implausible. */
export function toMetric(body: BodyInput): { heightCm: number; weightKg: number } | null {
  let heightCm: number;
  let weightKg: number;
  if (body.unit === 'imperial') {
    const ft = Number(body.feet);
    const inch = body.inches === '' ? 0 : Number(body.inches);
    const lb = Number(body.pounds);
    if (!body.feet || !body.pounds || !Number.isFinite(ft) || !Number.isFinite(inch) || !Number.isFinite(lb)) return null;
    if (inch < 0 || inch >= 12) return null;
    heightCm = (ft * 12 + inch) * 2.54;
    weightKg = lb * 0.45359237;
  } else {
    heightCm = Number(body.cm);
    weightKg = Number(body.kg);
    if (!body.cm || !body.kg || !Number.isFinite(heightCm) || !Number.isFinite(weightKg)) return null;
  }
  // Same plausibility range the API accepts
  if (heightCm < 90 || heightCm > 250 || weightKg < 20 || weightKg > 350) return null;
  return { heightCm: Math.round(heightCm * 10) / 10, weightKg: Math.round(weightKg * 10) / 10 };
}

export function bmiFrom(heightCm: number, weightKg: number): number {
  return Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export type QuizAnswers = Partial<Record<YesNoKey, boolean>>;

export interface QuizResult {
  score: number;
  risk: RiskLevel;
  signs: string[];
  bmi: number;
}

export function scoreQuiz(answers: QuizAnswers, bmi: number): QuizResult {
  const yes: Record<YesNoKey | 'bmi', boolean> = {
    snoring: Boolean(answers.snoring),
    tired: Boolean(answers.tired),
    observed: Boolean(answers.observed),
    pressure: Boolean(answers.pressure),
    bmi: bmi > BMI_THRESHOLD,
    age: Boolean(answers.age),
    neck: Boolean(answers.neck),
    male: Boolean(answers.male),
  };
  const score = Object.values(yes).filter(Boolean).length;
  const stop = [yes.snoring, yes.tired, yes.observed, yes.pressure].filter(Boolean).length;

  let risk: RiskLevel = 'low';
  if (score >= 5) risk = 'high';
  else if (score >= 3) risk = stop >= 2 && (yes.male || yes.bmi || yes.neck) ? 'high' : 'moderate';

  const signs = (Object.keys(yes) as (YesNoKey | 'bmi')[]).filter((k) => yes[k]).map((k) => SIGN_LABELS[k]);
  return { score, risk, signs, bmi };
}

/** Copy per level for the result screen. */
export const RISK_COPY: Record<RiskLevel, { label: string; tagline: string; body: string }> = {
  low: {
    label: 'LOW',
    tagline: 'Peace of mind starts with knowing the signs.',
    body: "According to your answers, you're at low risk for sleep apnea. If you (or your bed partner) notice any of the symptoms below, follow up with your doctor or book a home sleep study.",
  },
  moderate: {
    label: 'MODERATE',
    tagline: 'Sleeping better starts with getting answers.',
    body: 'We recommend a home sleep study to confirm whether you have sleep apnea and, if needed, take the next step toward treatment and better sleep.',
  },
  high: {
    label: 'HIGH',
    tagline: 'Sleeping better starts with getting answers.',
    body: 'Your answers show several strong signs of sleep apnea. We recommend a home sleep study soon to confirm a diagnosis and start the right treatment.',
  },
};

/** Symptoms to watch for (shown under the result). */
export const WATCH_SYMPTOMS = [
  'Chronic, loud snoring',
  'Snorting, gasping or choking during sleep',
  'Pauses in breathing noticed by a partner',
  'Excessive daytime tiredness',
  'Morning headaches or a dry mouth',
  'Mood changes, irritability or poor concentration',
  'Waking up often at night to urinate',
];
