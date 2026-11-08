'use client';

import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export const WhatsAppButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const defaultPhone = '+919811234567'; // Buy Denmed Clinic & Medical Support Helpline
  const quickQuestions = [
    'I need a wholesale quote for dental chairs & autoclaves',
    'How do I book a Level 3 Home Sleep Apnea test?',
    'Is Philips EverFlo 5L available for immediate rental?',
    'Need help checking GST invoice input tax credit'
  ];

  const handleSend = (textToSend?: string) => {
    const finalMsg = textToSend || message || 'Hello Buy Denmed, I need medical/dental equipment assistance.';
    const encoded = encodeURIComponent(finalMsg);
    window.open(`https://wa.me/919811234567?text=${encoded}`, '_blank');
    setIsOpen(false);
    setMessage('');
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-40">
      {/* Chat Popover */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-88 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="bg-[#2B2B2B] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#16A34A] flex items-center justify-center text-white font-bold">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">Buy Denmed Clinic Support</div>
                <div className="text-[11px] text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse"></span>
                  Verified Equipment Specialist Online
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-gray-50/70 space-y-3 max-h-80 overflow-y-auto">
            <div className="bg-white p-3 rounded-xl rounded-tl-none border border-gray-100 shadow-sm text-xs text-gray-700 leading-relaxed">
              👋 Hello Doctor! How can we assist your clinic or hospital today? We provide Pan-India delivery, EMI options, and official brand warranties.
            </div>

            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider px-1">
              Quick Inquiries:
            </div>

            <div className="space-y-1.5">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="w-full text-left text-xs bg-white hover:bg-orange-50 hover:text-[#FF6B00] border border-gray-200 hover:border-[#FF6B00] p-2 rounded-lg transition-all text-gray-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input form */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your equipment requirement..."
              className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B00]"
            />
            <button
              onClick={() => handleSend()}
              className="bg-[#16A34A] hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
              title="Send to WhatsApp"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-current" />
        <span className="font-semibold text-xs hidden sm:inline-block">
          Need Advice? Chat with Us
        </span>
      </button>
    </div>
  );
};

export default WhatsAppButton;
