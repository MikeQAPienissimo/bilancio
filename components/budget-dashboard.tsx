'use client'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownLeft, BrainCircuit, BriefcaseBusiness, CalendarDays, ChevronRight, ChevronLeft, CircleDollarSign, Landmark, LayoutDashboard, LogOut, Plus, RotateCcw, Save, Settings2, Trash2, WalletCards } from 'lucide-react'
import { Account, Asset, AssetMovimento, BudgetState, Deadline, Freq, FREQ_LABEL, FREQ_MULT, Income, Kind, demoState, dateIt, migrate, money, monthlyData, patrimoniTotals, toMensile, totals, uid } from '@/lib/budget'

const SUPABASE_URL = 'https://qqijeduwhggffmffbunb.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxaWplZHV3aGdnZmZtZmZidW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzQ2NzQsImV4cCI6MjEwMjExMDY3NH0.xRHLaN7QPOUWYToSUecXWYvw3gPa87YFhB2taGqilmI'
const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

type View = 'dashboard'|'movimenti'|'conti'|'budget'|'patrimonio'|'piva'|'scadenze'|'previsioni'|'advisor'|'setup'
const nav = [
  ['dashboard','Dashboard',LayoutDashboard],
  ['movimenti','Movimenti',ArrowDownLeft],
  ['conti','Conti e carte',WalletCards],
  ['budget','Budget',CircleDollarSign],
  ['patrimonio','Patrimonio',Landmark],
  ['piva','P.IVA',BriefcaseBusiness],
  ['scadenze','Scadenze',CalendarDays],
  ['previsioni','Previsioni',CalendarDays],
  ['advisor','Advisor AI',BrainCircuit],
  ['setup','Impostazioni',Settings2],
] as const

const TIPO_EMOJI: Record<string,string> = {conto:'🏦',carta:'💳',fido:'📋',contanti:'💵',piva:'🧾'}
const TIPO_LABEL: Record<string,string> = {conto:'Corrente',carta:'Carta credito',fido:'Fido',contanti:'Contanti',piva:'P.IVA'}
const IS_PATRIMONIO = (cat: string) => ['finanziario','assicurativo','risparmio'].includes(cat)

// ── AUTH SCREEN ──
function AuthScreen() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const loginGoogle = async () => {
    setLoading(true)
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  const loginEmail = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    setLoading(false)
    if (!error) setSent(true)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Landmark className="size-5"/></div>
          <div><p className="font-bold">Bilancio</p><p className="text-xs text-muted-foreground">Finanze personali</p></div>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-1">Accedi</h1>
          <p className="text-sm text-muted-foreground mb-6">I tuoi dati sono privati e sincronizzati su tutti i dispositivi.</p>
          {sent ? (
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-sm text-center">
              <p className="font-semibold text-primary mb-1">Email inviata ✓</p>
              <p className="text-muted-foreground">Controlla la tua casella e clicca il link per accedere.</p>
            </div>
          ) : (
            <>
              <button onClick={loginGoogle} disabled={loading} className="w-full h-11 rounded-xl border bg-background hover:bg-secondary flex items-center justify-center gap-3 text-sm font-semibold mb-4 transition-colors disabled:opacity-50">
                <svg className="size-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Accedi con Google
              </button>
              <div className="relative mb-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t"/></div><div className="relative flex justify-center text-xs text-muted-foreground bg-card px-2">oppure</div></div>
              <form onSubmit={loginEmail} className="flex flex-col gap-3">
                <input type="email" placeholder="La tua email" value={email} onChange={e=>setEmail(e.target.value)} required className="h-11 rounded-xl border bg-background px-3 text-sm focus:outline-none focus:border-primary"/>
                <button type="submit" disabled={loading} className="h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">Invia magic link</button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">Nessun dato condiviso con terze parti.</p>
      </div>
    </div>
  )
}

// ── MAIN APP ──
export function BudgetDashboard() {
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [state, setState] = useState<BudgetState>(demoState)
  const [view, setView] = useState<View>('dashboard')
  const [year, setYear] = useState(new Date().getFullYear())
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [aiMessages, setAiMessages] = useState<{role:'user'|'assistant';content:string}[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAutoRan, setAiAutoRan] = useState(false)
  const aiBottomRef = useRef<HTMLDivElement>(null)

  // Auth listener
  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Carica dati da Supabase quando utente loggato
  useEffect(() => {
    if (!user) return
    sb.from('user_data').select('data').eq('id', user.id).single().then(({ data, error }) => {
      if (data?.data && Object.keys(data.data).length > 0) {
        setState(migrate(data.data))
      }
    })
  }, [user])

  const saveToDb = useCallback(async (s: BudgetState) => {
    if (!user) return
    setSaving(true)
    setSaveMsg('')
    const { error } = await sb.from('user_data').upsert({ id: user.id, data: s, updated_at: new Date().toISOString() })
    setSaving(false)
    setSaveMsg(error ? '❌ Errore salvataggio' : '✓ Salvato')
    setTimeout(() => setSaveMsg(''), 3000)
  }, [user])

  const save = () => saveToDb(state)

  const logout = async () => {
    await sb.auth.signOut()
    setUser(null)
    setState(demoState)
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Caricamento...</div>
  if (!user) return <AuthScreen />

  const active = nav.find(n => n[0] === view)!

  // AI Context
  const buildAiContext = () => {
    const t = totals(state, year)
    const pat = patrimoniTotals(state.assets)
    return `Sei un consulente finanziario personale esperto. Rispondi in italiano con consigli pratici e diretti.

DATI FINANZIARI (${year}):
- Liquidità: ${money.format(t.liquidity)}
- Patrimonio netto: ${money.format(t.netWorth)}
- Conti: ${state.accounts.map(a=>`${a.name} (${TIPO_LABEL[a.type]}): ${money.format(a.balance)}`).join(', ')}
- Entrate: ${money.format(t.totalIncome)} | Spese: ${money.format(t.totalExpense)}
- Spese mensili equiv.: ${money.format(t.mensileSpese)}
- Limite mensile: ${t.limiteAttivo < Infinity ? money.format(t.limiteAttivo)+'/mese ('+Math.round(t.usatoLimite*100)+'% usato)' : 'nessuno'}
- Investimenti: versato ${money.format(pat.totVersato)}, valore ${money.format(pat.totValore)}, rendimento ${money.format(pat.rend)}
- P.IVA: fatturato ${money.format(t.pivaIncome)}, tasse stimate ${money.format(t.tax+t.contributions)}, accantonato ${money.format(t.reserve)}
- Spese principali: ${state.expenses.slice(0,6).map(e=>`${e.description} ${money.format(e.amount)} (${FREQ_LABEL[e.freq]})`).join(', ')}`
  }

  const sendAI = async (msg: string) => {
    if (!msg.trim()) return
    const newMsgs = [...aiMessages, { role: 'user' as const, content: msg }]
    setAiMessages(newMsgs); setAiInput(''); setAiLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, system: buildAiContext(), messages: newMsgs })
      })
      const data = await res.json()
      setAiMessages(m => [...m, { role: 'assistant', content: data.content?.[0]?.text ?? 'Errore.' }])
    } catch { setAiMessages(m => [...m, { role: 'assistant', content: 'Errore di connessione.' }]) }
    setAiLoading(false)
  }

  useEffect(() => { aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [aiMessages, aiLoading])

  const userName = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Utente'

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r bg-card px-4 py-5 lg:flex overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Landmark className="size-4"/></div>
          <div><p className="font-bold text-sm">Bilancio</p><p className="text-xs text-muted-foreground truncate max-w-[110px]">{userName}</p></div>
        </div>
        <nav className="flex flex-col gap-0.5 flex-1">
          {nav.map(([id, label, Icon]) => (
            <button key={id} onClick={() => { setView(id); if(id==='advisor'&&!aiAutoRan){setAiAutoRan(true);sendAI("Analizza la mia situazione finanziaria: evidenzia 3 punti di forza, 2 rischi urgenti e 3 azioni concrete da fare subito.")} }} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${view===id?'bg-primary text-primary-foreground':'text-muted-foreground hover:bg-secondary'}`}>
              <Icon className="size-4 shrink-0"/>{label}<ChevronRight className="ml-auto size-3 opacity-40"/>
            </button>
          ))}
        </nav>
        <div className="mt-4 border-t pt-4 flex flex-col gap-2">
          <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            <Save className="size-4"/>{saving ? 'Salvataggio...' : 'Salva'}
          </button>
          {saveMsg && <p className="text-xs text-center text-muted-foreground">{saveMsg}</p>}
          <button onClick={logout} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary">
            <LogOut className="size-4"/>Esci
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="pb-28 lg:ml-56 lg:pb-8">
        <header className="sticky top-0 z-20 border-b bg-background/95 px-5 py-3 backdrop-blur md:px-8">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Bilancio</p><h1 className="text-lg font-semibold leading-tight">{active[1]}</h1></div>
            <div className="flex items-center gap-2">
              {/* Selettore anno */}
              <div className="flex items-center gap-1 rounded-xl border bg-card px-2 py-1.5">
                <button onClick={() => setYear(y => y-1)} className="rounded-lg p-1 hover:bg-secondary"><ChevronLeft className="size-4"/></button>
                <span className="text-sm font-semibold min-w-[36px] text-center">{year}</span>
                <button onClick={() => setYear(y => y+1)} className="rounded-lg p-1 hover:bg-secondary"><ChevronRight className="size-4"/></button>
              </div>
              {/* Salva su mobile */}
              <button onClick={save} disabled={saving} className="lg:hidden flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                <Save className="size-3.5"/>{saving ? '...' : 'Salva'}
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-5 py-6 md:px-8">
          {view==='dashboard' && <Dashboard s={state} year={year}/>}
          {view==='movimenti' && <Movements s={state} set={setState} year={year}/>}
          {view==='conti' && <Accounts s={state} set={setState}/>}
          {view==='budget' && <Budgets s={state} set={setState} year={year}/>}
          {view==='patrimonio' && <Assets s={state} set={setState}/>}
          {view==='piva' && <Piva s={state} year={year}/>}
          {view==='scadenze' && <Deadlines s={state} set={setState}/>}
          {view==='previsioni' && <Previsioni s={state}/>}
          {view==='advisor' && (
            <div className="flex flex-col gap-6">
              <Heading kicker="ADVISOR AI" title="Il tuo consulente finanziario" text="Analisi sui tuoi dati reali. Fai domande libere."/>
              <Card>
                <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1 pb-2">
                  {aiMessages.map((m,i) => (
                    <div key={i} className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap max-w-[90%] ${m.role==='user'?'bg-secondary self-end':'bg-primary/10 self-start border border-primary/20'}`}>
                      {m.role==='assistant' && <p className="text-xs font-semibold text-primary mb-1">🤖 Advisor</p>}
                      {m.content}
                    </div>
                  ))}
                  {aiLoading && <div className="self-start bg-primary/10 rounded-2xl px-4 py-3 text-sm text-muted-foreground animate-pulse border border-primary/20">Analizzo...</div>}
                  <div ref={aiBottomRef}/>
                </div>
                <div className="mt-4 flex gap-2 border-t pt-4">
                  <input className="flex-1 rounded-xl border bg-background px-3 h-10 text-sm focus:outline-none focus:border-primary" placeholder="Fai una domanda..." value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendAI(aiInput)}/>
                  <button onClick={()=>sendAI(aiInput)} disabled={aiLoading||!aiInput.trim()} className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">Invia</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Sto spendendo troppo?','Come ottimizzare le tasse P.IVA?','Fondo di emergenza adeguato?','Consigli sugli investimenti?'].map(q=>(
                    <button key={q} onClick={()=>sendAI(q)} className="text-xs border rounded-lg px-2 py-1 hover:bg-secondary text-muted-foreground">{q}</button>
                  ))}
                </div>
              </Card>
            </div>
          )}
          {view==='setup' && <Setup s={state} set={setState} onSave={save} saveMsg={saveMsg} saving={saving} logout={logout}/>}
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-2 bottom-2 z-30 flex gap-0.5 overflow-x-auto rounded-2xl border bg-card p-1.5 shadow-xl lg:hidden">
        {nav.map(([id,label,Icon]) => (
          <button key={id} onClick={()=>setView(id)} aria-label={label} className={`flex min-w-10 flex-col items-center gap-0.5 rounded-xl p-1.5 text-[9px] ${view===id?'bg-primary text-primary-foreground':'text-muted-foreground'}`}>
            <Icon className="size-4"/><span className="truncate max-w-[40px]">{label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// ── SHARED COMPONENTS ──
const Card = ({children,className=''}:{children:React.ReactNode;className?:string}) =>
  <article className={`rounded-2xl border bg-card p-5 shadow-sm ${className}`}>{children}</article>

const Heading = ({kicker,title,text}:{kicker:string;title:string;text:string}) => (
  <div><p className="text-sm font-semibold text-primary">{kicker}</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2><p className="mt-2 text-muted-foreground">{text}</p></div>
)
const Metric = ({label,value,detail,warn}:{label:string;value:number;detail?:string;warn?:boolean}) => (
  <Card><p className="text-sm text-muted-foreground">{label}</p><p className={`mt-3 text-2xl font-semibold tabular-nums ${warn?'text-destructive':''}`}>{money.format(value)}</p>{detail&&<p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</Card>
)
const Field = ({label,children}:{label:string;children:React.ReactNode}) => (
  <label className="flex flex-col gap-1.5 text-sm font-medium [&_input]:h-10 [&_input]:rounded-xl [&_input]:border [&_input]:bg-background [&_input]:px-3 [&_select]:h-10 [&_select]:rounded-xl [&_select]:border [&_select]:bg-background [&_select]:px-3">
    {label}{children}
  </label>
)
const FreqSelect = ({name,value,onChange}:{name?:string;value?:Freq;onChange?:(v:Freq)=>void}) => (
  <select name={name} value={value} onChange={e=>onChange?.(e.target.value as Freq)}>
    {(Object.keys(FREQ_LABEL) as Freq[]).map(f=><option key={f} value={f}>{FREQ_LABEL[f]}</option>)}
  </select>
)

// ── DASHBOARD ──
function Dashboard({s,year}:{s:BudgetState;year:number}) {
  const t = totals(s,year), m = monthlyData(s,year)
  const cats = s.categories.map(c=>({name:c.name,value:t.expenses.filter(e=>e.category===c.name).reduce((n,e)=>n+e.amount,0)})).filter(x=>x.value)
  const limPerc = (t.limiteAttivo<Infinity && t.limiteAttivo>0 && !isNaN(t.usatoLimite)) ? Math.min(100,t.usatoLimite*100) : null
  return (
    <div className="flex flex-col gap-7">
      <Heading kicker="PANORAMICA" title="Il quadro è sotto controllo." text="Liquidità, patrimonio e flussi in un unico posto."/>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Liquidità netta" value={t.liquidity}/>
        <Metric label="Patrimonio totale" value={t.netWorth}/>
        <Card>
          <p className="text-sm text-muted-foreground">Spese/mese equiv.</p>
          <p className={`mt-3 text-2xl font-semibold ${limPerc&&limPerc>90?'text-destructive':''}`}>{money.format(t.mensileSpese)}</p>
          {limPerc!==null && <><div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${limPerc}%`,background:limPerc>90?'var(--destructive)':limPerc>70?'hsl(38 92% 50%)':'var(--primary)'}}/></div><p className="mt-1 text-xs text-muted-foreground">{limPerc.toFixed(0)}% del limite {money.format(t.limiteAttivo)}/mese</p></>}
        </Card>
        <Metric label="Riserva fiscale P.IVA" value={t.reserve} detail={`Tasse stimate: ${money.format(t.tax+t.contributions)}`}/>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Card><h3 className="font-semibold">Andamento mensile</h3><p className="text-sm text-muted-foreground">Entrate e spese {year}</p><div className="mt-4 h-60"><ResponsiveContainer><AreaChart data={m}><CartesianGrid vertical={false} stroke="var(--border)"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip formatter={v=>money.format(Number(v))}/><Area dataKey="entrate" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={.13}/><Area dataKey="spese" stroke="var(--chart-2)" fill="transparent"/></AreaChart></ResponsiveContainer></div></Card>
        <Card><h3 className="font-semibold">Spese per categoria</h3><div className="h-44"><ResponsiveContainer><PieChart><Pie data={cats} dataKey="value" innerRadius={48} outerRadius={72}>{cats.map((_,i)=><Cell key={i} fill={`var(--chart-${i%3+1})`}/>)}</Pie><Tooltip formatter={v=>money.format(Number(v))}/></PieChart></ResponsiveContainer></div>{cats.slice(0,4).map(x=><div key={x.name} className="flex justify-between py-1 text-sm"><span className="text-muted-foreground">{x.name}</span><b>{money.format(x.value)}</b></div>)}</Card>
      </div>
    </div>
  )
}

// ── MOVIMENTI ──
function Movements({s,set,year}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;year:number}) {
  const [mode,setMode] = useState<'entrata'|'spesa'>('spesa')
  const [freq,setFreq] = useState<Freq>('mensile')
  const submit = (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f=new FormData(e.currentTarget)
    const base={id:uid(),date:String(f.get('date')),description:String(f.get('description')),amount:Number(f.get('amount')),kind:String(f.get('kind')) as Kind,accountId:String(f.get('accountId')),recurring:Boolean(f.get('recurring')),freq}
    if(!base.description||base.amount<=0)return
    set(x=>mode==='entrata'?{...x,incomes:[base,...x.incomes]}:{...x,expenses:[{...base,category:String(f.get('category'))},...x.expenses]})
    e.currentTarget.reset();setFreq('mensile')
  }
  const all=[...s.incomes.map(x=>({...x,type:'Entrata'})),...s.expenses.map(x=>({...x,type:'Spesa'}))].filter(x=>new Date(x.date).getFullYear()===year).sort((a,b)=>b.date.localeCompare(a.date))
  return (
    <div className="flex flex-col gap-6">
      <Heading kicker="REGISTRO" title="Tutti i movimenti" text={`Movimenti ${year} — usa le frecce in alto per cambiare anno.`}/>
      <form onSubmit={submit} className="grid gap-3 rounded-2xl border bg-card p-5 md:grid-cols-4">
        <Field label="Operazione"><select value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="spesa">Spesa</option><option value="entrata">Entrata</option></select></Field>
        <Field label="Data"><input name="date" type="date" required defaultValue={new Date().toISOString().slice(0,10)}/></Field>
        <Field label="Descrizione"><input name="description" required/></Field>
        <Field label="Importo (€)"><input name="amount" type="number" min=".01" step=".01" required/></Field>
        <Field label="Tipo"><select name="kind"><option value="personale">Personale</option><option value="piva">P.IVA</option></select></Field>
        <Field label="Conto"><select name="accountId">{s.accounts.map(a=><option key={a.id} value={a.id}>{TIPO_EMOJI[a.type]} {a.name}</option>)}</select></Field>
        <Field label="Frequenza"><FreqSelect value={freq} onChange={setFreq}/></Field>
        {mode==='spesa'&&<Field label="Categoria"><select name="category">{s.categories.map(c=><option key={c.id}>{c.name}</option>)}</select></Field>}
        <label className="flex items-center gap-2 text-sm col-span-full"><input name="recurring" type="checkbox"/>Ricorrente</label>
        <button className="col-span-full h-11 rounded-xl bg-primary px-4 font-semibold text-primary-foreground"><Plus className="mr-2 inline size-4"/>Aggiungi</button>
      </form>
      <Card className="overflow-x-auto p-0">
        <div className="min-w-[600px]">
          {all.map(x=>(
            <div key={x.id} className="grid grid-cols-[90px_1fr_70px_70px_110px_36px] items-center gap-2 border-b px-4 py-3 last:border-0">
              <span className="text-xs text-muted-foreground">{dateIt(x.date)}</span>
              <div><b className="text-sm">{x.description}</b><p className="text-xs text-muted-foreground">{x.kind==='piva'?'P.IVA':'Personale'}{x.freq&&x.freq!=='unica'?` · ${FREQ_LABEL[x.freq as Freq]}`:''}</p></div>
              <span className="text-xs">{x.type}</span>
              <span className="text-xs text-muted-foreground">{x.freq?FREQ_LABEL[x.freq as Freq]:''}</span>
              <b className="text-right text-sm">{money.format(x.amount)}</b>
              <button onClick={()=>set(v=>x.type==='Entrata'?{...v,incomes:v.incomes.filter(i=>i.id!==x.id)}:{...v,expenses:v.expenses.filter(i=>i.id!==x.id)})}><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button>
            </div>
          ))}
          {!all.length&&<p className="p-8 text-center text-sm text-muted-foreground">Nessun movimento nel {year}</p>}
        </div>
      </Card>
    </div>
  )
}

// ── CONTI ──
function Accounts({s,set}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>}) {
  const [tipo,setTipo]=useState<Account['type']>('conto')
  const [showForm,setShowForm]=useState(false)
  const submit=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const f=new FormData(e.currentTarget)
    const base:Account={id:uid(),name:String(f.get('name')),type:tipo,balance:Number(f.get('balance')),limit:0}
    if(tipo==='carta'){base.plafond=Number(f.get('plafond'));base.giornoEstratto=Number(f.get('estratto'));base.giornoAddebito=Number(f.get('addebito'));base.tassoRevolving=Number(f.get('revolving'));base.usaRevolving=Boolean(f.get('useRev'))}
    if(tipo==='fido'){base.fidoMax=Number(f.get('fidoMax'));base.fidoAlert=Number(f.get('fidoAlert'));base.fidoTasso=Number(f.get('fidoTasso'))}
    set(x=>({...x,accounts:[...x.accounts,base]}));e.currentTarget.reset();setShowForm(false)
  }
  return (
    <div className="flex flex-col gap-6">
      <Heading kicker="LIQUIDITÀ" title="Conti e carte" text="Saldi, debiti e disponibilità."/>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {s.accounts.map(a=>{
          const usatoCarta=a.type==='carta'?Math.abs(Math.min(0,a.balance)):0
          const percCarta=a.type==='carta'&&a.plafond?Math.min(100,usatoCarta/a.plafond*100):0
          const fidoUsato=a.type==='fido'?Math.max(0,-a.balance):0
          const showAlert=a.type==='fido'&&a.fidoAlert&&fidoUsato>a.fidoAlert
          return (
            <Card key={a.id} className={`border-t-4 ${a.type==='piva'?'border-t-amber-500':a.type==='carta'?'border-t-red-500':a.type==='fido'?'border-t-gray-400':a.type==='contanti'?'border-t-green-500':'border-t-primary'}`}>
              <div className="flex justify-between items-start">
                <div><p className="text-xs text-muted-foreground">{TIPO_EMOJI[a.type]} {TIPO_LABEL[a.type]}</p><h3 className="font-semibold">{a.name}</h3></div>
                <button onClick={()=>set(x=>({...x,accounts:x.accounts.filter(v=>v.id!==a.id)}))}><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button>
              </div>
              <p className={`mt-4 text-3xl font-semibold tabular-nums ${a.balance<0?'text-destructive':''}`}>{money.format(a.balance)}</p>
              {a.type==='carta'&&a.plafond&&<><div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden"><div className="h-full rounded-full" style={{width:`${percCarta}%`,background:percCarta>80?'var(--destructive)':'var(--primary)'}}/></div><p className="mt-1 text-xs text-muted-foreground">Disponibile {money.format(a.plafond-usatoCarta)} · Estratto gg {a.giornoEstratto} · Addebito gg {a.giornoAddebito}</p>{a.tassoRevolving&&a.tassoRevolving>0&&<p className="text-xs text-amber-600">Revolving {a.tassoRevolving}%/anno</p>}</>}
              {a.type==='fido'&&a.fidoMax&&<><p className="mt-2 text-xs text-muted-foreground">Fido max {money.format(a.fidoMax)} · Usato {money.format(fidoUsato)} · Tasso {a.fidoTasso}%</p>{showAlert&&<p className="mt-1 text-xs text-destructive font-semibold">⚠️ Soglia alert superata</p>}</>}
            </Card>
          )
        })}
        <button onClick={()=>setShowForm(v=>!v)} className="rounded-2xl border-2 border-dashed border-border hover:border-primary flex items-center justify-center gap-2 text-muted-foreground hover:text-primary p-5 min-h-[120px] transition-colors">
          <Plus className="size-5"/>Aggiungi conto
        </button>
      </div>
      {showForm&&(
        <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">
          <Field label="Nome conto"><input name="name" required placeholder="Es. Intesa, Revolut..."/></Field>
          <Field label="Tipo"><select value={tipo} onChange={e=>setTipo(e.target.value as Account['type'])}><option value="conto">🏦 Corrente</option><option value="piva">🧾 P.IVA</option><option value="carta">💳 Carta di credito</option><option value="fido">📋 Fido</option><option value="contanti">💵 Contanti</option></select></Field>
          <Field label="Saldo attuale (€)"><input name="balance" type="number" step=".01" defaultValue="0"/></Field>
          {tipo==='carta'&&<><Field label="Plafond (€)"><input name="plafond" type="number" placeholder="Es. 3000"/></Field><Field label="Giorno estratto"><input name="estratto" type="number" min="1" max="31" placeholder="Es. 1"/></Field><Field label="Giorno addebito"><input name="addebito" type="number" min="1" max="31" placeholder="Es. 15"/></Field><Field label="Tasso revolving (%/anno)"><input name="revolving" type="number" step=".1" placeholder="0"/></Field><label className="flex items-center gap-2 text-sm"><input name="useRev" type="checkbox"/>Usa revolving</label></>}
          {tipo==='fido'&&<><Field label="Importo massimo (€)"><input name="fidoMax" type="number" placeholder="Es. 5000"/></Field><Field label="Soglia alert (€)"><input name="fidoAlert" type="number" placeholder="Es. 3000"/></Field><Field label="Tasso annuo (%)"><input name="fidoTasso" type="number" step=".1" placeholder="Es. 8.5"/></Field></>}
          <div className="col-span-full flex gap-3"><button type="submit" className="h-10 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">Aggiungi</button><button type="button" onClick={()=>setShowForm(false)} className="h-10 rounded-xl border px-5 text-sm">Annulla</button></div>
        </form>
      )}
    </div>
  )
}

// ── BUDGET ──
function Budgets({s,set,year}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;year:number}) {
  const month=new Date().getMonth()
  const t=totals(s,year)
  const limPerc=t.limiteAttivo<Infinity?Math.min(100,t.usatoLimite*100):null
  return (
    <div className="flex flex-col gap-6">
      <Heading kicker="PIANO MENSILE" title="Budget per categoria" text="Confronta limiti e spesa del mese corrente."/>
      {limPerc!==null&&<Card className={limPerc>90?'border-destructive bg-destructive/5':''}><div className="flex justify-between items-center mb-2"><h3 className="font-semibold">Limite spesa mensile</h3><span className={`text-sm font-semibold ${limPerc>90?'text-destructive':'text-primary'}`}>{limPerc.toFixed(0)}%</span></div><div className="h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${limPerc}%`,background:limPerc>90?'var(--destructive)':limPerc>70?'hsl(38 92% 50%)':'var(--primary)'}}/></div><p className="mt-2 text-sm text-muted-foreground">{money.format(t.mensileSpese)} di {money.format(t.limiteAttivo)}/mese · Residui {money.format(Math.max(0,t.limiteAttivo-t.mensileSpese))}</p></Card>}
      <div className="grid gap-4 md:grid-cols-2">
        {s.categories.map(c=>{
          const spent=s.expenses.filter(e=>e.category===c.name&&new Date(e.date).getMonth()===month&&new Date(e.date).getFullYear()===year).reduce((n,e)=>n+e.amount,0)
          const p=Math.min(100,c.budget?spent/c.budget*100:0)
          return (
            <Card key={c.id}>
              <div className="flex items-center justify-between"><div><h3 className="font-semibold">{c.name}</h3><p className="text-sm text-muted-foreground">{money.format(spent)} di {money.format(c.budget)}</p></div><input aria-label={`Budget ${c.name}`} className="w-24 rounded-lg border bg-background p-2 text-right text-sm" type="number" value={c.budget} onChange={e=>set(x=>({...x,categories:x.categories.map(v=>v.id===c.id?{...v,budget:Number(e.target.value)}:v)}))}/></div>
              <div className="mt-4 h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{width:`${p}%`}}/></div>
              <p className="mt-2 text-xs text-muted-foreground">{p>=100?'Limite raggiunto':`${money.format(c.budget-spent)} residui`}</p>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── PATRIMONIO ──
function Assets({s,set}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>}) {
  const [showForm,setShowForm]=useState(false)
  const [movInvId,setMovInvId]=useState<string|null>(null)
  const [tipoMov,setTipoMov]=useState<AssetMovimento['tipo']>('versamento')
  const [freq,setFreq]=useState<Freq>('mensile')
  const pat=patrimoniTotals(s.assets)
  const rendPerc=pat.totVersato>0?(pat.rend/pat.totVersato*100):0
  const submitAsset=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const f=new FormData(e.currentTarget)
    const importo=Number(f.get('importoVers'))
    const a:Asset={id:uid(),name:String(f.get('name')),type:String(f.get('type')) as Asset['type'],paid:importo,value:importo,istituto:String(f.get('istituto')),freq,importoVers:importo,movimenti:importo>0?[{id:uid(),data:new Date().toISOString().slice(0,10),tipo:'versamento',importo,note:'Primo versamento'}]:[]}
    set(x=>({...x,assets:[...x.assets,a]}));e.currentTarget.reset();setShowForm(false)
  }
  const addMov=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const f=new FormData(e.currentTarget)
    const mov:AssetMovimento={id:uid(),data:String(f.get('data')),tipo:tipoMov,importo:Number(f.get('importo')),note:String(f.get('note'))||undefined}
    set(x=>({...x,assets:x.assets.map(a=>{
      if(a.id!==movInvId)return a
      const movs=[...(a.movimenti??[]),mov]
      const versato=movs.filter(m=>m.tipo==='versamento').reduce((n,m)=>n+m.importo,0)
      const prelevato=movs.filter(m=>m.tipo==='prelievo').reduce((n,m)=>n+m.importo,0)
      const ult=[...movs].filter(m=>m.tipo==='aggiornamento_valore').sort((x,y)=>y.data.localeCompare(x.data))[0]
      return{...a,movimenti:movs,paid:versato-prelevato,value:ult?ult.importo:a.value}
    })}));e.currentTarget.reset();setMovInvId(null)
  }
  return (
    <div className="flex flex-col gap-6">
      <Heading kicker="PATRIMONIO" title="Investimenti e polizze" text="Segui valore e rendimento nel tempo."/>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Versato netto" value={pat.totVersato}/>
        <Metric label="Valore attuale" value={pat.totValore}/>
        <Card><p className="text-sm text-muted-foreground">Rendimento totale</p><p className={`mt-3 text-2xl font-semibold ${pat.rend>=0?'text-green-600':'text-destructive'}`}>{pat.rend>=0?'+':''}{money.format(pat.rend)}</p><p className="mt-1 text-xs text-muted-foreground">{rendPerc>=0?'+':''}{rendPerc.toFixed(1)}%</p></Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {s.assets.map(a=>{
          const movs=(a.movimenti??[]).slice().sort((x,y)=>y.data.localeCompare(x.data))
          const versato=movs.filter(m=>m.tipo==='versamento').reduce((n,m)=>n+m.importo,0)
          const prelevato=movs.filter(m=>m.tipo==='prelievo').reduce((n,m)=>n+m.importo,0)
          const netto=versato-prelevato
          const ult=movs.find(m=>m.tipo==='aggiornamento_valore')
          const valore=ult?ult.importo:a.value
          const rend=valore-netto,rendP=netto>0?(rend/netto*100):0
          const catEmoji={finanziario:'📈',assicurativo:'🛡️',risparmio:'🏦'}[a.type]??'💰'
          return (
            <Card key={a.id}>
              <div className="flex justify-between items-start">
                <div><p className="text-xs text-muted-foreground">{catEmoji} {a.type}{a.istituto?` · ${a.istituto}`:''}</p><h3 className="font-semibold">{a.name}</h3>{a.freq&&<p className="text-xs text-muted-foreground mt-0.5">{FREQ_LABEL[a.freq]}{a.importoVers?` · ${money.format(a.importoVers)}`:''}</p>}</div>
                <div className="flex gap-2"><button onClick={()=>setMovInvId(a.id)} className="text-xs border rounded-lg px-2 py-1 hover:bg-secondary">+ Mov.</button><button onClick={()=>set(x=>({...x,assets:x.assets.filter(v=>v.id!==a.id)}))}><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-secondary p-2"><p className="text-xs text-muted-foreground">Versato</p><p className="font-semibold text-sm">{money.format(netto)}</p></div>
                <div className="rounded-xl bg-secondary p-2"><p className="text-xs text-muted-foreground">Valore</p><p className={`font-semibold text-sm ${valore>=netto?'text-green-600':'text-destructive'}`}>{money.format(valore)}</p></div>
                <div className="rounded-xl bg-secondary p-2"><p className="text-xs text-muted-foreground">Rendim.</p><p className={`font-semibold text-sm ${rend>=0?'text-green-600':'text-destructive'}`}>{rend>=0?'+':''}{rendP.toFixed(1)}%</p></div>
              </div>
              {movs.length>0&&<div className="mt-3 border-t pt-3">{movs.slice(0,3).map(m=><div key={m.id} className="flex justify-between py-1 text-xs text-muted-foreground"><span>{dateIt(m.data)} · {{versamento:'↓',prelievo:'↑',aggiornamento_valore:'📊'}[m.tipo]} {m.note||''}</span><span className={m.tipo==='prelievo'?'text-destructive':'text-green-600'}>{m.tipo==='prelievo'?'-':'+'}{money.format(m.importo)}</span></div>)}</div>}
              {movInvId===a.id&&<form onSubmit={addMov} className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2"><Field label="Tipo"><select value={tipoMov} onChange={e=>setTipoMov(e.target.value as AssetMovimento['tipo'])}><option value="versamento">Versamento</option><option value="prelievo">Prelievo</option><option value="aggiornamento_valore">Aggiorn. valore</option></select></Field><Field label="Data"><input name="data" type="date" required defaultValue={new Date().toISOString().slice(0,10)}/></Field><Field label="Importo (€)"><input name="importo" type="number" min=".01" step=".01" required/></Field><Field label="Note"><input name="note" placeholder="Facoltativo"/></Field><div className="col-span-full flex gap-2"><button type="submit" className="h-9 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Salva</button><button type="button" onClick={()=>setMovInvId(null)} className="h-9 rounded-xl border px-4 text-sm">Annulla</button></div></form>}
            </Card>
          )
        })}
        <button onClick={()=>setShowForm(v=>!v)} className="rounded-2xl border-2 border-dashed border-border hover:border-primary flex items-center justify-center gap-2 text-muted-foreground hover:text-primary p-5 min-h-[120px] transition-colors"><Plus className="size-5"/>Nuovo investimento</button>
      </div>
      {showForm&&<form onSubmit={submitAsset} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3"><Field label="Nome"><input name="name" required placeholder="Es. ETF World..."/></Field><Field label="Categoria"><select name="type"><option value="finanziario">📈 Investimento finanziario</option><option value="assicurativo">🛡️ Assicurativo / Previdenziale</option><option value="risparmio">🏦 Risparmio vincolato</option></select></Field><Field label="Istituto"><input name="istituto" placeholder="Es. Fineco, Generali..."/></Field><Field label="Frequenza versamento"><FreqSelect value={freq} onChange={setFreq}/></Field><Field label="Importo versamento (€)"><input name="importoVers" type="number" step=".01" placeholder="0"/></Field><div className="col-span-full flex gap-3"><button type="submit" className="h-10 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">Aggiungi</button><button type="button" onClick={()=>setShowForm(false)} className="h-10 rounded-xl border px-5 text-sm">Annulla</button></div></form>}
    </div>
  )
}

// ── PIVA ──
function Piva({s,year}:{s:BudgetState;year:number}) {
  const t=totals(s,year),due=t.tax+t.contributions
  return (
    <div className="flex flex-col gap-6">
      <Heading kicker="REGIME FORFETTARIO" title="La tua P.IVA, senza sorprese" text="Stima fiscale aggiornata sui movimenti registrati."/>
      <div className="grid gap-4 md:grid-cols-4"><Metric label="Fatturato" value={t.pivaIncome}/><Metric label="Imponibile" value={t.taxable}/><Metric label="Contributi" value={t.contributions}/><Metric label="Imposta" value={t.tax}/></div>
      <Card className="bg-primary text-primary-foreground"><p className="opacity-70">Totale fiscale stimato {year}</p><p className="mt-3 text-4xl font-semibold">{money.format(due)}</p><p className="mt-4">Accantonato {money.format(t.reserve)} · {t.reserve>=due?'Copertura completa':`Mancano ${money.format(due-t.reserve)}`}</p></Card>
      <Card><h3 className="font-semibold mb-3">Scadenze fiscali {year}</h3>{[['30 giugno','Acconto INPS 1ª rata',due/2],['30 giugno','Imposta sostitutiva (acconto)',t.tax*0.4],['30 novembre','Acconto INPS 2ª rata',due/2]].map(([data,label,importo])=><div key={String(label)} className="flex justify-between py-2 border-b last:border-0 text-sm"><div><b>{String(label)}</b><p className="text-xs text-muted-foreground">{String(data)}</p></div><span className="font-semibold">{money.format(Number(importo))}</span></div>)}</Card>
    </div>
  )
}

// ── SCADENZE ──
function Deadlines({s,set}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>}) {
  const [showForm,setShowForm]=useState(false)
  const [freq,setFreq]=useState<Freq>('unica')
  const submit=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const f=new FormData(e.currentTarget)
    set(x=>({...x,deadlines:[...x.deadlines,{id:uid(),title:String(f.get('title')),date:String(f.get('date')),amount:Number(f.get('amount')),paid:false,priority:String(f.get('priority')) as Deadline['priority'],freq}]}))
    e.currentTarget.reset();setShowForm(false)
  }
  return (
    <div className="flex flex-col gap-6">
      <Heading kicker="CALENDARIO" title="Scadenze" text="Obblighi fiscali e pagamenti futuri."/>
      <button onClick={()=>setShowForm(v=>!v)} className="self-start flex items-center gap-2 rounded-xl bg-primary px-4 h-10 text-sm font-semibold text-primary-foreground"><Plus className="size-4"/>Aggiungi scadenza</button>
      {showForm&&<form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3"><Field label="Descrizione"><input name="title" required placeholder="Es. Assicurazione auto"/></Field><Field label="Data"><input name="date" type="date" required/></Field><Field label="Importo (€)"><input name="amount" type="number" step=".01" required/></Field><Field label="Priorità"><select name="priority"><option value="alta">Alta</option><option value="media">Media</option><option value="bassa">Bassa</option></select></Field><Field label="Frequenza"><FreqSelect value={freq} onChange={setFreq}/></Field><div className="col-span-full flex gap-3"><button type="submit" className="h-10 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">Aggiungi</button><button type="button" onClick={()=>setShowForm(false)} className="h-10 rounded-xl border px-5 text-sm">Annulla</button></div></form>}
      {s.deadlines.sort((a,b)=>a.date.localeCompare(b.date)).map(d=>(
        <Card key={d.id}>
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={()=>set(x=>({...x,deadlines:x.deadlines.map(v=>v.id===d.id?{...v,paid:!v.paid}:v)}))} className={`rounded-full px-3 py-1 text-xs font-semibold ${d.paid?'bg-secondary':'bg-primary text-primary-foreground'}`}>{d.paid?'Pagata':'Da pagare'}</button>
            <div className="flex-1"><h3 className={d.paid?'line-through opacity-60 font-semibold':'font-semibold'}>{d.title}</h3><p className="text-sm text-muted-foreground">{dateIt(d.date)} · Priorità {d.priority}{d.freq&&d.freq!=='unica'?` · ${FREQ_LABEL[d.freq]}`:''}</p></div>
            <b>{money.format(d.amount)}</b>
            <button onClick={()=>set(x=>({...x,deadlines:x.deadlines.filter(v=>v.id!==d.id)}))}><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ── PREVISIONI ──
function Previsioni({s}:{s:BudgetState}) {
  const [data,setData]=useState('')
  const addMesi=(n:number)=>{const d=new Date();d.setMonth(d.getMonth()+n);setData(d.toISOString().slice(0,10))}
  const t=totals(s,new Date().getFullYear())
  const speseCorr=s.expenses.filter(e=>!IS_PATRIMONIO(e.category))
  const speseAttive=data?speseCorr.filter(e=>!e.date||new Date(e.date)>=new Date(data)):speseCorr
  const speseScadute=data?speseCorr.filter(e=>e.date&&new Date(e.date)<new Date(data)):[]
  const mensileAttive=speseAttive.reduce((n,e)=>n+toMensile(e.amount,e.freq),0)
  const risparmio=speseScadute.reduce((n,e)=>n+toMensile(e.amount,e.freq),0)
  const tasse=Math.max(0,t.tax+t.contributions-t.reserve)
  return (
    <div className="flex flex-col gap-6">
      <Heading kicker="SIMULAZIONE" title="Previsioni future" text="Vedi come cambia la situazione nel tempo."/>
      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <Field label="Data di simulazione"><input type="date" value={data} onChange={e=>setData(e.target.value)}/></Field>
          <div className="flex gap-2 pb-0.5">{[[1,'+1m'],[3,'+3m'],[6,'+6m'],[12,'+1a']].map(([n,l])=><button key={l} onClick={()=>addMesi(Number(n))} className="h-10 rounded-xl border px-3 text-sm hover:bg-secondary">{l}</button>)}</div>
        </div>
      </Card>
      {data&&<>
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="Liquidità attuale" value={t.liquidity}/>
          <Metric label="Spese mensili attive" value={mensileAttive}/>
          <Metric label="Tasse P.IVA residue" value={tasse} warn={tasse>0}/>
        </div>
        {speseScadute.length>0&&<Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20"><h3 className="font-semibold text-green-700 dark:text-green-400 mb-3">✅ Spese che cessano entro {dateIt(data)}</h3>{speseScadute.map(e=><div key={e.id} className="flex justify-between py-2 border-b last:border-0 text-sm"><span className="line-through text-muted-foreground">{e.description} · {FREQ_LABEL[e.freq]}</span><span className="text-green-600 font-semibold">-{money.format(toMensile(e.amount,e.freq))}/mese</span></div>)}<p className="mt-3 font-semibold text-green-700 dark:text-green-400">Risparmio: {money.format(risparmio)}/mese</p></Card>}
        <Card><h3 className="font-semibold mb-3">Spese ancora attive</h3>{speseAttive.map(e=><div key={e.id} className="flex justify-between py-2 border-b last:border-0 text-sm"><span>{e.description} <span className="text-xs text-muted-foreground">· {FREQ_LABEL[e.freq]}</span></span><span className="font-semibold">{money.format(toMensile(e.amount,e.freq))}/mese</span></div>)}{!speseAttive.length&&<p className="text-muted-foreground text-sm">Nessuna spesa attiva</p>}</Card>
      </>}
    </div>
  )
}

// ── SETUP ──
function Setup({s,set,onSave,saveMsg,saving,logout}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;onSave:()=>void;saveMsg:string;saving:boolean;logout:()=>void}) {
  const update=(k:keyof BudgetState['profile'],v:string)=>set(x=>({...x,profile:{...x.profile,[k]:k==='name'||k==='ateco'?v:Number(v)}}))
  const [newCat,setNewCat]=useState('')
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Heading kicker="CONFIGURAZIONE" title="Impostazioni" text="Profilo fiscale, limiti e categorie."/>
      <Card>
        <h3 className="font-semibold mb-4">Profilo fiscale P.IVA</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {([['name','Nome',true],['ateco','Codice ATECO',true],['profitability','Redditività %',false],['substituteTax','Imposta %',false],['contributions','Contributi %',false],['taxReserve','Accantonamento %',false]] as const).map(([k,l,isText])=>(
            <Field key={k} label={l}><input type={isText?'text':'number'} value={s.profile[k]} onChange={e=>update(k,e.target.value)}/></Field>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="font-semibold mb-4">Limite di spesa mensile</h3>
        <p className="text-sm text-muted-foreground mb-4">Vince il più restrittivo tra i due. 0 = disabilitato.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Limite fisso (€/mese)"><input type="number" value={s.limiteSpesa.fisso} onChange={e=>set(x=>({...x,limiteSpesa:{...x.limiteSpesa,fisso:Number(e.target.value)}}))} /></Field>
          <Field label="Limite % sulle entrate"><input type="number" min="0" max="100" value={s.limiteSpesa.perc} onChange={e=>set(x=>({...x,limiteSpesa:{...x.limiteSpesa,perc:Number(e.target.value)}}))} /></Field>
        </div>
      </Card>
      <Card>
        <h3 className="font-semibold mb-4">Categorie di spesa</h3>
        <div className="flex flex-wrap gap-2 mb-4">{s.categories.map(c=><span key={c.id} className="flex items-center gap-1 rounded-full border bg-secondary px-3 py-1 text-sm">{c.name}<button onClick={()=>set(x=>({...x,categories:x.categories.filter(v=>v.id!==c.id)}))} className="text-muted-foreground hover:text-destructive ml-1">×</button></span>)}</div>
        <div className="flex gap-2"><input className="flex-1 h-10 rounded-xl border bg-background px-3 text-sm" placeholder="Nuova categoria..." value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newCat){set(x=>({...x,categories:[...x.categories,{id:uid(),name:newCat,budget:0}]}));setNewCat('')}}}/><button onClick={()=>{if(newCat){set(x=>({...x,categories:[...x.categories,{id:uid(),name:newCat,budget:0}]}));setNewCat('')}}} className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">+</button></div>
      </Card>
      <div className="flex flex-wrap gap-3">
        <button onClick={onSave} disabled={saving} className="flex items-center gap-2 h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50"><Save className="size-4"/>{saving?'Salvataggio...':'Salva tutto'}</button>
        {saveMsg&&<span className="flex items-center text-sm text-muted-foreground">{saveMsg}</span>}
        <button onClick={()=>{set(demoState)}} className="inline-flex h-11 items-center gap-2 rounded-xl border bg-card px-4 font-semibold text-sm hover:bg-secondary"><RotateCcw className="size-4"/>Ripristina demo</button>
        <button onClick={logout} className="inline-flex h-11 items-center gap-2 rounded-xl border border-destructive/30 bg-card px-4 font-semibold text-sm text-destructive hover:bg-destructive/5"><LogOut className="size-4"/>Esci dall'account</button>
      </div>
    </div>
  )
}
