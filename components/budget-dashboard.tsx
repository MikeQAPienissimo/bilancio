'use client'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownLeft, BadgeEuro, Bell, BrainCircuit, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronRight, ChevronLeft, CircleDollarSign, FileUp, Landmark, LayoutDashboard, LogOut, MoreHorizontal, Pencil, PiggyBank, Plus, Repeat2, RotateCcw, Save, Settings2, Target, Trash2, TrendingUp, WalletCards, X } from 'lucide-react'
import { Account, Asset, AssetMovimento, BenefitAccreditMode, BenefitTransaction, BenefitType, BenefitWallet, BudgetState, Deadline, Expense, Financing, FinancingCategory, Freq, FREQ_LABEL, FREQ_MULT, Income, InterestMode, Kind, ResidualMode, SavingsGoal, Simulation, SimulationType, WelfareCategory, createEmptyState, dateFullIt, dateIt, financingInstallmentSchedule, financingPrincipalReduction, financingRemainingInstallments, financingStatusFromSchedule, installmentAmount, installmentEndDate, installmentProgress, isActiveAt, migrate, money, monthlyData, nextInstallmentAfter, patrimoniTotals, remainingInstallmentCount, roundCurrency, toMensile, totals, uid } from '@/lib/budget'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase-config'

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

type View = 'dashboard'|'movimenti'|'conti'|'budget'|'patrimonio'|'finanziamenti'|'abbonamenti'|'obiettivi'|'piva'|'scadenze'|'previsioni'|'advisor'|'setup'
const nav = [
  ['dashboard','Dashboard',LayoutDashboard],
  ['movimenti','Movimenti',ArrowDownLeft],
  ['conti','Conti e carte',WalletCards],
  ['budget','Budget',CircleDollarSign],
  ['patrimonio','Patrimonio',Landmark],
  ['finanziamenti','Finanziamenti',BadgeEuro],
  ['abbonamenti','Abbonamenti',Repeat2],
  ['obiettivi','Obiettivi',Target],
  ['piva','P.IVA',BriefcaseBusiness],
  ['scadenze','Scadenze',CalendarDays],
  ['previsioni','Previsioni',CalendarDays],
  ['advisor','Advisor AI',BrainCircuit],
  ['setup','Impostazioni',Settings2],
] as const
const navGroups = [
  { label: 'OGGI', ids: ['dashboard','movimenti'] as View[] },
  { label: 'GESTIONE', ids: ['conti','patrimonio','abbonamenti'] as View[] },
  { label: 'PIANIFICA', ids: ['budget','scadenze','previsioni','finanziamenti','obiettivi'] as View[] },
  { label: 'STRUMENTI', ids: ['piva','advisor','setup'] as View[] }
]
const planningViews:View[]=['budget','scadenze','previsioni','finanziamenti','obiettivi','abbonamenti']
const moreViews:View[]=['conti','piva','advisor','setup']
const navDescription:Record<View,string>={dashboard:'Situazione in un colpo d’occhio',movimenti:'Entrate, spese e accrediti',conti:'Conti, carte e disponibilità',budget:'Limiti per categoria',patrimonio:'Investimenti e benefit',finanziamenti:'Mutui, prestiti e rate',abbonamenti:'Costi ricorrenti attivi',obiettivi:'Risparmio e fondo emergenza',piva:'Fisco e accantonamenti',scadenze:'Calendario dei pagamenti',previsioni:'Scenari e sostenibilità',advisor:'Analisi sui tuoi dati',setup:'Profilo e personalizzazione'}

const TIPO_EMOJI: Record<string,string> = {conto:'🏦',carta:'💳',fido:'📋',contanti:'💵',piva:'🧾'}
const TIPO_LABEL: Record<string,string> = {conto:'Corrente',carta:'Carta credito',fido:'Fido',contanti:'Contanti',piva:'P.IVA'}
const FINANCING_LABEL: Record<FinancingCategory,string> = {mutuo:'Mutuo',auto:'Auto',prestito:'Prestito',leasing:'Leasing',altro:'Altro'}
const SIMULATION_LABEL: Record<SimulationType,string> = {mutuo:'Nuovo mutuo',finanziamento:'Nuovo finanziamento',spesa:'Nuova spesa',entrata:'Nuova entrata'}
const BENEFIT_LABEL: Record<BenefitType,string> = {meal:'Buoni pasto',welfare:'Credito welfare',fuel:'Carta / buoni carburante'}
const WELFARE_LABEL: Record<WelfareCategory,string> = {shopping:'Buoni acquisto',health:'Salute e assistenza sanitaria',education:'Istruzione e formazione',transport:'Trasporto pubblico e mobilità',care:'Assistenza familiare',sport:'Sport e benessere',culture:'Cultura e ricreazione',travel:'Viaggi e tempo libero',pension:'Previdenza complementare',other:'Altro welfare'}
const IS_PATRIMONIO = (cat: string) => ['finanziario','assicurativo','risparmio'].includes(cat)

// ── AUTH SCREEN ──
function AuthScreen() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [authError, setAuthError] = useState('')

  const loginGoogle = async () => {
    setAuthError('')
    setLoading(true)
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) {
      setAuthError(error.message)
      setLoading(false)
    }
  }

  const loginEmail = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return
    setAuthError('')
    setLoading(true)
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    setLoading(false)
    if (!error) setSent(true)
    else setAuthError(error.message)
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
                Continua con Google
              </button>
              <div className="relative mb-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t"/></div><div className="relative flex justify-center text-xs text-muted-foreground bg-card px-2">oppure usa qualsiasi email</div></div>
              <form onSubmit={loginEmail} className="flex flex-col gap-3">
                <input type="email" placeholder="nome@esempio.it" value={email} onChange={e=>setEmail(e.target.value)} required className="h-11 rounded-xl border bg-background px-3 text-sm focus:outline-none focus:border-primary"/>
                <button type="submit" disabled={loading} className="h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">Invia link di accesso</button>
                <p className="text-xs text-muted-foreground">Funziona con Outlook, Hotmail, Yahoo, email aziendali e Gmail.</p>
              </form>
              {authError&&<p className="mt-3 text-sm text-destructive">{authError}</p>}
            </>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">I dati finanziari vengono inviati all’AI solo quando usi Advisor AI.</p>
      </div>
    </div>
  )
}

// ── MAIN APP ──
export function BudgetDashboard() {
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [state, setState] = useState<BudgetState>(() => createEmptyState())
  const [view, setView] = useState<View>('dashboard')
  const [mobileMenu,setMobileMenu]=useState<'planning'|'more'|null>(null)
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
    setState(createEmptyState())
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
    setState(createEmptyState())
    setAiMessages([])
    setAiAutoRan(false)
  }

  useEffect(() => {
    aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages, aiLoading])

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
- Debiti residui finanziamenti/mutui: ${money.format(t.financingDebt)}
- Conti: ${state.accounts.map(a=>`${a.name} (${TIPO_LABEL[a.type]}): ${money.format(a.balance)}`).join(', ')}
- Entrate personali: ${money.format(t.personalIncome)} | Introiti P.IVA: ${money.format(t.pivaIncome)} | Spese: ${money.format(t.totalExpense)}
- Spese mensili equiv.: ${money.format(t.mensileSpese)}
- Rate mensili equiv.: ${money.format(t.monthlyFinancing)}
- Limite mensile: ${t.limiteAttivo < Infinity ? money.format(t.limiteAttivo)+'/mese ('+Math.round(t.usatoLimite*100)+'% usato)' : 'nessuno'}
- Investimenti: versato ${money.format(pat.totVersato)}, valore ${money.format(pat.totValore)}, rendimento ${money.format(pat.rend)}
- P.IVA: fatturato ${money.format(t.pivaIncome)}, tasse stimate ${money.format(t.tax+t.contributions)}, accantonato ${money.format(t.reserve)}
- Finanziamenti: ${state.financings.map(f=>`${f.name}, residuo ${money.format(f.residualAmount)} (${f.residualMode==='principal'?'solo capitale':'totale dovuto'}), rata ${money.format(toMensile(f.paymentAmount,f.freq))}/mese, ${financingRemainingInstallments(f)} rate mancanti`).join('; ') || 'nessuno'}
- Abbonamenti: ${state.expenses.filter(e=>e.subscription).map(e=>`${e.description} ${money.format(toMensile(e.amount,e.freq))}/mese`).join('; ') || 'nessuno'}
- Obiettivi: ${state.goals.map(g=>`${g.name}: ${money.format(g.currentAmount)} di ${money.format(g.targetAmount)}`).join('; ') || 'nessuno'}
- Benefit e welfare: ${state.benefits.map(b=>`${b.name}: saldo ${money.format(b.balance)}${b.expiryDate?`, scadenza ${b.expiryDate}`:''}`).join('; ') || 'nessuno'}
- Spese principali: ${state.expenses.slice(0,6).map(e=>`${e.description} ${money.format(e.amount)} (${FREQ_LABEL[e.freq]})`).join(', ')}`
  }

  const sendAI = async (msg: string) => {
    if (!msg.trim()) return
    const newMsgs = [...aiMessages, { role: 'user' as const, content: msg }]
    setAiMessages(newMsgs); setAiInput(''); setAiLoading(true)
    try {
      const { data: { session } } = await sb.auth.getSession()
      if (!session?.access_token) throw new Error('Sessione scaduta: esci e accedi di nuovo.')

      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ system: buildAiContext(), messages: newMsgs })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Il servizio AI non è disponibile.')
      if (typeof data.content !== 'string' || !data.content.trim()) throw new Error('L’AI non ha restituito una risposta.')
      setAiMessages(m => [...m, { role: 'assistant', content: data.content }])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore di connessione.'
      setAiMessages(m => [...m, { role: 'assistant', content: message }])
    } finally {
      setAiLoading(false)
    }
  }

  const userName = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Utente'
  const openView=(id:View)=>{setView(id);setMobileMenu(null);if(id==='advisor'&&!aiAutoRan){setAiAutoRan(true);void sendAI('Analizza la mia situazione finanziaria: evidenzia 3 punti di forza, 2 rischi urgenti e 3 azioni concrete da fare subito.')}}
  const sectionLabel=navGroups.find(group=>group.ids.includes(view))?.label.toLocaleLowerCase('it-IT').replace(/^./,letter=>letter.toUpperCase())??'Bilancio'
  const sheetItems=(mobileMenu==='planning'?planningViews:moreViews).map(id=>nav.find(item=>item[0]===id)!).filter(Boolean)

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r bg-card px-4 py-5 lg:flex overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Landmark className="size-4"/></div>
          <div><p className="font-bold text-sm">Bilancio</p><p className="text-xs text-muted-foreground truncate max-w-[110px]">{userName}</p></div>
        </div>
        <nav className="flex flex-1 flex-col gap-4">
          {navGroups.map(group=><section key={group.label}><p className="mb-1 px-3 text-[10px] font-bold tracking-[.16em] text-muted-foreground/60">{group.label}</p><div className="flex flex-col gap-0.5">{group.ids.map(id=>{const item=nav.find(value=>value[0]===id)!;const [,label,Icon]=item;return <button key={id} onClick={()=>openView(id)} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${view===id?'bg-primary text-primary-foreground shadow-sm':'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}><Icon className="size-4 shrink-0"/>{label}<ChevronRight className="ml-auto size-3 opacity-40"/></button>})}</div></section>)}
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
            <div><p className="text-xs font-semibold uppercase tracking-widest text-primary">{sectionLabel}</p><h1 className="text-lg font-semibold leading-tight">{active[1]}</h1></div>
            <div className="flex items-center gap-2">
              {/* Selettore anno */}
              <div className="flex items-center gap-1 rounded-xl border bg-card px-2 py-1.5">
                <button onClick={() => setYear(y => y-1)} className="rounded-lg p-1 hover:bg-secondary"><ChevronLeft className="size-4"/></button>
                <span className="text-sm font-semibold min-w-[36px] text-center">{year}</span>
                <button onClick={() => setYear(y => y+1)} className="rounded-lg p-1 hover:bg-secondary"><ChevronRight className="size-4"/></button>
              </div>
              {/* Salva su mobile */}
              <button onClick={()=>openView('movimenti')} className="lg:hidden grid size-8 place-items-center rounded-xl border bg-card text-primary" aria-label="Nuovo movimento"><Plus className="size-4"/></button>
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
          {view==='finanziamenti' && <Financings s={state} set={setState} onOpenDeadlines={()=>setView('scadenze')}/>}
          {view==='abbonamenti' && <Subscriptions s={state} set={setState} onOpenMovements={()=>setView('movimenti')}/>}
          {view==='obiettivi' && <Goals s={state} set={setState} year={year}/>}
          {view==='piva' && <Piva s={state} year={year}/>}
          {view==='scadenze' && <Deadlines s={state} set={setState}/>}
          {view==='previsioni' && <Previsioni s={state} set={setState}/>}
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

      {mobileMenu&&<div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] lg:hidden" onClick={()=>setMobileMenu(null)}><div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[28px] border-t bg-card px-5 pb-7 pt-3 shadow-2xl" onClick={event=>event.stopPropagation()}><div className="mx-auto mb-4 h-1 w-11 rounded-full bg-border"/><div className="mb-4 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">{mobileMenu==='planning'?'Pianifica':'Tutto il resto'}</p><h2 className="mt-1 text-xl font-semibold">{mobileMenu==='planning'?'Organizza il futuro':'Conti e strumenti'}</h2><p className="mt-1 text-sm text-muted-foreground">{mobileMenu==='planning'?'Budget, scadenze, debiti e obiettivi.':'Funzioni utili, senza affollare la barra.'}</p></div><button onClick={()=>setMobileMenu(null)} className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary" aria-label="Chiudi menu"><X className="size-4"/></button></div><div className="grid grid-cols-2 gap-3">{sheetItems.map(([id,label,Icon])=><button key={id} onClick={()=>openView(id)} className={`rounded-2xl border p-4 text-left transition-colors ${view===id?'border-primary bg-primary/10':'bg-background hover:bg-secondary'}`}><div className={`grid size-9 place-items-center rounded-xl ${view===id?'bg-primary text-primary-foreground':'bg-secondary text-primary'}`}><Icon className="size-4"/></div><p className="mt-3 text-sm font-semibold">{label}</p><p className="mt-1 text-[11px] leading-snug text-muted-foreground">{navDescription[id]}</p></button>)}</div></div></div>}
      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 rounded-[24px] border bg-card/95 p-1.5 shadow-2xl backdrop-blur lg:hidden" style={{paddingBottom:'max(.375rem, env(safe-area-inset-bottom))'}}>
        {([['dashboard','Home',LayoutDashboard],['movimenti','Movimenti',ArrowDownLeft],['planning','Pianifica',TrendingUp],['patrimonio','Patrimonio',Landmark],['more','Altro',MoreHorizontal]] as const).map(([id,label,Icon])=>{const selected=id==='planning'?planningViews.includes(view):id==='more'?moreViews.includes(view):view===id;return <button key={id} onClick={()=>id==='planning'?setMobileMenu(value=>value==='planning'?null:'planning'):id==='more'?setMobileMenu(value=>value==='more'?null:'more'):openView(id)} className={`flex min-w-0 flex-col items-center gap-1 rounded-[18px] px-1 py-2 text-[10px] font-semibold transition-colors ${selected?'bg-primary/10 text-primary':'text-muted-foreground'}`}><Icon className={`size-[18px] ${selected?'stroke-[2.5]':''}`}/><span className="w-full truncate text-center">{label}</span></button>})}
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
const InstallmentFreqSelect = ({value,onChange}:{value:Freq;onChange:(v:Freq)=>void}) => (
  <select value={value} onChange={e=>onChange(e.target.value as Freq)}>
    {(Object.keys(FREQ_LABEL) as Freq[]).filter(f=>f!=='unica').map(f=><option key={f} value={f}>{FREQ_LABEL[f]}</option>)}
  </select>
)
const EditButton = ({onClick,label}:{onClick:()=>void;label:string}) => <button type="button" onClick={onClick} aria-label={label} title={label}><Pencil className="size-4 text-muted-foreground hover:text-primary"/></button>
const Gauge = ({label,value,detail,invert=false}:{label:string;value:number;detail:string;invert?:boolean}) => {
  const normalized=Math.max(0,Math.min(100,Number.isFinite(value)?value:0))
  const bad=invert?normalized>65:normalized<50
  const color=bad?'var(--destructive)':normalized>75?'hsl(142 71% 38%)':'var(--primary)'
  return <div className="rounded-2xl border bg-card p-4 text-center shadow-sm"><div className="mx-auto h-28 max-w-44"><ResponsiveContainer><RadialBarChart cx="50%" cy="82%" innerRadius="72%" outerRadius="100%" startAngle={180} endAngle={0} data={[{value:normalized}]}><PolarAngleAxis type="number" domain={[0,100]} tick={false}/><RadialBar dataKey="value" background cornerRadius={12} fill={color}/></RadialBarChart></ResponsiveContainer></div><p className="-mt-7 text-2xl font-semibold">{Math.round(normalized)}%</p><p className="mt-2 text-sm font-semibold">{label}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
}

// ── DASHBOARD ──
function Dashboard({s,year}:{s:BudgetState;year:number}) {
  const t = totals(s,year), m = monthlyData(s,year)
  const today=new Date().toISOString().slice(0,10)
  const addDays=(days:number)=>{const value=new Date(`${today}T12:00:00`);value.setDate(value.getDate()+days);return value.toISOString().slice(0,10)}
  const categoryNames=[...new Set(t.expenses.map(expense=>expense.category||'Senza categoria'))]
  const cats = categoryNames.map(name=>({name,value:t.expenses.filter(e=>e.category===name).reduce((n,e)=>n+e.amount,0)})).filter(x=>x.value).sort((a,b)=>b.value-a.value)
  const limPerc = (t.limiteAttivo<Infinity && t.limiteAttivo>0 && !isNaN(t.usatoLimite)) ? Math.min(100,t.usatoLimite*100) : null
  const recurringIncome=s.incomes.filter(item=>item.recurring&&item.incomeClass!=='benefit').reduce((total,item)=>total+toMensile(item.amount,item.freq??'mensile'),0)
  const monthlyIncome=recurringIncome>0?recurringIncome:t.totalIncome/12
  const recurringPiva=s.incomes.filter(item=>item.recurring&&item.kind==='piva'&&item.incomeClass!=='benefit').reduce((total,item)=>total+toMensile(item.amount,item.freq??'mensile'),0)
  const monthlyMargin=monthlyIncome-t.mensileSpese-recurringPiva*s.profile.taxReserve/100
  const savingsRate=monthlyIncome>0?(monthlyIncome-t.mensileSpese)/monthlyIncome*100:0
  const debtRatio=monthlyIncome>0?t.monthlyFinancing/monthlyIncome*100:0
  const fiscalDue=t.tax+t.contributions
  const reserveCoverage=fiscalDue>0?t.reserve/fiscalDue*100:100
  const budgetUsage=limPerc??0
  const openSubscriptions=s.expenses.filter(expense=>expense.subscription&&!expense.subscription.endDate&&isActiveAt(expense.subscription.startDate,null,today))
  const monthlySubscriptions=openSubscriptions.reduce((total,expense)=>total+toMensile(expense.amount,expense.freq),0)
  const forecast=[30,60,90].map(days=>{
    const end=addDays(days)
    const oneOff=s.deadlines.filter(item=>!item.paid&&item.date>=today&&item.date<=end).reduce((total,item)=>total+item.amount,0)
    return {days,value:t.liquidity+monthlyMargin*(days/30)-oneOff}
  })
  const alerts=[
    ...s.deadlines.filter(item=>!item.paid&&item.date<=addDays(7)).map(item=>({id:`d-${item.id}`,date:item.date,title:item.title,detail:item.date<today?'Scaduta':item.date===today?'Scade oggi':'Entro 7 giorni',amount:item.amount,urgent:item.date<=today})),
    ...s.financings.flatMap(item=>financingInstallmentSchedule(item).slice(0,1).filter(rate=>rate.date<=addDays(7)).map(rate=>({id:`f-${item.id}`,date:rate.date,title:`Rata ${item.name}`,detail:rate.date<today?'Scaduta':rate.date===today?'Scade oggi':'Entro 7 giorni',amount:rate.amount,urgent:rate.date<=today}))),
    ...s.expenses.filter(item=>item.subscription?.endDate&&item.subscription.endDate>=today&&item.subscription.endDate<=addDays(30)).map(item=>({id:`s-${item.id}`,date:item.subscription!.endDate!,title:`Termina ${item.description}`,detail:'Abbonamento in scadenza',amount:item.amount,urgent:false})),
    ...s.benefits.filter(item=>item.balance>0&&item.expiryDate&&item.expiryDate<=addDays(30)).map(item=>({id:`b-${item.id}`,date:item.expiryDate!,title:`Scade ${item.name}`,detail:item.expiryDate!<today?'Credito scaduto':'Benefit in scadenza',amount:item.balance,urgent:item.expiryDate!<=today}))
  ].sort((a,b)=>a.date.localeCompare(b.date))
  const topGoals=[...s.goals].sort((a,b)=>(b.targetAmount?b.currentAmount/b.targetAmount:0)-(a.targetAmount?a.currentAmount/a.targetAmount:0)).slice(0,3)
  return (
    <div className="flex flex-col gap-7">
      <Heading kicker="PANORAMICA" title="Il quadro è sotto controllo." text="Liquidità, patrimonio e flussi in un unico posto."/>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Liquidità netta" value={t.liquidity}/>
        <Metric label="Patrimonio netto" value={t.netWorth} detail={t.financingDebt>0?`Debiti residui: ${money.format(t.financingDebt)}`:undefined}/>
        <Card>
          <p className="text-sm text-muted-foreground">Spese/mese equiv.</p>
          <p className={`mt-3 text-2xl font-semibold ${limPerc&&limPerc>90?'text-destructive':''}`}>{money.format(t.mensileSpese)}</p>
          {limPerc!==null && <><div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${limPerc}%`,background:limPerc>90?'var(--destructive)':limPerc>70?'hsl(38 92% 50%)':'var(--primary)'}}/></div><p className="mt-1 text-xs text-muted-foreground">{limPerc.toFixed(0)}% del limite {money.format(t.limiteAttivo)}/mese</p></>}
        </Card>
        <Metric label="Riserva fiscale P.IVA" value={t.reserve} detail={`Tasse stimate: ${money.format(t.tax+t.contributions)}`}/>
      </div>
      {s.dashboard.forecast&&<section><div className="mb-3"><h3 className="text-xl font-semibold">Previsione di liquidità</h3><p className="text-sm text-muted-foreground">Stima a 30, 60 e 90 giorni basata sui flussi ricorrenti e sulle scadenze manuali.</p></div><div className="grid gap-4 sm:grid-cols-3">{forecast.map(item=><Metric key={item.days} label={`Tra ${item.days} giorni`} value={item.value} detail={`Margine stimato ${money.format(monthlyMargin)}/mese`} warn={item.value<0}/>)}</div></section>}
      {s.dashboard.alerts&&<Card><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Bell className="size-5"/></div><div><h3 className="font-semibold">Avvisi e prossimi pagamenti</h3><p className="text-sm text-muted-foreground">Rate e scadenze che richiedono attenzione.</p></div></div>{alerts.length?<div className="mt-4 divide-y">{alerts.slice(0,6).map(item=><div key={item.id} className="flex items-center gap-3 py-3"><div className={`size-2 rounded-full ${item.urgent?'bg-destructive':'bg-amber-500'}`}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{dateFullIt(item.date)} · {item.detail}</p></div><b className="text-sm">{money.format(item.amount)}</b></div>)}</div>:<p className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">Nessuna urgenza nei prossimi giorni.</p>}</Card>}
      {s.dashboard.subscriptions&&<Card><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">COSTI CONTINUI</p><h3 className="mt-2 text-lg font-semibold">Abbonamenti senza scadenza</h3><p className="mt-1 text-sm text-muted-foreground">Restano nel riepilogo mensile finché non imposti una data di fine.</p></div><div className="rounded-xl bg-primary/10 px-4 py-3 text-right"><p className="text-xs text-primary">Impatto mensile</p><p className="mt-1 text-2xl font-semibold text-primary">{money.format(monthlySubscriptions)}</p><p className="text-xs text-muted-foreground">{money.format(monthlySubscriptions*12)} su 12 mesi</p></div></div>{openSubscriptions.length?<div className="mt-4 grid gap-2 border-t pt-4 md:grid-cols-2">{openSubscriptions.slice(0,6).map(expense=><div key={expense.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-semibold">{expense.description}</p><p className="text-xs text-muted-foreground">{expense.category||'Senza categoria'} · {FREQ_LABEL[expense.freq]}</p></div><b className="text-sm">{money.format(toMensile(expense.amount,expense.freq))}/mese</b></div>)}</div>:<p className="mt-4 border-t pt-4 text-sm text-muted-foreground">Nessun abbonamento attivo senza scadenza.</p>}</Card>}
      {s.dashboard.goals&&<Card><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Target className="size-5"/></div><div><h3 className="font-semibold">Obiettivi di risparmio</h3><p className="text-sm text-muted-foreground">Avanzamento dei tuoi traguardi principali.</p></div></div>{topGoals.length?<div className="mt-4 grid gap-3 md:grid-cols-3">{topGoals.map(goal=>{const progress=goal.targetAmount>0?Math.min(100,goal.currentAmount/goal.targetAmount*100):0;return <div key={goal.id} className="rounded-xl bg-secondary/60 p-3"><div className="flex justify-between gap-2 text-sm"><b className="truncate">{goal.name}</b><span>{progress.toFixed(0)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-primary" style={{width:`${progress}%`}}/></div><p className="mt-2 text-xs text-muted-foreground">{money.format(goal.currentAmount)} di {money.format(goal.targetAmount)}</p></div>})}</div>:<p className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">Nessun obiettivo impostato.</p>}</Card>}
      {s.dashboard.charts&&<section className="flex flex-col gap-4"><div><h3 className="text-xl font-semibold">Grafici e indicatori</h3><p className="text-sm text-muted-foreground">Flussi, composizione delle spese e rapporti chiave aggiornati con i dati inseriti.</p></div><div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Card><h3 className="font-semibold">Entrate e spese per mese</h3><p className="text-sm text-muted-foreground">Confronto a colonne · {year}</p><div className="mt-4 h-64"><ResponsiveContainer><BarChart data={m} barGap={4}><CartesianGrid vertical={false} stroke="var(--border)"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip formatter={v=>money.format(Number(v))}/><Bar dataKey="entrate" name="Entrate" fill="var(--chart-1)" radius={[5,5,0,0]}/><Bar dataKey="spese" name="Spese" fill="var(--chart-2)" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></Card>
        <Card><h3 className="font-semibold">Spese per categoria</h3>{cats.length?<><div className="h-44"><ResponsiveContainer><PieChart><Pie data={cats} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72}>{cats.map((_,i)=><Cell key={i} fill={`var(--chart-${i%5+1})`}/>)}</Pie><Tooltip formatter={v=>money.format(Number(v))}/></PieChart></ResponsiveContainer></div>{cats.slice(0,5).map(x=><div key={x.name} className="flex justify-between py-1 text-sm"><span className="text-muted-foreground">{x.name}</span><b>{money.format(x.value)}</b></div>)}</>:<p className="grid h-56 place-items-center text-sm text-muted-foreground">Inserisci delle spese per vedere la composizione.</p>}</Card>
      </div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Gauge label="Tasso di risparmio" value={savingsRate} detail={`${money.format(Math.max(0,monthlyIncome-t.mensileSpese))} potenziali al mese`}/><Gauge label="Peso delle rate" value={debtRatio} detail={`${money.format(t.monthlyFinancing)} su ${money.format(monthlyIncome)}/mese`} invert/><Gauge label="Copertura fiscale" value={reserveCoverage} detail={`${money.format(t.reserve)} accantonati`}/><Gauge label="Uso limite spesa" value={budgetUsage} detail={limPerc===null?'Limite non impostato':`${money.format(t.mensileSpese)} di ${money.format(t.limiteAttivo)}`} invert/></div></section>}
    </div>
  )
}

function parseCsvLine(line:string,delimiter:string) {
  const values:string[]=[]
  let value='',quoted=false
  for(let index=0;index<line.length;index+=1){const char=line[index];if(char==='"'){if(quoted&&line[index+1]==='"'){value+='"';index+=1}else quoted=!quoted}else if(char===delimiter&&!quoted){values.push(value.trim());value=''}else value+=char}
  values.push(value.trim())
  return values
}

function normalizeCsvHeader(value:string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')
}

function parseCsvAmount(value:string) {
  const cleaned=value.replace(/[^0-9,.-]/g,'')
  if(!cleaned)return NaN
  const comma=cleaned.lastIndexOf(','),dot=cleaned.lastIndexOf('.')
  if(comma>=0&&dot>=0){const decimal=comma>dot?',':'.';return Number(cleaned.replace(decimal===','?/\./g:/,/g,'').replace(decimal, '.'))}
  if(comma>=0)return Number(cleaned.replace(/\./g,'').replace(',','.'))
  return Number(cleaned)
}

function parseCsvDate(value:string) {
  const trimmed=value.trim()
  if(/^\d{4}-\d{2}-\d{2}/.test(trimmed))return trimmed.slice(0,10)
  const match=trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/)
  if(!match)return ''
  const year=match[3].length===2?`20${match[3]}`:match[3]
  return `${year}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`
}

// ── MOVIMENTI ──
function Movements({s,set,year}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;year:number}) {
  const [mode,setMode] = useState<'entrata'|'spesa'>('spesa')
  const [freq,setFreq] = useState<Freq>('mensile')
  const [isSubscription,setIsSubscription] = useState(false)
  const [openEnded,setOpenEnded] = useState(false)
  const [paymentMode,setPaymentMode]=useState<'cash'|'benefit'|'mixed'>('cash')
  const [selectedBenefitId,setSelectedBenefitId]=useState('')
  const [benefitAmount,setBenefitAmount]=useState(0)
  const [formError,setFormError]=useState('')
  const [editing,setEditing] = useState<{type:'income';item:Income}|{type:'expense';item:Expense}|null>(null)
  const [csvMsg,setCsvMsg]=useState('')
  const editItem=editing?.item
  const editExpense=editing?.type==='expense'?editing.item:undefined
  const resetForm=()=>{setEditing(null);setFreq('mensile');setIsSubscription(false);setOpenEnded(false);setMode('spesa');setPaymentMode('cash');setSelectedBenefitId('');setBenefitAmount(0);setFormError('')}
  const editIncome=(item:Income)=>{setEditing({type:'income',item});setMode('entrata');setFreq(item.freq??'mensile');setIsSubscription(false);setOpenEnded(false)}
  const editExpenseItem=(item:Expense)=>{setEditing({type:'expense',item});setMode('spesa');setFreq(item.freq);setIsSubscription(Boolean(item.subscription));setOpenEnded(item.subscription?.endDate===null);setSelectedBenefitId(item.benefitId??'');setBenefitAmount(item.benefitAmount??0);setPaymentMode(item.benefitId?(item.benefitAmount??0)<item.amount?'mixed':'benefit':'cash');setFormError('')}
  const submit = (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f=new FormData(e.currentTarget)
    const accountId=String(f.get('accountId') ?? '') || undefined
    const base:Income={id:editItem?.id??uid(),date:String(f.get('date')),description:String(f.get('description')),amount:Number(f.get('amount')),kind:String(f.get('kind')) as Kind,accountId,recurring:Boolean(f.get('recurring'))||isSubscription,freq}
    if(!base.description||base.amount<=0)return
    if(mode==='entrata') {
      set(x=>({...x,incomes:[base,...x.incomes.filter(item=>item.id!==editItem?.id)],expenses:x.expenses.filter(item=>item.id!==editItem?.id)}))
    } else {
      const requestedBenefit=paymentMode==='cash'?0:paymentMode==='benefit'?base.amount:Math.min(base.amount,Math.max(0,benefitAmount))
      if(requestedBenefit>0&&!selectedBenefitId){setFormError('Scegli il benefit utilizzato.');return}
      const selectedWallet=s.benefits.find(item=>item.id===selectedBenefitId)
      const restoredAmount=editExpense?.benefitId===selectedBenefitId?(editExpense.benefitAmount??0):0
      if(requestedBenefit>0&&(!selectedWallet||selectedWallet.balance+restoredAmount<requestedBenefit)){setFormError(`Credito insufficiente: disponibile ${money.format((selectedWallet?.balance??0)+restoredAmount)}.`);return}
      set(current=>{
        let benefits=current.benefits.map(item=>({...item,transactions:[...item.transactions]}))
        if(editExpense?.benefitId&&editExpense.benefitTransactionId){benefits=benefits.map(item=>item.id===editExpense.benefitId?{...item,balance:item.balance+(editExpense.benefitAmount??0),transactions:item.transactions.filter(transaction=>transaction.id!==editExpense.benefitTransactionId)}:item)}
        const transactionId=requestedBenefit>0?uid():undefined
        const expense:Expense={...base,accountId:base.amount-requestedBenefit>0?accountId:undefined,freq,category:String(f.get('category')),benefitId:requestedBenefit>0?selectedBenefitId:undefined,benefitAmount:requestedBenefit||undefined,benefitTransactionId:transactionId,subscription:isSubscription?{startDate:String(f.get('startDate') ?? '')||undefined,endDate:openEnded?null:String(f.get('endDate'))}:undefined}
        if(requestedBenefit>0&&transactionId){benefits=benefits.map(item=>item.id===selectedBenefitId?{...item,balance:item.balance-requestedBenefit,transactions:[...item.transactions,{id:transactionId,date:base.date,type:'spend',amount:requestedBenefit,description:base.description,category:expense.category,note:paymentMode==='mixed'?`Quota benefit su ${money.format(base.amount)}`:undefined,expenseId:expense.id}]}:item)}
        return {...current,benefits,expenses:[expense,...current.expenses.filter(item=>item.id!==editItem?.id)],incomes:current.incomes.filter(item=>item.id!==editItem?.id)}
      })
    }
    e.currentTarget.reset();resetForm()
  }
  const incomes=s.incomes.filter(x=>new Date(x.date).getFullYear()===year).sort((a,b)=>b.date.localeCompare(a.date))
  const benefitIncomes=incomes.filter(x=>x.incomeClass==='benefit')
  const personalIncomes=incomes.filter(x=>x.kind==='personale'&&x.incomeClass!=='benefit')
  const pivaIncomes=incomes.filter(x=>x.kind==='piva'&&x.incomeClass!=='benefit')
  const expenses=s.expenses.filter(x=>new Date(x.date).getFullYear()===year).sort((a,b)=>b.date.localeCompare(a.date))
  const subscriptions=expenses.filter(x=>x.subscription)
  const otherExpenses=expenses.filter(x=>!x.subscription)
  const sum=(items:{amount:number}[])=>items.reduce((total,item)=>total+item.amount,0)
  const removeIncome=(id:string)=>set(current=>{const income=current.incomes.find(item=>item.id===id);return{...current,incomes:current.incomes.filter(item=>item.id!==id),benefits:income?.benefitId&&income.benefitTransactionId?current.benefits.map(item=>item.id===income.benefitId?{...item,balance:Math.max(0,item.balance-income.amount),transactions:item.transactions.filter(transaction=>transaction.id!==income.benefitTransactionId)}:item):current.benefits}})
  const removeExpense=(id:string)=>set(current=>{const expense=current.expenses.find(item=>item.id===id);return{...current,expenses:current.expenses.filter(item=>item.id!==id),benefits:expense?.benefitId&&expense.benefitTransactionId?current.benefits.map(item=>item.id===expense.benefitId?{...item,balance:item.balance+(expense.benefitAmount??0),transactions:item.transactions.filter(transaction=>transaction.id!==expense.benefitTransactionId)}:item):current.benefits}})
  const importCsv=async(file:File)=>{
    const text=await file.text()
    const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(line=>line.trim())
    if(lines.length<2){setCsvMsg('Il CSV non contiene righe da importare.');return}
    const delimiter=(lines[0].match(/;/g)?.length??0)>(lines[0].match(/,/g)?.length??0)?';':','
    const headers=parseCsvLine(lines[0],delimiter).map(normalizeCsvHeader)
    const find=(aliases:string[])=>headers.findIndex(header=>aliases.includes(header))
    const indexes={date:find(['data','date','datacontabile','datavaluta']),description:find(['descrizione','description','causale','nome']),amount:find(['importo','amount','valore']),type:find(['tipo','type','operazione']),kind:find(['ambito','kind','natura']),category:find(['categoria','category']),account:find(['conto','account'])}
    if(indexes.date<0||indexes.description<0||indexes.amount<0){setCsvMsg('Servono almeno le colonne Data, Descrizione/Causale e Importo.');return}
    let imported=0,skipped=0
    set(current=>{
      const incomes=[...current.incomes],expenses=[...current.expenses]
      const known=new Set([...incomes.map(item=>`i|${item.date}|${item.description.toLowerCase()}|${item.amount.toFixed(2)}`),...expenses.map(item=>`e|${item.date}|${item.description.toLowerCase()}|${item.amount.toFixed(2)}`)])
      for(const line of lines.slice(1)){
        const row=parseCsvLine(line,delimiter)
        const date=parseCsvDate(row[indexes.date]??''),description=(row[indexes.description]??'').trim(),rawAmount=parseCsvAmount(row[indexes.amount]??'')
        if(!date||!description||!Number.isFinite(rawAmount)||rawAmount===0){skipped+=1;continue}
        const explicit=(indexes.type>=0?row[indexes.type]:'').toLowerCase()
        const isExpense=/spesa|expense|addebito|uscita|debit/.test(explicit)||(!/entrata|income|accredito|credit/.test(explicit)&&rawAmount<0)
        const amount=Math.abs(rawAmount),key=`${isExpense?'e':'i'}|${date}|${description.toLowerCase()}|${amount.toFixed(2)}`
        if(known.has(key)){skipped+=1;continue}
        const kindText=indexes.kind>=0?(row[indexes.kind]??'').toLowerCase():''
        const kind:Kind=kindText.includes('piva')||kindText.includes('iva')?'piva':'personale'
        const accountName=indexes.account>=0?(row[indexes.account]??'').trim().toLowerCase():''
        const accountId=current.accounts.find(account=>account.name.toLowerCase()===accountName)?.id
        if(isExpense)expenses.unshift({id:uid(),date,description,amount,kind,accountId,recurring:false,freq:'unica',category:indexes.category>=0?(row[indexes.category]||'Importato'):'Importato'})
        else incomes.unshift({id:uid(),date,description,amount,kind,accountId,recurring:false,freq:'unica'})
        known.add(key);imported+=1
      }
      return {...current,incomes,expenses}
    })
    setCsvMsg(`${imported} movimenti importati${skipped?` · ${skipped} righe saltate o duplicate`:''}.`)
  }
  const incomeList=(items:Income[],empty:string)=><Card className="p-0 overflow-hidden">{items.map(item=>{const wallet=s.benefits.find(value=>value.id===item.benefitId);return <div key={item.id} className="flex items-center gap-3 border-b p-4 last:border-0"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className="text-sm">{item.description}</b>{item.incomeClass==='benefit'&&<span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">BENEFIT</span>}</div><p className="text-xs text-muted-foreground">{dateIt(item.date)}{item.recurring&&item.freq?` · ${FREQ_LABEL[item.freq]}`:''}{wallet?` · ${wallet.name}`:''}</p></div><b className={`text-sm ${item.incomeClass==='benefit'?'text-violet-600':'text-green-600'}`}>+{money.format(item.amount)}</b>{item.incomeClass!=='benefit'&&<EditButton onClick={()=>editIncome(item)} label="Modifica entrata"/>}<button onClick={()=>removeIncome(item.id)} aria-label="Elimina entrata"><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div>})}{!items.length&&<p className="p-6 text-center text-sm text-muted-foreground">{empty}</p>}</Card>
  const expenseList=(items:Expense[],empty:string)=><Card className="p-0 overflow-hidden">{items.map(item=>{const wallet=s.benefits.find(value=>value.id===item.benefitId);return <div key={item.id} className="flex items-center gap-3 border-b p-4 last:border-0"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className="text-sm">{item.description}</b>{item.subscription&&<span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">ABBONAMENTO</span>}{item.kind==='piva'&&<span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">P.IVA</span>}{wallet&&<span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">{(item.benefitAmount??0)<item.amount?'PAGAMENTO MISTO':'BENEFIT'}</span>}</div><p className="text-xs text-muted-foreground">{item.category||'Senza categoria'} · {FREQ_LABEL[item.freq]}</p>{wallet&&<p className="mt-1 text-xs text-muted-foreground">{money.format(item.benefitAmount??0)} con {wallet.name}{(item.benefitAmount??0)<item.amount?` · ${money.format(item.amount-(item.benefitAmount??0))} dal conto`:''}</p>}{item.subscription&&<p className="mt-1 text-xs text-muted-foreground">Inizio: {item.subscription.startDate?dateIt(item.subscription.startDate):'non indicato'} · Fine: {item.subscription.endDate?dateIt(item.subscription.endDate):'senza scadenza'}</p>}</div><b className="text-sm text-destructive">-{money.format(item.amount)}</b><EditButton onClick={()=>editExpenseItem(item)} label="Modifica spesa"/><button onClick={()=>removeExpense(item.id)} aria-label="Elimina spesa"><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div>})}{!items.length&&<p className="p-6 text-center text-sm text-muted-foreground">{empty}</p>}</Card>
  return (
    <div className="flex flex-col gap-6">
      <Heading kicker="REGISTRO" title="Entrate e spese" text={`Movimenti ${year}, già separati per natura e attività.`}/>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Entrate personali" value={sum(personalIncomes)}/><Metric label="Introiti P.IVA" value={sum(pivaIncomes)}/><Metric label="Accrediti benefit" value={sum(benefitIncomes)} detail="Non aumentano la liquidità"/><Metric label="Spese complessive" value={sum(expenses)} detail="Include quelle pagate con benefit"/></div>
      <Card><div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="font-semibold">Importa movimenti bancari</h3><p className="mt-1 text-sm text-muted-foreground">CSV con Data, Descrizione o Causale e Importo. Entrate positive e spese negative; i duplicati vengono ignorati.</p>{csvMsg&&<p className="mt-2 text-sm font-semibold text-primary">{csvMsg}</p>}</div><label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border bg-background px-4 text-sm font-semibold hover:bg-secondary"><FileUp className="size-4"/>Scegli CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void importCsv(file);e.currentTarget.value=''}}/></label></div></Card>
      <form key={editItem?.id??'new-movement'} onSubmit={submit} className="grid gap-3 rounded-2xl border bg-card p-5 md:grid-cols-4">
        {editing&&<div className="col-span-full flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"><span>Stai modificando “{editItem?.description}”</span><button type="button" onClick={resetForm} className="text-xs">Annulla modifica</button></div>}
        <Field label="Operazione"><select value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="spesa">Spesa</option><option value="entrata">Entrata</option></select></Field>
        <Field label="Data"><input name="date" type="date" required defaultValue={editItem?.date??new Date().toISOString().slice(0,10)}/></Field>
        <Field label="Descrizione"><input name="description" required defaultValue={editItem?.description}/></Field>
        <Field label="Importo (€)"><input name="amount" type="number" min=".01" step=".01" required defaultValue={editItem?.amount}/></Field>
        <Field label="Tipo"><select name="kind" defaultValue={editItem?.kind??'personale'}><option value="personale">Personale</option><option value="piva">P.IVA</option></select></Field>
        {mode==='spesa'&&<Field label="Come hai pagato?"><select value={paymentMode} onChange={event=>{setPaymentMode(event.target.value as typeof paymentMode);setFormError('')}}><option value="cash">Conto, carta o contanti</option><option value="benefit">Solo con un benefit</option><option value="mixed">Pagamento misto</option></select></Field>}
        {(mode==='entrata'||paymentMode!=='benefit')&&<Field label={paymentMode==='mixed'?'Conto per la parte restante':'Conto (facoltativo)'}><select name="accountId" defaultValue={editItem?.accountId??''}><option value="">Nessun conto</option>{s.accounts.map(a=><option key={a.id} value={a.id}>{TIPO_EMOJI[a.type]} {a.name}</option>)}</select></Field>}
        {mode==='spesa'&&paymentMode!=='cash'&&<Field label="Benefit utilizzato"><select value={selectedBenefitId} onChange={event=>{setSelectedBenefitId(event.target.value);setFormError('')}} required><option value="">Scegli...</option>{s.benefits.filter(item=>item.balance>0||item.id===editExpense?.benefitId).map(item=><option key={item.id} value={item.id}>{item.name} · {money.format(item.balance)}</option>)}</select></Field>}
        {mode==='spesa'&&paymentMode==='mixed'&&<Field label="Quota pagata con benefit (€)"><input type="number" min=".01" step=".01" value={benefitAmount||''} onChange={event=>{setBenefitAmount(Number(event.target.value));setFormError('')}} required/></Field>}
        <Field label="Frequenza"><FreqSelect value={freq} onChange={setFreq}/></Field>
        {mode==='spesa'&&<Field label="Categoria"><input name="category" list="expense-categories" required placeholder="Es. Casa, Auto..." defaultValue={editExpense?.category}/><datalist id="expense-categories">{s.categories.map(c=><option key={c.id} value={c.name}/>)}</datalist></Field>}
        <label className="flex items-center gap-2 text-sm col-span-full"><input name="recurring" type="checkbox" defaultChecked={editItem?.recurring}/>Ricorrente</label>
        {mode==='spesa'&&<label className="flex items-center gap-2 text-sm col-span-full"><input type="checkbox" checked={isSubscription} onChange={e=>setIsSubscription(e.target.checked)}/>È un abbonamento</label>}
        {mode==='spesa'&&isSubscription&&<><Field label="Data inizio (facoltativa)"><input name="startDate" type="date" defaultValue={editExpense?.subscription?.startDate}/></Field><Field label="Data fine"><input name="endDate" type="date" disabled={openEnded} required={!openEnded} defaultValue={editExpense?.subscription?.endDate??''}/></Field><label className="flex items-center gap-2 self-end pb-2 text-sm md:col-span-2"><input type="checkbox" checked={openEnded} onChange={e=>setOpenEnded(e.target.checked)}/>Data fine non definita</label></>}
        {formError&&<p className="col-span-full rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{formError}</p>}
        <button className="col-span-full h-11 rounded-xl bg-primary px-4 font-semibold text-primary-foreground">{editing?<Pencil className="mr-2 inline size-4"/>:<Plus className="mr-2 inline size-4"/>}{editing?'Salva modifiche':'Aggiungi'}</button>
      </form>
      <div className="grid gap-5 lg:grid-cols-2"><section className="flex flex-col gap-3"><div><h3 className="font-semibold">Entrate personali</h3><p className="text-sm text-muted-foreground">Stipendio e altri introiti non P.IVA</p></div>{incomeList(personalIncomes,'Nessuna entrata personale')}</section><section className="flex flex-col gap-3"><div><h3 className="font-semibold">Introiti P.IVA</h3><p className="text-sm text-muted-foreground">Fatture e compensi professionali</p></div>{incomeList(pivaIncomes,'Nessun introito P.IVA')}</section></div>
      <section className="flex flex-col gap-3"><div><h3 className="font-semibold">Accrediti benefit</h3><p className="text-sm text-muted-foreground">Valore ricevuto su buoni pasto, welfare e carte carburante: visibile, ma separato dal reddito monetario.</p></div>{incomeList(benefitIncomes,'Nessun accredito benefit registrato')}</section>
      <section className="flex flex-col gap-3"><div><h3 className="font-semibold">Abbonamenti</h3><p className="text-sm text-muted-foreground">Costi ricorrenti con periodo definito o senza scadenza</p></div>{expenseList(subscriptions,'Nessun abbonamento')}</section>
      <section className="flex flex-col gap-3"><div><h3 className="font-semibold">Altre spese</h3><p className="text-sm text-muted-foreground">Spese personali e professionali</p></div>{expenseList(otherExpenses,'Nessuna spesa')}</section>
    </div>
  )
}

// ── CONTI ──
function Accounts({s,set}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>}) {
  const [tipo,setTipo]=useState<Account['type']>('conto')
  const [showForm,setShowForm]=useState(false)
  const [editing,setEditing]=useState<Account|null>(null)
  const closeForm=()=>{setShowForm(false);setEditing(null);setTipo('conto')}
  const edit=(account:Account)=>{setEditing(account);setTipo(account.type);setShowForm(true)}
  const submit=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const f=new FormData(e.currentTarget)
    const base:Account={id:editing?.id??uid(),name:String(f.get('name')),type:tipo,balance:Number(f.get('balance')),limit:editing?.limit??0}
    if(tipo==='carta'){base.plafond=Number(f.get('plafond'));base.giornoEstratto=Number(f.get('estratto'));base.giornoAddebito=Number(f.get('addebito'));base.tassoRevolving=Number(f.get('revolving'));base.usaRevolving=Boolean(f.get('useRev'))}
    if(tipo==='fido'){base.fidoMax=Number(f.get('fidoMax'));base.fidoAlert=Number(f.get('fidoAlert'));base.fidoTasso=Number(f.get('fidoTasso'))}
    set(x=>({...x,accounts:editing?x.accounts.map(item=>item.id===editing.id?base:item):[...x.accounts,base]}));e.currentTarget.reset();closeForm()
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
                <div className="flex gap-2"><EditButton onClick={()=>edit(a)} label="Modifica conto"/><button onClick={()=>set(x=>({...x,accounts:x.accounts.filter(v=>v.id!==a.id)}))}><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div>
              </div>
              <p className={`mt-4 text-3xl font-semibold tabular-nums ${a.balance<0?'text-destructive':''}`}>{money.format(a.balance)}</p>
              {a.type==='carta'&&a.plafond&&<><div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden"><div className="h-full rounded-full" style={{width:`${percCarta}%`,background:percCarta>80?'var(--destructive)':'var(--primary)'}}/></div><p className="mt-1 text-xs text-muted-foreground">Disponibile {money.format(a.plafond-usatoCarta)} · Estratto gg {a.giornoEstratto} · Addebito gg {a.giornoAddebito}</p>{a.tassoRevolving&&a.tassoRevolving>0&&<p className="text-xs text-amber-600">Revolving {a.tassoRevolving}%/anno</p>}</>}
              {a.type==='fido'&&a.fidoMax&&<><p className="mt-2 text-xs text-muted-foreground">Fido max {money.format(a.fidoMax)} · Usato {money.format(fidoUsato)} · Tasso {a.fidoTasso}%</p>{showAlert&&<p className="mt-1 text-xs text-destructive font-semibold">⚠️ Soglia alert superata</p>}</>}
            </Card>
          )
        })}
        <button onClick={()=>{setEditing(null);setTipo('conto');setShowForm(v=>!v)}} className="rounded-2xl border-2 border-dashed border-border hover:border-primary flex items-center justify-center gap-2 text-muted-foreground hover:text-primary p-5 min-h-[120px] transition-colors">
          <Plus className="size-5"/>Aggiungi conto
        </button>
      </div>
      {showForm&&(
        <form key={editing?.id??'new-account'} onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">
          {editing&&<p className="col-span-full rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">Modifica conto “{editing.name}”</p>}
          <Field label="Nome conto"><input name="name" required placeholder="Es. Intesa, Revolut..." defaultValue={editing?.name}/></Field>
          <Field label="Tipo"><select value={tipo} onChange={e=>setTipo(e.target.value as Account['type'])}><option value="conto">🏦 Corrente</option><option value="piva">🧾 P.IVA</option><option value="carta">💳 Carta di credito</option><option value="fido">📋 Fido</option><option value="contanti">💵 Contanti</option></select></Field>
          <Field label="Saldo attuale (€)"><input name="balance" type="number" step=".01" defaultValue={editing?.balance??0}/></Field>
          {tipo==='carta'&&<><Field label="Plafond (€)"><input name="plafond" type="number" placeholder="Es. 3000" defaultValue={editing?.plafond}/></Field><Field label="Giorno estratto"><input name="estratto" type="number" min="1" max="31" placeholder="Es. 1" defaultValue={editing?.giornoEstratto}/></Field><Field label="Giorno addebito"><input name="addebito" type="number" min="1" max="31" placeholder="Es. 15" defaultValue={editing?.giornoAddebito}/></Field><Field label="Tasso revolving (%/anno)"><input name="revolving" type="number" step=".1" placeholder="0" defaultValue={editing?.tassoRevolving}/></Field><label className="flex items-center gap-2 text-sm"><input name="useRev" type="checkbox" defaultChecked={editing?.usaRevolving}/>Usa revolving</label></>}
          {tipo==='fido'&&<><Field label="Importo massimo (€)"><input name="fidoMax" type="number" placeholder="Es. 5000" defaultValue={editing?.fidoMax}/></Field><Field label="Soglia alert (€)"><input name="fidoAlert" type="number" placeholder="Es. 3000" defaultValue={editing?.fidoAlert}/></Field><Field label="Tasso annuo (%)"><input name="fidoTasso" type="number" step=".1" placeholder="Es. 8.5" defaultValue={editing?.fidoTasso}/></Field></>}
          <div className="col-span-full flex gap-3"><button type="submit" className="h-10 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">{editing?'Salva modifiche':'Aggiungi'}</button><button type="button" onClick={closeForm} className="h-10 rounded-xl border px-5 text-sm">Annulla</button></div>
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
  const [editingAsset,setEditingAsset]=useState<Asset|null>(null)
  const [movInvId,setMovInvId]=useState<string|null>(null)
  const [editingMov,setEditingMov]=useState<{assetId:string;movimento:AssetMovimento}|null>(null)
  const [tipoMov,setTipoMov]=useState<AssetMovimento['tipo']>('versamento')
  const [freq,setFreq]=useState<Freq>('mensile')
  const pat=patrimoniTotals(s.assets)
  const rendPerc=pat.totVersato>0?(pat.rend/pat.totVersato*100):0
  const submitAsset=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const f=new FormData(e.currentTarget)
    const importo=Number(f.get('importoVers'))
    const a:Asset={id:editingAsset?.id??uid(),name:String(f.get('name')),type:String(f.get('type')) as Asset['type'],paid:editingAsset?.paid??importo,value:editingAsset?.value??importo,istituto:String(f.get('istituto')),freq,importoVers:importo,movimenti:editingAsset?.movimenti??(importo>0?[{id:uid(),data:new Date().toISOString().slice(0,10),tipo:'versamento',importo,note:'Primo versamento'}]:[])}
    set(x=>({...x,assets:editingAsset?x.assets.map(item=>item.id===editingAsset.id?a:item):[...x.assets,a]}));e.currentTarget.reset();setShowForm(false);setEditingAsset(null)
  }
  const addMov=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const f=new FormData(e.currentTarget)
    const mov:AssetMovimento={id:editingMov?.movimento.id??uid(),data:String(f.get('data')),tipo:tipoMov,importo:Number(f.get('importo')),note:String(f.get('note'))||undefined}
    set(x=>({...x,assets:x.assets.map(a=>{
      if(a.id!==movInvId)return a
      const movs=editingMov?(a.movimenti??[]).map(item=>item.id===editingMov.movimento.id?mov:item):[...(a.movimenti??[]),mov]
      const versato=movs.filter(m=>m.tipo==='versamento').reduce((n,m)=>n+m.importo,0)
      const prelevato=movs.filter(m=>m.tipo==='prelievo').reduce((n,m)=>n+m.importo,0)
      const ult=[...movs].filter(m=>m.tipo==='aggiornamento_valore').sort((x,y)=>y.data.localeCompare(x.data))[0]
      return{...a,movimenti:movs,paid:versato-prelevato,value:ult?ult.importo:a.value}
    })}));e.currentTarget.reset();setMovInvId(null);setEditingMov(null)
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
                <div className="flex gap-2"><button onClick={()=>{setEditingMov(null);setMovInvId(a.id);setTipoMov('versamento')}} className="text-xs border rounded-lg px-2 py-1 hover:bg-secondary">+ Mov.</button><EditButton onClick={()=>{setEditingAsset(a);setFreq(a.freq??'mensile');setShowForm(true)}} label="Modifica investimento"/><button onClick={()=>set(x=>({...x,assets:x.assets.filter(v=>v.id!==a.id)}))}><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-secondary p-2"><p className="text-xs text-muted-foreground">Versato</p><p className="font-semibold text-sm">{money.format(netto)}</p></div>
                <div className="rounded-xl bg-secondary p-2"><p className="text-xs text-muted-foreground">Valore</p><p className={`font-semibold text-sm ${valore>=netto?'text-green-600':'text-destructive'}`}>{money.format(valore)}</p></div>
                <div className="rounded-xl bg-secondary p-2"><p className="text-xs text-muted-foreground">Rendim.</p><p className={`font-semibold text-sm ${rend>=0?'text-green-600':'text-destructive'}`}>{rend>=0?'+':''}{rendP.toFixed(1)}%</p></div>
              </div>
              {movs.length>0&&<div className="mt-3 border-t pt-3">{movs.slice(0,3).map(m=><div key={m.id} className="flex items-center gap-2 py-1 text-xs text-muted-foreground"><span className="min-w-0 flex-1">{dateIt(m.data)} · {{versamento:'↓',prelievo:'↑',aggiornamento_valore:'📊'}[m.tipo]} {m.note||''}</span><span className={m.tipo==='prelievo'?'text-destructive':'text-green-600'}>{m.tipo==='prelievo'?'-':'+'}{money.format(m.importo)}</span><EditButton onClick={()=>{setEditingMov({assetId:a.id,movimento:m});setMovInvId(a.id);setTipoMov(m.tipo)}} label="Modifica movimento patrimonio"/></div>)}</div>}
              {movInvId===a.id&&<form key={editingMov?.movimento.id??`new-asset-movement-${a.id}`} onSubmit={addMov} className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2"><Field label="Tipo"><select value={tipoMov} onChange={e=>setTipoMov(e.target.value as AssetMovimento['tipo'])}><option value="versamento">Versamento</option><option value="prelievo">Prelievo</option><option value="aggiornamento_valore">Aggiorn. valore</option></select></Field><Field label="Data"><input name="data" type="date" required defaultValue={editingMov?.movimento.data??new Date().toISOString().slice(0,10)}/></Field><Field label="Importo (€)"><input name="importo" type="number" min=".01" step=".01" required defaultValue={editingMov?.movimento.importo}/></Field><Field label="Note"><input name="note" placeholder="Facoltativo" defaultValue={editingMov?.movimento.note}/></Field><div className="col-span-full flex gap-2"><button type="submit" className="h-9 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{editingMov?'Salva modifica':'Salva'}</button><button type="button" onClick={()=>{setMovInvId(null);setEditingMov(null)}} className="h-9 rounded-xl border px-4 text-sm">Annulla</button></div></form>}
            </Card>
          )
        })}
        <button onClick={()=>{setEditingAsset(null);setFreq('mensile');setShowForm(v=>!v)}} className="rounded-2xl border-2 border-dashed border-border hover:border-primary flex items-center justify-center gap-2 text-muted-foreground hover:text-primary p-5 min-h-[120px] transition-colors"><Plus className="size-5"/>Nuovo investimento</button>
      </div>
      {showForm&&<form key={editingAsset?.id??'new-asset'} onSubmit={submitAsset} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">{editingAsset&&<p className="col-span-full rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">Modifica “{editingAsset.name}”</p>}<Field label="Nome"><input name="name" required placeholder="Es. ETF World..." defaultValue={editingAsset?.name}/></Field><Field label="Categoria"><select name="type" defaultValue={editingAsset?.type??'finanziario'}><option value="finanziario">📈 Investimento finanziario</option><option value="assicurativo">🛡️ Assicurativo / Previdenziale</option><option value="risparmio">🏦 Risparmio vincolato</option></select></Field><Field label="Istituto"><input name="istituto" placeholder="Es. Fineco, Generali..." defaultValue={editingAsset?.istituto}/></Field><Field label="Frequenza versamento"><FreqSelect value={freq} onChange={setFreq}/></Field><Field label="Importo versamento (€)"><input name="importoVers" type="number" step=".01" placeholder="0" defaultValue={editingAsset?.importoVers}/></Field><div className="col-span-full flex gap-3"><button type="submit" className="h-10 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">{editingAsset?'Salva modifiche':'Aggiungi'}</button><button type="button" onClick={()=>{setShowForm(false);setEditingAsset(null)}} className="h-10 rounded-xl border px-5 text-sm">Annulla</button></div></form>}
      <Benefits s={s} set={set}/>
    </div>
  )
}

function Benefits({s,set}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>}) {
  const today=new Date().toISOString().slice(0,10)
  const currentPeriod=today.slice(0,7)
  const [showForm,setShowForm]=useState(false)
  const [editing,setEditing]=useState<BenefitWallet|null>(null)
  const [type,setType]=useState<BenefitType>('meal')
  const [welfareCategory,setWelfareCategory]=useState<WelfareCategory>('shopping')
  const [accreditMode,setAccreditMode]=useState<BenefitAccreditMode>('none')
  const [movementId,setMovementId]=useState<string|null>(null)
  const [movementType,setMovementType]=useState<BenefitTransaction['type']>('spend')
  const total=s.benefits.reduce((sum,item)=>sum+Math.max(0,item.balance),0)
  const expiryLimit=(()=>{const date=new Date(`${today}T12:00:00`);date.setDate(date.getDate()+30);return date.toISOString().slice(0,10)})()
  const expiring=s.benefits.filter(item=>item.balance>0&&item.expiryDate&&item.expiryDate>=today&&item.expiryDate<=expiryLimit).length
  const reset=()=>{setEditing(null);setShowForm(false);setType('meal');setWelfareCategory('shopping');setAccreditMode('none')}
  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault()
    const form=new FormData(event.currentTarget),balance=Number(form.get('balance'))
    const benefit:BenefitWallet={
      id:editing?.id??uid(),name:String(form.get('name')),type,
      welfareCategory:type==='welfare'?welfareCategory:undefined,
      issuer:String(form.get('issuer')||'')||undefined,balance,
      expiryDate:String(form.get('expiryDate')||'')||undefined,
      notes:String(form.get('notes')||'')||undefined,accreditMode,
      monthlyAmount:accreditMode==='fixed'?Number(form.get('monthlyAmount'))||undefined:undefined,
      mealValue:accreditMode==='meal_count'?Number(form.get('mealValue'))||undefined:undefined,
      expectedMealCount:accreditMode==='meal_count'?Number(form.get('expectedMealCount'))||undefined:undefined,
      creditDay:accreditMode!=='none'?Number(form.get('creditDay'))||undefined:undefined,
      transactions:editing?.transactions??(balance>0?[{id:uid(),date:today,type:'topup',amount:balance,note:'Saldo iniziale',source:'adjustment'}]:[])
    }
    if(!benefit.name||benefit.balance<0)return
    set(value=>({...value,benefits:editing?value.benefits.map(item=>item.id===editing.id?benefit:item):[benefit,...value.benefits]}))
    event.currentTarget.reset();reset()
  }
  const edit=(item:BenefitWallet)=>{setEditing(item);setType(item.type);setWelfareCategory(item.welfareCategory??'shopping');setAccreditMode(item.accreditMode);setShowForm(true)}
  const addMovement=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault()
    const form=new FormData(event.currentTarget),id=movementId,wallet=s.benefits.find(item=>item.id===id)
    if(!id||!wallet)return
    const amount=movementType==='topup'&&wallet.accreditMode==='meal_count'?(Number(form.get('mealCount'))||0)*(wallet.mealValue??0):Number(form.get('amount'))
    if(amount<=0||movementType==='spend'&&amount>wallet.balance)return
    const date=String(form.get('date')),description=String(form.get('description')||'').trim(),category=String(form.get('category')||'').trim(),note=String(form.get('note')||'')||undefined
    const source=movementType==='topup'?String(form.get('source')||'employer') as BenefitTransaction['source']:undefined
    const transactionId=uid(),incomeId=movementType==='topup'&&source==='employer'?uid():undefined,expenseId=movementType==='spend'?uid():undefined
    const transaction:BenefitTransaction={id:transactionId,date,type:movementType,amount,note,description:description||undefined,category:category||undefined,source,incomeId,expenseId}
    set(value=>({...value,
      benefits:value.benefits.map(item=>item.id===id?{...item,balance:movementType==='spend'?item.balance-amount:item.balance+amount,transactions:[...item.transactions,transaction]}:item),
      incomes:incomeId?[{id:incomeId,date,description:description||`Accredito ${wallet.name}`,amount,kind:'personale',recurring:false,freq:'unica',incomeClass:'benefit',benefitId:id,benefitTransactionId:transactionId},...value.incomes]:value.incomes,
      expenses:expenseId?[{id:expenseId,date,description:description||`Utilizzo ${wallet.name}`,amount,kind:'personale',recurring:false,freq:'unica',category:category||'Benefit',benefitId:id,benefitAmount:amount,benefitTransactionId:transactionId},...value.expenses]:value.expenses
    }))
    event.currentTarget.reset();setMovementId(null)
  }
  const undoLast=(item:BenefitWallet)=>{
    const transaction=item.transactions.at(-1)
    if(!transaction||!window.confirm('Annullare l’ultimo movimento collegato?'))return
    set(value=>({...value,
      benefits:value.benefits.map(benefit=>benefit.id===item.id?{...benefit,balance:transaction.type==='spend'?benefit.balance+transaction.amount:Math.max(0,benefit.balance-transaction.amount),transactions:benefit.transactions.filter(current=>current.id!==transaction.id)}:benefit),
      incomes:transaction.incomeId?value.incomes.filter(income=>income.id!==transaction.incomeId):value.incomes,
      expenses:transaction.expenseId?value.expenses.filter(expense=>expense.id!==transaction.expenseId):value.expenses
    }))
  }
  const removeBenefit=(item:BenefitWallet)=>{if(!window.confirm(`Eliminare “${item.name}”? I movimenti già registrati resteranno nello storico.`))return;set(value=>({...value,benefits:value.benefits.filter(benefit=>benefit.id!==item.id),incomes:value.incomes.map(income=>income.benefitId===item.id?{...income,benefitId:undefined,benefitTransactionId:undefined}:income),expenses:value.expenses.map(expense=>expense.benefitId===item.id?{...expense,benefitId:undefined,benefitTransactionId:undefined}:expense)}))}
  return <section className="mt-2 border-t pt-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-primary">BENEFIT SPENDIBILI</p><h2 className="mt-2 text-2xl font-semibold">Buoni pasto, welfare e carburante</h2><p className="mt-1 text-sm text-muted-foreground">Funzionano come conti manuali: accrediti e utilizzi finiscono anche nei Movimenti, senza falsare la liquidità.</p></div><button onClick={()=>{if(showForm)reset();else setShowForm(true)}} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="size-4"/>Aggiungi benefit</button></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-3"><Metric label="Credito disponibile" value={total}/><Card><p className="text-sm text-muted-foreground">Strumenti attivi</p><p className="mt-3 text-2xl font-semibold">{s.benefits.filter(item=>item.balance>0).length}</p><p className="mt-1 text-xs text-muted-foreground">Separati dalla liquidità bancaria</p></Card><Card><p className="text-sm text-muted-foreground">In scadenza entro 30 giorni</p><p className={`mt-3 text-2xl font-semibold ${expiring?'text-destructive':''}`}>{expiring}</p><p className="mt-1 text-xs text-muted-foreground">Visibili anche negli avvisi</p></Card></div>
    {showForm&&<form key={editing?.id??'new-benefit'} onSubmit={submit} className="mt-5 grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">
      {editing&&<p className="col-span-full rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">Modifica “{editing.name}”</p>}
      <Field label="Nome"><input name="name" required defaultValue={editing?.name} placeholder="Es. Edenred, Pluxee, carta carburante..."/></Field>
      <Field label="Tipo"><select value={type} onChange={event=>setType(event.target.value as BenefitType)}>{(Object.keys(BENEFIT_LABEL) as BenefitType[]).map(key=><option key={key} value={key}>{BENEFIT_LABEL[key]}</option>)}</select></Field>
      {type==='welfare'&&<Field label="Categoria welfare"><select value={welfareCategory} onChange={event=>setWelfareCategory(event.target.value as WelfareCategory)}>{(Object.keys(WELFARE_LABEL) as WelfareCategory[]).map(key=><option key={key} value={key}>{WELFARE_LABEL[key]}</option>)}</select></Field>}
      <Field label="Gestore / emittente"><input name="issuer" defaultValue={editing?.issuer} placeholder="Es. Edenred, Pluxee, Eni..."/></Field>
      <Field label="Saldo attuale (€)"><input name="balance" type="number" min="0" step=".01" required defaultValue={editing?.balance??0}/></Field>
      <Field label="Scadenza (facoltativa)"><input name="expiryDate" type="date" defaultValue={editing?.expiryDate}/></Field>
      <Field label="Accredito mensile"><select value={accreditMode} onChange={event=>setAccreditMode(event.target.value as BenefitAccreditMode)}><option value="none">Nessuna previsione</option><option value="fixed">Importo fisso</option><option value="variable">Importo variabile da confermare</option><option value="meal_count">Numero buoni × valore</option></select></Field>
      {accreditMode!=='none'&&<Field label="Giorno previsto"><input name="creditDay" type="number" min="1" max="28" defaultValue={editing?.creditDay??1}/></Field>}
      {accreditMode==='fixed'&&<Field label="Importo mensile (€)"><input name="monthlyAmount" type="number" min=".01" step=".01" required defaultValue={editing?.monthlyAmount}/></Field>}
      {accreditMode==='meal_count'&&<><Field label="Valore singolo buono (€)"><input name="mealValue" type="number" min=".01" step=".01" required defaultValue={editing?.mealValue}/></Field><Field label="Numero buoni previsto"><input name="expectedMealCount" type="number" min="1" required defaultValue={editing?.expectedMealCount}/></Field></>}
      <Field label="Note"><input name="notes" defaultValue={editing?.notes} placeholder="Non inserire PIN o numero completo"/></Field>
      <div className="flex items-end gap-2"><button className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{editing?'Salva modifiche':'Aggiungi'}</button><button type="button" onClick={reset} className="h-10 rounded-xl border px-3 text-sm">Annulla</button></div>
    </form>}
    <div className="mt-5 grid gap-4 md:grid-cols-2">{s.benefits.map(item=>{
      const last=item.transactions.at(-1),expired=Boolean(item.expiryDate&&item.expiryDate<today)
      const creditedThisMonth=item.transactions.some(transaction=>transaction.type==='topup'&&transaction.source==='employer'&&transaction.date.startsWith(currentPeriod))
      const planned=item.accreditMode==='fixed'?item.monthlyAmount:item.accreditMode==='meal_count'?(item.mealValue??0)*(item.expectedMealCount??0):undefined
      return <Card key={item.id} className={expired&&item.balance>0?'border-destructive/40':''}>
        <div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{BENEFIT_LABEL[item.type].toUpperCase()}</span><h3 className="mt-3 font-semibold">{item.name}</h3><p className="mt-1 text-xs text-muted-foreground">{item.type==='welfare'&&item.welfareCategory?WELFARE_LABEL[item.welfareCategory]:item.issuer||'Gestore non indicato'}</p></div><div className="flex gap-3"><EditButton onClick={()=>edit(item)} label="Modifica benefit"/><button onClick={()=>removeBenefit(item)}><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div></div>
        <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-secondary/60 p-3"><p className="text-xs text-muted-foreground">Saldo disponibile</p><p className="mt-1 text-xl font-semibold">{money.format(item.balance)}</p></div><div className="rounded-xl bg-secondary/60 p-3"><p className="text-xs text-muted-foreground">Scadenza</p><p className={`mt-1 text-sm font-semibold ${expired?'text-destructive':''}`}>{item.expiryDate?dateFullIt(item.expiryDate):'Non indicata'}</p></div></div>
        {item.accreditMode!=='none'&&<div className={`mt-3 rounded-xl border p-3 ${creditedThisMonth?'border-green-500/30 bg-green-50 dark:bg-green-950/20':'border-amber-500/30 bg-amber-50 dark:bg-amber-950/20'}`}><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold">{creditedThisMonth?'Accredito del mese registrato':'Accredito mensile da confermare'}</p><p className="mt-1 text-xs text-muted-foreground">Giorno {item.creditDay??1}{planned?` · previsto ${money.format(planned)}`:item.accreditMode==='variable'?' · importo variabile':''}</p></div>{!creditedThisMonth&&<button onClick={()=>{setMovementId(item.id);setMovementType('topup')}} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Conferma</button>}</div></div>}
        {last&&<div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs"><span className="min-w-0 flex-1 text-muted-foreground">Ultimo: {last.type==='spend'?'Utilizzo':'Accredito'} · {dateIt(last.date)}{last.description?` · ${last.description}`:last.note?` · ${last.note}`:''}</span><b className={last.type==='spend'?'text-destructive':'text-green-600'}>{last.type==='spend'?'-':'+'}{money.format(last.amount)}</b><button onClick={()=>undoLast(item)} className="text-primary">Annulla</button></div>}
        <div className="mt-3 flex gap-2"><button onClick={()=>{setMovementId(item.id);setMovementType('spend')}} className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Registra spesa</button><button onClick={()=>{setMovementId(item.id);setMovementType('topup')}} className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Registra accredito</button></div>
        {movementId===item.id&&<form onSubmit={addMovement} className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2"><p className="col-span-full text-sm font-semibold">{movementType==='spend'?'Spesa pagata con questo benefit':'Accredito del benefit'}</p><Field label="Data"><input name="date" type="date" required defaultValue={today}/></Field>{movementType==='topup'&&<Field label="Origine"><select name="source" defaultValue="employer"><option value="employer">Datore di lavoro</option><option value="personal">Acquisto personale</option><option value="adjustment">Rettifica saldo</option></select></Field>}{movementType==='topup'&&item.accreditMode==='meal_count'?<Field label="Numero buoni accreditati"><input name="mealCount" type="number" min="1" required defaultValue={item.expectedMealCount}/></Field>:<Field label="Importo (€)"><input name="amount" type="number" min=".01" step=".01" required defaultValue={movementType==='topup'?planned:undefined}/></Field>}<Field label={movementType==='spend'?'Descrizione':'Descrizione (facoltativa)'}><input name="description" required={movementType==='spend'} placeholder={movementType==='spend'?'Es. Pranzo, benzina...':'Es. Accredito agosto'}/></Field>{movementType==='spend'&&<Field label="Categoria"><input name="category" list="benefit-expense-categories" required placeholder="Es. Ristorazione, Carburante..."/><datalist id="benefit-expense-categories">{s.categories.map(category=><option key={category.id} value={category.name}/>)}</datalist></Field>}<Field label="Note"><input name="note" placeholder="Facoltativo"/></Field><div className="flex items-end gap-2"><button className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Salva</button><button type="button" onClick={()=>setMovementId(null)} className="h-10 rounded-xl border px-3 text-sm">Annulla</button></div></form>}
      </Card>
    })}{!s.benefits.length&&<Card className="md:col-span-2"><p className="py-5 text-center text-sm text-muted-foreground">Nessun benefit registrato.</p></Card>}</div>
  </section>
}

// ── FINANZIAMENTI ──
function Financings({s,set,onOpenDeadlines}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;onOpenDeadlines:()=>void}) {
  const [showForm,setShowForm]=useState(false)
  const [editing,setEditing]=useState<Financing|null>(null)
  const [category,setCategory]=useState<FinancingCategory>('auto')
  const [freq,setFreq]=useState<Freq>('mensile')
  const [interestMode,setInterestMode]=useState<InterestMode>('payment')
  const [residualMode,setResidualMode]=useState<ResidualMode>('total_due')
  const [originalAmount,setOriginalAmount]=useState(0)
  const [interestRate,setInterestRate]=useState(0)
  const [totalRepayable,setTotalRepayable]=useState(0)
  const [knownPayment,setKnownPayment]=useState(0)
  const [residualAmount,setResidualAmount]=useState<number|null>(null)
  const [installmentCount,setInstallmentCount]=useState(36)
  const [remainingInstallments,setRemainingInstallments]=useState(36)
  const [startDate,setStartDate]=useState('')
  const [nextPaymentDate,setNextPaymentDate]=useState('')
  const residual=s.financings.reduce((total,item)=>total+Math.max(0,item.residualAmount),0)
  const monthly=s.financings.filter(item=>financingRemainingInstallments(item)>0).reduce((total,item)=>total+toMensile(item.paymentAmount,item.freq),0)
  const calculatedTotal=interestMode==='total'?totalRepayable:interestMode==='payment'?knownPayment*installmentCount:originalAmount
  const previewPayment=installmentAmount(originalAmount,interestMode,interestRate,calculatedTotal,installmentCount,freq,knownPayment)
  const previewStatus=financingStatusFromSchedule(startDate,freq,installmentCount,previewPayment)
  const usesAutomaticResidual=residualMode==='total_due'&&residualAmount===null
  const previewResidual=roundCurrency(residualAmount===null?(residualMode==='total_due'?previewStatus.residualAmount:originalAmount):residualAmount)
  const previewRemaining=residualMode==='principal'?remainingInstallments:usesAutomaticResidual?previewStatus.remaining:remainingInstallmentCount(previewResidual,previewPayment)
  const previewNextPayment=nextPaymentDate||previewStatus.nextDate||undefined
  const previewEndDate=installmentEndDate(startDate,freq,installmentCount)
  const previewFinancing:Financing={id:editing?.id??'preview',name:'Anteprima',category,kind:'personale',originalAmount,residualAmount:previewResidual,paymentAmount:previewPayment,freq,interestMode,interestRate,totalRepayable:calculatedTotal,installmentCount,startDate,endDate:previewEndDate,residualMode,remainingInstallments:previewRemaining,residualCalculatedFromSchedule:usesAutomaticResidual,nextPaymentDate:previewNextPayment,payments:editing?.payments??[]}
  const previewSchedule=financingInstallmentSchedule(previewFinancing)
  const submit=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const f=new FormData(e.currentTarget)
    const financing:Financing={
      id:editing?.id??uid(),
      name:String(f.get('name')),
      category,
      kind:String(f.get('kind')) as Kind,
      originalAmount,
      residualAmount:previewResidual,
      paymentAmount:previewPayment,
      freq,
      interestMode,
      interestRate:interestMode==='percentage'?interestRate:0,
      totalRepayable:interestMode==='total'?totalRepayable:previewPayment*installmentCount,
      installmentCount,
      startDate,
      endDate:previewEndDate,
      accountId:String(f.get('accountId')??'')||undefined,
      residualMode,
      remainingInstallments:previewRemaining,
      residualCalculatedFromSchedule:usesAutomaticResidual,
      nextPaymentDate:previewSchedule[0]?.date||previewNextPayment,
      payments:editing?.payments??[]
    }
    if(!financing.name||financing.originalAmount<=0||financing.paymentAmount<=0||!startDate||installmentCount<=0||(residualMode==='principal'&&remainingInstallments<=0))return
    set(x=>({...x,financings:editing?x.financings.map(item=>item.id===editing.id?financing:item):[financing,...x.financings]}))
    e.currentTarget.reset();resetForm()
  }
  const resetForm=()=>{setCategory('auto');setFreq('mensile');setInterestMode('payment');setResidualMode('total_due');setOriginalAmount(0);setInterestRate(0);setTotalRepayable(0);setKnownPayment(0);setResidualAmount(null);setInstallmentCount(36);setRemainingInstallments(36);setStartDate('');setNextPaymentDate('');setEditing(null);setShowForm(false)}
  const edit=(item:Financing)=>{setEditing(item);setCategory(item.category);setFreq(item.freq);setInterestMode(item.interestMode);setResidualMode(item.residualMode);setOriginalAmount(item.originalAmount);setInterestRate(item.interestRate);setTotalRepayable(item.totalRepayable);setKnownPayment(item.paymentAmount);setResidualAmount(item.residualAmount);setInstallmentCount(item.installmentCount);setRemainingInstallments(financingRemainingInstallments(item));setStartDate(item.startDate);setNextPaymentDate(item.nextPaymentDate??'');setShowForm(true)}
  const undoLastPayment=(item:Financing)=>{const payment=item.payments.at(-1);if(!payment||!window.confirm(`Annullare l’ultima rata registrata di ${money.format(payment.amount)}?`))return;set(value=>({...value,expenses:value.expenses.filter(expense=>expense.id!==payment.expenseId),financings:value.financings.map(financing=>financing.id===item.id?{...financing,residualAmount:roundCurrency(financing.residualAmount+payment.principalAmount),remainingInstallments:Math.min(financing.installmentCount,financing.remainingInstallments+1),nextPaymentDate:payment.dueDate,payments:financing.payments.filter(value=>value.id!==payment.id)}:financing)}))}
  return <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <Heading kicker="DEBITI E RATE" title="Finanziamenti e mutui" text="Piani rateali ordinati, con prossima rata e calendario automatico nelle Scadenze."/>
      <div className="flex flex-wrap gap-2"><button onClick={onOpenDeadlines} className="flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold hover:bg-secondary"><CalendarDays className="size-4"/>Calendario rate</button><button onClick={()=>{if(showForm)resetForm();else setShowForm(true)}} className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="size-4"/>Aggiungi finanziamento</button></div>
    </div>
    <div className="grid gap-4 sm:grid-cols-3"><Metric label="Debito residuo" value={residual}/><Metric label="Impegno mensile" value={monthly}/><Card><p className="text-sm text-muted-foreground">Piani registrati</p><p className="mt-3 text-2xl font-semibold">{s.financings.length}</p><p className="mt-1 text-xs text-muted-foreground">Le rate alimentano automaticamente le Scadenze</p></Card></div>
    {showForm&&<form key={editing?.id??'new-financing'} onSubmit={submit} className="flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{editing?'Modifica piano':'Nuovo piano'}</p><h3 className="mt-1 text-lg font-semibold">{editing?editing.name:'Inserisci i dati del finanziamento'}</h3></div><button type="button" onClick={resetForm} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-secondary">Chiudi</button></div>
      <section className="rounded-xl border p-4"><h4 className="mb-4 font-semibold">1. Informazioni principali</h4><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Nome"><input name="name" required placeholder="Es. Auto, mutuo casa..." defaultValue={editing?.name}/></Field>
        <Field label="Categoria"><select value={category} onChange={e=>setCategory(e.target.value as FinancingCategory)}>{(Object.keys(FINANCING_LABEL) as FinancingCategory[]).map(key=><option key={key} value={key}>{FINANCING_LABEL[key]}</option>)}</select></Field>
        <Field label="Ambito"><select name="kind" defaultValue={editing?.kind??'personale'}><option value="personale">Personale</option><option value="piva">P.IVA</option></select></Field>
        <Field label="Conto di addebito"><select name="accountId" defaultValue={editing?.accountId??''}><option value="">Nessun conto</option>{s.accounts.map(account=><option key={account.id} value={account.id}>{account.name}</option>)}</select></Field>
      </div></section>
      <section className="rounded-xl border p-4"><h4 className="mb-4 font-semibold">2. Durata e importi</h4><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Importo finanziato (€)"><input name="originalAmount" type="number" min=".01" step=".01" required value={originalAmount||''} onChange={e=>setOriginalAmount(Number(e.target.value))}/></Field>
        <Field label="Che residuo stai inserendo?"><select value={residualMode} onChange={e=>setResidualMode(e.target.value as ResidualMode)}><option value="total_due">Totale ancora da pagare</option><option value="principal">Solo capitale residuo della banca</option></select></Field>
        <Field label={residualMode==='principal'?'Capitale residuo (€)':'Residuo manuale (facoltativo)'}><input name="residualAmount" type="number" min="0" step=".01" placeholder={residualMode==='total_due'?'Vuoto = calcolo da rate e date':'Inserisci il dato della banca'} value={residualAmount??''} onChange={e=>setResidualAmount(e.target.value===''?null:Number(e.target.value))}/></Field>
        <Field label="Numero totale di rate"><input type="number" min="1" max="1200" required value={installmentCount} onChange={e=>setInstallmentCount(Number(e.target.value))}/></Field>
        <Field label="Frequenza rate"><InstallmentFreqSelect value={freq} onChange={setFreq}/></Field>
        <Field label="Data della prima rata"><input type="date" required value={startDate} onChange={e=>setStartDate(e.target.value)}/></Field>
        <Field label="Prossima rata (facoltativa)"><input type="date" value={nextPaymentDate} onChange={e=>setNextPaymentDate(e.target.value)}/></Field>
        {residualMode==='principal'&&<Field label="Rate mancanti dichiarate"><input type="number" min="1" max="1200" required value={remainingInstallments} onChange={e=>setRemainingInstallments(Number(e.target.value))}/></Field>}
      </div></section>
      <section className="rounded-xl border p-4"><h4 className="mb-4 font-semibold">3. Calcolo della rata</h4><div className="grid gap-4 md:grid-cols-2">
        <Field label="Dato disponibile"><select value={interestMode} onChange={e=>setInterestMode(e.target.value as InterestMode)}><option value="payment">Conosco l’importo della rata</option><option value="percentage">Conosco il tasso annuo %</option><option value="total">Conosco il totale da restituire</option></select></Field>
        {interestMode==='percentage'?<Field label="Tasso annuo %"><input type="number" min="0" step=".01" value={interestRate||''} onChange={e=>setInterestRate(Number(e.target.value))} placeholder="Es. 6,50"/></Field>:interestMode==='total'?<Field label="Totale da restituire (€)"><input type="number" min={originalAmount||.01} step=".01" required value={totalRepayable||''} onChange={e=>setTotalRepayable(Number(e.target.value))} placeholder="Capitale + interessi"/></Field>:<Field label="Importo rata (€)"><input type="number" min=".01" step=".01" required value={knownPayment||''} onChange={e=>setKnownPayment(Number(e.target.value))} placeholder="Es. 300"/></Field>}
      </div></section>
      {usesAutomaticResidual&&startDate&&previewPayment>0&&<div className="rounded-xl border border-primary/25 bg-primary/5 p-4"><p className="text-sm font-semibold text-primary">Calcolo automatico sul piano originario</p><p className="mt-1 text-sm text-muted-foreground">{previewStatus.paid} rate con data già trascorsa · {previewRemaining} ancora da pagare · {money.format(previewPayment)} × {previewRemaining} = <b className="text-foreground">{money.format(previewResidual)}</b>. Se una rata scaduta non è stata pagata, inserisci manualmente residuo e prossima rata.</p></div>}
      <div className="grid gap-3 rounded-xl bg-secondary/60 p-4 sm:grid-cols-2 xl:grid-cols-5"><div><p className="text-xs text-muted-foreground">Rata {interestMode==='payment'?'indicata':'calcolata'}</p><p className="mt-1 text-xl font-semibold">{money.format(previewPayment)}</p></div><div><p className="text-xs text-muted-foreground">Rate trascorse</p><p className="mt-1 text-xl font-semibold">{usesAutomaticResidual?previewStatus.paid:Math.max(0,installmentCount-previewRemaining)}</p></div><div><p className="text-xs text-muted-foreground">Rate mancanti</p><p className="mt-1 text-xl font-semibold text-primary">{previewRemaining}</p></div><div><p className="text-xs text-muted-foreground">{residualMode==='principal'?'Capitale residuo':'Totale residuo'}</p><p className="mt-1 text-xl font-semibold">{money.format(previewResidual)}</p></div><div><p className="text-xs text-muted-foreground">Ultima rata contrattuale</p><p className="mt-1 font-semibold">{previewEndDate?dateFullIt(previewEndDate):'Da calcolare'}</p></div></div>
      <div className="flex flex-wrap gap-3"><button className="h-10 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">{editing?'Salva modifiche':'Salva finanziamento'}</button><button type="button" onClick={resetForm} className="h-10 rounded-xl border px-5 text-sm">Annulla</button></div>
    </form>}
    <section><div className="mb-3"><h3 className="font-semibold">I tuoi piani rateali</h3><p className="text-sm text-muted-foreground">Una scheda pulita per ogni posizione; le singole rate sono visibili mese per mese in Scadenze.</p></div><div className="grid gap-4 xl:grid-cols-2">{s.financings.map(item=>{
      const plan=financingInstallmentSchedule(item)
      const progress=item.installmentCount>0?Math.min(100,Math.max(0,(item.installmentCount-plan.length)/item.installmentCount*100)):0
      const account=s.accounts.find(value=>value.id===item.accountId)
      return <Card key={item.id} className="overflow-hidden p-0">
        <div className="border-b p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">{FINANCING_LABEL[item.category]}</span><span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold">{item.kind==='piva'?'P.IVA':'PERSONALE'}</span></div><h3 className="mt-3 text-lg font-semibold">{item.name}</h3>{account&&<p className="mt-1 text-xs text-muted-foreground">Addebito su {account.name}</p>}</div><div className="flex gap-3"><EditButton onClick={()=>edit(item)} label="Modifica finanziamento"/><button onClick={()=>set(x=>({...x,financings:x.financings.filter(value=>value.id!==item.id)}))} aria-label="Elimina finanziamento"><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div></div>
          <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-secondary/70 p-3"><p className="text-xs text-muted-foreground">{item.residualMode==='principal'?'Capitale residuo':'Totale residuo dovuto'}</p><p className="mt-1 text-xl font-semibold">{money.format(item.residualAmount)}</p></div><div className="rounded-xl bg-primary/10 p-3"><p className="text-xs text-primary">Rata {FREQ_LABEL[item.freq].toLowerCase()}</p><p className="mt-1 text-xl font-semibold text-primary">{money.format(item.paymentAmount)}</p></div></div>
        </div>
        <div className="p-5"><div className="flex items-end justify-between gap-3"><div><p className="text-xs text-muted-foreground">Avanzamento per numero di rate</p><p className="mt-1 text-sm font-semibold">{plan.length} rate mancanti su {item.installmentCount}</p></div><p className="text-sm font-semibold text-primary">{progress.toFixed(0)}%</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{width:`${progress}%`}}/></div>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Prima rata</p><p className="mt-1 font-semibold">{item.startDate?dateFullIt(item.startDate):'—'}</p></div><div><p className="text-xs text-muted-foreground">Prossima rata prevista</p><p className="mt-1 font-semibold text-primary">{plan[0]?.date?dateFullIt(plan[0].date):'Piano concluso'}</p></div><div><p className="text-xs text-muted-foreground">Ultima rata contrattuale</p><p className="mt-1 font-semibold">{item.endDate?dateFullIt(item.endDate):'—'}</p></div></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3"><p className="text-xs text-muted-foreground">{item.interestMode==='total'?`Totale da restituire ${money.format(item.totalRepayable)}`:item.interestMode==='payment'?`Rata inserita manualmente · Totale piano ${money.format(item.paymentAmount*item.installmentCount)}`:`Tasso annuo ${item.interestRate}% · Totale stimato ${money.format(item.totalRepayable)}`}{item.payments.length?` · ${item.payments.length} rate registrate`:''}</p>{item.payments.length>0&&<button onClick={()=>undoLastPayment(item)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Annulla ultima rata</button>}</div>
        </div>
      </Card>
    })}{!s.financings.length&&<Card className="xl:col-span-2"><p className="text-center text-sm text-muted-foreground">Nessun finanziamento inserito. Quando ne aggiungi uno, le rate compariranno anche nelle Scadenze.</p></Card>}</div></section>
  </div>
}

// ── ABBONAMENTI ──
function Subscriptions({s,set,onOpenMovements}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;onOpenMovements:()=>void}) {
  const today=new Date().toISOString().slice(0,10)
  const subscriptions=s.expenses.filter(item=>item.subscription)
  const active=subscriptions.filter(item=>(!item.subscription?.endDate||item.subscription.endDate>today)&&(!item.subscription?.startDate||item.subscription.startDate<=today))
  const upcoming=subscriptions.filter(item=>item.subscription?.startDate&&item.subscription.startDate>today)
  const ended=subscriptions.filter(item=>item.subscription?.endDate&&item.subscription.endDate<=today)
  const monthly=active.reduce((total,item)=>total+toMensile(item.amount,item.freq),0)
  const updateEnd=(id:string,endDate:string|null)=>set(value=>({...value,expenses:value.expenses.map(item=>item.id===id?{...item,recurring:true,subscription:{...item.subscription,endDate}}:item)}))
  const list=(items:Expense[],status:'active'|'upcoming'|'ended')=><div className="grid gap-3 md:grid-cols-2">{items.map(item=><Card key={item.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold">{item.description}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status==='active'?'bg-green-100 text-green-700':status==='upcoming'?'bg-amber-100 text-amber-700':'bg-secondary text-muted-foreground'}`}>{status==='active'?'ATTIVO':status==='upcoming'?'PROGRAMMATO':'CONCLUSO'}</span></div><p className="mt-1 text-xs text-muted-foreground">{item.category||'Senza categoria'} · {FREQ_LABEL[item.freq]}</p></div><b>{money.format(toMensile(item.amount,item.freq))}/mese</b></div><div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-secondary/60 p-3 text-xs"><div><p className="text-muted-foreground">Inizio</p><p className="mt-1 font-semibold">{item.subscription?.startDate?dateFullIt(item.subscription.startDate):'Non indicato'}</p></div><div><p className="text-muted-foreground">Fine</p><p className="mt-1 font-semibold">{item.subscription?.endDate?dateFullIt(item.subscription.endDate):'Non definita'}</p></div></div><div className="mt-3 flex flex-wrap gap-2">{status!=='ended'?<button onClick={()=>updateEnd(item.id,today)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Termina oggi</button>:<button onClick={()=>updateEnd(item.id,null)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Riattiva</button>}<button onClick={onOpenMovements} className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Modifica dati</button><button onClick={()=>set(value=>({...value,expenses:value.expenses.filter(expense=>expense.id!==item.id)}))} className="ml-auto rounded-lg px-2 py-1.5 text-xs text-destructive">Elimina</button></div></Card>)}{!items.length&&<Card className="md:col-span-2"><p className="text-center text-sm text-muted-foreground">Nessun abbonamento in questa sezione.</p></Card>}</div>
  return <div className="flex flex-col gap-6"><div className="flex flex-wrap items-end justify-between gap-4"><Heading kicker="COSTI RICORRENTI" title="Centro abbonamenti" text="Costi attivi, programmati e conclusi con impatto mensile e annuale."/><button onClick={onOpenMovements} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="size-4"/>Nuovo abbonamento</button></div><div className="grid gap-4 sm:grid-cols-3"><Metric label="Costo mensile attivo" value={monthly}/><Metric label="Costo annuale stimato" value={monthly*12}/><Card><p className="text-sm text-muted-foreground">Abbonamenti attivi</p><p className="mt-3 text-2xl font-semibold">{active.length}</p><p className="mt-1 text-xs text-muted-foreground">{upcoming.length} programmati · {ended.length} conclusi</p></Card></div><section><h3 className="mb-3 font-semibold">Attivi</h3>{list(active,'active')}</section>{upcoming.length>0&&<section><h3 className="mb-3 font-semibold">Programmati</h3>{list(upcoming,'upcoming')}</section>}<section><h3 className="mb-3 font-semibold">Conclusi</h3>{list(ended,'ended')}</section></div>
}

// ── OBIETTIVI ──
function Goals({s,set,year}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;year:number}) {
  const [editing,setEditing]=useState<SavingsGoal|null>(null)
  const [showForm,setShowForm]=useState(false)
  const t=totals(s,year),today=new Date().toISOString().slice(0,10)
  const emergencySaved=s.goals.filter(item=>item.kind==='emergency').reduce((total,item)=>total+item.currentAmount,0)
  const suggestedEmergency=t.mensileSpese*6
  const submit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const form=new FormData(event.currentTarget);const goal:SavingsGoal={id:editing?.id??uid(),name:String(form.get('name')),kind:String(form.get('kind')) as SavingsGoal['kind'],targetAmount:Number(form.get('targetAmount')),currentAmount:Number(form.get('currentAmount')),targetDate:String(form.get('targetDate')||'')||undefined};if(!goal.name||goal.targetAmount<=0||goal.currentAmount<0)return;set(value=>({...value,goals:editing?value.goals.map(item=>item.id===editing.id?goal:item):[goal,...value.goals]}));event.currentTarget.reset();setEditing(null);setShowForm(false)}
  const edit=(goal:SavingsGoal)=>{setEditing(goal);setShowForm(true)}
  return <div className="flex flex-col gap-6"><div className="flex flex-wrap items-end justify-between gap-4"><Heading kicker="RISPARMIO" title="Obiettivi e fondo emergenza" text="Trasforma il margine mensile in traguardi misurabili."/><button onClick={()=>{setEditing(null);setShowForm(value=>!value)}} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="size-4"/>Nuovo obiettivo</button></div><div className="grid gap-4 sm:grid-cols-3"><Metric label="Fondo emergenza" value={emergencySaved} detail={t.mensileSpese>0?`${(emergencySaved/t.mensileSpese).toFixed(1)} mesi di spese`:'Aggiungi le spese ricorrenti'}/><Metric label="Obiettivo prudente (6 mesi)" value={suggestedEmergency}/><Card><p className="text-sm text-muted-foreground">Traguardi registrati</p><p className="mt-3 text-2xl font-semibold">{s.goals.length}</p><p className="mt-1 text-xs text-muted-foreground">Tutti modificabili in qualsiasi momento</p></Card></div>{showForm&&<form key={editing?.id??'new-goal'} onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">{editing&&<p className="col-span-full rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">Modifica “{editing.name}”</p>}<Field label="Nome"><input name="name" required defaultValue={editing?.name} placeholder="Es. Fondo emergenza, viaggio..."/></Field><Field label="Tipo"><select name="kind" defaultValue={editing?.kind??'goal'}><option value="goal">Obiettivo</option><option value="emergency">Fondo emergenza</option></select></Field><Field label="Importo obiettivo (€)"><input name="targetAmount" type="number" min=".01" step=".01" required defaultValue={editing?.targetAmount}/></Field><Field label="Già accumulato (€)"><input name="currentAmount" type="number" min="0" step=".01" required defaultValue={editing?.currentAmount??0}/></Field><Field label="Data obiettivo (facoltativa)"><input name="targetDate" type="date" min={today} defaultValue={editing?.targetDate}/></Field><div className="flex items-end gap-2"><button className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">{editing?'Salva modifiche':'Aggiungi'}</button><button type="button" onClick={()=>{setEditing(null);setShowForm(false)}} className="h-10 rounded-xl border px-4 text-sm">Annulla</button></div></form>}<div className="grid gap-4 md:grid-cols-2">{s.goals.map(goal=>{const progress=goal.targetAmount>0?Math.min(100,goal.currentAmount/goal.targetAmount*100):0;const remaining=Math.max(0,goal.targetAmount-goal.currentAmount);let monthlyNeeded=0;if(goal.targetDate&&goal.targetDate>today){const start=new Date(`${today}T12:00:00`),end=new Date(`${goal.targetDate}T12:00:00`);const months=Math.max(1,(end.getFullYear()-start.getFullYear())*12+end.getMonth()-start.getMonth());monthlyNeeded=remaining/months}return <Card key={goal.id}><div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{goal.kind==='emergency'?'FONDO EMERGENZA':'OBIETTIVO'}</span><h3 className="mt-3 text-lg font-semibold">{goal.name}</h3></div><div className="flex gap-3"><EditButton onClick={()=>edit(goal)} label="Modifica obiettivo"/><button onClick={()=>set(value=>({...value,goals:value.goals.filter(item=>item.id!==goal.id)}))}><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div></div><div className="mt-5 flex items-end justify-between"><div><p className="text-2xl font-semibold">{money.format(goal.currentAmount)}</p><p className="text-xs text-muted-foreground">su {money.format(goal.targetAmount)}</p></div><b className="text-primary">{progress.toFixed(0)}%</b></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{width:`${progress}%`}}/></div><div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-xs"><div><p className="text-muted-foreground">Mancano</p><p className="mt-1 font-semibold">{money.format(remaining)}</p></div><div><p className="text-muted-foreground">Versamento suggerito</p><p className="mt-1 font-semibold">{monthlyNeeded>0?`${money.format(monthlyNeeded)}/mese`:'Imposta una data'}</p></div></div></Card>})}{!s.goals.length&&<Card className="md:col-span-2"><div className="py-6 text-center"><PiggyBank className="mx-auto size-9 text-muted-foreground/50"/><p className="mt-3 font-semibold">Nessun obiettivo ancora</p><p className="mt-1 text-sm text-muted-foreground">Aggiungi un fondo emergenza o un traguardo personale.</p></div></Card>}</div></div>
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
  const today=new Date().toISOString().slice(0,10)
  const [selectedMonth,setSelectedMonth]=useState(today.slice(0,7))
  const [showForm,setShowForm]=useState(false)
  const [freq,setFreq]=useState<Freq>('unica')
  const [editing,setEditing]=useState<Deadline|null>(null)
  const monthDate=new Date(`${selectedMonth}-01T12:00:00`)
  const monthLabel=new Intl.DateTimeFormat('it-IT',{month:'long',year:'numeric'}).format(monthDate)
  const shiftMonth=(amount:number)=>{const next=new Date(monthDate);next.setMonth(next.getMonth()+amount);setSelectedMonth(`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}`)}
  const manualDeadlines=s.deadlines.filter(item=>item.date.startsWith(selectedMonth)).sort((a,b)=>a.date.localeCompare(b.date))
  const financingDeadlines=s.financings.flatMap(financing=>financingInstallmentSchedule(financing).filter(installment=>installment.date.startsWith(selectedMonth)).map(installment=>({financing,installment}))).sort((a,b)=>a.installment.date.localeCompare(b.installment.date))
  const monthItems=[...manualDeadlines.map(deadline=>({type:'manual' as const,date:deadline.date,deadline})),...financingDeadlines.map(item=>({type:'financing' as const,date:item.installment.date,...item}))].sort((a,b)=>a.date.localeCompare(b.date))
  const monthTotal=manualDeadlines.filter(item=>!item.paid).reduce((total,item)=>total+item.amount,0)+financingDeadlines.reduce((total,item)=>total+item.installment.amount,0)
  const futureInstallments=s.financings.reduce((total,financing)=>total+financingInstallmentSchedule(financing).length,0)
  const payInstallment=(financing:Financing,installment:{date:string;amount:number})=>{
    if(!window.confirm(`Registrare come pagata la rata di ${money.format(installment.amount)} di “${financing.name}”?`))return
    const paidDate=new Date().toISOString().slice(0,10),expenseId=uid(),principalAmount=financingPrincipalReduction(financing,installment.amount)
    set(value=>({...value,
      expenses:[{id:expenseId,date:paidDate,description:`Rata ${financing.name}`,amount:installment.amount,kind:financing.kind,accountId:financing.accountId,recurring:false,freq:'unica',category:'Finanziamenti'},...value.expenses],
      financings:value.financings.map(item=>item.id===financing.id?{...item,residualAmount:roundCurrency(Math.max(0,item.residualAmount-principalAmount)),remainingInstallments:Math.max(0,item.remainingInstallments-1),residualCalculatedFromSchedule:false,nextPaymentDate:nextInstallmentAfter(installment.date,item.freq),payments:[...item.payments,{id:uid(),dueDate:installment.date,paidDate,amount:installment.amount,principalAmount,expenseId}]}:item)
    }))
  }
  const submit=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const f=new FormData(e.currentTarget)
    const deadline:Deadline={id:editing?.id??uid(),title:String(f.get('title')),date:String(f.get('date')),amount:Number(f.get('amount')),paid:editing?.paid??false,priority:String(f.get('priority')) as Deadline['priority'],freq}
    set(x=>({...x,deadlines:editing?x.deadlines.map(item=>item.id===editing.id?deadline:item):[...x.deadlines,deadline]}))
    e.currentTarget.reset();setShowForm(false);setEditing(null);setFreq('unica')
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><Heading kicker="CALENDARIO" title="Scadenze mensili" text="Scadenze manuali e rate dei finanziamenti, riunite automaticamente mese per mese."/><button onClick={()=>{setEditing(null);setFreq('unica');setShowForm(v=>!v)}} className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="size-4"/>Aggiungi scadenza</button></div>
      <Card><div className="flex flex-wrap items-center justify-between gap-4"><button onClick={()=>shiftMonth(-1)} className="grid size-10 place-items-center rounded-xl border hover:bg-secondary" aria-label="Mese precedente"><ChevronLeft className="size-4"/></button><div className="text-center"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Mese visualizzato</p><h3 className="mt-1 text-xl font-semibold capitalize">{monthLabel}</h3>{selectedMonth!==today.slice(0,7)&&<button onClick={()=>setSelectedMonth(today.slice(0,7))} className="mt-1 text-xs font-medium text-primary">Torna al mese corrente</button>}</div><button onClick={()=>shiftMonth(1)} className="grid size-10 place-items-center rounded-xl border hover:bg-secondary" aria-label="Mese successivo"><ChevronRight className="size-4"/></button></div></Card>
      <div className="grid gap-4 sm:grid-cols-3"><Metric label={`Totale programmato · ${monthLabel}`} value={monthTotal}/><Card><p className="text-sm text-muted-foreground">Rate automatiche nel mese</p><p className="mt-3 text-2xl font-semibold">{financingDeadlines.length}</p><p className="mt-1 text-xs text-muted-foreground">Generate dai finanziamenti</p></Card><Card><p className="text-sm text-muted-foreground">Rate future complessive</p><p className="mt-3 text-2xl font-semibold">{futureInstallments}</p><p className="mt-1 text-xs text-muted-foreground">Distribuite nei prossimi mesi</p></Card></div>
      {showForm&&<form key={editing?.id??'new-deadline'} onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">{editing&&<p className="col-span-full rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">Modifica “{editing.title}”</p>}<Field label="Descrizione"><input name="title" required placeholder="Es. Assicurazione auto" defaultValue={editing?.title}/></Field><Field label="Data"><input name="date" type="date" required defaultValue={editing?.date}/></Field><Field label="Importo (€)"><input name="amount" type="number" step=".01" required defaultValue={editing?.amount}/></Field><Field label="Priorità"><select name="priority" defaultValue={editing?.priority??'alta'}><option value="alta">Alta</option><option value="media">Media</option><option value="bassa">Bassa</option></select></Field><Field label="Frequenza"><FreqSelect value={freq} onChange={setFreq}/></Field><div className="col-span-full flex gap-3"><button type="submit" className="h-10 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">{editing?'Salva modifiche':'Aggiungi'}</button><button type="button" onClick={()=>{setShowForm(false);setEditing(null)}} className="h-10 rounded-xl border px-5 text-sm">Annulla</button></div></form>}
      <section><div className="mb-3"><h3 className="font-semibold capitalize">Pagamenti di {monthLabel}</h3><p className="text-sm text-muted-foreground">Vedi solo il mese selezionato. Le rate con etichetta “Automatica” arrivano direttamente dai finanziamenti.</p></div><div className="flex flex-col gap-3">{monthItems.map(item=>{
        const day=Number(item.date.slice(8,10))
        const weekday=new Intl.DateTimeFormat('it-IT',{weekday:'short'}).format(new Date(`${item.date}T12:00:00`))
        if(item.type==='manual'){
          const d=item.deadline
          return <Card key={`manual-${d.id}`} className="p-4"><div className="flex flex-wrap items-center gap-4"><div className="grid size-14 shrink-0 place-items-center rounded-xl bg-secondary text-center"><div><p className="text-[10px] font-semibold uppercase text-muted-foreground">{weekday}</p><p className="text-xl font-bold leading-none">{day}</p></div></div><div className="min-w-48 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className={d.paid?'font-semibold line-through opacity-60':'font-semibold'}>{d.title}</h3><span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase">Manuale</span></div><p className="mt-1 text-xs text-muted-foreground">Priorità {d.priority}{d.freq&&d.freq!=='unica'?` · ${FREQ_LABEL[d.freq]}`:''}</p></div><b className="text-right">{money.format(d.amount)}</b><button onClick={()=>set(x=>({...x,deadlines:x.deadlines.map(value=>value.id===d.id?{...value,paid:!value.paid}:value)}))} className={`rounded-full px-3 py-1 text-xs font-semibold ${d.paid?'bg-secondary':'bg-primary text-primary-foreground'}`}>{d.paid?'Pagata':'Da pagare'}</button><EditButton onClick={()=>{setEditing(d);setFreq(d.freq??'unica');setShowForm(true)}} label="Modifica scadenza"/><button onClick={()=>set(x=>({...x,deadlines:x.deadlines.filter(value=>value.id!==d.id)}))}><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div></Card>
        }
        const {financing,installment}=item
        const dateStatus=item.date<today?'Data trascorsa':item.date===today?'Scade oggi':'Programmata'
        const remainingCount=financingRemainingInstallments(financing)
        return <Card key={`financing-${financing.id}-${installment.number}`} className="border-primary/25 p-4"><div className="flex flex-wrap items-center gap-4"><div className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-center text-primary"><div><p className="text-[10px] font-semibold uppercase">{weekday}</p><p className="text-xl font-bold leading-none">{day}</p></div></div><div className="min-w-48 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">Rata · {financing.name}</h3><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">Automatica</span></div><p className="mt-1 text-xs text-muted-foreground">Rata residua {installment.number} di {remainingCount} · {FINANCING_LABEL[financing.category]} · {dateStatus}</p></div><div className="text-right"><b className="text-lg">{money.format(installment.amount)}</b><p className="mt-1 text-[10px] font-semibold uppercase text-primary">{installment.number===remainingCount&&installment.amount<financing.paymentAmount?'ULTIMA RATA':'RATA PREVISTA'}</p></div><button onClick={()=>payInstallment(financing,installment)} className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground"><CheckCircle2 className="size-4"/>Segna pagata</button></div></Card>
      })}{!monthItems.length&&<Card><div className="py-8 text-center"><CalendarDays className="mx-auto size-8 text-muted-foreground/50"/><p className="mt-3 font-semibold">Nessun pagamento in questo mese</p><p className="mt-1 text-sm text-muted-foreground">Usa le frecce per cambiare mese oppure aggiungi una scadenza manuale.</p></div></Card>}</div></section>
    </div>
  )
}

// ── PREVISIONI ──
function Previsioni({s,set}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>}) {
  const today=new Date().toISOString().slice(0,10)
  const [data,setData]=useState(today)
  const [simType,setSimType]=useState<SimulationType>('mutuo')
  const [freq,setFreq]=useState<Freq>('mensile')
  const [simInterestMode,setSimInterestMode]=useState<InterestMode>('percentage')
  const [simAmount,setSimAmount]=useState(0)
  const [simDownPayment,setSimDownPayment]=useState(0)
  const [simInterestRate,setSimInterestRate]=useState(0)
  const [simTotalRepayable,setSimTotalRepayable]=useState(0)
  const [simKnownPayment,setSimKnownPayment]=useState(0)
  const [simInstallmentCount,setSimInstallmentCount]=useState(36)
  const [simStartDate,setSimStartDate]=useState('')
  const [selectedId,setSelectedId]=useState(s.simulations[0]?.id??'')
  const [editing,setEditing]=useState<Simulation|null>(null)
  const isLoan=simType==='mutuo'||simType==='finanziamento'
  const simulatedPrincipal=Math.max(0,simAmount-simDownPayment)
  const simCalculatedTotal=simInterestMode==='total'?simTotalRepayable:simInterestMode==='payment'?simKnownPayment*simInstallmentCount:simulatedPrincipal
  const simPreviewPayment=isLoan?installmentAmount(simulatedPrincipal,simInterestMode,simInterestRate,simCalculatedTotal,simInstallmentCount,freq,simKnownPayment):0
  const simPreviewEnd=isLoan?installmentEndDate(simStartDate,freq,simInstallmentCount):''
  const simPreviewProgress=isLoan?installmentProgress(simStartDate,freq,simInstallmentCount):null
  useEffect(()=>{
    if(s.simulations.length&&!s.simulations.some(item=>item.id===selectedId))setSelectedId(s.simulations[0].id)
    if(!s.simulations.length&&selectedId)setSelectedId('')
  },[s.simulations,selectedId])
  const addMesi=(n:number)=>{const date=new Date();date.setMonth(date.getMonth()+n);setData(date.toISOString().slice(0,10))}
  const submit=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const form=new FormData(e.currentTarget)
    const simulation:Simulation={
      id:editing?.id??uid(),name:String(form.get('name')),type:simType,
      amount:simAmount,downPayment:isLoan?simDownPayment:0,
      interestMode:isLoan?simInterestMode:'percentage',
      interestRate:isLoan&&simInterestMode==='percentage'?simInterestRate:0,
      totalRepayable:isLoan?(simInterestMode==='total'?simTotalRepayable:simPreviewPayment*simInstallmentCount):0,
      paymentAmount:isLoan?simPreviewPayment:0,
      installmentCount:isLoan?simInstallmentCount:0,
      freq,startDate:simStartDate||undefined,
      kind:String(form.get('kind')) as Kind
    }
    if(!simulation.name||simulation.amount<=0||(isLoan&&(!simStartDate||simInstallmentCount<=0||simPreviewPayment<=0)))return
    set(value=>({...value,simulations:editing?value.simulations.map(item=>item.id===editing.id?simulation:item):[simulation,...value.simulations]}));setSelectedId(simulation.id)
    e.currentTarget.reset();resetSimulationForm()
  }
  const resetSimulationForm=()=>{setEditing(null);setSimType('mutuo');setFreq('mensile');setSimInterestMode('percentage');setSimAmount(0);setSimDownPayment(0);setSimInterestRate(0);setSimTotalRepayable(0);setSimKnownPayment(0);setSimInstallmentCount(36);setSimStartDate('')}
  const editSimulation=(item:Simulation)=>{setEditing(item);setSimType(item.type);setFreq(item.freq);setSimInterestMode(item.interestMode);setSimAmount(item.amount);setSimDownPayment(item.downPayment);setSimInterestRate(item.interestRate);setSimTotalRepayable(item.totalRepayable);setSimKnownPayment(item.paymentAmount);setSimInstallmentCount(item.installmentCount);setSimStartDate(item.startDate??'')}
  const selected=s.simulations.find(item=>item.id===selectedId)
  const recurringIncome=s.incomes.filter(item=>item.recurring&&(!item.date||item.date<=data)).reduce((total,item)=>total+toMensile(item.amount,item.freq??'mensile'),0)
  const recurringPiva=s.incomes.filter(item=>item.kind==='piva'&&item.recurring&&(!item.date||item.date<=data)).reduce((total,item)=>total+toMensile(item.amount,item.freq??'mensile'),0)
  const activeSubscriptions=s.expenses.filter(item=>(item.recurring||item.subscription)&&(!item.subscription||isActiveAt(item.subscription.startDate,item.subscription.endDate,data)))
  const recurringExpenses=activeSubscriptions.reduce((total,item)=>total+toMensile(item.amount,item.freq),0)
  const activeFinancing=s.financings.filter(item=>{
    const schedule=financingInstallmentSchedule(item,today)
    return schedule.length>0&&data>=schedule[0].date&&data<=schedule[schedule.length-1].date
  }).reduce((total,item)=>total+toMensile(item.paymentAmount,item.freq),0)
  const taxReserve=recurringPiva*s.profile.taxReserve/100
  const baseMonthly=recurringIncome-recurringExpenses-activeFinancing-taxReserve
  let monthlyImpact=0,upfrontImpact=0,scenarioPayment=0
  let selectedPlan:ReturnType<typeof installmentProgress>|null=null
  if(selected){
    if(selected.type==='mutuo'||selected.type==='finanziamento'){
      upfrontImpact=selected.downPayment
      scenarioPayment=installmentAmount(Math.max(0,selected.amount-selected.downPayment),selected.interestMode,selected.interestRate,selected.totalRepayable,selected.installmentCount,selected.freq,selected.paymentAmount)
      monthlyImpact=-toMensile(scenarioPayment,selected.freq)
      selectedPlan=installmentProgress(selected.startDate??'',selected.freq,selected.installmentCount,data)
    }else if(selected.freq==='unica'){
      upfrontImpact=selected.type==='spesa'?selected.amount:-selected.amount
    }else{
      monthlyImpact=(selected.type==='entrata'?1:-1)*toMensile(selected.amount,selected.freq)
    }
  }
  const projectedMonthly=baseMonthly+monthlyImpact
  const liquidity=s.accounts.reduce((total,account)=>total+account.balance,0)
  const projectedLiquidity=liquidity-upfrontImpact
  const expiredSubscriptions=s.expenses.filter(item=>item.subscription?.endDate&&item.subscription.endDate<data)
  const releasedMonthly=expiredSubscriptions.reduce((total,item)=>total+toMensile(item.amount,item.freq),0)
  return <div className="flex flex-col gap-6">
    <Heading kicker="SCENARI" title="Previsioni future" text="Salva più ipotesi, scegli quale simulare e vedi subito quanto resta o quanto manca."/>
    <Card><div className="flex flex-wrap items-end gap-3"><Field label="Data della simulazione"><input type="date" value={data} onChange={e=>setData(e.target.value)}/></Field><div className="flex gap-2 pb-0.5">{[[1,'+1m'],[3,'+3m'],[6,'+6m'],[12,'+1a']].map(([months,label])=><button key={label} onClick={()=>addMesi(Number(months))} className="h-10 rounded-xl border px-3 text-sm hover:bg-secondary">{label}</button>)}</div>{s.simulations.length>0&&<Field label="Scenario da simulare"><select value={selectedId} onChange={e=>setSelectedId(e.target.value)}>{s.simulations.map(item=><option key={item.id} value={item.id}>{item.name} · {SIMULATION_LABEL[item.type]}</option>)}</select></Field>}</div></Card>
    <form key={editing?.id??'new-simulation'} onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">
      {editing&&<div className="col-span-full flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"><span>Modifica scenario “{editing.name}”</span><button type="button" onClick={resetSimulationForm} className="text-xs">Annulla modifica</button></div>}
      <Field label="Nome scenario"><input name="name" required placeholder="Es. Mutuo casa 25 anni" defaultValue={editing?.name}/></Field>
      <Field label="Cosa vuoi simulare"><select value={simType} onChange={e=>setSimType(e.target.value as SimulationType)}>{(Object.keys(SIMULATION_LABEL) as SimulationType[]).map(type=><option key={type} value={type}>{SIMULATION_LABEL[type]}</option>)}</select></Field>
      <Field label="Ambito"><select name="kind" defaultValue={editing?.kind??'personale'}><option value="personale">Personale</option><option value="piva">P.IVA</option></select></Field>
      <Field label={isLoan?'Costo del bene/progetto (€)':'Importo (€)'}><input type="number" min=".01" step=".01" required value={simAmount||''} onChange={e=>setSimAmount(Number(e.target.value))}/></Field>
      {isLoan?<>
        <Field label="Anticipo (€)"><input type="number" min="0" step=".01" value={simDownPayment||''} onChange={e=>setSimDownPayment(Number(e.target.value))}/></Field>
        <Field label="Frequenza rate"><InstallmentFreqSelect value={freq} onChange={setFreq}/></Field>
        <Field label="Come conosci il piano"><select value={simInterestMode} onChange={e=>setSimInterestMode(e.target.value as InterestMode)}><option value="percentage">Conosco il tasso annuo %</option><option value="total">Conosco il totale da restituire</option><option value="payment">Conosco l’importo della rata</option></select></Field>
        {simInterestMode==='percentage'?<Field label="Tasso annuo %"><input type="number" min="0" step=".01" value={simInterestRate||''} onChange={e=>setSimInterestRate(Number(e.target.value))}/></Field>:simInterestMode==='total'?<Field label="Totale da restituire (€)"><input type="number" min={simulatedPrincipal||.01} step=".01" required value={simTotalRepayable||''} onChange={e=>setSimTotalRepayable(Number(e.target.value))} placeholder="Capitale + interessi"/></Field>:<Field label="Importo rata (€)"><input type="number" min=".01" step=".01" required value={simKnownPayment||''} onChange={e=>setSimKnownPayment(Number(e.target.value))} placeholder="Es. 300"/></Field>}
        <Field label="Numero totale di rate"><input type="number" min="1" max="1200" required value={simInstallmentCount} onChange={e=>setSimInstallmentCount(Number(e.target.value))}/></Field>
        <Field label="Data della prima rata"><input type="date" required value={simStartDate} onChange={e=>setSimStartDate(e.target.value)}/></Field>
        <div className="col-span-full grid gap-3 rounded-xl bg-secondary/60 p-4 sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Rata {simInterestMode==='payment'?'indicata':'stimata'}</p><p className="font-semibold">{money.format(simPreviewPayment)}</p></div><div><p className="text-xs text-muted-foreground">Totale rate</p><p className="font-semibold">{money.format(simPreviewPayment*simInstallmentCount)}</p></div><div><p className="text-xs text-muted-foreground">Data ultima rata</p><p className="font-semibold">{simPreviewEnd?dateFullIt(simPreviewEnd):'Da calcolare'}</p></div><div><p className="text-xs text-muted-foreground">Rate mancanti a oggi</p><p className="font-semibold">{simPreviewProgress?.remaining??0} di {simInstallmentCount||0}</p></div></div>
      </>:<><Field label="Frequenza"><FreqSelect value={freq} onChange={setFreq}/></Field><Field label="Data inizio (facoltativa)"><input type="date" value={simStartDate} onChange={e=>setSimStartDate(e.target.value)}/></Field></>}
      <button className="self-end h-10 rounded-xl bg-primary px-5 font-semibold text-primary-foreground md:col-span-1">{editing?<Pencil className="mr-2 inline size-4"/>:<Plus className="mr-2 inline size-4"/>}{editing?'Salva modifiche':'Salva scenario'}</button>
    </form>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Margine mensile attuale" value={baseMonthly} warn={baseMonthly<0}/><Metric label="Impatto scenario/mese" value={monthlyImpact}/><Metric label={projectedMonthly>=0?'Residuo mensile':'Mancanza mensile'} value={Math.abs(projectedMonthly)} warn={projectedMonthly<0}/><Metric label="Liquidità dopo anticipo" value={projectedLiquidity} warn={projectedLiquidity<0}/></div>
    {selected&&<Card className={projectedMonthly<0||projectedLiquidity<0?'border-destructive/40 bg-destructive/5':'border-green-500/30 bg-green-50/50 dark:bg-green-950/20'}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{SIMULATION_LABEL[selected.type]}</p><h3 className="mt-1 text-xl font-semibold">{selected.name}</h3><p className="mt-2 text-sm text-muted-foreground">Importo {money.format(selected.amount)}{selected.downPayment>0?` · Anticipo ${money.format(selected.downPayment)}`:''}{scenarioPayment>0?` · Rata ${selected.interestMode==='payment'?'indicata':'stimata'} ${money.format(scenarioPayment)} ${FREQ_LABEL[selected.freq].toLowerCase()}`:''}</p></div><div className={`rounded-xl px-4 py-2 text-sm font-semibold ${projectedMonthly>=0&&projectedLiquidity>=0?'bg-green-600 text-white':'bg-destructive text-destructive-foreground'}`}>{projectedMonthly>=0&&projectedLiquidity>=0?'Sostenibile con i dati inseriti':`Mancano ${money.format(Math.max(0,-projectedMonthly))}/mese`}</div></div>{selectedPlan&&<div className="mt-4 grid gap-3 rounded-xl bg-background/70 p-4 sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Prima rata</p><p className="font-semibold">{selected.startDate?dateFullIt(selected.startDate):'—'}</p></div><div><p className="text-xs text-muted-foreground">Ultima rata</p><p className="font-semibold">{selectedPlan.endDate?dateFullIt(selectedPlan.endDate):'—'}</p></div><div><p className="text-xs text-muted-foreground">Rate trascorse</p><p className="font-semibold">{selectedPlan.paid}</p></div><div><p className="text-xs text-muted-foreground">Rate mancanti</p><p className="font-semibold text-primary">{selectedPlan.remaining} di {selected.installmentCount}</p></div></div>}<p className="mt-4 text-xs text-muted-foreground">{selected.type==='mutuo'||selected.type==='finanziamento'?(selected.interestMode==='total'?`Calcolo sul totale da restituire di ${money.format(selected.totalRepayable)}.`:selected.interestMode==='payment'?`Calcolo sulla rata indicata di ${money.format(selected.paymentAmount)} per ${selected.installmentCount} rate.`:`Calcolo con tasso annuo del ${selected.interestRate}%. `):''} Stima indicativa: non include spese bancarie, assicurazioni, variazioni dei tassi o costi non registrati.</p></Card>}
    {expiredSubscriptions.length>0&&<Card><h3 className="font-semibold">Abbonamenti conclusi entro la data scelta</h3><p className="mt-1 text-sm text-muted-foreground">Liberano {money.format(releasedMonthly)} al mese.</p><div className="mt-3">{expiredSubscriptions.map(item=><div key={item.id} className="flex justify-between border-t py-2 text-sm"><span>{item.description}</span><span className="text-green-600">+{money.format(toMensile(item.amount,item.freq))}/mese</span></div>)}</div></Card>}
    <section><h3 className="mb-3 font-semibold">Scenari salvati</h3><div className="grid gap-3 md:grid-cols-2">{s.simulations.map(item=><Card key={item.id} className={item.id===selectedId?'border-primary':''}><div className="flex items-start justify-between gap-3"><button onClick={()=>setSelectedId(item.id)} className="min-w-0 flex-1 text-left"><p className="text-xs font-semibold text-primary">{SIMULATION_LABEL[item.type]}</p><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{money.format(item.amount)} · {item.kind==='piva'?'P.IVA':'Personale'}</p></button><EditButton onClick={()=>editSimulation(item)} label="Modifica scenario"/><button onClick={()=>set(value=>({...value,simulations:value.simulations.filter(scenario=>scenario.id!==item.id)}))} aria-label="Elimina scenario"><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div></Card>)}{!s.simulations.length&&<Card className="md:col-span-2"><p className="text-center text-sm text-muted-foreground">Salva il primo scenario per iniziare il confronto.</p></Card>}</div></section>
  </div>
}

// ── SETUP ──
function Setup({s,set,onSave,saveMsg,saving,logout}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;onSave:()=>void;saveMsg:string;saving:boolean;logout:()=>void}) {
  const update=(k:keyof BudgetState['profile'],v:string)=>set(x=>({...x,profile:{...x.profile,[k]:k==='name'||k==='ateco'?v:Number(v)}}))
  const [newCat,setNewCat]=useState('')
  const [editingCategoryId,setEditingCategoryId]=useState<string|null>(null)
  const [categoryDraft,setCategoryDraft]=useState('')
  const saveCategoryName=(id:string)=>{const next=categoryDraft.trim();if(!next)return;set(value=>{const current=value.categories.find(item=>item.id===id);if(!current)return value;return{...value,categories:value.categories.map(item=>item.id===id?{...item,name:next}:item),expenses:value.expenses.map(item=>item.category===current.name?{...item,category:next}:item)}});setEditingCategoryId(null);setCategoryDraft('')}
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
        <h3 className="font-semibold">Personalizza la dashboard</h3>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">Scegli quali blocchi mostrare nella panoramica.</p>
        <div className="grid gap-2 sm:grid-cols-2">{([['forecast','Previsioni 30/60/90 giorni'],['alerts','Avvisi e prossime scadenze'],['goals','Obiettivi di risparmio'],['subscriptions','Abbonamenti senza scadenza'],['charts','Grafici e indicatori']] as const).map(([key,label])=><label key={key} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm"><span>{label}</span><input type="checkbox" checked={s.dashboard[key]} onChange={event=>set(value=>({...value,dashboard:{...value.dashboard,[key]:event.target.checked}}))}/></label>)}</div>
      </Card>
      <Card>
        <h3 className="font-semibold mb-4">Categorie di spesa</h3>
        <div className="flex flex-wrap gap-2 mb-4">{s.categories.map(c=>editingCategoryId===c.id?<span key={c.id} className="flex items-center gap-1 rounded-xl border bg-secondary p-1 text-sm"><input autoFocus className="h-8 rounded-lg border bg-background px-2" value={categoryDraft} onChange={e=>setCategoryDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveCategoryName(c.id);if(e.key==='Escape')setEditingCategoryId(null)}}/><button onClick={()=>saveCategoryName(c.id)} className="px-2 font-semibold text-primary">Salva</button><button onClick={()=>setEditingCategoryId(null)} className="px-1 text-muted-foreground">×</button></span>:<span key={c.id} className="flex items-center gap-1 rounded-full border bg-secondary px-3 py-1 text-sm">{c.name}<EditButton onClick={()=>{setEditingCategoryId(c.id);setCategoryDraft(c.name)}} label="Modifica categoria"/><button onClick={()=>set(x=>({...x,categories:x.categories.filter(v=>v.id!==c.id)}))} className="text-muted-foreground hover:text-destructive ml-1">×</button></span>)}</div>
        <div className="flex gap-2"><input className="flex-1 h-10 rounded-xl border bg-background px-3 text-sm" placeholder="Nuova categoria..." value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newCat){set(x=>({...x,categories:[...x.categories,{id:uid(),name:newCat,budget:0}]}));setNewCat('')}}}/><button onClick={()=>{if(newCat){set(x=>({...x,categories:[...x.categories,{id:uid(),name:newCat,budget:0}]}));setNewCat('')}}} className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">+</button></div>
      </Card>
      <div className="flex flex-wrap gap-3">
        <button onClick={onSave} disabled={saving} className="flex items-center gap-2 h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50"><Save className="size-4"/>{saving?'Salvataggio...':'Salva tutto'}</button>
        {saveMsg&&<span className="flex items-center text-sm text-muted-foreground">{saveMsg}</span>}
        <button onClick={()=>{if(window.confirm('Azzerare tutti i dati non ancora salvati?')) set(createEmptyState())}} className="inline-flex h-11 items-center gap-2 rounded-xl border bg-card px-4 font-semibold text-sm hover:bg-secondary"><RotateCcw className="size-4"/>Azzera dati</button>
        <button onClick={logout} className="inline-flex h-11 items-center gap-2 rounded-xl border border-destructive/30 bg-card px-4 font-semibold text-sm text-destructive hover:bg-destructive/5"><LogOut className="size-4"/>Esci dall'account</button>
      </div>
    </div>
  )
}
