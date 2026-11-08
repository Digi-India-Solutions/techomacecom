'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Heart, 
  Activity, 
  Moon, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Zap, 
  Award, 
  FileText, 
  Sparkles,
  Stethoscope,
  Smile,
  Info,
  PhoneCall
} from 'lucide-react';
import Logo from '@/components/common/Logo';
import { submitEnquiry } from '@/lib/api';
import { useToastStore } from '@/lib/store';

interface FormState {
  fullName: string;
  mobile: string;
  city: string;
  preferredDate: string;
  testType: 'Level 2' | 'Level 3' | 'Not sure';
  message: string;
  consent: boolean;
  honeypot: string;
}

const SYMPTOMS_DATA = [
  {
    id: 'snoring',
    title: 'Loud Chronic Snoring',
    desc: 'Persistent, heavy, or irregular snoring that disturbs your partner or sounds like gasping/choking.',
    icon: Moon,
    badge: 'Primary Indicator'
  },
  {
    id: 'choking',
    title: 'Gasping or Choking at Night',
    desc: 'Waking up abruptly with a sudden dry throat, choking sensation, or pounding heart rate.',
    icon: Activity,
    badge: 'High Criticality'
  },
  {
    id: 'daytime_sleepiness',
    title: 'Daytime Sleepiness & Fatigue',
    desc: 'Uncontrollable exhaustion, feeling unrefreshed upon waking, or nodding off during work or driving.',
    icon: Clock,
    badge: 'Cognitive Impact'
  },
  {
    id: 'headaches',
    title: 'Morning Headaches',
    desc: 'Waking up with dull frontal pressure caused by nocturnal oxygen drops and carbon dioxide retention.',
    icon: AlertCircle,
    badge: 'Oxygen Deficit'
  },
  {
    id: 'brain_fog',
    title: 'Poor Concentration & Brain Fog',
    desc: 'Memory lapses, mood irritability, morning grogginess, and trouble sustaining attention during the day.',
    icon: Sparkles,
    badge: 'Neurological'
  },
  {
    id: 'bp',
    title: 'High Blood Pressure',
    desc: 'Resistant hypertension or cardiovascular strain linked to nocturnal airway collapses and hypoxia.',
    icon: Heart,
    badge: 'Cardiovascular'
  }
];

// Comparison table rows matching screenshot 1793802451264_image_d3e8c545.png
const COMPARISON_TABLE = [
  {
    category: 'Location',
    rows: [
      { label: 'At Home', level3: true, level2: true }
    ]
  },
  {
    category: 'What It Monitors',
    rows: [
      { label: 'Breathing Activity', level3: true, level2: true },
      { label: 'Snoring', level3: true, level2: true },
      { label: 'Airflows', level3: true, level2: true },
      { label: 'Oxygen Levels (SpO2)', level3: true, level2: true },
      { label: 'Heart Rate', level3: true, level2: true },
      { label: 'Brain Activity (EEG Leads)', level3: false, level2: true },
      { label: 'Leg & Body / PLMD', level3: false, level2: true },
      { label: 'Muscle Activity (Chin EMG)', level3: false, level2: true }
    ]
  },
  {
    category: 'What It Diagnoses',
    rows: [
      { label: 'Sleep Quality & Staging', level3: false, level2: true },
      { label: 'Sleep Apnea (OSA / CSA)', level3: true, level2: true },
      { label: 'Narcolepsy', level3: false, level2: true }
    ]
  },
  {
    category: 'Therapy Titration',
    rows: [
      { label: 'Bi-PAP / CPAP Titration', level3: false, level2: true }
    ]
  }
];

const FAQS_DATA = [
  {
    q: 'What is the difference between an at-home sleep test and a hospital sleep lab study?',
    a: 'An at-home sleep test allows you to sleep naturally in your own bed in your familiar bedroom environment, eliminating the disruption and anxiety of staying overnight in a clinic. Modern Level 2 and Level 3 diagnostic devices provide medical-grade data matching hospital lab accuracy for diagnosing Obstructive Sleep Apnea.'
  },
  {
    q: 'How does our technician set up the sleep study equipment at your home?',
    a: 'Our certified somnology technician visits your home in the evening at your preferred time. They comfortably attach lightweight, sanitized sensors (nasal cannula, pulse oximeter, and soft chest belt), verify that signals are transmitting cleanly, and answer any questions before leaving you to sleep peacefully.'
  },
  {
    q: 'Will the equipment feel uncomfortable or prevent me from sleeping?',
    a: 'The equipment is ultra-lightweight, compact, and wireless. You are not tethered to a wall socket and can freely roll over, sleep on your back or side, or get up to use the washroom. Most patients fall asleep naturally within 15–20 minutes.'
  },
  {
    q: 'How quickly will I receive my doctor-verified sleep study report?',
    a: 'Our technician collects the device the next morning. Raw polysomnography signals are scored by clinical somnologists and interpreted by board-certified Pulmonologists & Sleep Specialists. Your comprehensive PDF report is delivered to your email and WhatsApp within 24 to 48 hours.'
  },
  {
    q: 'Is a doctor’s prescription required to request a home sleep study?',
    a: 'A prescription is helpful but not mandatory to register an enquiry. When you submit your details, our clinical sleep advisor will review your symptoms (snoring, daytime tiredness score, sleep pattern) and recommend whether Level 2 or Level 3 testing is appropriate.'
  },
  {
    q: 'What happens if my report indicates sleep apnea?',
    a: 'Buy Denmed is India’s authorized respiratory healthcare specialist. If your report shows mild, moderate, or severe apnea, our pulmonology coordinator can arrange a CPAP/BiPAP trial, assist with comfortable mask fitting, or coordinate flexible monthly rentals.'
  }
];

export const SleepTestLanding: React.FC = () => {
  const { addToast } = useToastStore();
  const formRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormState>({
    fullName: '',
    mobile: '',
    city: '',
    preferredDate: '',
    testType: 'Not sure',
    message: '',
    consent: true,
    honeypot: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const toggleSymptom = (id: string, title: string) => {
    setSelectedSymptoms((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        return prev.filter((s) => s !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handlePreFillSymptoms = () => {
    const selectedTitles = SYMPTOMS_DATA
      .filter((s) => selectedSymptoms.includes(s.id))
      .map((s) => s.title);

    if (selectedTitles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        message: `Reported symptoms: ${selectedTitles.join(', ')}.`
      }));
    }
    scrollToForm();
  };

  const validatePhone = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required';
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (!cleanMobile) {
      errors.mobile = 'Mobile Number is required';
    } else if (!validatePhone(cleanMobile)) {
      errors.mobile = 'Enter a valid 10-digit Indian mobile number (e.g. 9811234567)';
    }

    if (!formData.city.trim()) {
      errors.city = 'City / Town is required';
    }

    if (!formData.consent) {
      errors.consent = 'Please authorise contact to proceed';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitEnquiry({
        type: 'sleep_test',
        fullName: formData.fullName.trim(),
        name: formData.fullName.trim(),
        mobile: cleanMobile,
        phone: cleanMobile,
        city: formData.city.trim(),
        preferredDate: formData.preferredDate || undefined,
        testType: formData.testType,
        message: formData.message.trim() || undefined,
        consent: formData.consent,
        honeypot: formData.honeypot
      });

      const enquiryId = result.enquiryId || `BDM-ST-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedId(enquiryId);
      setIsSubmitted(true);
      addToast({
        type: 'success',
        title: 'Enquiry Received!',
        message: 'Our clinical sleep diagnostic advisor will call you shortly.'
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: 'Could not send enquiry. Please call us directly at +91 98112 34567.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      mobile: '',
      city: '',
      preferredDate: '',
      testType: 'Not sure',
      message: '',
      consent: true,
      honeypot: ''
    });
    setFormErrors({});
    setIsSubmitted(false);
  };

  return (
    <div className="bg-[#F8FAFC] text-slate-800 min-h-screen">
      {/* ========================================================
          1. STICKY TOP BAR (Logo, anchor links, phone, Enquire Now)
          ======================================================== */}
      <header className="sticky top-0 z-50 bg-[#1E293B] border-b border-slate-700 text-white shadow-md">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Logo variant="dark" size="md" showTagline={false} />
            <div className="hidden md:flex flex-col border-l border-slate-700 pl-3">
              <span className="text-[11px] font-bold font-heading tracking-wider uppercase text-teal-300">
                Sleep Diagnostics
              </span>
              <span className="text-[10px] text-slate-400 font-body">
                At-Home HSAT Polysomnography
              </span>
            </div>
          </div>

          {/* Navigation Anchor Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold font-heading text-slate-300">
            <a href="#about-sleep-study" className="hover:text-teal-300 transition-colors">
              About Sleep Study
            </a>
            <a href="#level2-vs-level3" className="hover:text-teal-300 transition-colors">
              Level 2 vs Level 3
            </a>
            <a href="#how-it-works" className="hover:text-teal-300 transition-colors">
              How It Works
            </a>
            <a href="#why-choose-us" className="hover:text-teal-300 transition-colors">
              Why Choose Us
            </a>
            <a href="#faqs" className="hover:text-teal-300 transition-colors">
              FAQs
            </a>
          </nav>

          {/* Phone Helpline & Teal Enquire Now Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="tel:+919811234567"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold font-heading text-white hover:text-teal-300 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-teal-300">
                <Phone className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline">+91 98112 34567</span>
            </a>

            <button
              type="button"
              onClick={scrollToForm}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold font-heading text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              Enquire Now
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          2. HERO SECTION & 3. ENQUIRY FORM
          (Snoring couple photo left, floating callback card right)
          ======================================================== */}
      <section className="relative bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white pt-8 pb-12 sm:pt-12 sm:pb-16 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#0F766E]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Hero Visual & Text */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-teal-300 text-xs font-bold font-heading">
                <Moon className="w-3.5 h-3.5" />
                <span>Pan-India At-Home Diagnostics</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold font-heading tracking-tight leading-tight">
                Sleep Study at Home — <br />
                <span className="text-teal-300">Diagnose Sleep Apnea in Bed</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 font-body leading-relaxed max-w-xl">
                Wake up feeling refreshed. Skip noisy overnight hospital stays with our certified doorstep Level 2 &amp; Level 3 sleep apnea test. Conducted by trained somnology technicians and verified by senior Pulmonologists.
              </p>

              {/* Photo Showcase: Snoring couple in bed */}
              <div className="relative w-full aspect-16/9 sm:aspect-16/10 rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-white/5">
                <Image
                  src="/images/snoring_couple_hero_1793803355221.jpg"
                  alt="Couple experiencing snoring and sleep apnea disturbance"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 700px"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 text-xs font-body text-slate-200">
                  <span className="font-bold text-white font-heading">Loud Snoring or Daytime Exhaustion?</span> Get tested in the comfort of your own bed.
                </div>
              </div>

              {/* 3 Value Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-body">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Doorstep technician setup</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <Stethoscope className="w-4 h-4 text-teal-300 shrink-0" />
                  <span>Doctor-verified reports</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <Clock className="w-4 h-4 text-cyan-300 shrink-0" />
                  <span>24–48 hr fast results</span>
                </div>
              </div>
            </div>

            {/* Right Column: Floating Callback Form (matching screenshot) */}
            <div className="lg:col-span-5" id="enquiry-form" ref={formRef}>
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-800 border-2 border-[#0F766E]/30 relative overflow-hidden">
                {/* Teal Top Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-[#0F766E]" />

                {/* Form Heading */}
                <div className="mb-4">
                  <h3 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 leading-tight">
                    Get a CALLBACK from our Sleep Advisor
                  </h3>
                  <p className="text-xs text-slate-500 font-body mt-1">
                    Free diagnostic consultation. No upfront booking fee or credit card required.
                  </p>
                </div>

                {isSubmitted ? (
                  /* Thank-you state */
                  <div className="py-6 px-4 text-center space-y-4 bg-teal-50/70 rounded-2xl border border-teal-200">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-heading">
                        Enquiry ID: <span className="font-mono text-slate-900">{submittedId}</span>
                      </span>
                      <h4 className="text-lg font-bold font-heading text-slate-900 mt-1">
                        Thank You, {formData.fullName}!
                      </h4>
                      <p className="text-xs text-slate-600 font-body leading-relaxed mt-1">
                        Our senior clinical sleep coordinator will call you at <strong className="text-slate-900">+91 {formData.mobile}</strong> within 30 minutes to confirm your preferred test date.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <a
                        href="tel:+919811234567"
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#1E293B] hover:bg-slate-900 text-white text-xs font-bold font-heading flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-teal-300" />
                        <span>Call Advisor</span>
                      </a>
                      <a
                        href="https://wa.me/919811234567?text=Hi%20Buy%20Denmed,%20I%20submitted%20sleep%20test%20enquiry"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold font-heading flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-[11px] font-semibold text-[#0F766E] hover:underline font-heading inline-block pt-1"
                    >
                      ← Submit another patient enquiry
                    </button>
                  </div>
                ) : (
                  /* Active Form */
                  <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                    {/* Honeypot Spam Protection Field */}
                    <div className="sr-only" aria-hidden="true" style={{ display: 'none' }}>
                      <input
                        type="text"
                        name="honeypot"
                        tabIndex={-1}
                        autoComplete="off"
                        value={formData.honeypot}
                        onChange={handleInputChange}
                      />
                    </div>

                    {/* Field 1: Full Name */}
                    <div>
                      <label className="text-xs font-bold font-heading text-slate-700 block mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Enter patient full name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-body rounded-xl border bg-slate-50 focus:bg-white transition-colors focus:outline-none ${
                          formErrors.fullName ? 'border-red-500' : 'border-slate-200 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]'
                        }`}
                      />
                      {formErrors.fullName && (
                        <p className="text-[10px] text-red-500 mt-1">{formErrors.fullName}</p>
                      )}
                    </div>

                    {/* Field 2 & 3: Mobile & City */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold font-heading text-slate-700 block mb-1">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold font-heading text-slate-400">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            name="mobile"
                            placeholder="10-digit number"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            className={`w-full pl-11 pr-3 py-2.5 text-xs sm:text-sm font-body rounded-xl border bg-slate-50 focus:bg-white transition-colors focus:outline-none ${
                              formErrors.mobile ? 'border-red-500' : 'border-slate-200 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]'
                            }`}
                          />
                        </div>
                        {formErrors.mobile && (
                          <p className="text-[10px] text-red-500 mt-1">{formErrors.mobile}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold font-heading text-slate-700 block mb-1">
                          City / Location <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          placeholder="e.g. Mumbai, Delhi NCR"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-body rounded-xl border bg-slate-50 focus:bg-white transition-colors focus:outline-none ${
                            formErrors.city ? 'border-red-500' : 'border-slate-200 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]'
                          }`}
                        />
                        {formErrors.city && (
                          <p className="text-[10px] text-red-500 mt-1">{formErrors.city}</p>
                        )}
                      </div>
                    </div>

                    {/* Field 4: Preferred Test Date & Test Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold font-heading text-slate-700 block mb-1">
                          Preferred Date <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="date"
                          name="preferredDate"
                          value={formData.preferredDate}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2.5 text-xs font-body rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0F766E] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold font-heading text-slate-700 block mb-1">
                          Test Type
                        </label>
                        <select
                          name="testType"
                          value={formData.testType}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2.5 text-xs font-body rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0F766E] focus:outline-none"
                        >
                          <option value="Not sure">Not sure (Advisor will recommend)</option>
                          <option value="Level 2">Level 2 (Comprehensive 16-channel)</option>
                          <option value="Level 3">Level 3 (Cardiorespiratory 7-channel)</option>
                        </select>
                      </div>
                    </div>

                    {/* Field 5: Message */}
                    <div>
                      <label className="text-xs font-bold font-heading text-slate-700 flex items-center justify-between mb-1">
                        <span>Message / Symptoms</span>
                        <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                      </label>
                      <textarea
                        rows={2}
                        name="message"
                        placeholder="Mention symptoms like snoring, choking, daytime tiredness..."
                        value={formData.message}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-xs font-body rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0F766E] focus:outline-none resize-none"
                      />
                    </div>

                    {/* Field 6: Consent Checkbox */}
                    <div>
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          name="consent"
                          checked={formData.consent}
                          onChange={handleInputChange}
                          className="mt-0.5 w-4 h-4 rounded text-[#0F766E] focus:ring-[#0F766E] border-slate-300 cursor-pointer"
                        />
                        <span className="text-[11px] text-slate-600 font-body leading-tight">
                          I authorise Buy Denmed representative to contact/WhatsApp me. <span className="text-red-500">*</span>
                        </span>
                      </label>
                      {formErrors.consent && (
                        <p className="text-[10px] text-red-500 mt-1">{formErrors.consent}</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5F58] disabled:opacity-60 text-white font-bold font-heading text-xs sm:text-sm shadow-lg shadow-teal-950/20 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting Request...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Callback Request</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Or Call Helpline */}
                    <div className="pt-1 text-center">
                      <span className="text-xs text-slate-400 font-body">or</span>
                      <div className="mt-1">
                        <a
                          href="tel:+919811234567"
                          className="inline-flex items-center gap-1.5 text-xs font-bold font-heading text-slate-700 hover:text-[#0F766E] transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#0F766E]" />
                          <span>Call: +91 98112 34567</span>
                        </a>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Rounded White Pill below hero photo matching screenshot */}
          <div className="mt-8 text-center">
            <div className="inline-block bg-white text-slate-800 px-6 sm:px-10 py-3 rounded-full shadow-lg border border-slate-200">
              <h2 className="text-base sm:text-xl font-bold font-heading text-slate-900">
                Sleep Study in The Comfort of Your Home
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-body mt-3 font-medium">
              Buy Denmed Performs Level-II &amp; Level-III Sleep Studies At Home
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. SYMPTOMS SECTION ("Do you have these symptoms?")
          ======================================================== */}
      <section className="py-12 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] bg-[#E6F4F3] px-2.5 py-1 rounded-full border border-[#0F766E]/20 font-heading inline-block">
              Self-Assessment
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">
              Do You Have These Symptoms?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-body leading-relaxed">
              Obstructive Sleep Apnea often remains undetected. Click any symptoms you or your partner experience to check your risk.
            </p>
          </div>

          {/* 6 Symptom Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SYMPTOMS_DATA.map((symptom) => {
              const Icon = symptom.icon;
              const isSelected = selectedSymptoms.includes(symptom.id);

              return (
                <div
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id, symptom.title)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#0F766E] bg-[#E6F4F3]/60 shadow-md ring-2 ring-[#0F766E]/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-[#0F766E] text-white' : 'bg-teal-50 text-[#0F766E]'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-heading ${
                        isSelected ? 'bg-[#0F766E] text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {symptom.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 font-heading flex items-center justify-between">
                        <span>{symptom.title}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#0F766E]" />}
                      </h3>
                      <p className="text-xs text-slate-500 font-body mt-1 leading-relaxed">
                        {symptom.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-heading">
                    <span className={isSelected ? 'text-[#0F766E] font-bold' : 'text-slate-400'}>
                      {isSelected ? '✓ Symptom added' : '+ Tap to select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assessment Prompt */}
          {selectedSymptoms.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#1E293B] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold font-heading text-teal-300">
                  {selectedSymptoms.length} Symptom{selectedSymptoms.length > 1 ? 's' : ''} Selected
                </div>
                <div className="text-sm font-semibold font-heading mt-0.5">
                  High indication for home sleep testing. Our pulmonologist advisor can review your case.
                </div>
              </div>
              <button
                type="button"
                onClick={handlePreFillSymptoms}
                className="px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5F58] text-white text-xs font-bold font-heading shrink-0 shadow-md transition-all active:scale-95"
              >
                Pre-Fill In Enquiry Form →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          5. LEVEL 3 VS LEVEL 2 COMPARISON TABLE
          (Matching screenshot: Left table, Right doctor with thumbs up)
          ======================================================== */}
      <section id="level2-vs-level3" className="py-12 sm:py-16 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] bg-[#E6F4F3] px-2.5 py-1 rounded-full border border-[#0F766E]/20 font-heading inline-block mb-1">
              Diagnostic Modalities
            </span>
            <h2 className="text-xl sm:text-3xl font-bold text-slate-900 font-heading">
              We Perform Level-II &amp; Level-III Sleep Studies At Home
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-body mt-1.5">
              Comprehensive clinical evaluation matching hospital lab standards with zero room-stay fee
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Table on left (7 columns) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#1E293B] text-white border-b border-slate-700">
                      <th className="py-3 px-4 font-bold font-heading text-xs w-1/2">
                        Parameter
                      </th>
                      <th className="py-3 px-4 font-bold font-heading text-xs text-center border-l border-slate-700 w-1/4">
                        Level - 3
                      </th>
                      <th className="py-3 px-4 font-bold font-heading text-xs text-center border-l border-slate-700 w-1/4">
                        Level - 2
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_TABLE.map((section, sIdx) => (
                      <React.Fragment key={sIdx}>
                        {/* Section row header */}
                        <tr className="bg-slate-100 border-y border-slate-200">
                          <td colSpan={3} className="py-1.5 px-4 font-bold font-heading text-[11px] text-slate-700 uppercase tracking-wider">
                            {section.category}
                          </td>
                        </tr>
                        {section.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-4 font-body text-xs text-slate-800 font-medium">
                              {row.label}
                            </td>
                            <td className="py-2.5 px-4 text-center border-l border-slate-100">
                              {row.level3 ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
                                  <X className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-center border-l border-slate-100">
                              {row.level2 ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
                                  <X className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Advisor CTA */}
              <div className="p-3.5 bg-teal-50/60 border-t border-teal-100 flex items-center justify-between text-xs">
                <span className="font-body text-slate-700">
                  Unsure which test is recommended for your symptoms?
                </span>
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold font-heading rounded-lg transition-colors"
                >
                  Speak to Advisor
                </button>
              </div>
            </div>

            {/* Doctor with Thumbs Up photo on right (5 columns) matching screenshot */}
            <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white flex flex-col">
              <div className="relative w-full h-72 sm:h-80 lg:flex-1 min-h-[300px]">
                <Image
                  src="/images/doctor_thumbs_up_1793803357466.jpg"
                  alt="Doctor verifying home sleep test diagnostic reports"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 450px"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[#0F766E]" />
                  <span className="font-heading font-bold text-xs text-slate-900">
                    Doctor-Verified Interpretation
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-body mt-1 leading-relaxed">
                  Every home test is scored by clinical somnologists and verified by senior Pulmonologists with detailed AHI &amp; oxygen desaturation index.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. ABOUT SLEEP STUDY (Matching screenshot 1793802593012)
          Left: Overview & Types bullets, Right: Sticky callback card
          ======================================================== */}
      <section id="about-sleep-study" className="py-12 sm:py-16 bg-white border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Content (7 columns) */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">
                About Sleep Study
              </h2>

              <div className="space-y-3 font-body text-xs sm:text-sm text-gray-600 leading-relaxed">
                <h3 className="font-heading font-bold text-base text-gray-900">
                  An Overview
                </h3>
                <p>
                  Sleep study tests, formally known as polysomnography, are diagnostic tests used to evaluate and diagnose sleep disorders. Conducted typically in a sleep lab or at home, these tests record various physiological activities during sleep.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Types of Sleep Study Tests
                </h3>
                <ul className="space-y-3 font-body text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#0F766E] mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-slate-900 font-heading">Standard Polysomnography (PSG):</strong> Conducted in a sleep lab or at home with comprehensive multi-channel monitoring including brain waves (EEG), heart rate, breathing, oxygen levels, and leg movements.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#0F766E] mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-slate-900 font-heading">Home Sleep Apnea Testing (HSAT):</strong> Designed primarily to diagnose Obstructive Sleep Apnea (OSA). This test is performed comfortably in your own bedroom and is highly convenient for patients.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#0F766E] mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-slate-900 font-heading">Multiple Sleep Latency Test (MSLT):</strong> Conducted to measure how quickly a person falls asleep in quiet daytime conditions, used to evaluate narcolepsy and excessive daytime sleepiness.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#0F766E] mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-slate-900 font-heading">Maintenance of Wakefulness Test (MWT):</strong> Assesses how well a person can stay awake in a quiet environment, often used to evaluate treatment effectiveness.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Side: Quick callback card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-teal-50/50 to-white rounded-3xl p-6 sm:p-7 border border-teal-200/80 shadow-md">
              <h3 className="text-lg sm:text-xl font-bold font-heading text-slate-900 mb-1">
                Have Questions About Sleep Studies?
              </h3>
              <p className="text-xs text-slate-500 font-body mb-4">
                Our certified medical coordinators are available 24x7 to assist you.
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="w-full py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold font-heading text-xs sm:text-sm rounded-xl shadow-md transition-colors"
                >
                  Schedule Free Advisor Call
                </button>
                <a
                  href="tel:+919811234567"
                  className="w-full py-2.5 bg-white border border-slate-200 hover:border-[#0F766E] text-slate-800 font-semibold font-heading text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#0F766E]" />
                  <span>Call: +91 98112 34567</span>
                </a>
              </div>

              <div className="mt-4 pt-4 border-t border-teal-100 flex items-center gap-3 text-xs text-slate-500 font-body">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Confidential • HIPAA/DISHA Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. HOW IT WORKS (4 Hexagon Cards in Row matching screenshot 1793802440819)
          ======================================================== */}
      <section id="how-it-works" className="py-12 sm:py-16 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 font-heading">
              How It Works?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-body">
              Simple 4-step doorstep diagnostic journey from initial call to doctor-signed report
            </p>
          </div>

          {/* 4 Hexagonal process cards in a row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {[
              {
                step: '1',
                text: 'Call us or leave your number on the callback form'
              },
              {
                step: '2',
                text: 'Our representative calls you at the earliest to discuss symptoms'
              },
              {
                step: '3',
                text: 'Service confirmation and doorstep delivery by patient care co-ordinator'
              },
              {
                step: '4',
                text: 'Your journey towards recovery begins with doctor-verified report'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="relative bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center pt-10"
              >
                {/* Floating Hexagon Step Badge on top */}
                <div className="absolute -top-5 w-12 h-12 bg-[#1E293B] text-white clip-hexagon flex items-center justify-center font-heading font-bold text-base shadow-md border-2 border-white">
                  <span className="text-teal-300">{item.step}</span>
                </div>

                {/* Inner stylized gradient card */}
                <div className="w-full h-full min-h-[140px] rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white p-5 flex items-center justify-center">
                  <p className="font-heading font-medium text-xs sm:text-sm leading-relaxed text-slate-100">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          8. TECHNICIAN AT HOME SECTION
          (Photo of technician setting up device at home + 3 bullets)
          ======================================================== */}
      <section className="py-12 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Technician image on left */}
            <div className="lg:col-span-6 relative aspect-16/10 sm:aspect-4/3 rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-50">
              <Image
                src="/images/technician_setup_home_1793803357959.jpg"
                alt="Certified somnology technician setting up sleep test equipment at home"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 600px"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Bullets on right */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] bg-[#E6F4F3] px-2.5 py-1 rounded-full border border-[#0F766E]/20 font-heading inline-block">
                Doorstep Care
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">
                Home Setup by Trained Technicians
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-body leading-relaxed">
                Our technicians are hospital-trained biomedical somnologists who arrive in uniform, adhere to stringent sanitization protocols, and respect your privacy.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900">
                      Gentle &amp; Painless Hookup
                    </h4>
                    <p className="text-xs text-slate-500 font-body leading-relaxed mt-0.5">
                      Sensors are applied using hypoallergenic, non-irritating medical adhesive tape for effortless, irritation-free sleep.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900">
                      100% Sanitized &amp; Sterilized Hardware
                    </h4>
                    <p className="text-xs text-slate-500 font-body leading-relaxed mt-0.5">
                      Units, effort belts, and sensor cannulas undergo hospital-grade UV-C and clinical autoclave sterilization.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900">
                      Next-Morning Collection &amp; 24-48 Hr Report
                    </h4>
                    <p className="text-xs text-slate-500 font-body leading-relaxed mt-0.5">
                      Technician retrieves device at your convenient morning hour. Data is scored and validated by our Pulmonologist.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          9. WHY CHOOSE US (6 Icon Cards)
          ======================================================== */}
      <section id="why-choose-us" className="py-12 sm:py-16 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] bg-[#E6F4F3] px-2.5 py-1 rounded-full border border-[#0F766E]/20 font-heading inline-block">
              Clinical Excellence
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">
              Why Choose Buy Denmed for Sleep Study?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-body">
              Combining precision diagnostic instrumentation with patient-centered comfort
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Certified Somnology Technicians',
                desc: 'Trained medical professionals who carry out respectful, gentle doorstep device setup.',
                icon: User
              },
              {
                title: 'Doctor-Verified Diagnostic Reports',
                desc: 'Evaluated and signed by board-certified Pulmonologists & Sleep Medicine specialists.',
                icon: Stethoscope
              },
              {
                title: 'Rapid 24–48 Hour Turnaround',
                desc: 'Comprehensive AHI and oxygen desaturation index delivered directly to WhatsApp & email.',
                icon: Clock
              },
              {
                title: 'AASM-Compliant Diagnostic Devices',
                desc: 'Hardware matching premier hospital lab standards from certified global manufacturers.',
                icon: Award
              },
              {
                title: 'Hospital-Grade Sterilization',
                desc: 'All sensors and recording units are UV-C disinfected and autoclaved prior to each visit.',
                icon: ShieldCheck
              },
              {
                title: 'Post-Report CPAP Guidance',
                desc: 'Optional titration trials and rental units if therapy is prescribed by your doctor.',
                icon: Zap
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-slate-900">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-body mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          10. TEAL REPEAT CTA BAND ("Sleep Better Starting Tonight")
          ======================================================== */}
      <section className="py-12 sm:py-14 bg-[#0F766E] text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl font-bold font-heading text-white">
                Sleep Better Starting Tonight
              </h2>
              <p className="text-xs sm:text-sm text-teal-100 font-body max-w-xl">
                Take the first step towards healthy restorative sleep. Our sleep care advisors will answer all your questions and coordinate doorstep setup.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <button
                type="button"
                onClick={scrollToForm}
                className="px-6 py-3 rounded-xl bg-[#1E293B] hover:bg-slate-900 text-white font-bold font-heading text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                Enquire Now
              </button>
              <a
                href="tel:+919811234567"
                className="px-5 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-50 font-bold font-heading text-xs sm:text-sm shadow-md transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-[#0F766E]" />
                <span>Call: +91 98112 34567</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          11. FAQS ACCORDION (6 Questions with FAQPage JSON-LD)
          ======================================================== */}
      <section id="faqs" className="py-12 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] bg-[#E6F4F3] px-2.5 py-1 rounded-full border border-[#0F766E]/20 font-heading inline-block">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">
              Common Questions About Home Sleep Study
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS_DATA.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;

              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isOpen ? 'border-[#0F766E] bg-teal-50/30' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 font-bold font-heading text-xs sm:text-sm text-slate-900 focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <span className="shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-slate-600 font-body leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          12. MINIMAL FOOTER (Logo, phone, email, address, links)
          ======================================================== */}
      <footer className="bg-[#1E293B] text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <Logo variant="dark" size="md" showTagline={false} />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold font-heading text-slate-300">
              <Link href="/" className="hover:text-teal-300 transition-colors">
                Home Store
              </Link>
              <Link href="/rent" className="hover:text-teal-300 transition-colors">
                Equipment Rental
              </Link>
              <Link href="/category/respiratory-care" className="hover:text-teal-300 transition-colors">
                Respiratory Care
              </Link>
              <Link href="/contact" className="hover:text-teal-300 transition-colors">
                Contact
              </Link>
              <Link href="/policies/privacy-policy" className="hover:text-teal-300 transition-colors">
                Privacy Policy
              </Link>
            </div>

            <div className="text-xs text-center md:text-right font-body">
              <div className="font-bold text-white font-heading">Sleep Helpline</div>
              <div>+91 98112 34567 • care@buydenmed.com</div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-body text-center space-y-1">
            <p>
              <strong>Medical Disclaimer:</strong> Home Sleep Apnea Testing (HSAT) is a clinical diagnostic screening aid. Reports are analyzed and interpreted by certified physicians.
            </p>
            <p>
              © 2026 Buy Denmed Healthcare Pvt. Ltd. Pan-India At-Home Diagnostics.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Bar (Call & Enquire) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-3 shadow-lg flex items-center gap-2.5">
        <a
          href="tel:+919811234567"
          className="flex-1 py-3 bg-[#1E293B] text-white font-bold font-heading text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
        >
          <Phone className="w-3.5 h-3.5 text-teal-300" />
          <span>Call Advisor</span>
        </a>
        <button
          type="button"
          onClick={scrollToForm}
          className="flex-1 py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold font-heading text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95"
        >
          <span>Enquire Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default SleepTestLanding;
