'use client';

import React, { useState } from 'react';
import { submitBulkEnquiry } from '@/lib/api';
import { useToastStore } from '@/lib/store';
import { Building2, FileText, CheckCircle2, ShieldCheck, Phone, Mail, ArrowRight } from 'lucide-react';

export default function BulkEnquiryPage() {
  const { addToast } = useToastStore();
  const [formData, setFormData] = useState({
    name: 'Dr. Vikram Malhotra',
    organizationName: 'Malhotra Multi-Speciality Clinic',
    email: 'dr.vikram@malhotraclinic.com',
    phone: '9811234567',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    equipmentRequired: ['Dental Chairs & Units', 'Class B Autoclaves'],
    estimatedBudget: '₹5,00,000 - ₹15,00,000',
    timeline: 'Within 2-4 Weeks',
    message: 'Looking for a package quote for 2 Confident dental chairs, 1 Euronda Class B autoclave, and 5 boxes of 3M composites with GST tax invoice.'
  });

  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const equipmentOptions = [
    'Dental Chairs & Units',
    'Oil-Free Air Compressors',
    'High Speed Turbines & Micromotors',
    'Class B Autoclaves & Sterilizers',
    'Digital RVG Sensors & Handheld X-Ray',
    'Oxygen Concentrators (5L / 10L)',
    'CPAP / BiPAP Medical Ventilators',
    'Multi-Parameter Patient Monitors',
    'Dental Consumables (Composites, Cements, Files)',
    'Motorized Hospital Beds & Wheelchairs'
  ];

  const toggleEquipment = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      equipmentRequired: prev.equipmentRequired.includes(item)
        ? prev.equipmentRequired.filter((e) => e !== item)
        : [...prev.equipmentRequired, item]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await submitBulkEnquiry(formData);
      if (res.success) {
        setSubmittedId(res.enquiryId);
        addToast({
          type: 'success',
          title: 'Bulk Inquiry Submitted',
          message: res.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-[#2B2B2B] text-white p-8 rounded-3xl shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Building2 className="w-3.5 h-3.5" />
          <span>Institutional & Hospital B2B Procurement Desk</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          Request Wholesale Equipment Quotation
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl">
          Equipping a new dental clinic, hospital ICU ward, or expansion wing? Get direct institutional distributor pricing, custom payment milestones, free engineer site inspection, and comprehensive AMC contracts.
        </p>
      </div>

      {submittedId ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Quotation Request Registered #{submittedId}</h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
            Our Senior Biomedical Procurement Specialist has received your equipment list. You will receive an official proforma invoice and wholesale quote on <strong>{formData.email}</strong> within 2 hours.
          </p>
          <div className="pt-4">
            <button
              onClick={() => setSubmittedId(null)}
              className="px-6 py-2.5 bg-[#FF6B00] text-white text-xs font-bold rounded-xl"
            >
              Submit Another Inquiry
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Contact Details */}
          <div>
            <h3 className="font-bold text-sm text-gray-900 mb-3 border-b border-gray-100 pb-2">
              1. Institutional / Clinic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Doctor / Contact Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Hospital / Clinic Legal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Mobile Number (India) *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
            </div>
          </div>

          {/* Location & Budget */}
          <div>
            <h3 className="font-bold text-sm text-gray-900 mb-3 border-b border-gray-100 pb-2">
              2. Location & Procurement Scope
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">State</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Estimated Budget</label>
                <select
                  value={formData.estimatedBudget}
                  onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl"
                >
                  <option>₹1,00,000 - ₹5,00,000</option>
                  <option>₹5,00,000 - ₹15,00,000</option>
                  <option>₹15,00,000 - ₹50,00,000</option>
                  <option>Above ₹50,00,000 (Turnkey Project)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Equipment Checklist */}
          <div>
            <h3 className="font-bold text-sm text-gray-900 mb-3 border-b border-gray-100 pb-2">
              3. Categories Required (Select All That Apply)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {equipmentOptions.map((item) => (
                <label
                  key={item}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    formData.equipmentRequired.includes(item)
                      ? 'border-[#FF6B00] bg-orange-50/50 text-[#FF6B00] font-bold'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.equipmentRequired.includes(item)}
                    onChange={() => toggleEquipment(item)}
                    className="w-4 h-4 text-[#FF6B00] rounded"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Specific Requirements Box */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Detailed Specifications / Model Preferences / Quantities
            </label>
            <textarea
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full text-xs p-3.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6B00]"
              placeholder="List specific brands or quantities required..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#FF6B00] hover:bg-[#E65D00] text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
          >
            {loading ? 'Submitting...' : 'Submit Wholesale Quotation Request'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
