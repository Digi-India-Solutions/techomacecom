import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Search, UserCheck, UserPlus } from 'lucide-react';
import {
  createManualRental,
  getManualRentalOptions,
  lookupRentalCustomer,
  type CustomerLookup,
  type ManualRentalInput,
  type ManualRentalOptions,
} from '@/lib/api/admin/rentals';
import { AdminApiError, formatINR } from '@/lib/api/admin/client';
import { useToast } from '@/components/admin/ToastProvider';
import { SafeImage } from '@/components/admin/SafeImage';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';

const card = 'rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4';
const h2 = 'text-base font-semibold text-[#12263F]';
const step = (n: number, t: string, hint?: string) => (
  <div>
    <h2 className={`${h2} flex items-center gap-2`}>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1D5FAF] text-xs font-bold text-white">{n}</span>
      {t}
    </h2>
    {hint && <p className="mt-0.5 pl-8 text-xs text-[#5B6B82]">{hint}</p>}
  </div>
);

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const UNIT = { daily: 'day', weekly: 'week', monthly: 'month' } as const;

function addPeriods(start: string, period: 'daily' | 'weekly' | 'monthly', n: number) {
  if (!start) return '';
  const d = new Date(`${start}T00:00:00`);
  if (period === 'daily') d.setDate(d.getDate() + n);
  else if (period === 'weekly') d.setDate(d.getDate() + 7 * n);
  else {
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  }
  return ymd(d);
}

type Status = 'approved' | 'active' | 'completed';

export function NewRentalPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [opts, setOpts] = useState<ManualRentalOptions | null>(null);
  const [loadError, setLoadError] = useState('');
  const [today] = useState(() => ymd(new Date()));

  // customer
  const [email, setEmail] = useState('');
  const [lookup, setLookup] = useState<CustomerLookup | null>(null);
  const [looking, setLooking] = useState(false);
  const [cust, setCust] = useState({ name: '', mobile: '', type: 'individual' });
  // equipment
  const [productId, setProductId] = useState('');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [periods, setPeriods] = useState(1);
  const [price, setPrice] = useState({ rate: 0, deposit: 0, delivery: 0 });
  const [chargeGst, setChargeGst] = useState(true);
  // status & dates
  const [status, setStatus] = useState<Status>('active');
  const [startDate, setStartDate] = useState(today);
  const [unitId, setUnitId] = useState('');
  // address
  const [addressId, setAddressId] = useState<string>('new');
  const [addr, setAddr] = useState({ type: 'home', name: '', phone: '', organisation: '', line1: '', line2: '', landmark: '', city: '', state: '', pincode: '' });
  // payment
  const [payment, setPayment] = useState<{ amount: number; method: NonNullable<ManualRentalInput['payment']>['method']; reference: string; paidOn: string }>({
    amount: 0,
    method: 'upi',
    reference: '',
    paidOn: today,
  });
  const [paymentTouched, setPaymentTouched] = useState(false);
  // completion
  const [completion, setCompletion] = useState<NonNullable<ManualRentalInput['completion']>>({
    returnedOn: today,
    condition: 'good',
    depositRefund: 0,
    refundMethod: 'bank_transfer',
    refundReference: '',
  });
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [fe, setFe] = useState<Record<string, string>>({});

  useEffect(() => {
    getManualRentalOptions()
      .then((o) => {
        setOpts(o);
        if (o.products[0]) pickProduct(o.products[0].id, o);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load products'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const product = opts?.products.find((p) => p.id === productId);
  const plan = product?.plans.find((p) => p.period === period);

  function pickProduct(id: string, o = opts) {
    const p = o?.products.find((x) => x.id === id);
    setProductId(id);
    setUnitId('');
    const pl = p?.plans.find((x) => x.period === 'monthly') || p?.plans[0];
    if (pl) pickPlan(pl.period, p);
  }
  function pickPlan(per: 'daily' | 'weekly' | 'monthly', p = product) {
    const pl = p?.plans.find((x) => x.period === per);
    if (!pl) return;
    setPeriod(per);
    setPeriods(pl.minPeriods);
    setPrice({ rate: pl.rate, deposit: pl.deposit, delivery: pl.delivery });
    setCompletion((c) => ({ ...c, depositRefund: pl.deposit }));
  }

  const totals = useMemo(() => {
    const rent = price.rate * periods;
    const gst = opts?.gstEnabled && chargeGst && product ? Math.round((rent + price.delivery) * product.gstRate) / 100 : 0;
    const total = rent + price.delivery + gst + price.deposit;
    return { rent, gst, total };
  }, [price, periods, chargeGst, product, opts?.gstEnabled]);
  const amountPaid = paymentTouched ? payment.amount : totals.total;
  const endDate = addPeriods(startDate, period, periods);

  const runLookup = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFe({ 'customer.email': 'Enter a valid email' });
      return;
    }
    setLooking(true);
    setFe({});
    try {
      const res = await lookupRentalCustomer(email);
      setLookup(res);
      if (res.found) {
        setCust({ name: res.customer.name, mobile: res.customer.mobile, type: 'individual' });
        const def = res.customer.addresses.find((a) => a.isDefault) || res.customer.addresses[0];
        setAddressId(def ? def.id : 'new');
        setAddr((a) => ({ ...a, name: res.customer.name, phone: res.customer.mobile }));
      } else {
        setAddressId('new');
      }
    } catch (err) {
      showToast({ title: 'Lookup failed', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setLooking(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookup) {
      setFe({ 'customer.email': 'Look up the email first' });
      return;
    }
    setSaving(true);
    setFe({});
    const input: ManualRentalInput = {
      productId,
      period,
      periods,
      startDate,
      status,
      rate: price.rate,
      deposit: price.deposit,
      delivery: price.delivery,
      chargeGst,
      customer: { email: email.trim(), name: cust.name.trim(), mobile: cust.mobile.trim() || undefined, type: cust.type },
      ...(addressId !== 'new'
        ? { addressId }
        : {
            address: {
              ...addr,
              name: addr.name.trim() || cust.name.trim(),
              phone: addr.phone.trim() || cust.mobile.trim(),
              organisation: addr.organisation || undefined,
              line2: addr.line2 || undefined,
              landmark: addr.landmark || undefined,
            },
          }),
      unitId: unitId || undefined,
      payment: amountPaid > 0 ? { amount: amountPaid, method: payment.method, reference: payment.reference.trim() || undefined, paidOn: payment.paidOn || undefined } : undefined,
      completion: status === 'completed' ? { ...completion, refundReference: completion.refundReference?.trim() || undefined } : undefined,
      note: note.trim() || undefined,
    };
    try {
      const res = await createManualRental(input);
      showToast({
        title: `Rental ${res.rentalNumber} saved`,
        description: res.customerCreated ? 'A new customer account was created — it shows in their My Rentals once they sign in.' : 'It now shows in the customer’s My Rentals.',
        variant: 'success',
      });
      navigate(`/admin/rentals/${res.id}`);
    } catch (err) {
      if (err instanceof AdminApiError && err.fields) setFe(err.fields);
      showToast({ title: 'Could not save the rental', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loadError) return <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</p>;
  if (!opts) return <div className="h-96 animate-pulse rounded-xl bg-slate-200" />;
  if (!opts.products.length) {
    return (
      <div className={`${card} max-w-lg`}>
        <p className={h2}>No product is available on rent</p>
        <p className="text-sm text-[#5B6B82]">Turn on “Available on rent” and add a rental plan to a product first.</p>
        <Link to="/admin/products" className="text-sm font-semibold text-[#1D5FAF] hover:underline">
          Go to products
        </Link>
      </div>
    );
  }

  const existing = lookup?.found ? lookup.customer : null;
  const err = (k: string) => fe[k];

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="flex items-center gap-3">
        <Link to="/admin/rentals" className="rounded-lg border border-[#DCE6F2] bg-white p-2 text-[#12263F] hover:bg-[#EAF2FC]" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#12263F]">New rental</h1>
          <p className="text-sm text-[#5B6B82]">Enter a phone / walk-in booking or an old rental. It appears in the customer’s account under My Rentals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {/* 1. Customer */}
          <section className={card}>
            {step(1, 'Customer', 'Matched by email. An existing account keeps its details; a new email creates a customer account.')}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <FormField label="Email" required error={err('customer.email')} className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLookup(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      runLookup();
                    }
                  }}
                  placeholder="customer@example.com"
                  className={inputClass}
                />
              </FormField>
              <button type="button" onClick={runLookup} disabled={looking || !email.trim()} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-semibold text-white hover:bg-[#11335E] disabled:opacity-50">
                {looking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Find customer
              </button>
            </div>
            {lookup && (
              <div className={`flex items-start gap-3 rounded-lg border p-3 text-xs ${existing ? 'border-emerald-200 bg-emerald-50' : 'border-[#1D5FAF]/25 bg-[#EAF2FC]'}`}>
                {existing ? <UserCheck className="h-5 w-5 shrink-0 text-emerald-600" /> : <UserPlus className="h-5 w-5 shrink-0 text-[#1D5FAF]" />}
                <div>
                  {existing ? (
                    <>
                      <p className="font-semibold text-emerald-800">Existing customer: {existing.name || existing.email}</p>
                      <p className="text-emerald-700">
                        {existing.mobile || 'No mobile'} · {existing.rentals} rental{existing.rentals === 1 ? '' : 's'} · {existing.orders} order{existing.orders === 1 ? '' : 's'}
                        {existing.status === 'blocked' && ' · BLOCKED'}
                      </p>
                    </>
                  ) : (
                    <p className="font-semibold text-[#12263F]">No account with this email — a new customer will be created.</p>
                  )}
                </div>
              </div>
            )}
            {lookup && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FormField label="Full name" required error={err('customer.name')}>
                  <input value={cust.name} onChange={(e) => setCust((c) => ({ ...c, name: e.target.value }))} disabled={Boolean(existing?.name)} className={inputClass} />
                </FormField>
                <FormField label="Mobile" error={err('customer.mobile')} hint={existing?.mobile ? undefined : '10-digit Indian mobile'}>
                  <input value={cust.mobile} onChange={(e) => setCust((c) => ({ ...c, mobile: e.target.value }))} disabled={Boolean(existing?.mobile)} inputMode="numeric" className={inputClass} />
                </FormField>
                {!existing && (
                  <FormField label="Customer type">
                    <select value={cust.type} onChange={(e) => setCust((c) => ({ ...c, type: e.target.value }))} className={selectClass}>
                      <option value="individual">Patient / Family</option>
                      <option value="doctor">Doctor / Dentist</option>
                      <option value="clinic_admin">Hospital / Clinic</option>
                      <option value="procurement">Procurement</option>
                    </select>
                  </FormField>
                )}
              </div>
            )}
          </section>

          {/* 2. Equipment */}
          <section className={card}>
            {step(2, 'Equipment & price', 'Prices start from the product’s rental plan — change them if a different price was agreed.')}
            <FormField label="Product" required error={err('productId')}>
              <select value={productId} onChange={(e) => pickProduct(e.target.value)} className={selectClass}>
                {opts.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) · {p.units.length} unit{p.units.length === 1 ? '' : 's'} free
                  </option>
                ))}
              </select>
            </FormField>
            {product && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {product.plans.map((pl) => (
                    <button
                      key={pl.period}
                      type="button"
                      onClick={() => pickPlan(pl.period)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${period === pl.period ? 'bg-[#1D5FAF] text-white' : 'border border-[#DCE6F2] text-[#5B6B82] hover:bg-[#EAF2FC]'}`}
                    >
                      {pl.period[0].toUpperCase() + pl.period.slice(1)} · {formatINR(pl.rate)}/{UNIT[pl.period]}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <FormField label={`Duration (${UNIT[period]}s)`} required error={err('periods')} hint={plan ? `${plan.minPeriods}–${plan.maxPeriods} on the website` : undefined}>
                    <input type="number" min={1} value={periods} onChange={(e) => setPeriods(Math.max(1, Number(e.target.value)))} className={inputClass} />
                  </FormField>
                  <FormField label={`Rate / ${UNIT[period]} (₹)`} error={err('rate')}>
                    <input type="number" min={0} value={price.rate} onChange={(e) => setPrice((p) => ({ ...p, rate: Number(e.target.value) }))} className={`${inputClass} tabular-nums`} />
                  </FormField>
                  <FormField label="Deposit (₹)" error={err('deposit')}>
                    <input type="number" min={0} value={price.deposit} onChange={(e) => setPrice((p) => ({ ...p, deposit: Number(e.target.value) }))} className={`${inputClass} tabular-nums`} />
                  </FormField>
                  <FormField label="Delivery & pickup (₹)" error={err('delivery')}>
                    <input type="number" min={0} value={price.delivery} onChange={(e) => setPrice((p) => ({ ...p, delivery: Number(e.target.value) }))} className={`${inputClass} tabular-nums`} />
                  </FormField>
                </div>
                {opts.gstEnabled && (
                  <label className="flex items-center gap-2 text-xs text-[#12263F]">
                    <input type="checkbox" checked={chargeGst} onChange={(e) => setChargeGst(e.target.checked)} className="h-4 w-4 accent-[#1D5FAF]" />
                    Charge GST ({product.gstRate}%) on rent and delivery
                  </label>
                )}
              </>
            )}
          </section>

          {/* 3. Status & dates */}
          <section className={card}>
            {step(3, 'Status & dates')}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  ['approved', 'Upcoming', 'Booked, not delivered yet'],
                  ['active', 'Active', 'Equipment is with the customer now'],
                  ['completed', 'Completed', 'Old rental — returned already'],
                ] as [Status, string, string][]
              ).map(([v, t, h]) => (
                <label key={v} className={`cursor-pointer rounded-lg border p-3 ${status === v ? 'border-[#1D5FAF] bg-[#EAF2FC]/50' : 'border-[#DCE6F2]'}`}>
                  <input
                    type="radio"
                    name="status"
                    checked={status === v}
                    onChange={() => {
                      setStatus(v);
                      if (v === 'approved' && startDate < today) setStartDate(today);
                      if (v !== 'approved' && startDate > today) setStartDate(today);
                    }}
                    className="mr-2 accent-[#1D5FAF]"
                  />
                  <span className="text-xs font-semibold text-[#12263F]">{t}</span>
                  <span className="block pl-5 text-[11px] text-[#5B6B82]">{h}</span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField label={status === 'approved' ? 'Delivery / start date' : 'Started on (delivered)'} required error={err('startDate')}>
                <input
                  type="date"
                  value={startDate}
                  min={status === 'approved' ? today : undefined}
                  max={status === 'approved' ? undefined : today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Ends on">
                <input value={endDate} readOnly className={`${inputClass} bg-[#F6F9FD]`} />
              </FormField>
              {status !== 'completed' && (
                <FormField label="Unit" error={err('unitId')} hint={status === 'active' ? 'The machine at the customer’s place' : 'Optional — can be assigned later'}>
                  <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className={selectClass}>
                    <option value="">{product?.units.length ? 'Not assigned' : 'No free unit'}</option>
                    {product?.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unitCode} · S/N {u.serialNumber}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}
            </div>
            {status === 'completed' && (
              <div className="space-y-3 rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] p-3.5">
                <p className="text-xs font-semibold text-[#12263F]">Return & deposit</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <FormField label="Returned on" required error={err('completion.returnedOn')}>
                    <input type="date" min={startDate} max={today} value={completion.returnedOn} onChange={(e) => setCompletion((c) => ({ ...c, returnedOn: e.target.value }))} className={inputClass} />
                  </FormField>
                  <FormField label="Condition">
                    <select value={completion.condition} onChange={(e) => setCompletion((c) => ({ ...c, condition: e.target.value as typeof c.condition }))} className={selectClass}>
                      <option value="good">Good</option>
                      <option value="needs_service">Needs service</option>
                      <option value="damaged">Damaged</option>
                    </select>
                  </FormField>
                  <FormField label="Deposit refunded (₹)" error={err('completion.depositRefund')} hint={`Deposit ${formatINR(price.deposit)}`}>
                    <input type="number" min={0} max={price.deposit} value={completion.depositRefund} onChange={(e) => setCompletion((c) => ({ ...c, depositRefund: Number(e.target.value) }))} className={`${inputClass} tabular-nums`} />
                  </FormField>
                  <FormField label="Refund status">
                    <select value={completion.refundMethod} onChange={(e) => setCompletion((c) => ({ ...c, refundMethod: e.target.value as typeof c.refundMethod }))} className={selectClass}>
                      <option value="bank_transfer">Paid by bank transfer</option>
                      <option value="upi">Paid by UPI</option>
                      <option value="pending">Not paid yet (refund later)</option>
                      <option value="none">Nothing to refund</option>
                    </select>
                  </FormField>
                  {['bank_transfer', 'upi'].includes(completion.refundMethod) && completion.depositRefund > 0 && (
                    <FormField label="Refund reference">
                      <input value={completion.refundReference || ''} onChange={(e) => setCompletion((c) => ({ ...c, refundReference: e.target.value }))} className={`${inputClass} font-mono`} />
                    </FormField>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* 4. Address */}
          <section className={card}>
            {step(4, 'Delivery address', 'Saved to the customer’s address book.')}
            {existing && existing.addresses.length > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {existing.addresses.map((a) => (
                  <label key={a.id} className={`cursor-pointer rounded-lg border p-3 text-xs ${addressId === a.id ? 'border-[#1D5FAF] bg-[#EAF2FC]/50' : 'border-[#DCE6F2]'}`}>
                    <input type="radio" name="addr" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mr-2 accent-[#1D5FAF]" />
                    <span className="font-semibold text-[#12263F]">{a.organisation || a.name}</span>
                    <span className="block pl-5 text-[#5B6B82]">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} – {a.pincode}
                    </span>
                  </label>
                ))}
                <label className={`cursor-pointer rounded-lg border p-3 text-xs ${addressId === 'new' ? 'border-[#1D5FAF] bg-[#EAF2FC]/50' : 'border-[#DCE6F2]'}`}>
                  <input type="radio" name="addr" checked={addressId === 'new'} onChange={() => setAddressId('new')} className="mr-2 accent-[#1D5FAF]" />
                  <span className="font-semibold text-[#12263F]">A new address</span>
                </label>
              </div>
            )}
            {addressId === 'new' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FormField label="Type">
                  <select value={addr.type} onChange={(e) => setAddr((a) => ({ ...a, type: e.target.value }))} className={selectClass}>
                    <option value="home">Home</option>
                    <option value="clinic">Clinic</option>
                    <option value="hospital">Hospital</option>
                    <option value="other">Other</option>
                  </select>
                </FormField>
                <FormField label="Contact name" required error={err('address.name')}>
                  <input value={addr.name} placeholder={cust.name} onChange={(e) => setAddr((a) => ({ ...a, name: e.target.value }))} className={inputClass} />
                </FormField>
                <FormField label="Contact mobile" required error={err('address.phone')}>
                  <input value={addr.phone} placeholder={cust.mobile} inputMode="numeric" onChange={(e) => setAddr((a) => ({ ...a, phone: e.target.value }))} className={inputClass} />
                </FormField>
                {addr.type !== 'home' && (
                  <FormField label="Clinic / hospital name" className="sm:col-span-3">
                    <input value={addr.organisation} onChange={(e) => setAddr((a) => ({ ...a, organisation: e.target.value }))} className={inputClass} />
                  </FormField>
                )}
                <FormField label="Building, floor & street" required error={err('address.line1')} className="sm:col-span-2">
                  <input value={addr.line1} onChange={(e) => setAddr((a) => ({ ...a, line1: e.target.value }))} className={inputClass} />
                </FormField>
                <FormField label="Area / locality">
                  <input value={addr.line2} onChange={(e) => setAddr((a) => ({ ...a, line2: e.target.value }))} className={inputClass} />
                </FormField>
                <FormField label="Landmark">
                  <input value={addr.landmark} onChange={(e) => setAddr((a) => ({ ...a, landmark: e.target.value }))} className={inputClass} />
                </FormField>
                <FormField label="City" required error={err('address.city')}>
                  <input value={addr.city} onChange={(e) => setAddr((a) => ({ ...a, city: e.target.value }))} className={inputClass} />
                </FormField>
                <FormField label="State" required error={err('address.state')}>
                  <select value={addr.state} onChange={(e) => setAddr((a) => ({ ...a, state: e.target.value }))} className={selectClass}>
                    <option value="">Choose…</option>
                    {opts.states.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="PIN code" required error={err('address.pincode')}>
                  <input value={addr.pincode} maxLength={6} inputMode="numeric" onChange={(e) => setAddr((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, '') }))} className={inputClass} />
                </FormField>
              </div>
            )}
            {err('address') && <p className="text-xs font-medium text-red-600">{err('address')}</p>}
          </section>

          {/* 5. Payment */}
          <section className={card}>
            {step(5, 'Payment received', 'Whatever is not received shows as balance due on the rental.')}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <FormField label="Amount received (₹)" error={err('payment.amount')} hint={`Total ${formatINR(totals.total)}`}>
                <input
                  type="number"
                  min={0}
                  max={totals.total}
                  value={amountPaid}
                  onChange={(e) => {
                    setPaymentTouched(true);
                    setPayment((p) => ({ ...p, amount: Number(e.target.value) }));
                  }}
                  className={`${inputClass} tabular-nums`}
                />
              </FormField>
              <FormField label="Method">
                <select value={payment.method} onChange={(e) => setPayment((p) => ({ ...p, method: e.target.value as typeof p.method }))} className={selectClass}>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="card">Card (POS)</option>
                  <option value="cheque">Cheque</option>
                </select>
              </FormField>
              <FormField label="Reference / UTR">
                <input value={payment.reference} onChange={(e) => setPayment((p) => ({ ...p, reference: e.target.value }))} className={`${inputClass} font-mono`} />
              </FormField>
              <FormField label="Received on">
                <input type="date" max={today} value={payment.paidOn} onChange={(e) => setPayment((p) => ({ ...p, paidOn: e.target.value }))} className={inputClass} />
              </FormField>
            </div>
            <FormField label="Internal note">
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Booked over phone, old paper invoice #123" className={textareaClass} />
            </FormField>
          </section>
        </div>

        {/* Summary */}
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <section className={card}>
            <h2 className={h2}>Summary</h2>
            {product && (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2]">
                  <SafeImage src={product.image} alt={product.name} />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-[#12263F]">{product.name}</p>
                  <p className="text-[#5B6B82]">
                    {periods} {UNIT[period]}
                    {periods === 1 ? '' : 's'} · {startDate} → {endDate}
                  </p>
                </div>
              </div>
            )}
            <dl className="space-y-1.5 text-xs">
              {[
                ['Rent', totals.rent],
                ['Delivery & pickup', price.delivery],
                ['GST', totals.gst],
                ['Deposit', price.deposit],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between">
                  <dt className="text-[#5B6B82]">{k}</dt>
                  <dd className="tabular-nums">{formatINR(v as number)}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-[#DCE6F2] pt-1.5 font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatINR(totals.total)}</dd>
              </div>
              <div className="flex justify-between text-emerald-700">
                <dt>Received</dt>
                <dd className="tabular-nums">{formatINR(amountPaid || 0)}</dd>
              </div>
              <div className={`flex justify-between font-semibold ${totals.total - amountPaid > 0 ? 'text-[#B85A0E]' : 'text-[#12263F]'}`}>
                <dt>Balance due</dt>
                <dd className="tabular-nums">{formatINR(Math.max(0, totals.total - (amountPaid || 0)))}</dd>
              </div>
            </dl>
            <button
              type="submit"
              disabled={saving || !lookup || !productId}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#174D8F] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Save rental
            </button>
            {!lookup && <p className="text-center text-[11px] text-[#5B6B82]">Find the customer by email first.</p>}
          </section>
        </aside>
      </div>
    </form>
  );
}
