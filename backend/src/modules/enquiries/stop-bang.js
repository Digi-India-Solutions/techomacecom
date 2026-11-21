/**
 * STOP-BANG sleep apnea screening (Chung F. et al., Chest 2016) — the questionnaire the
 * storefront risk quiz uses (same one as sleepapnea.org's quiz).
 *
 *   S  Snoring loudly                      B  BMI > 35 kg/m²
 *   T  Tired / sleepy during the day       A  Age over 50
 *   O  Observed choking / breathing stops  N  Neck circumference > 16 in (40 cm)
 *   P  Pressure — high blood pressure      G  Gender — born male
 *
 * Score = number of "yes" (0–8):
 *   0–2  LOW
 *   3–4  MODERATE — unless 2+ of S/T/O/P are "yes" AND (male OR BMI > 35 OR neck > 40 cm) → HIGH
 *   5–8  HIGH
 *
 * The storefront computes the same result for instant feedback (frontend/lib/sleepQuiz.ts);
 * the API always recomputes it here, so a stored risk level never comes from the browser.
 * Screening only — it does not diagnose sleep apnea.
 */

export const BMI_THRESHOLD = 35;

/** Labels for the "possible signs" chips, in questionnaire order. */
export const SIGN_LABELS = {
  snoring: "Loud snoring",
  tired: "Daytime tiredness",
  observed: "Observed breathing pauses",
  pressure: "High blood pressure",
  bmi: "BMI over 35",
  age: "Over age 50",
  neck: "Neck over 16 in (40 cm)",
  male: "Born male",
};

/** kg / m² rounded to one decimal; null when the inputs are not a plausible adult body. */
export function bmiFrom(heightCm, weightKg) {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!Number.isFinite(h) || !Number.isFinite(w) || h < 90 || h > 250 || w < 20 || w > 350) return null;
  return Math.round((w / (h / 100) ** 2) * 10) / 10;
}

/**
 * @param answers { snoring, tired, observed, pressure, age, neck, male } booleans
 * @param bmi     number (kg/m²)
 * @returns { score, stopScore, risk: "low" | "moderate" | "high", signs: string[] }
 */
export function scoreStopBang(answers, bmi) {
  const yes = {
    snoring: Boolean(answers.snoring),
    tired: Boolean(answers.tired),
    observed: Boolean(answers.observed),
    pressure: Boolean(answers.pressure),
    bmi: Number(bmi) > BMI_THRESHOLD,
    age: Boolean(answers.age),
    neck: Boolean(answers.neck),
    male: Boolean(answers.male),
  };
  const score = Object.values(yes).filter(Boolean).length;
  const stopScore = [yes.snoring, yes.tired, yes.observed, yes.pressure].filter(Boolean).length;

  let risk = "low";
  if (score >= 5) risk = "high";
  else if (score >= 3) risk = stopScore >= 2 && (yes.male || yes.bmi || yes.neck) ? "high" : "moderate";

  const signs = Object.entries(yes)
    .filter(([, v]) => v)
    .map(([k]) => SIGN_LABELS[k]);

  return { score, stopScore, risk, signs };
}
