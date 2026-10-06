'use client'

import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Flower2,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react'

const categories = [
  { name: 'Decorations', icon: Flower2, color: 'bg-rose-100 text-rose-700' },
  { name: 'Venue', icon: LayoutDashboard, color: 'bg-sky-100 text-sky-700' },
  { name: 'Stationery', icon: ClipboardList, color: 'bg-violet-100 text-violet-700' },
  { name: 'Catering / Food Stalls', icon: UtensilsCrossed, color: 'bg-amber-100 text-amber-700' },
  { name: 'Groceries', icon: ClipboardList, color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Vegetables', icon: Flower2, color: 'bg-lime-100 text-lime-700' },
]

const initialItems = [
  { category: 'Decorations', item: 'Mandap floral arrangement', vendor: 'Petal & Stem Co.', total: 18500, advance: 12000 },
  { category: 'Venue', item: 'The Willow Garden', vendor: 'Willow Garden Estate', total: 85000, advance: 50000 },
  { category: 'Catering / Food Stalls', item: 'Main buffet & live dosa counter', vendor: 'Saffron Table', total: 64000, advance: 64000 },
  { category: 'Stationery', item: 'Invitation suite · 120 sets', vendor: 'Paper & Press', total: 9600, advance: 4800 },
  { category: 'Groceries', item: 'Pantry essentials', vendor: 'Metro Wholesale', total: 12400, advance: 8000 },
  { category: 'Vegetables', item: 'Fresh produce · 3 days', vendor: 'Green Basket Market', total: 7800, advance: 4200 },
]

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`

export default function Page() {
  const [activeCategory, setActiveCategory] = useState('All items')
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [items, setItems] = useState(initialItems)
  const filteredItems = activeCategory === 'All items' ? items : items.filter((item) => item.category === activeCategory)
  const totals = useMemo(() => items.reduce((acc, item) => ({ total: acc.total + item.total, advance: acc.advance + item.advance }), { total: 0, advance: 0 }), [items])
  const due = totals.total - totals.advance

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white px-5 py-6 transition-transform lg:translate-x-0 ${showMobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10 flex items-center justify-between px-2">
          <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white"><Flower2 size={18} /></div><div><p className="text-sm font-bold tracking-tight">Wedora</p><p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">Event workspace</p></div></div>
          <button className="lg:hidden" onClick={() => setShowMobileNav(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        <nav className="flex flex-col gap-1">
          <a className="flex items-center gap-3 rounded-xl bg-slate-900 px-3 py-3 text-sm font-semibold text-white" href="#dashboard"><LayoutDashboard size={17} /> Dashboard</a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50" href="#events"><CalendarDays size={17} /> Events <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">3</span></a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50" href="#team"><Users size={17} /> Team members</a>
        </nav>
        <p className="mb-3 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Manage</p>
        <nav className="flex flex-col gap-1"><a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50" href="#payments"><CircleDollarSign size={17} /> Payments</a><a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50" href="#settings"><Settings size={17} /> Settings</a></nav>
        <div className="mt-auto rounded-2xl bg-slate-50 p-4"><div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm"><ShieldCheck size={16} /></div><p className="text-xs font-semibold">Admin workspace</p><p className="mt-1 text-[11px] leading-4 text-slate-500">You have full control over events, access and payments.</p></div>
      </aside>

      <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-[#f7f8fa]/90 px-5 backdrop-blur-md sm:px-8"><div className="flex items-center gap-3"><button className="lg:hidden" onClick={() => setShowMobileNav(true)} aria-label="Open navigation"><Menu size={20} /></button><div><p className="text-xs font-medium text-slate-400">Wednesday, 16 October 2024</p><h1 className="text-xl font-bold tracking-tight">Good morning, Aisha</h1></div></div><div className="flex items-center gap-3"><button className="hidden rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 sm:block" aria-label="Search"><Search size={17} /></button><button className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500" aria-label="Notifications"><Bell size={17} /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-500" /></button><div className="ml-1 flex size-9 items-center justify-center rounded-full bg-[#e5d3c5] text-sm font-bold text-[#704c39]">AS</div></div></header>
        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8" id="dashboard"><section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-rose-600"><span className="size-1.5 rounded-full bg-rose-500" /> ACTIVE EVENT</div><h2 className="text-3xl font-bold tracking-tight text-slate-950">Aarav & Meera&apos;s wedding</h2><p className="mt-2 text-sm text-slate-500">Saturday, 23 November 2024 <span className="mx-2 text-slate-300">·</span> The Willow Garden Estate</p></div><button onClick={() => setShowAddItem(true)} className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"><Plus size={17} /> Add expense</button></section>
          <section className="grid gap-4 sm:grid-cols-3"><StatCard label="Total budget" value={money(totals.total)} helper="Across 6 categories" icon={<CircleDollarSign />} /><StatCard label="Paid so far" value={money(totals.advance)} helper={`${Math.round((totals.advance / totals.total) * 100)}% of total budget`} icon={<ArrowUpRight />} /><StatCard label="Total due" value={money(due)} helper="Needs your attention" icon={<Bell />} danger /></section>
          <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_320px]"><div className="min-w-0 rounded-2xl border border-slate-200 bg-white"><div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold">Expense overview</h3><p className="mt-1 text-xs text-slate-400">Track every commitment in one place</p></div><button className="flex items-center gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">This event <ChevronDown size={14} /></button></div><div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-5 py-3"><button onClick={() => setActiveCategory('All items')} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${activeCategory === 'All items' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>All items</button>{categories.map((category) => <button key={category.name} onClick={() => setActiveCategory(category.name)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${activeCategory === category.name ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{category.name}</button>)}</div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Expense item</th><th className="px-5 py-3">Total cost</th><th className="px-5 py-3">Advance paid</th><th className="px-5 py-3">Due balance</th><th className="px-5 py-3"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-slate-100">{filteredItems.map((item) => { const balance = item.total - item.advance; return <tr key={item.item} className="transition hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className={`flex size-9 items-center justify-center rounded-xl ${categories.find((category) => category.name === item.category)?.color}`}><ClipboardList size={16} /></div><div><p className="font-semibold text-slate-700">{item.item}</p><p className="mt-0.5 text-xs text-slate-400">{item.category} · {item.vendor}</p></div></div></td><td className="px-5 py-4 font-medium text-slate-600">{money(item.total)}</td><td className="px-5 py-4 font-medium text-emerald-600">{money(item.advance)}</td><td className="px-5 py-4"><span className={`font-bold ${balance ? 'text-rose-600' : 'text-emerald-600'}`}>{money(balance)}</span><span className={`ml-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${balance ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{balance ? 'Due' : 'Paid'}</span></td><td className="px-5 py-4 text-right"><button aria-label={`More actions for ${item.item}`} className="text-slate-300 hover:text-slate-600"><MoreHorizontal size={18} /></button></td></tr> })}</tbody></table></div></div>
            <aside className="flex flex-col gap-6"><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold">Payment progress</h3><p className="mt-1 text-xs text-slate-400">Overall budget health</p></div><span className="text-xl font-bold text-slate-800">{Math.round((totals.advance / totals.total) * 100)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${(totals.advance / totals.total) * 100}%` }} /></div><div className="mt-4 flex justify-between text-xs"><span className="text-slate-500">Paid <strong className="text-slate-700">{money(totals.advance)}</strong></span><span className="text-rose-600">Due <strong>{money(due)}</strong></span></div></div><div className="rounded-2xl bg-slate-900 p-5 text-white"><div className="mb-8 flex items-start justify-between"><div className="flex size-10 items-center justify-center rounded-xl bg-white/10"><CalendarDays size={19} /></div><span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-bold text-emerald-300">42 days left</span></div><p className="text-xs text-slate-400">Next milestone</p><p className="mt-1 font-bold">Final vendor confirmations</p><p className="mt-2 text-xs leading-5 text-slate-400">Make sure all pending balances are cleared before 10 November.</p><button className="mt-5 w-full rounded-xl bg-white/10 py-2.5 text-xs font-semibold text-white hover:bg-white/15">View timeline</button></div></aside></section>
        </div>
      </div>
      {showAddItem && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-lg font-bold">Add expense item</h2><p className="mt-1 text-xs text-slate-500">Record a new wedding commitment.</p></div><button onClick={() => setShowAddItem(false)} aria-label="Close"><X size={18} /></button></div><form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); setShowAddItem(false) }}><label className="text-xs font-semibold text-slate-600">Item name<input required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500" placeholder="e.g. Bridal makeup" /></label><label className="text-xs font-semibold text-slate-600">Total cost<input required type="number" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500" placeholder="0" /></label><label className="text-xs font-semibold text-slate-600">Category<select className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"><option>Decorations</option>{categories.slice(1).map((category) => <option key={category.name}>{category.name}</option>)}</select></label><button className="mt-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white">Save expense</button></form></div></div>}
    </main>
  )
}

function StatCard({ label, value, helper, icon, danger = false }: { label: string; value: string; helper: string; icon: React.ReactNode; danger?: boolean }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><p className="text-xs font-semibold text-slate-400">{label}</p><div className={`flex size-8 items-center justify-center rounded-lg ${danger ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}`}>{icon}</div></div><p className={`mt-4 text-2xl font-bold tracking-tight ${danger ? 'text-rose-600' : 'text-slate-900'}`}>{value}</p><p className={`mt-1 text-xs ${danger ? 'text-rose-500' : 'text-slate-400'}`}>{helper}</p></div>
}
