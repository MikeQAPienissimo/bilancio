'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownLeft, ArrowUpRight, Banknote, BriefcaseBusiness, CalendarDays, ChevronRight, CircleGauge, Landmark, LayoutDashboard, Plus, RotateCcw, Settings2, Trash2, TrendingUp, WalletCards } from 'lucide-react'
import { BudgetState, demoState, Expense, Income, dateIt, money, monthlyData, totals, uid } from '@/lib/budget'

type View = 'riepilogo' | 'entrate' | 'spese' | 'piva' | 'previsioni' | 'setup'
const nav: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'riepilogo', label: 'Riepilogo', icon: LayoutDashboard },
  { id: 'entrate', label: 'Entrate', icon: ArrowDownLeft },
  { id: 'spese', label: 'Spese', icon: ArrowUpRight },
  { id: 'piva', label: 'P.IVA', icon: BriefcaseBusiness },
  { id: 'previsioni', label: 'Previsioni', icon: TrendingUp },
  { id: 'setup', label: 'Impostazioni', icon: Settings2 },
]
const currentYear = new Date().getFullYear()
const storageKey = 'bilancio-budget-v1'

export function BudgetDashboard() {
  const [state, setState] = useState<BudgetState>(demoState)
  const [view, setView] = useState<View>('riepilogo')
  const [year, setYear] = useState(currentYear)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    if (saved) { try { setState(JSON.parse(saved)) } catch {} }
    setReady(true)
  }, [])
  useEffect(() => { if (ready) window.localStorage.setItem(storageKey, JSON.stringify(state)) }, [state, ready])

  const t = useMemo(() => totals(state, year), [state, year])
  const monthly = useMemo(() => monthlyData(state, year), [state, year])
  const active = nav.find((item) => item.id === view)!
  const removeIncome = (id: string) => setState((s) => ({ ...s, incomes: s.incomes.filter((i) => i.id !== id) }))
  const removeExpense = (id: string) => setState((s) => ({ ...s, expenses: s.expenses.filter((i) => i.id !== id) }))

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-card px-5 py-6 lg:flex">
        <Brand />
        <nav className="mt-10 flex flex-col gap-1" aria-label="Navigazione principale">
          {nav.map((item) => <NavButton key={item.id} item={item} active={view === item.id} onClick={() => setView(item.id)} />)}
        </nav>
        <div className="mt-auto rounded-xl bg-secondary p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><span className="size-2 rounded-full bg-primary" /> Dati locali</div>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">Salvati solo su questo dispositivo.</p>
        </div>
      </aside>

      <main className="min-h-screen pb-24 lg:ml-64 lg:pb-8">
        <header className="sticky top-0 z-20 border-b bg-background/95 px-5 py-4 backdrop-blur md:px-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div><p className="text-sm text-muted-foreground">Il tuo spazio finanziario</p><h1 className="text-xl font-semibold tracking-tight">{active.label}</h1></div>
            <label className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium"><CalendarDays className="size-4 text-muted-foreground" /><span className="sr-only">Anno</span><select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-transparent outline-none"><option>{currentYear}</option><option>{currentYear - 1}</option></select></label>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-5 py-7 md:px-8 lg:px-10 lg:py-9">
          {view === 'riepilogo' && <Overview state={state} year={year} />}
          {view === 'entrate' && <Transactions title="Entrate" subtitle="Registra e controlla tutti gli incassi." entries={t.incomes} mode="income" onAdd={(item) => setState((s) => ({ ...s, incomes: [item as Income, ...s.incomes] }))} onRemove={removeIncome} />}
          {view === 'spese' && <Transactions title="Spese" subtitle="Tieni sotto controllo ogni uscita." entries={t.expenses} mode="expense" onAdd={(item) => setState((s) => ({ ...s, expenses: [item as Expense, ...s.expenses] }))} onRemove={removeExpense} />}
          {view === 'piva' && <PivaView state={state} year={year} />}
          {view === 'previsioni' && <Forecast state={state} year={year} />}
          {view === 'setup' && <Setup state={state} setState={setState} onReset={() => { setState(demoState); window.localStorage.removeItem(storageKey) }} />}
        </div>
      </main>
      <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-between rounded-2xl border bg-card p-2 shadow-lg lg:hidden" aria-label="Navigazione mobile">
        {nav.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setView(item.id)} aria-label={item.label} className={`flex min-w-12 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs ${view === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}><Icon className="size-4" /><span className="hidden sm:inline">{item.label}</span></button> })}
      </nav>
    </div>
  )
}

function Brand() { return <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Landmark className="size-5" /></div><div><p className="text-lg font-bold tracking-tight">Bilancio</p><p className="text-xs text-muted-foreground">Budget personale</p></div></div> }
function NavButton({ item, active, onClick }: { item: typeof nav[number]; active: boolean; onClick: () => void }) { const Icon = item.icon; return <button onClick={onClick} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}><Icon className="size-4" />{item.label}<ChevronRight className="ml-auto size-4 opacity-50" /></button> }

function Overview({ state, year }: { state: BudgetState; year: number }) {
  const t = totals(state, year); const monthly = monthlyData(state, year)
  const cards = [
    { label: 'Entrate totali', value: t.totalIncome, detail: `${money.format(t.pivaIncome)} da P.IVA`, icon: ArrowDownLeft },
    { label: 'Spese totali', value: t.totalExpense, detail: `${money.format(t.personalExpense)} personali`, icon: ArrowUpRight },
    { label: 'Accantonamento', value: t.reserve, detail: `${state.profile.taxReserve}% del fatturato`, icon: Landmark },
    { label: 'Disponibile', value: t.available, detail: 'Al netto delle riserve', icon: WalletCards },
  ]
  return <div className="flex flex-col gap-7">
    <section><p className="text-sm font-medium text-primary">PANORAMICA {year}</p><h2 className="mt-2 max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-4xl">Ciao {state.profile.name.split(' ')[0]}, ecco come stanno andando le tue finanze.</h2></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, detail, icon: Icon }) => <article key={label} className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-start justify-between"><p className="text-sm font-medium text-muted-foreground">{label}</p><Icon className="size-5 text-primary" /></div><p className="mt-5 text-3xl font-semibold tracking-tight">{money.format(value)}</p><p className="mt-2 text-sm text-muted-foreground">{detail}</p></article>)}</section>
    <section className="grid gap-5 xl:grid-cols-[1.7fr_1fr]"><ChartCard title="Flusso mensile" subtitle="Entrate e spese nel corso dell’anno"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthly} margin={{ left: -15, right: 8, top: 12 }}><defs><linearGradient id="income" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35}/><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)"/><XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12}/><YAxis axisLine={false} tickLine={false} fontSize={11}/><Tooltip formatter={(v) => money.format(Number(v))}/><Area type="monotone" dataKey="entrate" stroke="var(--chart-1)" fill="url(#income)" strokeWidth={2}/><Area type="monotone" dataKey="spese" stroke="var(--chart-2)" fill="transparent" strokeWidth={2}/></AreaChart></ResponsiveContainer></ChartCard><Recent state={state} year={year}/></section>
  </div>
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <article className="rounded-2xl border bg-card p-5 shadow-sm"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p><div className="mt-5 h-72">{children}</div></article> }
function Recent({ state, year }: { state: BudgetState; year: number }) { const all = [...state.incomes.map(i => ({...i, sign: 1})), ...state.expenses.map(i => ({...i, sign: -1}))].filter(i => new Date(i.date).getFullYear() === year).sort((a,b) => b.date.localeCompare(a.date)).slice(0,5); return <article className="rounded-2xl border bg-card p-5 shadow-sm"><h3 className="font-semibold">Movimenti recenti</h3><p className="mt-1 text-sm text-muted-foreground">Gli ultimi registrati</p><div className="mt-5 flex flex-col gap-1">{all.map(i => <div key={i.id} className="flex items-center gap-3 rounded-xl py-3"><div className={`grid size-9 place-items-center rounded-lg ${i.sign > 0 ? 'bg-secondary text-primary' : 'bg-muted text-muted-foreground'}`}>{i.sign > 0 ? <ArrowDownLeft className="size-4"/> : <ArrowUpRight className="size-4"/>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{i.description}</p><p className="text-xs text-muted-foreground">{dateIt(i.date)}</p></div><p className="text-sm font-semibold tabular-nums">{i.sign > 0 ? '+' : '−'}{money.format(i.amount)}</p></div>)}</div></article> }

function Transactions({ title, subtitle, entries, mode, onAdd, onRemove }: { title: string; subtitle: string; entries: (Income | Expense)[]; mode: 'income' | 'expense'; onAdd: (item: Income | Expense) => void; onRemove: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const data = new FormData(e.currentTarget); const base = { id: uid(), date: String(data.get('date')), description: String(data.get('description')), amount: Number(data.get('amount')), kind: String(data.get('kind')) as 'personale' | 'piva' }; if (!base.description || base.amount <= 0) return; onAdd(mode === 'expense' ? { ...base, category: String(data.get('category') || 'Altro') } : base); e.currentTarget.reset(); setOpen(false) }
  return <div className="flex flex-col gap-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">MOVIMENTI</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2><p className="mt-2 text-muted-foreground">{subtitle}</p></div><button onClick={() => setOpen(!open)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="size-4" />Nuova {mode === 'income' ? 'entrata' : 'spesa'}</button></div>
    {open && <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm md:grid-cols-5"><Field label="Data"><input name="date" type="date" required defaultValue={new Date().toISOString().slice(0,10)} /></Field><Field label="Descrizione"><input name="description" required placeholder="Descrizione" /></Field><Field label="Importo"><input name="amount" required min="0.01" step="0.01" type="number" placeholder="0,00" /></Field><Field label="Tipo"><select name="kind"><option value="personale">Personale</option><option value="piva">P.IVA</option></select></Field>{mode === 'expense' && <Field label="Categoria"><input name="category" placeholder="Es. Casa" /></Field>}<div className="flex items-end"><button type="submit" className="h-11 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Salva</button></div></form>}
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm"><div className="hidden grid-cols-[120px_1fr_130px_130px_44px] gap-4 border-b bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid"><span>Data</span><span>Descrizione</span><span>Tipo</span><span className="text-right">Importo</span><span /></div>{entries.sort((a,b) => b.date.localeCompare(a.date)).map(item => <div key={item.id} className="flex items-center gap-3 border-b px-4 py-4 last:border-0 md:grid md:grid-cols-[120px_1fr_130px_130px_44px] md:gap-4 md:px-5"><span className="hidden text-sm text-muted-foreground md:block">{dateIt(item.date)}</span><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.description}</p><p className="text-xs text-muted-foreground md:hidden">{dateIt(item.date)} · {item.kind === 'piva' ? 'P.IVA' : 'Personale'}</p></div><span className="hidden w-fit rounded-full bg-secondary px-2.5 py-1 text-xs font-medium md:block">{item.kind === 'piva' ? 'P.IVA' : 'Personale'}</span><span className="text-right font-semibold tabular-nums">{money.format(item.amount)}</span><button onClick={() => onRemove(item.id)} aria-label={`Elimina ${item.description}`} className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4"/></button></div>)}{entries.length === 0 && <p className="p-10 text-center text-muted-foreground">Nessun movimento per questo anno.</p>}</div>
  </div>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-2 text-sm font-medium [&_input]:h-11 [&_input]:rounded-xl [&_input]:border [&_input]:bg-background [&_input]:px-3 [&_input]:outline-none [&_select]:h-11 [&_select]:rounded-xl [&_select]:border [&_select]:bg-background [&_select]:px-3">{label}{children}</label> }

function PivaView({ state, year }: { state: BudgetState; year: number }) { const t = totals(state, year); const due = t.contributions + t.tax; return <div className="flex flex-col gap-6"><div><p className="text-sm font-medium text-primary">REGIME FORFETTARIO</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">La tua P.IVA, senza sorprese.</h2><p className="mt-2 text-muted-foreground">Una stima semplice basata sui parametri configurati.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric label="Fatturato" value={t.pivaIncome}/><Metric label="Imponibile" value={t.taxable}/><Metric label="Contributi stimati" value={t.contributions}/><Metric label="Imposta sostitutiva" value={t.tax}/></div><section className="grid gap-5 xl:grid-cols-[1.2fr_1fr]"><article className="rounded-2xl border bg-primary p-6 text-primary-foreground"><p className="text-sm opacity-70">Totale fiscale stimato</p><p className="mt-3 text-4xl font-semibold">{money.format(due)}</p><div className="mt-8 h-2 overflow-hidden rounded-full bg-primary-foreground/20"><div className="h-full rounded-full bg-primary-foreground" style={{ width: `${Math.min(100, t.reserve ? due / t.reserve * 100 : 0)}%` }}/></div><div className="mt-3 flex justify-between text-sm"><span>Accantonato {money.format(t.reserve)}</span><span>{t.reserve >= due ? 'Copertura completa' : `Mancano ${money.format(due - t.reserve)}`}</span></div></article><article className="rounded-2xl border bg-card p-6"><h3 className="font-semibold">Parametri fiscali</h3><dl className="mt-5 flex flex-col gap-4">{[['Codice ATECO', state.profile.ateco], ['Redditività', `${state.profile.profitability}%`], ['Imposta', `${state.profile.substituteTax}%`], ['Contributi', `${state.profile.contributions}%`]].map(([a,b]) => <div key={a} className="flex justify-between border-b pb-3 last:border-0"><dt className="text-muted-foreground">{a}</dt><dd className="font-semibold">{b}</dd></div>)}</dl></article></section></div> }
function Metric({ label, value }: { label: string; value: number }) { return <article className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-4 text-2xl font-semibold">{money.format(value)}</p></article> }

function Forecast({ state, year }: { state: BudgetState; year: number }) { const t = totals(state, year); const months = Math.max(1, new Date().getMonth() + 1); const factor = 12 / months; const projectedIncome = t.totalIncome * factor; const projectedExpense = t.totalExpense * factor; const data = [{name:'Attuale',entrate:t.totalIncome,spese:t.totalExpense},{name:'Proiezione',entrate:projectedIncome,spese:projectedExpense}]; return <div className="flex flex-col gap-6"><div><p className="text-sm font-medium text-primary">PROIEZIONE ANNUALE</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Guarda qualche mese più avanti.</h2><p className="mt-2 text-muted-foreground">Stima basata sulla media dei mesi trascorsi nel {year}.</p></div><div className="grid gap-4 md:grid-cols-3"><Metric label="Entrate previste" value={projectedIncome}/><Metric label="Spese previste" value={projectedExpense}/><Metric label="Margine previsto" value={projectedIncome-projectedExpense}/></div><ChartCard title="Attuale vs proiezione" subtitle="Confronto dei valori cumulati"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid vertical={false} stroke="var(--border)"/><XAxis dataKey="name" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip formatter={(v) => money.format(Number(v))}/><Bar dataKey="entrate" fill="var(--chart-1)" radius={[6,6,0,0]}/><Bar dataKey="spese" fill="var(--chart-2)" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></ChartCard></div> }

function Setup({ state, setState, onReset }: { state: BudgetState; setState: React.Dispatch<React.SetStateAction<BudgetState>>; onReset: () => void }) { const update = (key: keyof BudgetState['profile'], value: string) => setState(s => ({...s, profile:{...s.profile, [key]: key === 'name' || key === 'ateco' ? value : Number(value)}})); return <div className="flex max-w-3xl flex-col gap-6"><div><p className="text-sm font-medium text-primary">CONFIGURAZIONE</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Imposta il tuo profilo.</h2><p className="mt-2 text-muted-foreground">Questi valori alimentano tutte le stime fiscali.</p></div><section className="grid gap-5 rounded-2xl border bg-card p-6 md:grid-cols-2"><Field label="Nome"><input value={state.profile.name} onChange={e=>update('name',e.target.value)}/></Field><Field label="Codice ATECO"><input value={state.profile.ateco} onChange={e=>update('ateco',e.target.value)}/></Field><Field label="Coefficiente di redditività (%)"><input type="number" value={state.profile.profitability} onChange={e=>update('profitability',e.target.value)}/></Field><Field label="Imposta sostitutiva (%)"><input type="number" value={state.profile.substituteTax} onChange={e=>update('substituteTax',e.target.value)}/></Field><Field label="Contributi INPS (%)"><input type="number" step="0.01" value={state.profile.contributions} onChange={e=>update('contributions',e.target.value)}/></Field><Field label="Accantonamento (%)"><input type="number" value={state.profile.taxReserve} onChange={e=>update('taxReserve',e.target.value)}/></Field></section><button onClick={onReset} className="inline-flex h-11 w-fit items-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold"><RotateCcw className="size-4"/>Ripristina dati demo</button></div> }
