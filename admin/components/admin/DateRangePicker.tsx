import React from 'react';
import { Calendar } from 'lucide-react';
import type { DateRangePreset, DateRangeValue } from '@/types/admin';

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

const PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'custom', label: 'Custom' },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const selectPreset = (preset: DateRangePreset) => {
    const today = new Date('2026-11-17');
    const to = today.toISOString().slice(0, 10);
    const fromDate = new Date(today);
    if (preset === '7d') fromDate.setDate(today.getDate() - 6);
    if (preset === '30d') fromDate.setDate(today.getDate() - 29);

    onChange({
      preset,
      from: preset === 'custom' ? value.from : fromDate.toISOString().slice(0, 10),
      to: preset === 'custom' ? value.to : to,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center rounded-lg border border-[#DCE6F2] bg-white p-1">
        {PRESETS.map((p) => {
          const active = value.preset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => selectPreset(p.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#1D5FAF] text-white'
                  : 'text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {value.preset === 'custom' && (
        <div className="flex items-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs">
          <Calendar className="h-3.5 w-3.5 text-[#5B6B82] shrink-0" />
          <input
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="text-xs text-[#12263F] focus:outline-none tabular-nums"
            aria-label="From date"
          />
          <span className="text-[#5B6B82]">to</span>
          <input
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="text-xs text-[#12263F] focus:outline-none tabular-nums"
            aria-label="To date"
          />
        </div>
      )}
    </div>
  );
}
