import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import type { OrderStatusSlice, SalesTrendPoint, StateOrderSlice, TopSellingProduct } from '@/types/admin';
import { formatINR } from '@/lib/api/admin/client';
import { SafeImage } from './SafeImage';

export function SalesTrendLineChart({ data }: { data: SalesTrendPoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) return null;

  const width = 640;
  const height = 240;
  const padLeft = 58;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 34;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const maxVal = Math.max(...data.map((d) => Math.max(d.sales, d.rentalRevenue)), 10000);

  const getX = (i: number) =>
    data.length === 1 ? padLeft + chartW / 2 : padLeft + (i / (data.length - 1)) * chartW;
  const getY = (val: number) => padTop + chartH - (val / maxVal) * chartH;

  const salesPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.sales).toFixed(1)}`)
    .join(' ');
  const rentalPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.rentalRevenue).toFixed(1)}`)
    .join(' ');

  const areaPath = `${salesPath} L ${getX(data.length - 1).toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${getX(0).toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`;

  const gridTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="rounded-xl border border-[#DCE6F2] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-[#12263F]">Sales &amp; Rental Trend</h3>
          <p className="text-xs text-[#5B6B82]">Equipment sales vs recurring rental revenue</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-[#12263F]">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#1D5FAF]" />
            Product Sales
          </span>
          <span className="flex items-center gap-1.5 text-[#5B6B82]">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#0B2545]" />
            Rental Revenue
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-60 overflow-visible">
          <defs>
            <linearGradient id="bdmSalesArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1D5FAF" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#1D5FAF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {gridTicks.map((t) => {
            const y = padTop + chartH * (1 - t);
            const val = Math.round(maxVal * t);
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#DCE6F2"
                  strokeDasharray={t === 0 ? undefined : '3 3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#5B6B82] text-[10px] tabular-nums"
                >
                  {val >= 100000
                    ? `₹${(val / 100000).toFixed(1)}L`
                    : val >= 1000
                      ? `₹${Math.round(val / 1000)}k`
                      : `₹${val}`}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#bdmSalesArea)" />
          <path d={salesPath} fill="none" stroke="#1D5FAF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={rentalPath} fill="none" stroke="#0B2545" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />

          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.sales);
            const ry = getY(d.rentalRevenue);
            const isHovered = hoveredIdx === i;
            return (
              <g key={d.date}>
                <text
                  x={cx}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-[#5B6B82] text-[10px]"
                >
                  {d.label}
                </text>
                {isHovered && (
                  <line
                    x1={cx}
                    y1={padTop}
                    x2={cx}
                    y2={padTop + chartH}
                    stroke="#1D5FAF"
                    strokeOpacity="0.3"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5 : 3.5}
                  fill="#1D5FAF"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <circle
                  cx={cx}
                  cy={ry}
                  r={isHovered ? 4.5 : 3}
                  fill="#0B2545"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <rect
                  x={cx - chartW / data.length / 2}
                  y={padTop}
                  width={chartW / data.length}
                  height={chartH + 24}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer"
                />
              </g>
            );
          })}
        </svg>

        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] px-3.5 py-2 text-xs tabular-nums">
            <span className="font-semibold text-[#12263F]">{data[hoveredIdx].label}</span>
            <div className="flex items-center gap-4">
              <span className="text-[#1D5FAF] font-medium">
                Sales: {formatINR(data[hoveredIdx].sales)}
              </span>
              <span className="text-[#0B2545] font-medium">
                Rentals: {formatINR(data[hoveredIdx].rentalRevenue)}
              </span>
              <span className="text-[#5B6B82]">
                {data[hoveredIdx].orders} orders
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function OrdersStatusDonutChart({ slices }: { slices: OrderStatusSlice[] }) {
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const total = slices.reduce((acc, s) => acc + s.count, 0) || 1;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 flex flex-col justify-between">
      <div>
        <h3 className="text-base font-semibold text-[#12263F]">Orders by Status</h3>
        <p className="text-xs text-[#5B6B82]">Current fulfillment distribution</p>
      </div>

      <div className="my-4 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative h-40 w-40 shrink-0">
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
            {slices.map((slice) => {
              const pct = slice.count / total;
              const dashLength = pct * circumference;
              const dashOffset = -cumulativePercent * circumference;
              cumulativePercent += pct;
              const isHighlighted = !activeStatus || activeStatus === slice.status;

              return (
                <circle
                  key={slice.status}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={activeStatus === slice.status ? 22 : 18}
                  strokeDasharray={`${dashLength} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  opacity={isHighlighted ? 1 : 0.3}
                  onMouseEnter={() => setActiveStatus(slice.status)}
                  onMouseLeave={() => setActiveStatus(null)}
                  className="cursor-pointer transition-all duration-150"
                />
              );
            })}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-[#12263F] tabular-nums">{total}</span>
            <span className="text-[11px] text-[#5B6B82]">Total Orders</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2">
          {slices.map((s) => {
            const pct = Math.round((s.count / total) * 100);
            return (
              <div
                key={s.status}
                onMouseEnter={() => setActiveStatus(s.status)}
                onMouseLeave={() => setActiveStatus(null)}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs hover:bg-[#F6F9FD] cursor-pointer"
              >
                <span className="flex items-center gap-2 text-[#12263F] font-medium">
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.label}
                </span>
                <span className="text-[#5B6B82] tabular-nums">
                  <strong className="text-[#12263F]">{s.count}</strong> ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function TopSellingProductsChart({ products }: { products: TopSellingProduct[] }) {
  const maxRevenue = Math.max(...products.map((p) => p.revenue), 1);

  return (
    <div className="rounded-xl border border-[#DCE6F2] bg-white p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#12263F]">Top 5 Selling Products</h3>
        <p className="text-xs text-[#5B6B82]">Ranked by gross revenue in selected period</p>
      </div>

      <div className="space-y-3.5">
        {products.map((p) => {
          const widthPct = Math.max(8, Math.round((p.revenue / maxRevenue) * 100));
          return (
            <div key={p.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md border border-[#DCE6F2] bg-[#F6F9FD]">
                    <SafeImage src={p.imageUrl} alt={p.name} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#12263F] truncate">{p.name}</p>
                    <p className="text-[11px] font-mono text-[#5B6B82]">{p.sku}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 tabular-nums">
                  <p className="text-xs font-semibold text-[#12263F]">{formatINR(p.revenue)}</p>
                  <p className="text-[11px] text-[#5B6B82]">{p.unitsSold} units</p>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-[#EAF2FC] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1D5FAF] transition-all duration-300"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OrdersByStateChart({
  orderStates = [],
  rentalStates = [],
  states, // backward compatibility
}: {
  orderStates?: StateOrderSlice[];
  rentalStates?: StateOrderSlice[];
  states?: StateOrderSlice[];
}) {
  const [tab, setTab] = useState<'orders' | 'rentals'>('orders');
  const actualOrderStates = orderStates.length > 0 ? orderStates : states || [];
  const activeList = tab === 'orders' ? actualOrderStates : rentalStates;
  const maxCount = Math.max(...activeList.map((s) => s.ordersCount), 1);
  const totalCount = activeList.reduce((acc, s) => acc + s.ordersCount, 0);

  return (
    <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#12263F]">
              {tab === 'orders' ? 'Orders by State' : 'Rentals by State'}
            </h3>
            <p className="text-xs text-[#5B6B82]">
              {tab === 'orders'
                ? 'Geographical product orders across India'
                : 'Equipment rental deployment across India'}
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] p-1">
            <button
              type="button"
              onClick={() => setTab('orders')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                tab === 'orders'
                  ? 'bg-[#1D5FAF] text-white shadow-xs'
                  : 'text-[#5B6B82] hover:text-[#12263F] hover:bg-[#EAF2FC]/50'
              }`}
            >
              Orders ({actualOrderStates.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('rentals')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                tab === 'rentals'
                  ? 'bg-[#1D5FAF] text-white shadow-xs'
                  : 'text-[#5B6B82] hover:text-[#12263F] hover:bg-[#EAF2FC]/50'
              }`}
            >
              Rentals ({rentalStates.length})
            </button>
          </div>
        </div>

        {activeList.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center text-[#5B6B82]">
            <MapPin className="h-8 w-8 text-[#8A97A8] mb-2 stroke-[1.5]" />
            <p className="text-xs font-medium">
              {tab === 'orders' ? 'No state order delivery data yet' : 'No state rental deployment data yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {activeList.slice(0, 6).map((item, idx) => {
              const widthPct = Math.max(8, Math.round((item.ordersCount / maxCount) * 100));
              const barColors = [
                'bg-[#1D5FAF]', // Primary Blue
                'bg-[#0B2545]', // Navy
                'bg-[#F28C38]', // Accent Amber
                'bg-[#10B981]', // Emerald
                'bg-[#8B5CF6]', // Purple
                'bg-[#64748B]', // Slate
              ];
              const barColor = barColors[idx % barColors.length];

              return (
                <div key={item.state} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-3.5 w-3.5 text-[#1D5FAF] shrink-0" />
                      <span className="text-xs font-semibold text-[#12263F] truncate">{item.state}</span>
                    </div>
                    <div className="text-right shrink-0 tabular-nums flex items-center gap-2">
                      <span className="text-xs font-bold text-[#12263F]">
                        {item.ordersCount} {tab === 'orders' ? (item.ordersCount === 1 ? 'order' : 'orders') : (item.ordersCount === 1 ? 'rental' : 'rentals')}
                      </span>
                      <span className="text-[11px] text-[#5B6B82]">({formatINR(item.revenue)})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-full rounded-full bg-[#EAF2FC] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-300`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-[#5B6B82] w-8 text-right shrink-0">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#DCE6F2] flex items-center justify-between text-[11px] text-[#5B6B82]">
        <span>
          Total {tab === 'orders' ? 'Orders' : 'Rentals'}: <strong className="text-[#12263F]">{totalCount}</strong>
        </span>
        <span className="text-[#1D5FAF] font-medium">
          {activeList.length} {activeList.length === 1 ? 'Active State' : 'Active States'}
        </span>
      </div>
    </div>
  );
}
