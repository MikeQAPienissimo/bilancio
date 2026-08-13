'use client'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownLeft, BadgeEuro, Bell, BrainCircuit, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronRight, ChevronLeft, CircleDollarSign, Download, Eye, EyeOff, FileText, FileUp, KeyRound, Landmark, LayoutDashboard, LockKeyhole, LogOut, Mail, MoreHorizontal, Pencil, PiggyBank, Plus, ReceiptText, Repeat2, RotateCcw, Save, Search, Settings2, ShieldCheck, Target, Trash2, TrendingUp, Upload, Users, WalletCards, X } from 'lucide-react'
import { Account, AppModule, Asset, AssetMovimento, BenefitAccreditMode, BenefitTransaction, BenefitType, BenefitWallet, BudgetState, CashWithdrawal, Deadline, EMPTY_MODULES, Expense, Financing, FinancingCategory, Freq, FREQ_LABEL, FREQ_MULT, Income, InsuranceKind, InterestMode, Invoice, Kind, PublicBenefit, PublicBenefitAmountMode, PublicBenefitAuthority, PublicBenefitCategory, PublicBenefitPayment, PublicBenefitStatus, ResidualEntryMode, ResidualMode, SavingsGoal, Simulation, SimulationType, WelfareCategory, assetFinancialStatus, assetLinkedExpenses, assetPlanStatus, createEmptyState, dateFullIt, dateIt, financingInstallmentSchedule, financingPrincipalReduction, financingRemainingInstallments, financingStatusFromSchedule, installmentAmount, installmentEndDate, installmentProgress, isActiveAt, isProtectionInsurance, migrate, money, monthlyData, nextInstallmentAfter, patrimoniTotals, remainingInstallmentCount, roundCurrency, toMensile, totals, uid } from '@/lib/budget'
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
  ['piva','Lavoro autonomo',BriefcaseBusiness],
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
const navDescription:Record<View,string>={dashboard:'Situazione in un colpo d’occhio',movimenti:'Entrate, spese e accrediti',conti:'Conti, carte e disponibilità',budget:'Limiti per categoria',patrimonio:'Investimenti, benefit e sostegni',finanziamenti:'Mutui, prestiti e rate',abbonamenti:'Costi ricorrenti attivi',obiettivi:'Risparmio e fondo emergenza',piva:'Fatture, incassi e fisco',scadenze:'Calendario dei pagamenti',previsioni:'Scenari e sostenibilità',advisor:'Analisi sui tuoi dati',setup:'Profilo e personalizzazione'}
const VIEW_MODULE:Partial<Record<View,AppModule>>={finanziamenti:'financings',obiettivi:'goals',piva:'selfEmployment',previsioni:'simulations',advisor:'advisor'}
const MODULE_CATALOG = [
  {id:'financings',label:'Finanziamenti e mutui',description:'Rate, debito residuo e scadenze automatiche.',icon:BadgeEuro},
  {id:'investments',label:'Investimenti e risparmio',description:'PAC, fondi, depositi e versamenti ricorrenti.',icon:TrendingUp},
  {id:'insurance',label:'Assicurazioni e previdenza',description:'Polizze, premi, durata e valore maturato.',icon:ShieldCheck},
  {id:'simulations',label:'Simulazioni future',description:'Confronta mutui, spese e scenari senza alterare i dati reali.',icon:CalendarDays},
  {id:'goals',label:'Obiettivi di risparmio',description:'Fondo di emergenza e traguardi personali.',icon:Target},
  {id:'selfEmployment',label:'Lavoro autonomo',description:'Fatture, incassi, costi professionali e fisco.',icon:BriefcaseBusiness},
  {id:'benefits',label:'Benefit e sostegni',description:'Buoni pasto, welfare e prestazioni pubbliche INPS/INAIL.',icon:WalletCards},
  {id:'advisor',label:'Advisor AI',description:'Analisi e domande sui dati che scegli di registrare.',icon:BrainCircuit}
] as const satisfies ReadonlyArray<{id:AppModule;label:string;description:string;icon:typeof BadgeEuro}>
const CORE_FEATURES=['Dashboard mensile','Entrate e spese','Conti e carte','Budget','Scadenze','Abbonamenti e ricorrenze']

const TIPO_EMOJI: Record<string,string> = {conto:'🏦',carta:'💳',fido:'📋',contanti:'💵',piva:'🧾'}
const TIPO_LABEL: Record<string,string> = {conto:'Corrente',carta:'Carta credito',fido:'Fido',contanti:'Contanti',piva:'Professionale'}
const FINANCING_LABEL: Record<FinancingCategory,string> = {mutuo:'Mutuo',auto:'Auto',prestito:'Prestito',leasing:'Leasing',altro:'Altro'}
const SIMULATION_LABEL: Record<SimulationType,string> = {mutuo:'Nuovo mutuo',finanziamento:'Nuovo finanziamento',spesa:'Nuova spesa',entrata:'Nuova entrata'}
const BENEFIT_LABEL: Record<BenefitType,string> = {meal:'Buoni pasto',welfare:'Credito welfare',fuel:'Carta / buoni carburante'}
const WELFARE_LABEL: Record<WelfareCategory,string> = {shopping:'Buoni acquisto',health:'Salute e assistenza sanitaria',education:'Istruzione e formazione',transport:'Trasporto pubblico e mobilità',care:'Assistenza familiare',sport:'Sport e benessere',culture:'Cultura e ricreazione',travel:'Viaggi e tempo libero',pension:'Previdenza complementare',other:'Altro welfare'}
const PUBLIC_BENEFIT_STATUS_LABEL:Record<PublicBenefitStatus,string>={valutazione:'Sto valutando',domanda:'Domanda presentata',approvata:'Approvata / in pagamento',sospesa:'Sospesa',terminata:'Terminata',respinta:'Respinta'}
const PUBLIC_BENEFIT_CATEGORY_LABEL:Record<PublicBenefitCategory,string>={disoccupazione:'Disoccupazione e continuità',famiglia:'Famiglia',genitorialita:'Genitorialità',inclusione:'Inclusione e sostegno',disabilita:'Disabilità e non autosufficienza',malattia:'Malattia e cura',infortunio:'Infortunio e malattia professionale',superstiti:'Superstiti',lavoro:'Tutela del lavoro',altro:'Altro'}
type PublicBenefitCatalogItem={key:string;name:string;authority:PublicBenefitAuthority;category:PublicBenefitCategory;officialUrl:string;description:string}
const INPS_INCOME_SUPPORT_URL='https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-aree-tematiche.prestazioni-a-sostegno-del-reddito-accesso-al-portale-delle-domande-50598.prestazioni-a-sostegno-del-reddito-accesso-al-portale-delle-domande.html'
const INPS_FAMILY_URL='https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.03.il-nuovo-portale-della-famiglia-e-della-genitorialit.html'
const INAIL_BENEFITS_URL='https://www.inail.it/portale/assicurazione/it/lassicurazione-inail/quali-sono-le-prestazioni-di-inail/prestazioni-economiche.html'
const PUBLIC_BENEFIT_CATALOG:PublicBenefitCatalogItem[]=[
  {key:'inps-naspi',name:'NASpI',authority:'INPS',category:'disoccupazione',officialUrl:'https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2025.07.naspi-e-dis-coll-ti-sostengono-se-ne-hai-bisogno.html',description:'Indennità mensile di disoccupazione per lavoratori subordinati.'},
  {key:'inps-discoll',name:'DIS-COLL',authority:'INPS',category:'disoccupazione',officialUrl:'https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2025.07.naspi-e-dis-coll-ti-sostengono-se-ne-hai-bisogno.html',description:'Indennità di disoccupazione per collaboratori e alcune figure iscritte alla Gestione Separata.'},
  {key:'inps-iscro',name:'ISCRO',authority:'INPS',category:'disoccupazione',officialUrl:'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.indennit-straordinaria-continuit-reddituale-e-operativa-iscro--55497.indennit-straordinaria-di-continuit-reddituale-e-operativa-iscro-.html',description:'Sostegno alla continuità reddituale per lavoratori autonomi iscritti alla Gestione Separata.'},
  {key:'inps-alas',name:'ALAS',authority:'INPS',category:'disoccupazione',officialUrl:INPS_INCOME_SUPPORT_URL,description:'Indennità di disoccupazione per lavoratori autonomi dello spettacolo.'},
  {key:'inps-idis',name:'Indennità di discontinuità spettacolo',authority:'INPS',category:'disoccupazione',officialUrl:INPS_INCOME_SUPPORT_URL,description:'Sostegno per lavoratori del settore spettacolo in presenza dei requisiti previsti.'},
  {key:'inps-agricola',name:'Disoccupazione agricola',authority:'INPS',category:'disoccupazione',officialUrl:INPS_INCOME_SUPPORT_URL,description:'Prestazione per operai agricoli e figure equiparate.'},
  {key:'inps-cig',name:'CIGO, CIGS o assegno FIS',authority:'INPS',category:'lavoro',officialUrl:'https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2025.01.integrazione-salariale-assegni-disoccupazione-e-fondi-importi-2025.html',description:'Integrazione salariale o assegno dei fondi durante sospensioni o riduzioni del lavoro.'},
  {key:'inps-auu',name:'Assegno unico e universale',authority:'INPS',category:'famiglia',officialUrl:INPS_FAMILY_URL,description:'Sostegno economico per i figli a carico.'},
  {key:'inps-maternita',name:'Indennità di maternità o paternità',authority:'INPS',category:'genitorialita',officialUrl:INPS_FAMILY_URL,description:'Indennità collegata ai periodi tutelati di maternità o paternità.'},
  {key:'inps-parentale',name:'Indennità di congedo parentale',authority:'INPS',category:'genitorialita',officialUrl:'https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2025.05.congedo-parentale-aumento-delle-indennit-.html',description:'Indennità per periodi di congedo parentale; percentuali e limiti dipendono dal caso.'},
  {key:'inps-maternita-assegno',name:'Assegno di maternità dello Stato o dei Comuni',authority:'INPS',category:'genitorialita',officialUrl:INPS_FAMILY_URL,description:'Assegni di maternità soggetti a requisiti specifici.'},
  {key:'inps-nido',name:'Bonus asilo nido e supporto domiciliare',authority:'INPS',category:'famiglia',officialUrl:INPS_FAMILY_URL,description:'Contributo per rette di nido o supporto presso l’abitazione nei casi previsti.'},
  {key:'inps-nuovi-nati',name:'Bonus nuovi nati',authority:'INPS',category:'genitorialita',officialUrl:INPS_FAMILY_URL,description:'Contributo una tantum legato a nascita o adozione secondo la normativa vigente.'},
  {key:'inps-mamme',name:'Bonus mamme',authority:'INPS',category:'genitorialita',officialUrl:INPS_FAMILY_URL,description:'Sostegno alle lavoratrici madri previsto dalla normativa vigente.'},
  {key:'inps-liberta',name:'Reddito di Libertà',authority:'INPS',category:'inclusione',officialUrl:INPS_FAMILY_URL,description:'Sostegno per donne vittime di violenza seguite dai servizi competenti.'},
  {key:'inps-adi',name:'Assegno di Inclusione (ADI)',authority:'INPS',category:'inclusione',officialUrl:'https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2025.02.assegno-di-inclusione-e-supporto-formazione-e-lavoro-le-novit-2025.html',description:'Misura di inclusione sociale e lavorativa per nuclei in possesso dei requisiti.'},
  {key:'inps-sfl',name:'Supporto per la Formazione e il Lavoro (SFL)',authority:'INPS',category:'inclusione',officialUrl:'https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2025.02.assegno-di-inclusione-e-supporto-formazione-e-lavoro-le-novit-2025.html',description:'Indennità collegata alla partecipazione a percorsi di attivazione.'},
  {key:'inps-carta',name:'Carta Dedicata a te',authority:'INPS',category:'inclusione',officialUrl:INPS_FAMILY_URL,description:'Carta di sostegno per beni di prima necessità nei casi individuati.'},
  {key:'inps-invalidita',name:'Invalidità civile: pensione o assegno mensile',authority:'INPS',category:'disabilita',officialUrl:'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.Dichiarazioni-di-responsabilita-e-ricoveri-indennizzati.html',description:'Prestazioni assistenziali collegate al riconoscimento dell’invalidità civile.'},
  {key:'inps-accompagnamento',name:'Indennità di accompagnamento',authority:'INPS',category:'disabilita',officialUrl:'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.Dichiarazioni-di-responsabilita-e-ricoveri-indennizzati.html',description:'Indennità per non autosufficienza nei casi riconosciuti.'},
  {key:'inps-frequenza',name:'Indennità di frequenza',authority:'INPS',category:'disabilita',officialUrl:'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.Dichiarazioni-di-responsabilita-e-ricoveri-indennizzati.html',description:'Prestazione per minori con difficoltà persistenti che frequentano percorsi previsti.'},
  {key:'inps-sociale',name:'Assegno sociale',authority:'INPS',category:'inclusione',officialUrl:'https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.Dichiarazioni-di-responsabilita-e-ricoveri-indennizzati.html',description:'Prestazione assistenziale collegata a età, residenza e condizioni economiche.'},
  {key:'inps-previdenziale-invalidita',name:'Assegno ordinario di invalidità o pensione di inabilità',authority:'INPS',category:'disabilita',officialUrl:INPS_INCOME_SUPPORT_URL,description:'Prestazioni previdenziali legate alla riduzione o perdita della capacità lavorativa.'},
  {key:'inps-malattia',name:'Indennità di malattia o degenza',authority:'INPS',category:'malattia',officialUrl:INPS_INCOME_SUPPORT_URL,description:'Indennità di malattia, ricovero o degenza per le categorie coperte.'},
  {key:'inps-congedo-104',name:'Congedo straordinario per assistenza (Legge 104)',authority:'INPS',category:'disabilita',officialUrl:INPS_FAMILY_URL,description:'Indennità durante il congedo straordinario per assistenza a familiari con disabilità grave.'},
  {key:'inps-fondo-garanzia',name:'Fondo di garanzia TFR e crediti di lavoro',authority:'INPS',category:'lavoro',officialUrl:INPS_INCOME_SUPPORT_URL,description:'Intervento del Fondo nei casi previsti di insolvenza del datore di lavoro.'},
  {key:'inps-altro',name:'Altra prestazione INPS',authority:'INPS',category:'altro',officialUrl:INPS_INCOME_SUPPORT_URL,description:'Voce libera per una prestazione INPS non presente nel catalogo.'},
  {key:'inail-temporanea',name:'Indennità per inabilità temporanea assoluta',authority:'INAIL',category:'infortunio',officialUrl:INAIL_BENEFITS_URL,description:'Indennità giornaliera per il periodo di impossibilità assoluta a lavorare.'},
  {key:'inail-capitale',name:'Indennizzo in capitale del danno biologico',authority:'INAIL',category:'infortunio',officialUrl:INAIL_BENEFITS_URL,description:'Indennizzo una tantum per menomazioni riconosciute nei limiti previsti.'},
  {key:'inail-rendita',name:'Rendita per danno permanente',authority:'INAIL',category:'infortunio',officialUrl:INAIL_BENEFITS_URL,description:'Rendita per menomazione permanente da infortunio o malattia professionale.'},
  {key:'inail-domestico',name:'Prestazioni per infortunio in ambito domestico',authority:'INAIL',category:'infortunio',officialUrl:'https://www.inail.it/portale/assicurazione/it/lassicurazione-inail/quali-sono-le-prestazioni-di-inail/prestazioni-economiche/prestazioni-per-infortunio-in-ambito-domestico.html',description:'Rendita o una tantum per gli assicurati contro gli infortuni domestici.'},
  {key:'inail-incollocabilita',name:'Assegno di incollocabilità',authority:'INAIL',category:'disabilita',officialUrl:'https://www.inail.it/portale/assicurazione/it/lassicurazione-inail/quali-sono-le-prestazioni-di-inail/prestazioni-economiche/assegno-di-incollocabilita.html',description:'Assegno per titolari di rendita con condizioni e requisiti specifici.'},
  {key:'inail-assistenza',name:'Assegno per assistenza personale continuativa',authority:'INAIL',category:'disabilita',officialUrl:'https://www.inail.it/portale/assicurazione/it/lassicurazione-inail/quali-sono-le-prestazioni-di-inail/prestazioni-economiche/assegno-per-assistenza-personale-continuativa.html',description:'Integrazione della rendita in presenza di necessità di assistenza continuativa.'},
  {key:'inail-superstiti',name:'Rendita ai superstiti',authority:'INAIL',category:'superstiti',officialUrl:'https://www.inail.it/portale/assicurazione/it/lassicurazione-inail/quali-sono-le-prestazioni-di-inail/prestazioni-economiche/rendita-ai-superstiti.html',description:'Rendita ai superstiti per decesso causato da infortunio o malattia professionale.'},
  {key:'inail-morte',name:'Assegno una tantum in caso di morte',authority:'INAIL',category:'superstiti',officialUrl:'https://www.inail.it/portale/assicurazione/it/lassicurazione-inail/quali-sono-le-prestazioni-di-inail/prestazioni-economiche/assegno-una-tantum-in-caso-di-morte.html',description:'Una tantum ai superstiti o a chi ha sostenuto le spese funerarie nei casi previsti.'},
  {key:'inail-continuativo',name:'Speciale assegno continuativo mensile',authority:'INAIL',category:'superstiti',officialUrl:'https://www.inail.it/portale/assicurazione/it/lassicurazione-inail/quali-sono-le-prestazioni-di-inail/prestazioni-economiche/speciale-assegno-continuativo-mensile.html',description:'Assegno ai superstiti di alcuni titolari di rendita deceduti per cause indipendenti.'},
  {key:'inail-studio',name:'Borsa di studio ai superstiti',authority:'INAIL',category:'superstiti',officialUrl:'https://www.inail.it/portale/assicurazione/it/lassicurazione-inail/quali-sono-le-prestazioni-di-inail/prestazioni-economiche/borsa-di-studio-ai-superstiti.html',description:'Borsa annuale per studenti già titolari di rendita ai superstiti.'},
  {key:'inail-amianto',name:'Fondo vittime dell’amianto',authority:'INAIL',category:'infortunio',officialUrl:'https://www.inail.it/portale/assicurazione/it/fondi-speciali/fondo-vittime-dell-amianto.html',description:'Prestazione aggiuntiva collegata a patologie asbesto-correlate.'},
  {key:'inail-rimborsi',name:'Rimborsi per cure, viaggio o soggiorno',authority:'INAIL',category:'malattia',officialUrl:INAIL_BENEFITS_URL,description:'Rimborsi connessi a cure e prestazioni riabilitative nei casi previsti.'},
  {key:'inail-altro',name:'Altra prestazione INAIL',authority:'INAIL',category:'altro',officialUrl:INAIL_BENEFITS_URL,description:'Voce libera per una prestazione INAIL non presente nel catalogo.'}
]
const IS_PATRIMONIO = (cat: string) => ['finanziario','assicurativo','risparmio'].includes(cat)

// ── AUTH SCREEN ──
function AuthScreen() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password,setPassword]=useState('')
  const [mode,setMode]=useState<'password'|'magic'>('password')
  const [notice,setNotice]=useState('')
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

  const loginPassword = async (event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();if(!email||!password)return
    setAuthError('');setNotice('');setLoading(true)
    const {error}=await sb.auth.signInWithPassword({email,password})
    setLoading(false)
    if(error)setAuthError(error.message==='Invalid login credentials'?'Email o password non corretti.':error.message)
  }

  const loginMagicLink = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return
    setAuthError('');setNotice('')
    setLoading(true)
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin,shouldCreateUser:false } })
    setLoading(false)
    if (!error) setNotice('Link inviato. Controlla la tua casella email.')
    else setAuthError(error.message)
  }

  const resetPassword=async()=>{
    if(!email){setAuthError('Inserisci prima il tuo indirizzo email.');return}
    setAuthError('');setNotice('');setLoading(true)
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/auth/update-password`})
    setLoading(false)
    if(error)setAuthError(error.message)
    else setNotice('Ti abbiamo inviato il link per impostare una nuova password.')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Landmark className="size-5"/></div>
          <div><p className="font-bold">Bilancio</p><p className="text-xs text-muted-foreground">Finanze personali</p></div>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><LockKeyhole className="size-5"/></div><div><h1 className="text-xl font-semibold">Accedi al tuo spazio</h1><p className="mt-1 text-sm text-muted-foreground">Ogni account vede esclusivamente i propri dati finanziari.</p></div></div>
          <div className="mb-4 grid grid-cols-2 rounded-xl bg-secondary p-1 text-xs font-semibold"><button onClick={()=>{setMode('password');setAuthError('');setNotice('')}} className={`rounded-lg px-3 py-2 ${mode==='password'?'bg-card text-primary shadow-sm':'text-muted-foreground'}`}>Email e password</button><button onClick={()=>{setMode('magic');setAuthError('');setNotice('')}} className={`rounded-lg px-3 py-2 ${mode==='magic'?'bg-card text-primary shadow-sm':'text-muted-foreground'}`}>Link temporaneo</button></div>
          {notice&&<div className="mb-4 rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary"><CheckCircle2 className="mr-2 inline size-4"/>{notice}</div>}
          {mode==='password'?<form onSubmit={loginPassword} className="flex flex-col gap-3"><label className="text-sm font-medium">Email<input type="email" placeholder="nome@esempio.it" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" className="mt-1.5 h-11 w-full rounded-xl border bg-background px-3 text-sm focus:border-primary focus:outline-none"/></label><label className="text-sm font-medium">Password<input type="password" placeholder="La tua password" value={password} onChange={event=>setPassword(event.target.value)} required minLength={8} autoComplete="current-password" className="mt-1.5 h-11 w-full rounded-xl border bg-background px-3 text-sm focus:border-primary focus:outline-none"/></label><button type="submit" disabled={loading} className="mt-1 h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading?'Accesso...':'Accedi'}</button><button type="button" onClick={()=>void resetPassword()} disabled={loading} className="text-xs font-semibold text-primary">Password dimenticata o mai impostata?</button></form>:<form onSubmit={loginMagicLink} className="flex flex-col gap-3"><label className="text-sm font-medium">Email<input type="email" placeholder="nome@esempio.it" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" className="mt-1.5 h-11 w-full rounded-xl border bg-background px-3 text-sm focus:border-primary focus:outline-none"/></label><button type="submit" disabled={loading} className="h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading?'Invio...':'Invia link temporaneo'}</button><p className="text-xs text-muted-foreground">Disponibile solo per gli indirizzi già autorizzati.</p></form>}
          <div className="relative my-5"><div className="absolute inset-0 flex items-center"><div className="w-full border-t"/></div><div className="relative flex justify-center"><span className="bg-card px-2 text-xs text-muted-foreground">oppure</span></div></div>
              <button onClick={loginGoogle} disabled={loading} className="w-full h-11 rounded-xl border bg-background hover:bg-secondary flex items-center justify-center gap-3 text-sm font-semibold mb-4 transition-colors disabled:opacity-50">
                <svg className="size-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continua con Google
              </button>
          {authError&&<p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{authError}</p>}
          <div className="mt-5 rounded-xl border bg-secondary/50 p-3 text-xs text-muted-foreground"><ShieldCheck className="mr-2 inline size-4 text-primary"/><b>Accesso su invito.</b> Un nuovo utente deve essere autorizzato dall’amministratore.</div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">I dati finanziari vengono inviati all’AI solo quando usi Advisor AI.</p>
      </div>
    </div>
  )
}

function Onboarding({user,saving,saveMsg,onComplete}:{user:any;saving:boolean;saveMsg:string;onComplete:(modules:Record<AppModule,boolean>)=>Promise<void>}){
  const [step,setStep]=useState(0)
  const [modules,setModules]=useState<Record<AppModule,boolean>>({...EMPTY_MODULES})
  const userName=user.user_metadata?.full_name?.split(' ')[0]||user.email?.split('@')[0]||'Utente'
  const groups=[MODULE_CATALOG.slice(0,5),MODULE_CATALOG.slice(5)]
  const toggle=(id:AppModule)=>setModules(value=>({...value,[id]:!value[id]}))
  const selectedCount=Object.values(modules).filter(Boolean).length
  return <div className="min-h-screen bg-background px-4 py-6 sm:grid sm:place-items-center sm:py-10">
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-[28px] border bg-card shadow-xl">
      <div className="border-b bg-secondary/40 px-5 py-5 sm:px-8">
        <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Landmark className="size-5"/></div><div><p className="font-bold">Bilancio Personale</p><p className="text-xs text-muted-foreground">Il tuo spazio, costruito intorno a te</p></div></div><span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary shadow-sm">{step+1} di 3</span></div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-primary transition-all" style={{width:`${(step+1)/3*100}%`}}/></div>
      </div>
      <div className="px-5 py-7 sm:px-8 sm:py-9">
        {step===0&&<div>
          <p className="text-sm font-semibold text-primary">CIAO {String(userName).toUpperCase()}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Partiamo solo da ciò che ti serve.</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Entrate, spese, conti, budget, scadenze e abbonamenti sono sempre disponibili. Il resto lo scegli tu, senza riempire l’app di sezioni inutili.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">{CORE_FEATURES.map(item=><div key={item} className="flex items-center gap-3 rounded-2xl border bg-background p-4"><div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="size-4"/></div><span className="text-sm font-semibold">{item}</span></div>)}</div>
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="text-xs font-bold uppercase tracking-widest text-primary">Dati reali: zero</p><p className="mt-1 text-sm text-muted-foreground">Gli esempi servono soltanto a spiegare le schermate e non entrano mai nei calcoli.</p></div>
        </div>}
        {step>0&&<div>
          <p className="text-sm font-semibold text-primary">{step===1?'PATRIMONIO E PIANIFICAZIONE':'STRUMENTI PERSONALI'}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{step===1?'Cosa vuoi tenere sotto controllo?':'C’è altro che fa parte della tua vita?'}</h1>
          <p className="mt-2 text-muted-foreground">Seleziona anche più opzioni. Potrai attivarle o nasconderle in qualsiasi momento dalle Impostazioni.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">{groups[step-1].map(({id,label,description,icon:Icon})=>{const selected=modules[id];return <button type="button" key={id} aria-pressed={selected} onClick={()=>toggle(id)} className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${selected?'border-primary bg-primary/10 shadow-sm':'bg-background hover:border-primary/40 hover:bg-secondary/30'}`}><div className={`grid size-11 shrink-0 place-items-center rounded-xl ${selected?'bg-primary text-primary-foreground':'bg-secondary text-primary'}`}><Icon className="size-5"/></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="font-semibold">{label}</p><span className={`grid size-5 place-items-center rounded-full border ${selected?'border-primary bg-primary text-primary-foreground':'border-border'}`}>{selected&&<CheckCircle2 className="size-3.5"/>}</span></div><p className="mt-1 text-sm leading-snug text-muted-foreground">{description}</p></div></button>})}</div>
          {step===2&&<p className="mt-5 rounded-xl bg-secondary/60 p-3 text-sm text-muted-foreground"><b className="text-foreground">{selectedCount} moduli selezionati.</b> Disattivarli in futuro li nasconderà soltanto: i dati resteranno al sicuro.</p>}
        </div>}
      </div>
      <div className="flex items-center justify-between gap-3 border-t bg-secondary/20 px-5 py-4 sm:px-8">
        <button type="button" onClick={()=>setStep(value=>Math.max(0,value-1))} disabled={step===0||saving} className="h-11 rounded-xl border bg-card px-4 text-sm font-semibold disabled:invisible">Indietro</button>
        <div className="text-center text-xs text-destructive">{saveMsg.startsWith('❌')?saveMsg:''}</div>
        {step<2?<button type="button" onClick={()=>setStep(value=>value+1)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Continua<ChevronRight className="size-4"/></button>:<button type="button" disabled={saving} onClick={()=>void onComplete(modules)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving?'Creo il tuo spazio...':'Entra nel tuo Bilancio'}<ChevronRight className="size-4"/></button>}
      </div>
    </div>
  </div>
}

// ── MAIN APP ──
export function BudgetDashboard() {
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [dataLoading,setDataLoading]=useState(true)
  const [state, setState] = useState<BudgetState>(() => createEmptyState())
  const [view, setView] = useState<View>('dashboard')
  const [mobileMenu,setMobileMenu]=useState<'planning'|'more'|null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [aiMessages, setAiMessages] = useState<{role:'user'|'assistant';content:string}[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
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
    if (!user) { setDataLoading(false); return }
    let cancelled=false
    setDataLoading(true)
    setState(createEmptyState())
    sb.from('user_data').select('data').eq('id', user.id).maybeSingle().then(({ data }) => {
      if(cancelled)return
      if (data?.data && Object.keys(data.data).length > 0) {
        setState(migrate(data.data))
      }
      setDataLoading(false)
    })
    return()=>{cancelled=true}
  }, [user])

  const saveToDb = useCallback(async (s: BudgetState) => {
    if (!user) return false
    setSaving(true)
    setSaveMsg('')
    const { error } = await sb.from('user_data').upsert({ id: user.id, data: s, updated_at: new Date().toISOString() })
    setSaving(false)
    setSaveMsg(error ? '❌ Errore salvataggio' : '✓ Salvato')
    setTimeout(() => setSaveMsg(''), 3000)
    return !error
  }, [user])

  const save = () => saveToDb(state)

  const logout = async () => {
    await sb.auth.signOut()
    setUser(null)
    setState(createEmptyState())
    setAiMessages([])
  }

  useEffect(() => {
    aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages, aiLoading])

  useEffect(()=>{
    const requiredModule=VIEW_MODULE[view]
    if(requiredModule&&!state.preferences.modules[requiredModule])setView('dashboard')
  },[state.preferences.modules,view])

  const completeOnboarding=async(modules:Record<AppModule,boolean>)=>{
    const next:BudgetState={
      ...state,
      preferences:{onboardingCompleted:true,modules},
      dashboard:{...state.dashboard,goals:modules.goals}
    }
    const saved=await saveToDb(next)
    if(saved){setState(next);setView('dashboard')}
  }

  if (authLoading||(user&&dataLoading)) return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Caricamento del tuo spazio...</div>
  if (!user) return <AuthScreen />
  if(!state.preferences.onboardingCompleted)return <Onboarding user={user} saving={saving} saveMsg={saveMsg} onComplete={completeOnboarding}/>

  const active = nav.find(n => n[0] === view)!

  // AI Context
  const buildAiContext = () => {
    const t = totals(state, year)
    const modules=state.preferences.modules
    const investmentAssets=state.assets.filter(asset=>asset.type!=='assicurativo')
    const insuranceAssets=state.assets.filter(asset=>asset.type==='assicurativo')
    const pat=patrimoniTotals(investmentAssets)
    const lines=[
      `ANNO DI ANALISI: ${year}`,
      `Liquidità: ${money.format(t.liquidity)}`,
      `Conti: ${state.accounts.map(a=>`${a.name} (${TIPO_LABEL[a.type]}): ${money.format(a.balance)}`).join(', ')||'nessuno'}`,
      `Contanti tracciati da prelievi: ${money.format(state.cashWithdrawals.reduce((total,withdrawal)=>total+Math.max(0,withdrawal.amount-state.expenses.filter(expense=>expense.cashWithdrawalId===withdrawal.id).reduce((spent,expense)=>spent+expense.amount,0)),0))}`,
      `Entrate personali: ${money.format(t.personalIncome)}`,
      `Spese totali: ${money.format(t.totalExpense)}`,
      `Spese mensili equivalenti: ${money.format(t.mensileSpese)}`,
      `Limite mensile: ${t.limiteAttivo<Infinity?`${money.format(t.limiteAttivo)}/mese (${Math.round(t.usatoLimite*100)}% usato)`:'nessuno'}`,
      `Abbonamenti: ${state.expenses.filter(e=>e.subscription).map(e=>`${e.description} ${money.format(toMensile(e.amount,e.freq))}/mese`).join('; ')||'nessuno'}`,
      `Spese principali: ${state.expenses.slice(0,6).map(e=>`${e.description} ${money.format(e.amount)} (${FREQ_LABEL[e.freq]})`).join(', ')||'nessuna'}`
    ]
    if(modules.selfEmployment)lines.push(`Lavoro autonomo: incassi ${money.format(t.pivaIncome)}, tasse e contributi stimati ${money.format(t.tax+t.contributions)}, accantonato ${money.format(t.reserve)}`)
    if(modules.financings)lines.push(`Finanziamenti: ${state.financings.map(f=>`${f.name}, residuo ${money.format(f.residualAmount)} (${f.residualMode==='principal'?'solo capitale':'totale dovuto'}), rata ${money.format(toMensile(f.paymentAmount,f.freq))}/mese, ${financingRemainingInstallments(f)} rate mancanti`).join('; ')||'nessuno'}`)
    if(modules.investments)lines.push(`Investimenti e risparmio: versato ${money.format(pat.totVersato)}, valore ${money.format(pat.totValore)}, rendimento ${money.format(pat.rend)}`)
    if(modules.insurance)lines.push(`Assicurazioni: ${insuranceAssets.map(asset=>{const status=assetFinancialStatus(asset);return isProtectionInsurance(asset)?`${asset.name}, protezione puro rischio, premi versati ${money.format(status.netPaid)}, capitale decesso ${money.format(asset.deathBenefit??0)}, capitale invalidità/infortunio ${money.format(asset.disabilityBenefit??0)}${asset.durationYears?`, durata ${asset.durationYears} anni`:''}`:`${asset.name}, premi versati ${money.format(status.netPaid)}, valore attuale/riscatto ${money.format(status.value)}, rendimento ${money.format(status.returnAmount)}`}).join('; ')||'nessuna'}`)
    if(modules.goals)lines.push(`Obiettivi: ${state.goals.map(g=>`${g.name}: ${money.format(g.currentAmount)} di ${money.format(g.targetAmount)}`).join('; ')||'nessuno'}`)
    if(modules.benefits){
      lines.push(`Benefit spendibili: ${state.benefits.map(b=>`${b.name}: saldo ${money.format(b.balance)}${b.expiryDate?`, scadenza ${b.expiryDate}`:''}`).join('; ')||'nessuno'}`)
      lines.push(`Prestazioni pubbliche: ${state.publicBenefits.map(item=>`${item.authority} ${item.name}, stato ${PUBLIC_BENEFIT_STATUS_LABEL[item.status]}${item.amountMode==='fixed'?`, previsto ${money.format(item.amount)} ${FREQ_LABEL[item.frequency].toLowerCase()}`:', importo variabile'}, ricevuto ${money.format(item.payments.reduce((total,payment)=>total+payment.amount,0))}`).join('; ')||'nessuna'}`)
    }
    if(modules.simulations)lines.push(`Simulazioni salvate: ${state.simulations.map(item=>`${item.name}, importo ${money.format(item.amount)}`).join('; ')||'nessuna'}`)
    return lines.join('\n- ')
  }

  const sendAI = async (msg: string) => {
    if (!msg.trim()||aiLoading) return
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
        body: JSON.stringify({ context: buildAiContext(), messages: newMsgs })
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
  const isViewEnabled=(id:View)=>{const requiredModule=VIEW_MODULE[id];return !requiredModule||state.preferences.modules[requiredModule]}
  const visibleNavGroups=navGroups.map(group=>({...group,ids:group.ids.filter(isViewEnabled)})).filter(group=>group.ids.length)
  const openView=(id:View)=>{if(!isViewEnabled(id)){setView('setup');setMobileMenu(null);return}setView(id);setMobileMenu(null)}
  const aiSuggestions=[
    'Analizza la mia situazione e dammi 3 priorità concrete',
    'Sto spendendo troppo rispetto alle mie entrate?',
    state.preferences.modules.financings?'Come posso gestire meglio le rate?':null,
    state.preferences.modules.selfEmployment?'Sto accantonando abbastanza per tasse e contributi?':null,
    state.preferences.modules.goals?'Il mio fondo di emergenza è adeguato?':null,
    state.preferences.modules.investments?'Come stanno andando i miei investimenti?':null
  ].filter((value):value is string=>Boolean(value)).slice(0,4)
  const sectionLabel=visibleNavGroups.find(group=>group.ids.includes(view))?.label.toLocaleLowerCase('it-IT').replace(/^./,letter=>letter.toUpperCase())??'Bilancio'
  const sheetItems=(mobileMenu==='planning'?planningViews:moreViews).filter(isViewEnabled).map(id=>nav.find(item=>item[0]===id)!).filter(Boolean)

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r bg-card px-4 py-5 lg:flex overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Landmark className="size-4"/></div>
          <div><p className="font-bold text-sm">Bilancio</p><p className="text-xs text-muted-foreground truncate max-w-[110px]">{userName}</p></div>
        </div>
        <nav className="flex flex-1 flex-col gap-4">
          {visibleNavGroups.map(group=><section key={group.label}><p className="mb-1 px-3 text-[10px] font-bold tracking-[.16em] text-muted-foreground/60">{group.label}</p><div className="flex flex-col gap-0.5">{group.ids.map(id=>{const item=nav.find(value=>value[0]===id)!;const [,label,Icon]=item;return <button key={id} onClick={()=>openView(id)} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${view===id?'bg-primary text-primary-foreground shadow-sm':'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}><Icon className="size-4 shrink-0"/>{label}<ChevronRight className="ml-auto size-3 opacity-40"/></button>})}</div></section>)}
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
          {view==='dashboard' && <Dashboard s={state} year={year} onOpen={openView}/>}
          {view==='movimenti' && <Movements s={state} set={setState} year={year} modules={state.preferences.modules}/>}
          {view==='conti' && <Accounts s={state} set={setState} selfEmploymentEnabled={state.preferences.modules.selfEmployment}/>}
          {view==='budget' && <Budgets s={state} set={setState} year={year}/>}
          {view==='patrimonio' && <Assets s={state} set={setState} modules={state.preferences.modules} onOpenSettings={()=>setView('setup')}/>}
          {view==='finanziamenti' && <Financings s={state} set={setState} selfEmploymentEnabled={state.preferences.modules.selfEmployment} onOpenDeadlines={()=>setView('scadenze')}/>}
          {view==='abbonamenti' && <Subscriptions s={state} set={setState} onOpenMovements={()=>setView('movimenti')}/>}
          {view==='obiettivi' && <Goals s={state} set={setState} year={year}/>}
          {view==='piva' && <SelfEmployment s={state} set={setState} year={year} userId={user.id}/>}
          {view==='scadenze' && <Deadlines s={state} set={setState} financingsEnabled={state.preferences.modules.financings}/>}
          {view==='previsioni' && <Previsioni s={state} set={setState} selfEmploymentEnabled={state.preferences.modules.selfEmployment}/>}
          {view==='advisor' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-start justify-between gap-4"><Heading kicker="ADVISOR AI" title="Un assistente per leggere meglio i numeri" text="Fa analisi informative sui dati che scegli di inviargli, senza sostituire un professionista."/><span className="rounded-full border border-green-500/30 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 dark:bg-green-950/20">Groq · piano gratuito</span></div>
              <Card>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-xl bg-secondary/60 p-3"><div className="flex max-w-2xl items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary"/><p className="text-xs text-muted-foreground"><b className="text-foreground">Invio solo su tua richiesta.</b> I dati finanziari preparati dall’app vengono trasmessi al servizio AI soltanto quando premi Invia. Non includere PIN, password, IBAN completi, documenti o dati sanitari.</p></div>{aiMessages.length>0&&<button onClick={()=>setAiMessages([])} disabled={aiLoading} className="text-xs font-semibold text-primary disabled:opacity-50">Cancella conversazione</button>}</div>
                <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1 pb-2">
                  {!aiMessages.length&&!aiLoading&&<div className="rounded-2xl border border-dashed p-6 text-center"><BrainCircuit className="mx-auto size-8 text-primary"/><h3 className="mt-3 font-semibold">Nessun dato inviato</h3><p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">Scegli una domanda o scrivine una tua. In quel momento l’app invierà un riepilogo dei moduli attivi, non l’intero archivio grezzo.</p></div>}
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
                  {aiSuggestions.map(q=>(
                    <button key={q} onClick={()=>sendAI(q)} className="text-xs border rounded-lg px-2 py-1 hover:bg-secondary text-muted-foreground">{q}</button>
                  ))}
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">Le risposte possono contenere errori e sono soltanto informative: per decisioni finanziarie, fiscali, previdenziali o legali verifica sempre con un professionista o con l’ente competente.</p>
              </Card>
            </div>
          )}
          {view==='setup' && <Setup s={state} set={setState} onSave={save} saveMsg={saveMsg} saving={saving} logout={logout} user={user}/>}
        </div>
      </main>

      {mobileMenu&&<div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] lg:hidden" onClick={()=>setMobileMenu(null)}><div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[28px] border-t bg-card px-5 pb-7 pt-3 shadow-2xl" onClick={event=>event.stopPropagation()}><div className="mx-auto mb-4 h-1 w-11 rounded-full bg-border"/><div className="mb-4 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">{mobileMenu==='planning'?'Pianifica':'Tutto il resto'}</p><h2 className="mt-1 text-xl font-semibold">{mobileMenu==='planning'?'Organizza il futuro':'Conti e strumenti'}</h2><p className="mt-1 text-sm text-muted-foreground">{mobileMenu==='planning'?'Budget, scadenze, debiti e obiettivi.':'Funzioni utili, senza affollare la barra.'}</p></div><button onClick={()=>setMobileMenu(null)} className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary" aria-label="Chiudi menu"><X className="size-4"/></button></div><div className="grid grid-cols-2 gap-3">{sheetItems.map(([id,label,Icon])=><button key={id} onClick={()=>openView(id)} className={`rounded-2xl border p-4 text-left transition-colors ${view===id?'border-primary bg-primary/10':'bg-background hover:bg-secondary'}`}><div className={`grid size-9 place-items-center rounded-xl ${view===id?'bg-primary text-primary-foreground':'bg-secondary text-primary'}`}><Icon className="size-4"/></div><p className="mt-3 text-sm font-semibold">{label}</p><p className="mt-1 text-[11px] leading-snug text-muted-foreground">{navDescription[id]}</p></button>)}</div></div></div>}
      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 rounded-[24px] border bg-card/95 p-1.5 shadow-2xl backdrop-blur lg:hidden" style={{paddingBottom:'max(.375rem, env(safe-area-inset-bottom))'}}>
        {([['dashboard','Home',LayoutDashboard],['movimenti','Movimenti',ArrowDownLeft],['planning','Pianifica',TrendingUp],['patrimonio','Patrimonio',Landmark],['more','Altro',MoreHorizontal]] as const).map(([id,label,Icon])=>{const selected=id==='planning'?planningViews.filter(isViewEnabled).includes(view):id==='more'?moreViews.filter(isViewEnabled).includes(view):view===id;return <button key={id} onClick={()=>id==='planning'?setMobileMenu(value=>value==='planning'?null:'planning'):id==='more'?setMobileMenu(value=>value==='more'?null:'more'):openView(id)} className={`flex min-w-0 flex-col items-center gap-1 rounded-[18px] px-1 py-2 text-[10px] font-semibold transition-colors ${selected?'bg-primary/10 text-primary':'text-muted-foreground'}`}><Icon className={`size-[18px] ${selected?'stroke-[2.5]':''}`}/><span className="w-full truncate text-center">{label}</span></button>})}
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
  <Card><p className="text-sm text-muted-foreground">{label}</p><p className={`sensitive mt-3 text-2xl font-semibold tabular-nums ${warn?'text-destructive':''}`}>{money.format(value)}</p>{detail&&<p className="sensitive mt-1 text-xs text-muted-foreground">{detail}</p>}</Card>
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
  return <div className="rounded-2xl border bg-card p-4 text-center shadow-sm"><div className="sensitive mx-auto h-28 max-w-44"><ResponsiveContainer><RadialBarChart cx="50%" cy="82%" innerRadius="72%" outerRadius="100%" startAngle={180} endAngle={0} data={[{value:normalized}]}><PolarAngleAxis type="number" domain={[0,100]} tick={false}/><RadialBar dataKey="value" background cornerRadius={12} fill={color}/></RadialBarChart></ResponsiveContainer></div><p className="sensitive -mt-7 text-2xl font-semibold">{Math.round(normalized)}%</p><p className="mt-2 text-sm font-semibold">{label}</p><p className="sensitive mt-1 text-xs text-muted-foreground">{detail}</p></div>
}

// ── DASHBOARD ──
function Dashboard({s,year,onOpen}:{s:BudgetState;year:number;onOpen:(view:View)=>void}) {
  const today=new Date().toISOString().slice(0,10),t=totals(s,year),m=monthlyData(s,year)
  const [selectedMonth,setSelectedMonth]=useState(today.slice(0,7))
  const [showValues,setShowValues]=useState(true)
  const monthDate=new Date(`${selectedMonth}-01T12:00:00`)
  const monthLabel=new Intl.DateTimeFormat('it-IT',{month:'long',year:'numeric'}).format(monthDate)
  const monthEnd=new Date(monthDate.getFullYear(),monthDate.getMonth()+1,0,12).toISOString().slice(0,10)
  const shiftMonth=(amount:number)=>{const next=new Date(monthDate);next.setMonth(next.getMonth()+amount);setSelectedMonth(`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}`)}
  const addDays=(days:number)=>{const value=new Date(`${today}T12:00:00`);value.setDate(value.getDate()+days);return value.toISOString().slice(0,10)}
  const categoryNames=[...new Set(t.expenses.map(expense=>expense.category||'Senza categoria'))]
  const cats = categoryNames.map(name=>({name,value:t.expenses.filter(e=>e.category===name).reduce((n,e)=>n+e.amount,0)})).filter(x=>x.value).sort((a,b)=>b.value-a.value)
  const limPerc = (t.limiteAttivo<Infinity && t.limiteAttivo>0 && !isNaN(t.usatoLimite)) ? Math.min(100,t.usatoLimite*100) : null
  const recurringIncomes=s.incomes.filter(item=>item.recurring&&item.incomeClass!=='benefit'&&item.date<=monthEnd)
  const oneOffIncomes=s.incomes.filter(item=>!item.recurring&&item.incomeClass!=='benefit'&&item.date.startsWith(selectedMonth))
  const publicBenefitReceived=s.publicBenefits.flatMap(item=>item.payments).filter(payment=>payment.date.startsWith(selectedMonth)).reduce((total,payment)=>total+payment.amount,0)
  const publicBenefitExpected=s.preferences.modules.benefits?s.publicBenefits.filter(item=>item.status==='approvata'&&item.amountMode==='fixed'&&(!item.startDate||item.startDate<=monthEnd)&&(!item.endDate||item.endDate>=`${selectedMonth}-01`)).reduce((total,item)=>{
    if(item.payments.some(payment=>payment.date.startsWith(selectedMonth)))return total
    if(item.frequency==='unica')return (item.nextPaymentDate??item.startDate)?.startsWith(selectedMonth)?total+item.amount:total
    return total+toMensile(item.amount,item.frequency)
  },0):0
  const monthlyIncome=recurringIncomes.reduce((total,item)=>total+toMensile(item.amount,item.freq??'mensile'),0)+oneOffIncomes.reduce((total,item)=>total+item.amount,0)+publicBenefitExpected
  const autonomousIncome=recurringIncomes.filter(item=>item.kind==='piva').reduce((total,item)=>total+toMensile(item.amount,item.freq??'mensile'),0)+oneOffIncomes.filter(item=>item.kind==='piva').reduce((total,item)=>total+item.amount,0)
  const recurringCosts=s.expenses.filter(item=>!item.assetId&&(item.recurring||item.subscription)&&isActiveAt(item.subscription?.startDate??item.date,item.subscription?.endDate,monthEnd))
  const recurringAssetPlans=s.expenses.filter(item=>item.assetId&&(item.recurring||item.subscription)&&isActiveAt(item.subscription?.startDate??item.date,item.subscription?.endDate,monthEnd))
  const recurringExpenses=recurringCosts.reduce((total,item)=>total+toMensile(Math.max(0,item.amount-(item.benefitAmount??0)),item.freq),0)
  const recurringInsurance=recurringAssetPlans.filter(item=>item.expenseClass==='insurance_premium').reduce((total,item)=>total+toMensile(item.amount,item.freq),0)
  const extraInsurance=s.expenses.filter(item=>item.expenseClass==='insurance_premium'&&!item.recurring&&!item.subscription&&item.date.startsWith(selectedMonth)).reduce((total,item)=>total+item.amount,0)
  const monthlyInsurance=recurringInsurance+extraInsurance
  const oneOffExpenses=s.expenses.filter(item=>!item.assetId&&!item.recurring&&!item.subscription&&item.category!=='Finanziamenti'&&item.date.startsWith(selectedMonth)).reduce((total,item)=>total+Math.max(0,item.amount-(item.benefitAmount??0)),0)
  const monthlyExpenses=recurringExpenses+monthlyInsurance+oneOffExpenses
  const monthlyFinancing=s.financings.reduce((total,item)=>total+financingInstallmentSchedule(item,`${selectedMonth}-01`).filter(rate=>rate.date.startsWith(selectedMonth)).reduce((sum,rate)=>sum+rate.amount,0),0)
  const recurringInvestments=recurringAssetPlans.filter(item=>item.expenseClass==='investment_transfer').reduce((total,item)=>total+toMensile(item.amount,item.freq),0)
  const extraInvestments=s.expenses.filter(item=>item.expenseClass==='investment_transfer'&&!item.recurring&&!item.subscription&&item.date.startsWith(selectedMonth)).reduce((total,item)=>total+item.amount,0)
  const monthlyInvestments=recurringInvestments+extraInvestments
  const monthAssetOutflows=s.expenses.filter(item=>item.assetId&&((item.recurring||item.subscription)?isActiveAt(item.subscription?.startDate??item.date,item.subscription?.endDate,monthEnd):item.date.startsWith(selectedMonth)))
  const monthlyTaxReserve=autonomousIncome*s.profile.taxReserve/100
  const monthlyMargin=monthlyIncome-monthlyExpenses-monthlyFinancing-monthlyInvestments-monthlyTaxReserve
  const savingsRate=monthlyIncome>0?(monthlyInvestments+Math.max(0,monthlyMargin))/monthlyIncome*100:0
  const debtRatio=monthlyIncome>0?monthlyFinancing/monthlyIncome*100:0
  const fiscalDue=t.tax+t.contributions
  const reserveCoverage=fiscalDue>0?t.reserve/fiscalDue*100:100
  const budgetUsage=limPerc??0
  const forecast=[30,60,90].map(days=>{
    const end=addDays(days)
    const oneOff=s.deadlines.filter(item=>!item.paid&&item.date>=today&&item.date<=end).reduce((total,item)=>total+item.amount,0)
    return {days,value:t.liquidity+monthlyMargin*(days/30)-oneOff}
  })
  const alerts=[
    ...s.deadlines.filter(item=>!item.paid&&item.date<=addDays(7)).map(item=>({id:`d-${item.id}`,date:item.date,title:item.title,detail:item.date<today?'Scaduta':item.date===today?'Scade oggi':'Entro 7 giorni',amount:item.amount,urgent:item.date<=today})),
    ...(s.preferences.modules.financings?s.financings:[]).flatMap(item=>financingInstallmentSchedule(item).slice(0,1).filter(rate=>rate.date<=addDays(7)).map(rate=>({id:`f-${item.id}`,date:rate.date,title:`Rata ${item.name}`,detail:rate.date<today?'Scaduta':rate.date===today?'Scade oggi':'Entro 7 giorni',amount:rate.amount,urgent:rate.date<=today}))),
    ...s.expenses.filter(item=>item.subscription?.endDate&&item.subscription.endDate>=today&&item.subscription.endDate<=addDays(30)).map(item=>({id:`s-${item.id}`,date:item.subscription!.endDate!,title:`Termina ${item.description}`,detail:'Abbonamento in scadenza',amount:item.amount,urgent:false})),
    ...(s.preferences.modules.selfEmployment?s.invoices:[]).filter(item=>!item.paid&&item.dueDate&&item.dueDate<=addDays(7)).map(item=>({id:`i-${item.id}`,date:item.dueDate!,title:`Fattura ${item.number} · ${item.customer}`,detail:item.dueDate!<today?'Incasso in ritardo':item.dueDate===today?'Incasso previsto oggi':'Incasso entro 7 giorni',amount:item.amount,urgent:item.dueDate!<=today})),
    ...(s.preferences.modules.benefits?s.benefits:[]).filter(item=>item.balance>0&&item.expiryDate&&item.expiryDate<=addDays(30)).map(item=>({id:`b-${item.id}`,date:item.expiryDate!,title:`Scade ${item.name}`,detail:item.expiryDate!<today?'Credito scaduto':'Benefit in scadenza',amount:item.balance,urgent:item.expiryDate!<=today})),
    ...(s.preferences.modules.benefits?s.publicBenefits:[]).filter(item=>item.status==='approvata'&&item.nextPaymentDate&&item.nextPaymentDate<=addDays(7)).map(item=>({id:`pb-${item.id}`,date:item.nextPaymentDate!,title:`Accredito ${item.name}`,detail:item.nextPaymentDate!<today?'Pagamento da verificare':item.nextPaymentDate===today?'Previsto oggi':`Previsto da ${item.authority}`,amount:item.amountMode==='fixed'?item.amount:0,urgent:item.nextPaymentDate!<today}))
  ].sort((a,b)=>a.date.localeCompare(b.date))
  const topGoals=[...s.goals].sort((a,b)=>(b.targetAmount?b.currentAmount/b.targetAmount:0)-(a.targetAmount?a.currentAmount/a.targetAmount:0)).slice(0,3)
  const isPristine=!s.accounts.length&&!s.incomes.length&&!s.expenses.length
  return (
    <div className={`flex flex-col gap-7 ${showValues?'':'[&_.sensitive]:select-none [&_.sensitive]:blur-[7px] [&_.sensitive]:pointer-events-none'}`}>
      <div className="flex flex-wrap items-start justify-between gap-4"><Heading kicker="PANORAMICA" title="Prima il mese, poi il patrimonio." text="Entrate e impegni mensili davanti; debiti e patrimonio restano una fotografia separata."/><button onClick={()=>setShowValues(value=>!value)} className="inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold shadow-sm hover:bg-secondary" aria-label={showValues?'Nascondi importi':'Mostra importi'}>{showValues?<EyeOff className="size-4"/>:<Eye className="size-4"/>}{showValues?'Nascondi dati':'Mostra dati'}</button></div>
      {isPristine&&<Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-widest text-primary">INIZIA DA QUI</p><h3 className="mt-2 text-2xl font-semibold">Il tuo Bilancio è pronto e parte da zero.</h3><p className="mt-2 text-sm text-muted-foreground">Aggiungi prima il conto che usi ogni giorno, poi un’entrata e una spesa. I grafici si costruiranno automaticamente sui tuoi dati reali.</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>onOpen('conti')} className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">1. Aggiungi un conto</button><button onClick={()=>onOpen('movimenti')} className="h-10 rounded-xl border bg-card px-4 text-sm font-semibold">2. Registra un movimento</button></div></div><div className="w-full rounded-2xl border border-dashed border-primary/30 bg-card/80 p-4 md:w-64"><div className="flex items-center justify-between"><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">ESEMPIO · NON CONTEGGIATO</span><ArrowDownLeft className="size-4 text-green-600"/></div><p className="mt-4 text-sm font-semibold">Stipendio mensile</p><p className="mt-1 text-2xl font-semibold text-green-700">+ 1.500,00 €</p><p className="mt-1 text-xs text-muted-foreground">Entrata personale ricorrente</p></div></div></Card>}
      <Card className="p-4"><div className="flex items-center justify-between gap-4"><button onClick={()=>shiftMonth(-1)} className="grid size-9 place-items-center rounded-xl border hover:bg-secondary" aria-label="Mese precedente"><ChevronLeft className="size-4"/></button><div className="text-center"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Flusso mensile</p><h3 className="mt-1 text-xl font-semibold capitalize">{monthLabel}</h3></div><button onClick={()=>shiftMonth(1)} className="grid size-9 place-items-center rounded-xl border hover:bg-secondary" aria-label="Mese successivo"><ChevronRight className="size-4"/></button></div></Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Entrate previste" value={monthlyIncome} detail={`${recurringIncomes.length} ricorrenti · ${oneOffIncomes.length} ricevute nel mese${publicBenefitExpected>0?` · ${money.format(publicBenefitExpected)} sostegni attesi`:''}`}/>
        <Metric label="Spese correnti" value={monthlyExpenses} detail={`${recurringCosts.length} costi ricorrenti · premi ${money.format(monthlyInsurance)}`}/>
        <Metric label="Rate e accantonamenti" value={monthlyFinancing+monthlyTaxReserve} detail={`Rate ${money.format(monthlyFinancing)} · fisco ${money.format(monthlyTaxReserve)}`}/>
        <Metric label="Disponibile dopo gli impegni" value={monthlyMargin} detail={monthlyInvestments>0?`Dopo ${money.format(monthlyInvestments)} destinati agli investimenti`:'Prima di nuovi risparmi'} warn={monthlyMargin<0}/>
      </div>
      {s.preferences.modules.benefits&&s.publicBenefits.length>0&&<Card><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">INPS E INAIL</p><h3 className="mt-2 text-lg font-semibold">Sostegni pubblici del mese</h3><p className="mt-1 text-sm text-muted-foreground">Le domande non approvate non entrano nel flusso. Un pagamento registrato sostituisce la previsione del mese.</p></div><div className="grid grid-cols-2 gap-2 text-right"><div className="rounded-xl bg-secondary/60 px-4 py-3"><p className="text-xs text-muted-foreground">Ricevuto</p><p className="sensitive mt-1 font-semibold text-green-700">{money.format(publicBenefitReceived)}</p></div><div className="rounded-xl bg-primary/10 px-4 py-3"><p className="text-xs text-primary">Ancora previsto</p><p className="sensitive mt-1 font-semibold text-primary">{money.format(publicBenefitExpected)}</p></div></div></div><div className="mt-4 grid gap-2 border-t pt-4 md:grid-cols-2">{s.publicBenefits.filter(item=>item.status==='approvata').slice(0,6).map(item=><div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">{item.authority} · {item.nextPaymentDate?`prossimo ${dateFullIt(item.nextPaymentDate)}`:'data da indicare'}</p></div><b className="sensitive text-sm">{item.amountMode==='fixed'?money.format(item.amount):'Variabile'}</b></div>)}</div></Card>}
      <Card><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">FOTOGRAFIA DI OGGI</p><h3 className="mt-2 text-xl font-semibold">Patrimonio, senza mischiarlo al mese</h3><p className="mt-1 text-sm text-muted-foreground">Il patrimonio netto è una fotografia alla data odierna: attività meno capitale residuo dichiarato.</p></div><Landmark className="size-6 text-primary"/></div><div className="mt-5 grid gap-3 sm:grid-cols-4"><div className="rounded-xl bg-secondary/60 p-3"><p className="text-xs text-muted-foreground">Liquidità</p><p className="sensitive mt-1 font-semibold">{money.format(t.liquidity)}</p></div><div className="rounded-xl bg-secondary/60 p-3"><p className="text-xs text-muted-foreground">Investimenti</p><p className="sensitive mt-1 font-semibold">{money.format(t.assets)}</p></div><div className="rounded-xl bg-secondary/60 p-3"><p className="text-xs text-muted-foreground">Capitale debiti</p><p className="sensitive mt-1 font-semibold text-destructive">-{money.format(t.financingDebt)}</p></div><div className="rounded-xl bg-primary/10 p-3"><p className="text-xs text-primary">Patrimonio netto</p><p className="sensitive mt-1 font-semibold text-primary">{money.format(t.netWorth)}</p></div></div>{t.financingDebtUnknown>0&&<p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">{t.financingDebtUnknown} {t.financingDebtUnknown===1?'finanziamento non incide':'finanziamenti non incidono'} sul patrimonio netto perché hai indicato le rate future, ma non il capitale residuo comunicato dall’istituto.</p>}</Card>
      {s.dashboard.forecast&&<section><div className="mb-3"><h3 className="text-xl font-semibold">Previsione di liquidità</h3><p className="text-sm text-muted-foreground">Stima a 30, 60 e 90 giorni basata sui flussi ricorrenti e sulle scadenze manuali.</p></div><div className="grid gap-4 sm:grid-cols-3">{forecast.map(item=><Metric key={item.days} label={`Tra ${item.days} giorni`} value={item.value} detail={`Margine stimato ${money.format(monthlyMargin)}/mese`} warn={item.value<0}/>)}</div></section>}
      {s.dashboard.alerts&&<Card><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Bell className="size-5"/></div><div><h3 className="font-semibold">Avvisi e prossimi pagamenti</h3><p className="text-sm text-muted-foreground">Rate, fatture e scadenze che richiedono attenzione.</p></div></div>{alerts.length?<div className="mt-4 divide-y">{alerts.slice(0,6).map(item=><div key={item.id} className="flex items-center gap-3 py-3"><div className={`size-2 rounded-full ${item.urgent?'bg-destructive':'bg-amber-500'}`}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{dateFullIt(item.date)} · {item.detail}</p></div><b className="sensitive text-sm">{money.format(item.amount)}</b></div>)}</div>:<p className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">Nessuna urgenza nei prossimi giorni.</p>}</Card>}
      {s.dashboard.subscriptions&&<Card><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">IMPEGNI DEL MESE</p><h3 className="mt-2 text-lg font-semibold">Costi ricorrenti e abbonamenti</h3><p className="mt-1 text-sm text-muted-foreground">Iliad e ogni voce marcata come ricorrente compaiono qui automaticamente.</p></div><div className="rounded-xl bg-primary/10 px-4 py-3 text-right"><p className="text-xs text-primary">Impatto mensile</p><p className="sensitive mt-1 text-2xl font-semibold text-primary">{money.format(recurringExpenses)}</p></div></div>{recurringCosts.length?<div className="mt-4 grid gap-2 border-t pt-4 md:grid-cols-2">{recurringCosts.slice(0,8).map(expense=><div key={expense.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-semibold">{expense.description}</p><p className="text-xs text-muted-foreground">{expense.category||'Senza categoria'} · {FREQ_LABEL[expense.freq]}</p></div><b className="sensitive text-sm">{money.format(toMensile(expense.amount,expense.freq))}/mese</b></div>)}</div>:<p className="mt-4 border-t pt-4 text-sm text-muted-foreground">Nessun costo ricorrente registrato.</p>}</Card>}
      {monthAssetOutflows.length>0&&<Card><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">PATRIMONIO E PROTEZIONE</p><h3 className="mt-2 text-lg font-semibold">Versamenti e premi del mese</h3><p className="mt-1 text-sm text-muted-foreground">I versamenti agli investimenti sono trasferimenti patrimoniali; i premi assicurativi sono costi di protezione.</p></div><div className="grid grid-cols-2 gap-2 text-right"><div className="rounded-xl bg-primary/10 px-4 py-3"><p className="text-xs text-primary">Investimenti</p><p className="sensitive mt-1 font-semibold text-primary">{money.format(monthlyInvestments)}</p></div><div className="rounded-xl bg-secondary/60 px-4 py-3"><p className="text-xs text-muted-foreground">Premi</p><p className="sensitive mt-1 font-semibold">{money.format(monthlyInsurance)}</p></div></div></div><div className="mt-4 grid gap-2 border-t pt-4 md:grid-cols-2">{monthAssetOutflows.slice(0,8).map(expense=><div key={expense.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-semibold">{expense.description}</p><p className="text-xs text-muted-foreground">{expense.expenseClass==='insurance_premium'?'Premio assicurativo':'Trasferimento al patrimonio'} · {FREQ_LABEL[expense.freq]}</p></div><b className="sensitive text-sm">{money.format(expense.recurring?toMensile(expense.amount,expense.freq):expense.amount)}{expense.recurring?'/mese':''}</b></div>)}</div></Card>}
      {s.preferences.modules.goals&&s.dashboard.goals&&<Card><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Target className="size-5"/></div><div><h3 className="font-semibold">Obiettivi di risparmio</h3><p className="text-sm text-muted-foreground">Avanzamento dei tuoi traguardi principali.</p></div></div>{topGoals.length?<div className="mt-4 grid gap-3 md:grid-cols-3">{topGoals.map(goal=>{const progress=goal.targetAmount>0?Math.min(100,goal.currentAmount/goal.targetAmount*100):0;return <div key={goal.id} className="rounded-xl bg-secondary/60 p-3"><div className="flex justify-between gap-2 text-sm"><b className="truncate">{goal.name}</b><span className="sensitive">{progress.toFixed(0)}%</span></div><div className="sensitive mt-2 h-2 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-primary" style={{width:`${progress}%`}}/></div><p className="sensitive mt-2 text-xs text-muted-foreground">{money.format(goal.currentAmount)} di {money.format(goal.targetAmount)}</p></div>})}</div>:<p className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">Nessun obiettivo impostato.</p>}</Card>}
      {s.dashboard.charts&&<section className="flex flex-col gap-4"><div><h3 className="text-xl font-semibold">Grafici e indicatori</h3><p className="text-sm text-muted-foreground">Flussi, composizione delle spese e rapporti chiave aggiornati con i dati inseriti.</p></div><div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Card><h3 className="font-semibold">Entrate e spese per mese</h3><p className="text-sm text-muted-foreground">Le ricorrenze vengono proiettate su ogni mese attivo · {year}</p><div className="sensitive mt-4 h-64"><ResponsiveContainer><BarChart data={m} barGap={4}><CartesianGrid vertical={false} stroke="var(--border)"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip formatter={v=>money.format(Number(v))}/><Bar dataKey="entrate" name="Entrate" fill="var(--chart-1)" radius={[5,5,0,0]}/><Bar dataKey="spese" name="Spese" fill="var(--chart-2)" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></Card>
        <Card><h3 className="font-semibold">Spese per categoria</h3>{cats.length?<><div className="sensitive h-44"><ResponsiveContainer><PieChart><Pie data={cats} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72}>{cats.map((_,i)=><Cell key={i} fill={`var(--chart-${i%5+1})`}/>)}</Pie><Tooltip formatter={v=>money.format(Number(v))}/></PieChart></ResponsiveContainer></div>{cats.slice(0,5).map(x=><div key={x.name} className="flex justify-between py-1 text-sm"><span className="text-muted-foreground">{x.name}</span><b className="sensitive">{money.format(x.value)}</b></div>)}</>:<p className="grid h-56 place-items-center text-sm text-muted-foreground">Inserisci delle spese per vedere la composizione.</p>}</Card>
      </div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Gauge label="Capacità di risparmio" value={savingsRate} detail={`${money.format(Math.max(0,monthlyMargin)+monthlyInvestments)} tra margine e investimenti`}/><Gauge label="Peso delle rate" value={debtRatio} detail={`${money.format(monthlyFinancing)} su ${money.format(monthlyIncome)}/mese`} invert/><Gauge label="Copertura fiscale" value={reserveCoverage} detail={`${money.format(t.reserve)} accantonati`}/><Gauge label="Uso limite spesa" value={budgetUsage} detail={limPerc===null?'Limite non impostato':`${money.format(monthlyExpenses)} di ${money.format(t.limiteAttivo)}`} invert/></div></section>}
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
function Movements({s,set,year,modules}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;year:number;modules:Record<AppModule,boolean>}) {
  const [mode,setMode] = useState<'entrata'|'spesa'|'prelievo'>('spesa')
  const [freq,setFreq] = useState<Freq>('mensile')
  const [isSubscription,setIsSubscription] = useState(false)
  const [openEnded,setOpenEnded] = useState(false)
  const [paymentMode,setPaymentMode]=useState<'cash'|'withdrawal'|'publicBenefit'|'benefit'|'mixed'>('cash')
  const [selectedBenefitId,setSelectedBenefitId]=useState('')
  const [selectedWithdrawalId,setSelectedWithdrawalId]=useState('')
  const [selectedPublicBenefitPaymentId,setSelectedPublicBenefitPaymentId]=useState('')
  const [benefitAmount,setBenefitAmount]=useState(0)
  const [formError,setFormError]=useState('')
  const [editing,setEditing] = useState<{type:'income';item:Income}|{type:'expense';item:Expense}|{type:'withdrawal';item:CashWithdrawal}|null>(null)
  const [csvMsg,setCsvMsg]=useState('')
  const [movementQuery,setMovementQuery]=useState('')
  const [movementScope,setMovementScope]=useState<'all'|'income'|'expense'|'recurring'|'withdrawal'>('all')
  const [movementAccount,setMovementAccount]=useState('all')
  const editItem=editing&&editing.type!=='withdrawal'?editing.item:undefined
  const editExpense=editing?.type==='expense'?editing.item:undefined
  const editWithdrawalItem=editing?.type==='withdrawal'?editing.item:undefined
  const resetForm=()=>{setEditing(null);setFreq('mensile');setIsSubscription(false);setOpenEnded(false);setMode('spesa');setPaymentMode('cash');setSelectedBenefitId('');setSelectedWithdrawalId('');setSelectedPublicBenefitPaymentId('');setBenefitAmount(0);setFormError('')}
  const editIncome=(item:Income)=>{setEditing({type:'income',item});setMode('entrata');setFreq(item.freq??'mensile');setIsSubscription(false);setOpenEnded(false)}
  const editExpenseItem=(item:Expense)=>{setEditing({type:'expense',item});setMode('spesa');setFreq(item.freq);setIsSubscription(Boolean(item.subscription||item.recurring));setOpenEnded(item.subscription?.endDate===null||Boolean(item.recurring&&!item.subscription));setSelectedBenefitId(item.benefitId??'');setSelectedWithdrawalId(item.cashWithdrawalId??'');setSelectedPublicBenefitPaymentId(item.publicBenefitSourcePaymentId??'');setBenefitAmount(item.benefitAmount??0);setPaymentMode(item.cashWithdrawalId?'withdrawal':item.publicBenefitSourcePaymentId?'publicBenefit':item.benefitId?(item.benefitAmount??0)<item.amount?'mixed':'benefit':'cash');setFormError('')}
  const editCashWithdrawal=(item:CashWithdrawal)=>{setEditing({type:'withdrawal',item});setMode('prelievo');setSelectedPublicBenefitPaymentId(item.publicBenefitPaymentId??'');setPaymentMode('cash');setFormError('')}
  const cashSpent=(withdrawalId:string,excludeExpenseId?:string)=>s.expenses.filter(item=>item.cashWithdrawalId===withdrawalId&&item.id!==excludeExpenseId).reduce((total,item)=>total+item.amount,0)
  const cashRemaining=(withdrawal:CashWithdrawal,excludeExpenseId?:string)=>Math.max(0,withdrawal.amount-cashSpent(withdrawal.id,excludeExpenseId))
  const allPublicPayments=s.publicBenefits.flatMap(benefit=>benefit.payments.map(payment=>({benefit,payment})))
  const publicPaymentRemaining=(paymentId:string,excludeExpenseId?:string,excludeWithdrawalId?:string)=>{const source=allPublicPayments.find(item=>item.payment.id===paymentId);if(!source)return 0;const direct=s.expenses.filter(item=>item.publicBenefitSourcePaymentId===paymentId&&item.id!==excludeExpenseId).reduce((total,item)=>total+item.amount,0);const withdrawn=s.cashWithdrawals.filter(item=>item.publicBenefitPaymentId===paymentId&&item.id!==excludeWithdrawalId).reduce((total,item)=>total+item.amount,0);return Math.max(0,source.payment.amount-direct-withdrawn)}
  const submit = (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f=new FormData(e.currentTarget)
    const accountId=String(f.get('accountId') ?? '') || undefined
    if(mode==='prelievo'){
      const publicBenefitPaymentId=String(f.get('publicBenefitPaymentId')||'')||undefined
      const withdrawal:CashWithdrawal={id:editWithdrawalItem?.id??uid(),date:String(f.get('date')),amount:Number(f.get('amount')),accountId,publicBenefitPaymentId,note:String(f.get('note')||'').trim()||undefined}
      const alreadySpent=editWithdrawalItem?cashSpent(editWithdrawalItem.id):0
      if(withdrawal.amount<=0||withdrawal.amount<alreadySpent){setFormError(`Questo prelievo ha già ${money.format(alreadySpent)} di spese collegate.`);return}
      if(publicBenefitPaymentId&&withdrawal.amount>publicPaymentRemaining(publicBenefitPaymentId,undefined,editWithdrawalItem?.id)){setFormError(`Nel pagamento selezionato restano ${money.format(publicPaymentRemaining(publicBenefitPaymentId,undefined,editWithdrawalItem?.id))} non ancora assegnati.`);return}
      set(current=>({...current,cashWithdrawals:editWithdrawalItem?current.cashWithdrawals.map(item=>item.id===editWithdrawalItem.id?withdrawal:item):[withdrawal,...current.cashWithdrawals]}))
      e.currentTarget.reset();resetForm();return
    }
    const base:Income={id:editItem?.id??uid(),date:String(f.get('date')),description:String(f.get('description')),amount:Number(f.get('amount')),kind:String(f.get('kind')) as Kind,accountId,recurring:mode==='entrata'?Boolean(f.get('recurring')):isSubscription,freq}
    if(!base.description||base.amount<=0)return
    if(mode==='spesa'&&editExpense?.assetId){
      set(current=>{
        const assets=current.assets.map(asset=>{
          if(asset.id!==editExpense.assetId)return asset
          if(editExpense.id.startsWith('asset-plan-'))return{...asset,importoVers:base.amount,freq,startDate:String(f.get('startDate')||base.date),sourceAccountId:accountId,autoTrackPayments:true}
          if(editExpense.id.startsWith('asset-initial-'))return{...asset,initialPayment:base.amount,initialPaymentDate:base.date,sourceAccountId:accountId}
          const movementId=editExpense.id.replace('asset-movement-','')
          return{...asset,sourceAccountId:accountId,movimenti:(asset.movimenti??[]).map(movement=>movement.id===movementId?{...movement,data:base.date,importo:base.amount,note:base.description}:movement)}
        })
        return{...current,assets,expenses:[...current.expenses.filter(item=>!item.assetId),...assets.flatMap(assetLinkedExpenses)]}
      })
      e.currentTarget.reset();resetForm();return
    }
    if(mode==='entrata') {
      set(x=>({...x,incomes:[base,...x.incomes.filter(item=>item.id!==editItem?.id)],expenses:x.expenses.filter(item=>item.id!==editItem?.id)}))
    } else {
      const requestedBenefit=paymentMode==='benefit'?base.amount:paymentMode==='mixed'?Math.min(base.amount,Math.max(0,benefitAmount)):0
      const selectedWithdrawal=s.cashWithdrawals.find(item=>item.id===selectedWithdrawalId)
      const selectedPublicPayment=allPublicPayments.find(item=>item.payment.id===selectedPublicBenefitPaymentId)
      if(paymentMode==='withdrawal'&&!selectedWithdrawal){setFormError('Scegli il prelievo contanti da utilizzare.');return}
      if(paymentMode==='withdrawal'&&selectedWithdrawal&&base.amount>cashRemaining(selectedWithdrawal,editExpense?.id)){setFormError(`Contanti insufficienti: restano ${money.format(cashRemaining(selectedWithdrawal,editExpense?.id))} in questo prelievo.`);return}
      if(paymentMode==='publicBenefit'&&!selectedPublicPayment){setFormError('Scegli un pagamento INPS/INAIL realmente ricevuto.');return}
      if(paymentMode==='publicBenefit'&&base.amount>publicPaymentRemaining(selectedPublicBenefitPaymentId,editExpense?.id)){setFormError(`Nel pagamento selezionato restano ${money.format(publicPaymentRemaining(selectedPublicBenefitPaymentId,editExpense?.id))} non ancora assegnati.`);return}
      if(requestedBenefit>0&&!selectedBenefitId){setFormError('Scegli il benefit utilizzato.');return}
      const selectedWallet=s.benefits.find(item=>item.id===selectedBenefitId)
      const restoredAmount=editExpense?.benefitId===selectedBenefitId?(editExpense.benefitAmount??0):0
      if(requestedBenefit>0&&(!selectedWallet||selectedWallet.balance+restoredAmount<requestedBenefit)){setFormError(`Credito insufficiente: disponibile ${money.format((selectedWallet?.balance??0)+restoredAmount)}.`);return}
      set(current=>{
        let benefits=current.benefits.map(item=>({...item,transactions:[...item.transactions]}))
        if(editExpense?.benefitId&&editExpense.benefitTransactionId){benefits=benefits.map(item=>item.id===editExpense.benefitId?{...item,balance:item.balance+(editExpense.benefitAmount??0),transactions:item.transactions.filter(transaction=>transaction.id!==editExpense.benefitTransactionId)}:item)}
        const transactionId=requestedBenefit>0?uid():undefined
        const expense:Expense={...base,accountId:paymentMode==='withdrawal'||paymentMode==='publicBenefit'?undefined:base.amount-requestedBenefit>0?accountId:undefined,freq,category:String(f.get('category')),cashWithdrawalId:paymentMode==='withdrawal'?selectedWithdrawalId:undefined,publicBenefitSourcePaymentId:paymentMode==='publicBenefit'?selectedPublicBenefitPaymentId:undefined,benefitId:requestedBenefit>0?selectedBenefitId:undefined,benefitAmount:requestedBenefit||undefined,benefitTransactionId:transactionId,subscription:isSubscription?{startDate:String(f.get('startDate') ?? '')||undefined,endDate:openEnded?null:String(f.get('endDate'))}:undefined}
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
  const yearStart=`${year}-01-01`,yearEnd=`${year}-12-31`
  const expenses=s.expenses.filter(item=>(item.subscription||item.recurring)?(item.subscription?.startDate??item.date)<=yearEnd&&(!item.subscription?.endDate||item.subscription.endDate>=yearStart):item.date.startsWith(String(year))).sort((a,b)=>b.date.localeCompare(a.date))
  const assetPlanExpenses=expenses.filter(item=>Boolean(item.assetId))
  const spendingExpenses=expenses.filter(item=>item.expenseClass!=='investment_transfer')
  const subscriptions=expenses.filter(item=>!item.assetId&&(item.subscription||item.recurring))
  const otherExpenses=expenses.filter(item=>!item.assetId&&!item.subscription&&!item.recurring)
  const visibleWithdrawals=[...s.cashWithdrawals].filter(item=>item.date.startsWith(String(year))||cashRemaining(item)>0).sort((a,b)=>b.date.localeCompare(a.date))
  const normalizedMovementQuery=movementQuery.trim().toLocaleLowerCase('it')
  const accountName=(accountId?:string)=>s.accounts.find(account=>account.id===accountId)?.name??''
  const matchesMovement=(item:Income|Expense)=>{
    if(movementAccount!=='all'&&item.accountId!==movementAccount)return false
    if(!normalizedMovementQuery)return true
    const expense='category' in item?item as Expense:undefined
    return [item.description,item.date,item.kind,accountName(item.accountId),expense?.category,FREQ_LABEL[item.freq??'unica']].filter(Boolean).join(' ').toLocaleLowerCase('it').includes(normalizedMovementQuery)
  }
  const matchesWithdrawal=(item:CashWithdrawal)=>{
    if(movementAccount!=='all'&&item.accountId!==movementAccount)return false
    if(!normalizedMovementQuery)return true
    return [item.date,item.note,accountName(item.accountId),'prelievo contanti'].filter(Boolean).join(' ').toLocaleLowerCase('it').includes(normalizedMovementQuery)
  }
  const filteredPersonalIncomes=personalIncomes.filter(item=>matchesMovement(item)&&(movementScope==='all'||movementScope==='income'||movementScope==='recurring'&&item.recurring))
  const filteredPivaIncomes=pivaIncomes.filter(item=>matchesMovement(item)&&(movementScope==='all'||movementScope==='income'||movementScope==='recurring'&&item.recurring))
  const filteredBenefitIncomes=benefitIncomes.filter(item=>matchesMovement(item)&&(movementScope==='all'||movementScope==='income'))
  const filteredSubscriptions=subscriptions.filter(item=>matchesMovement(item)&&(movementScope==='all'||movementScope==='expense'||movementScope==='recurring'))
  const filteredAssetPlanExpenses=assetPlanExpenses.filter(item=>matchesMovement(item)&&(movementScope==='all'||movementScope==='expense'||movementScope==='recurring'&&(item.recurring||item.subscription)))
  const filteredOtherExpenses=otherExpenses.filter(item=>matchesMovement(item)&&(movementScope==='all'||movementScope==='expense'))
  const filteredWithdrawals=visibleWithdrawals.filter(item=>matchesWithdrawal(item)&&(movementScope==='all'||movementScope==='withdrawal'))
  const filteredMovementCount=filteredPersonalIncomes.length+filteredPivaIncomes.length+filteredBenefitIncomes.length+filteredSubscriptions.length+filteredAssetPlanExpenses.length+filteredOtherExpenses.length+filteredWithdrawals.length
  const sum=(items:{amount:number}[])=>items.reduce((total,item)=>total+item.amount,0)
  const removeIncome=(id:string)=>set(current=>{const income=current.incomes.find(item=>item.id===id),paymentId=income?.publicBenefitPaymentId;return{...current,incomes:current.incomes.filter(item=>item.id!==id),benefits:income?.benefitId&&income.benefitTransactionId?current.benefits.map(item=>item.id===income.benefitId?{...item,balance:Math.max(0,item.balance-income.amount),transactions:item.transactions.filter(transaction=>transaction.id!==income.benefitTransactionId)}:item):current.benefits,publicBenefits:income?.publicBenefitId&&paymentId?current.publicBenefits.map(item=>item.id===income.publicBenefitId?{...item,payments:item.payments.filter(payment=>payment.id!==paymentId)}:item):current.publicBenefits,expenses:paymentId?current.expenses.map(item=>item.publicBenefitSourcePaymentId===paymentId?{...item,publicBenefitSourcePaymentId:undefined}:item):current.expenses,cashWithdrawals:paymentId?current.cashWithdrawals.map(item=>item.publicBenefitPaymentId===paymentId?{...item,publicBenefitPaymentId:undefined}:item):current.cashWithdrawals}})
  const removeExpense=(id:string)=>set(current=>{const expense=current.expenses.find(item=>item.id===id);if(expense?.assetId){const assets=current.assets.map(asset=>{if(asset.id!==expense.assetId)return asset;if(id.startsWith('asset-plan-'))return{...asset,autoTrackPayments:false};if(id.startsWith('asset-initial-'))return{...asset,initialPayment:undefined,initialPaymentDate:undefined};const movementId=id.replace('asset-movement-','');return{...asset,movimenti:(asset.movimenti??[]).filter(movement=>movement.id!==movementId)}});return{...current,assets,expenses:[...current.expenses.filter(item=>!item.assetId),...assets.flatMap(assetLinkedExpenses)]}}return{...current,expenses:current.expenses.filter(item=>item.id!==id),benefits:expense?.benefitId&&expense.benefitTransactionId?current.benefits.map(item=>item.id===expense.benefitId?{...item,balance:item.balance+(expense.benefitAmount??0),transactions:item.transactions.filter(transaction=>transaction.id!==expense.benefitTransactionId)}:item):current.benefits}})
  const removeCashWithdrawal=(item:CashWithdrawal)=>{const linked=s.expenses.filter(expense=>expense.cashWithdrawalId===item.id).length;if(!window.confirm(linked?`Eliminare questo prelievo? Le ${linked} spese resteranno registrate ma non saranno più collegate.`:'Eliminare questo prelievo?'))return;set(current=>({...current,cashWithdrawals:current.cashWithdrawals.filter(withdrawal=>withdrawal.id!==item.id),expenses:current.expenses.map(expense=>expense.cashWithdrawalId===item.id?{...expense,cashWithdrawalId:undefined}:expense)}))}
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
        const kind:Kind=modules.selfEmployment&&(kindText.includes('piva')||kindText.includes('iva'))?'piva':'personale'
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
  const exportCsv=()=>{
    const cell=(value:string|number|undefined)=>`"${String(value??'').replace(/"/g,'""')}"`
    const rows:(string|number|undefined)[][]=[['Data','Tipo','Descrizione','Importo','Categoria','Ambito','Conto','Ricorrente','Frequenza','Metodo']]
    const addIncome=(item:Income)=>rows.push([item.date,'Entrata',item.description,item.amount.toFixed(2).replace('.', ','),'',item.kind==='piva'?'Lavoro autonomo':'Personale',accountName(item.accountId),item.recurring?'Sì':'No',FREQ_LABEL[item.freq??'unica'],item.incomeClass==='benefit'?'Benefit':'Denaro'])
    const addExpense=(item:Expense)=>rows.push([item.date,'Spesa',item.description,(-item.amount).toFixed(2).replace('.', ','),item.category,item.kind==='piva'?'Lavoro autonomo':'Personale',accountName(item.accountId),item.recurring||item.subscription?'Sì':'No',FREQ_LABEL[item.freq],item.cashWithdrawalId?'Contanti da prelievo':item.publicBenefitSourcePaymentId?'Pagamento INPS/INAIL':item.benefitId?(item.benefitAmount??0)<item.amount?'Misto con benefit':'Benefit':'Conto/carta/contanti'])
    ;[...filteredPersonalIncomes,...filteredPivaIncomes,...filteredBenefitIncomes].forEach(addIncome)
    ;[...filteredSubscriptions,...filteredAssetPlanExpenses,...filteredOtherExpenses].forEach(addExpense)
    filteredWithdrawals.forEach(item=>rows.push([item.date,'Prelievo',item.note??'Prelievo contanti',item.amount.toFixed(2).replace('.', ','),'', 'Personale',accountName(item.accountId),'No','Una tantum','Trasferimento a contanti']))
    const csv=`\uFEFF${rows.map(row=>row.map(cell).join(';')).join('\r\n')}`
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}))
    const link=document.createElement('a');link.href=url;link.download=`movimenti-${year}.csv`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url)
  }
  const incomeList=(items:Income[],empty:string)=><Card className="p-0 overflow-hidden">{items.map(item=>{const wallet=s.benefits.find(value=>value.id===item.benefitId),publicBenefit=s.publicBenefits.find(value=>value.id===item.publicBenefitId);return <div key={item.id} className="flex items-center gap-3 border-b p-4 last:border-0"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className="text-sm">{item.description}</b>{item.incomeClass==='benefit'&&<span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">BENEFIT</span>}{publicBenefit&&<span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{publicBenefit.authority}</span>}</div><p className="text-xs text-muted-foreground">{dateIt(item.date)}{item.recurring&&item.freq?` · ${FREQ_LABEL[item.freq]}`:''}{wallet?` · ${wallet.name}`:''}{publicBenefit?` · pagamento ${publicBenefit.name}`:''}</p></div><b className={`text-sm ${item.incomeClass==='benefit'?'text-violet-600':'text-green-600'}`}>+{money.format(item.amount)}</b>{item.incomeClass!=='benefit'&&!publicBenefit&&<EditButton onClick={()=>editIncome(item)} label="Modifica entrata"/>}<button onClick={()=>removeIncome(item.id)} aria-label="Elimina entrata"><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div>})}{!items.length&&<p className="p-6 text-center text-sm text-muted-foreground">{empty}</p>}</Card>
  const expenseList=(items:Expense[],empty:string)=><Card className="p-0 overflow-hidden">{items.map(item=>{
    const wallet=s.benefits.find(value=>value.id===item.benefitId),withdrawal=s.cashWithdrawals.find(value=>value.id===item.cashWithdrawalId),publicSource=allPublicPayments.find(value=>value.payment.id===item.publicBenefitSourcePaymentId)
    const asset=s.assets.find(value=>value.id===item.assetId)
    const isInvestment=item.expenseClass==='investment_transfer'
    const isPremium=item.expenseClass==='insurance_premium'
    return <div key={item.id} className="flex items-center gap-3 border-b p-4 last:border-0"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className="text-sm">{item.description}</b>{(item.subscription||item.recurring)&&<span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">RICORRENTE</span>}{isInvestment&&<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">TRASFERIMENTO AL PATRIMONIO</span>}{isPremium&&<span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">PREMIO ASSICURATIVO</span>}{item.kind==='piva'&&<span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">AUTONOMO</span>}{wallet&&<span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">{(item.benefitAmount??0)<item.amount?'PAGAMENTO MISTO':'BENEFIT'}</span>}{withdrawal&&<span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">CONTANTI</span>}{publicSource&&<span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{publicSource.benefit.authority}</span>}</div><p className="text-xs text-muted-foreground">{item.category||'Senza categoria'} · {FREQ_LABEL[item.freq]}{asset?` · ${asset.name}`:''}</p>{wallet&&<p className="mt-1 text-xs text-muted-foreground">{money.format(item.benefitAmount??0)} con {wallet.name}{(item.benefitAmount??0)<item.amount?` · ${money.format(item.amount-(item.benefitAmount??0))} dal conto`:''}</p>}{withdrawal&&<p className="mt-1 text-xs text-muted-foreground">Dal prelievo di {money.format(withdrawal.amount)} del {dateFullIt(withdrawal.date)}</p>}{publicSource&&<p className="mt-1 text-xs text-muted-foreground">Dal pagamento {publicSource.benefit.authority} “{publicSource.benefit.name}” del {dateFullIt(publicSource.payment.date)}</p>}{(item.subscription||item.recurring)&&<p className="mt-1 text-xs text-muted-foreground">Inizio: {item.subscription?.startDate?dateIt(item.subscription.startDate):dateIt(item.date)} · Fine: {item.subscription?.endDate?dateIt(item.subscription.endDate):'senza scadenza'}</p>}</div><b className={`text-sm ${isInvestment?'text-primary':'text-destructive'}`}>-{money.format(item.amount)}</b><EditButton onClick={()=>editExpenseItem(item)} label={asset?'Modifica piano collegato':'Modifica spesa'}/><button onClick={()=>removeExpense(item.id)} aria-label={asset?'Rimuovi dal piano collegato':'Elimina spesa'}><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div>
  })}{!items.length&&<p className="p-6 text-center text-sm text-muted-foreground">{empty}</p>}</Card>
  return (
    <div className="flex flex-col gap-6">
      <Heading kicker="REGISTRO" title="Entrate e spese" text={`Movimenti ${year}, già separati per natura e attività.`}/>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Entrate personali" value={sum(personalIncomes)}/>{modules.selfEmployment&&<Metric label="Incassi lavoro autonomo" value={sum(pivaIncomes)}/>} {modules.benefits&&<Metric label="Accrediti benefit" value={sum(benefitIncomes)} detail="Non aumentano la liquidità"/>}<Metric label="Spese complessive" value={sum(spendingExpenses)} detail="I trasferimenti agli investimenti restano separati"/></div>
      <Card><div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="font-semibold">Importa movimenti bancari</h3><p className="mt-1 text-sm text-muted-foreground">CSV con Data, Descrizione o Causale e Importo. Entrate positive e spese negative; i duplicati vengono ignorati.</p>{csvMsg&&<p className="mt-2 text-sm font-semibold text-primary">{csvMsg}</p>}</div><label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border bg-background px-4 text-sm font-semibold hover:bg-secondary"><FileUp className="size-4"/>Scegli CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void importCsv(file);e.currentTarget.value=''}}/></label></div></Card>
      <Card><div className="flex flex-col gap-3 lg:flex-row lg:items-end"><Field label="Cerca nel registro"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input value={movementQuery} onChange={event=>setMovementQuery(event.target.value)} placeholder="Descrizione, categoria, conto..." className="pl-9"/></div></Field><Field label="Mostra"><select value={movementScope} onChange={event=>setMovementScope(event.target.value as typeof movementScope)}><option value="all">Tutti i movimenti</option><option value="income">Solo entrate</option><option value="expense">Solo spese</option><option value="recurring">Solo ricorrenti</option><option value="withdrawal">Solo prelievi</option></select></Field><Field label="Conto"><select value={movementAccount} onChange={event=>setMovementAccount(event.target.value)}><option value="all">Tutti i conti</option>{s.accounts.map(account=><option key={account.id} value={account.id}>{account.name}</option>)}</select></Field><div className="flex items-center gap-2"><button type="button" onClick={()=>{setMovementQuery('');setMovementScope('all');setMovementAccount('all')}} className="h-10 rounded-xl border px-4 text-sm font-semibold hover:bg-secondary">Azzera</button><button type="button" onClick={exportCsv} disabled={filteredMovementCount===0} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Download className="size-4"/>Esporta CSV</button></div></div><p className="mt-3 text-xs text-muted-foreground">{filteredMovementCount} {filteredMovementCount===1?'movimento visibile':'movimenti visibili'} nel {year}. L’esportazione rispetta i filtri selezionati.</p></Card>
      <form key={editing?.item.id??'new-movement'} onSubmit={submit} className="grid gap-3 rounded-2xl border bg-card p-5 md:grid-cols-4">
        {editing&&<div className="col-span-full flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"><span>Stai modificando “{editing.type==='withdrawal'?`Prelievo ${money.format(editing.item.amount)}`:editing.item.description}”</span><button type="button" onClick={resetForm} className="text-xs">Annulla modifica</button></div>}
        <Field label="Operazione"><select value={mode} onChange={e=>{setMode(e.target.value as typeof mode);setFormError('')}}><option value="spesa">Spesa</option><option value="entrata">Entrata</option><option value="prelievo">Prelievo contanti (trasferimento)</option></select></Field>
        <Field label="Data"><input name="date" type="date" required defaultValue={editItem?.date??editWithdrawalItem?.date??new Date().toISOString().slice(0,10)}/></Field>
        {mode!=='prelievo'&&<Field label="Descrizione"><input name="description" required defaultValue={editItem?.description}/></Field>}
        <Field label="Importo (€)"><input name="amount" type="number" min=".01" step=".01" required defaultValue={editItem?.amount??editWithdrawalItem?.amount}/></Field>
        {mode!=='prelievo'&&<Field label="Ambito"><select name="kind" defaultValue={modules.selfEmployment?editItem?.kind??'personale':'personale'}><option value="personale">Personale</option>{modules.selfEmployment&&<option value="piva">Lavoro autonomo</option>}</select></Field>}
        {mode==='spesa'&&<Field label="Come hai pagato?"><select value={paymentMode} onChange={event=>{setPaymentMode(event.target.value as typeof paymentMode);setFormError('')}}><option value="cash">Conto, carta o contanti non collegati</option><option value="withdrawal">Da un prelievo contanti</option>{modules.benefits&&allPublicPayments.length>0&&<option value="publicBenefit">Da un pagamento INPS/INAIL ricevuto</option>}{modules.benefits&&<><option value="benefit">Solo con un benefit</option><option value="mixed">Pagamento misto con benefit</option></>}</select></Field>}
        {(mode==='entrata'||mode==='prelievo'||mode==='spesa'&&(paymentMode==='cash'||paymentMode==='mixed'))&&<Field label={mode==='prelievo'?'Conto da cui hai prelevato':paymentMode==='mixed'?'Conto per la parte restante':'Conto (facoltativo)'}><select name="accountId" defaultValue={editItem?.accountId??editWithdrawalItem?.accountId??''}><option value="">Nessun conto</option>{s.accounts.filter(account=>mode!=='prelievo'||account.type!=='contanti').map(a=><option key={a.id} value={a.id}>{TIPO_EMOJI[a.type]} {a.name}</option>)}</select></Field>}
        {mode==='prelievo'&&<Field label="Nota"><input name="note" defaultValue={editWithdrawalItem?.note} placeholder="Es. contanti per la settimana"/></Field>}
        {mode==='prelievo'&&modules.benefits&&allPublicPayments.length>0&&<Field label="Origine del denaro (facoltativa)"><select name="publicBenefitPaymentId" value={selectedPublicBenefitPaymentId} onChange={event=>{setSelectedPublicBenefitPaymentId(event.target.value);setFormError('')}}><option value="">Disponibilità generale del conto</option>{allPublicPayments.filter(item=>publicPaymentRemaining(item.payment.id,undefined,editWithdrawalItem?.id)>0||item.payment.id===editWithdrawalItem?.publicBenefitPaymentId).sort((a,b)=>b.payment.date.localeCompare(a.payment.date)).map(item=><option key={item.payment.id} value={item.payment.id}>{item.benefit.authority} · {item.benefit.name} · {dateIt(item.payment.date)} · restano {money.format(publicPaymentRemaining(item.payment.id,undefined,editWithdrawalItem?.id))}</option>)}</select></Field>}
        {mode==='spesa'&&paymentMode==='withdrawal'&&<Field label="Prelievo da utilizzare"><select value={selectedWithdrawalId} onChange={event=>{setSelectedWithdrawalId(event.target.value);setFormError('')}} required><option value="">Scegli...</option>{s.cashWithdrawals.filter(item=>cashRemaining(item,editExpense?.id)>0||item.id===editExpense?.cashWithdrawalId).sort((a,b)=>b.date.localeCompare(a.date)).map(item=><option key={item.id} value={item.id}>{dateIt(item.date)} · prelievo {money.format(item.amount)} · restano {money.format(cashRemaining(item,editExpense?.id))}</option>)}</select></Field>}
        {mode==='spesa'&&paymentMode==='publicBenefit'&&<Field label="Pagamento ricevuto da utilizzare"><select value={selectedPublicBenefitPaymentId} onChange={event=>{setSelectedPublicBenefitPaymentId(event.target.value);setFormError('')}} required><option value="">Scegli...</option>{allPublicPayments.filter(item=>publicPaymentRemaining(item.payment.id,editExpense?.id)>0||item.payment.id===editExpense?.publicBenefitSourcePaymentId).sort((a,b)=>b.payment.date.localeCompare(a.payment.date)).map(item=><option key={item.payment.id} value={item.payment.id}>{item.benefit.authority} · {item.benefit.name} · {dateIt(item.payment.date)} · restano {money.format(publicPaymentRemaining(item.payment.id,editExpense?.id))}</option>)}</select></Field>}
        {mode==='spesa'&&(paymentMode==='benefit'||paymentMode==='mixed')&&<Field label="Benefit utilizzato"><select value={selectedBenefitId} onChange={event=>{setSelectedBenefitId(event.target.value);setFormError('')}} required><option value="">Scegli...</option>{s.benefits.filter(item=>item.balance>0||item.id===editExpense?.benefitId).map(item=><option key={item.id} value={item.id}>{item.name} · {money.format(item.balance)}</option>)}</select></Field>}
        {mode==='spesa'&&paymentMode==='mixed'&&<Field label="Quota pagata con benefit (€)"><input type="number" min=".01" step=".01" value={benefitAmount||''} onChange={event=>{setBenefitAmount(Number(event.target.value));setFormError('')}} required/></Field>}
        {mode!=='prelievo'&&<Field label="Frequenza"><FreqSelect value={freq} onChange={setFreq}/></Field>}
        {mode==='spesa'&&<Field label="Categoria"><input name="category" list="expense-categories" required placeholder="Es. Casa, Auto..." defaultValue={editExpense?.category}/><datalist id="expense-categories">{s.categories.map(c=><option key={c.id} value={c.name}/>)}</datalist></Field>}
        {mode==='entrata'&&<label className="flex items-center gap-2 text-sm col-span-full"><input name="recurring" type="checkbox" defaultChecked={editItem?.recurring}/>Entrata ricorrente</label>}
        {mode==='spesa'&&<label className="flex items-center gap-2 text-sm col-span-full"><input type="checkbox" checked={isSubscription} onChange={e=>{setIsSubscription(e.target.checked);if(e.target.checked&&!editing)setOpenEnded(true)}}/>Costo ricorrente / abbonamento</label>}
        {mode==='spesa'&&isSubscription&&<><Field label="Data inizio (facoltativa)"><input name="startDate" type="date" defaultValue={editExpense?.subscription?.startDate}/></Field><Field label="Data fine"><input name="endDate" type="date" disabled={openEnded} required={!openEnded} defaultValue={editExpense?.subscription?.endDate??''}/></Field><label className="flex items-center gap-2 self-end pb-2 text-sm md:col-span-2"><input type="checkbox" checked={openEnded} onChange={e=>setOpenEnded(e.target.checked)}/>Data fine non definita</label></>}
        {formError&&<p className="col-span-full rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{formError}</p>}
        {mode==='prelievo'&&<p className="col-span-full rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">Il prelievo trasferisce denaro dal conto ai contanti: non è una spesa e non entra nei grafici. Le spese collegate consumeranno soltanto il residuo di questo prelievo.</p>}
        <button className="col-span-full h-11 rounded-xl bg-primary px-4 font-semibold text-primary-foreground">{editing?<Pencil className="mr-2 inline size-4"/>:<Plus className="mr-2 inline size-4"/>}{editing?'Salva modifiche':mode==='prelievo'?'Registra prelievo':'Aggiungi'}</button>
      </form>
      {filteredWithdrawals.length>0&&<section className="flex flex-col gap-3"><div><h3 className="font-semibold">Portafogli contanti</h3><p className="text-sm text-muted-foreground">Ogni prelievo è una disponibilità separata. Il residuo scende solo con le spese che gli colleghi.</p></div><div className="grid gap-3 md:grid-cols-2">{filteredWithdrawals.map(item=>{const spent=cashSpent(item.id),remaining=Math.max(0,item.amount-spent),account=s.accounts.find(value=>value.id===item.accountId),publicSource=allPublicPayments.find(value=>value.payment.id===item.publicBenefitPaymentId);return <Card key={item.id}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-orange-700">PRELIEVO · {dateFullIt(item.date)}</p><h4 className="mt-2 font-semibold">{money.format(item.amount)} in contanti</h4><p className="mt-1 text-xs text-muted-foreground">{account?`Da ${account.name}`:'Conto non collegato'}{publicSource?` · fondi ${publicSource.benefit.authority} ${publicSource.benefit.name}`:''}{item.note?` · ${item.note}`:''}</p></div><div className="flex gap-3"><EditButton onClick={()=>editCashWithdrawal(item)} label="Modifica prelievo"/><button onClick={()=>removeCashWithdrawal(item)} aria-label="Elimina prelievo"><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-secondary/60 p-3"><p className="text-xs text-muted-foreground">Speso</p><p className="mt-1 font-semibold">{money.format(spent)}</p></div><div className="rounded-xl bg-orange-50 p-3 dark:bg-orange-950/20"><p className="text-xs text-orange-700">Rimasto</p><p className="mt-1 text-xl font-semibold text-orange-700">{money.format(remaining)}</p></div></div></Card>})}</div></section>}
      {(movementScope==='all'||movementScope==='income'||movementScope==='recurring')&&<><div className={`grid gap-5 ${modules.selfEmployment?'lg:grid-cols-2':''}`}><section className="flex flex-col gap-3"><div><h3 className="font-semibold">Entrate personali</h3><p className="text-sm text-muted-foreground">Stipendio e altri introiti personali</p></div>{incomeList(filteredPersonalIncomes,'Nessuna entrata con questi filtri')}</section>{modules.selfEmployment&&<section className="flex flex-col gap-3"><div><h3 className="font-semibold">Incassi lavoro autonomo</h3><p className="text-sm text-muted-foreground">Fatture pagate e compensi professionali</p></div>{incomeList(filteredPivaIncomes,'Nessun incasso con questi filtri')}</section>}</div>
      {modules.benefits&&movementScope!=='recurring'&&<section className="flex flex-col gap-3"><div><h3 className="font-semibold">Accrediti benefit</h3><p className="text-sm text-muted-foreground">Valore ricevuto su buoni pasto, welfare e carte carburante: visibile, ma separato dal reddito monetario.</p></div>{incomeList(filteredBenefitIncomes,'Nessun accredito con questi filtri')}</section>}</>}
      {(movementScope==='all'||movementScope==='expense'||movementScope==='recurring')&&<section className="flex flex-col gap-3"><div><h3 className="font-semibold">Versamenti e premi</h3><p className="text-sm text-muted-foreground">Piani ricorrenti, versamenti iniziali ed extra collegati a investimenti e assicurazioni.</p></div>{expenseList(filteredAssetPlanExpenses,'Nessun versamento o premio con questi filtri')}</section>}
      {(movementScope==='all'||movementScope==='expense'||movementScope==='recurring')&&<section className="flex flex-col gap-3"><div><h3 className="font-semibold">Abbonamenti</h3><p className="text-sm text-muted-foreground">Costi ricorrenti con periodo definito o senza scadenza</p></div>{expenseList(filteredSubscriptions,'Nessun abbonamento con questi filtri')}</section>}
      {(movementScope==='all'||movementScope==='expense')&&<section className="flex flex-col gap-3"><div><h3 className="font-semibold">Altre spese</h3><p className="text-sm text-muted-foreground">Spese personali e professionali</p></div>{expenseList(filteredOtherExpenses,'Nessuna spesa con questi filtri')}</section>}
      {filteredMovementCount===0&&<Card><p className="py-4 text-center text-sm text-muted-foreground">Nessun movimento corrisponde ai filtri selezionati.</p></Card>}
    </div>
  )
}

// ── CONTI ──
function Accounts({s,set,selfEmploymentEnabled}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;selfEmploymentEnabled:boolean}) {
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
          <Field label="Tipo"><select value={tipo} onChange={e=>setTipo(e.target.value as Account['type'])}><option value="conto">🏦 Corrente</option>{(selfEmploymentEnabled||tipo==='piva')&&<option value="piva">🧾 Professionale</option>}<option value="carta">💳 Carta di credito</option><option value="fido">📋 Fido</option><option value="contanti">💵 Contanti</option></select></Field>
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
function Assets({s,set,modules,onOpenSettings}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;modules:Record<AppModule,boolean>;onOpenSettings:()=>void}) {
  const today=new Date().toISOString().slice(0,10)
  const [showForm,setShowForm]=useState(false)
  const [editingAsset,setEditingAsset]=useState<Asset|null>(null)
  const [movInvId,setMovInvId]=useState<string|null>(null)
  const [editingMov,setEditingMov]=useState<{assetId:string;movimento:AssetMovimento}|null>(null)
  const [tipoMov,setTipoMov]=useState<AssetMovimento['tipo']>('versamento')
  const [freq,setFreq]=useState<Freq>('mensile')
  const [assetType,setAssetType]=useState<Asset['type']>('finanziario')
  const [insuranceKind,setInsuranceKind]=useState<InsuranceKind>('protection')
  const [autoTrackPayments,setAutoTrackPayments]=useState(false)
  const enabledAssetTypes:Asset['type'][]=[...(modules.investments?['finanziario' as const,'risparmio' as const]:[]),...(modules.insurance?['assicurativo' as const]:[])]
  const defaultAssetType=enabledAssetTypes[0]??'finanziario'
  const visibleAssets=s.assets.filter(asset=>asset.type==='assicurativo'?modules.insurance:modules.investments)
  const hasAssetModules=modules.investments||modules.insurance
  const hasAnyPatrimonyModule=hasAssetModules||modules.benefits
  const pat=patrimoniTotals(visibleAssets)
  const rendPerc=pat.totVersato>0?(pat.rend/pat.totVersato*100):0
  const protectionPremiums=visibleAssets.filter(isProtectionInsurance).reduce((total,asset)=>total+assetFinancialStatus(asset,today).netPaid,0)
  const resetAssetForm=()=>{setShowForm(false);setEditingAsset(null);setFreq('mensile');setAssetType(defaultAssetType);setInsuranceKind('protection');setAutoTrackPayments(false)}
  const submitAsset=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const f=new FormData(e.currentTarget)
    const importoVers=Number(f.get('importoVers'))||0
    const startDate=String(f.get('startDate')||'')||undefined
    const initialPayment=Number(f.get('initialPayment'))||undefined
    const initialPaymentDate=initialPayment?(String(f.get('initialPaymentDate')||'')||startDate):undefined
    const durationYears=assetType==='assicurativo'?(Number(f.get('durationYears'))||undefined):undefined
    const protection=assetType==='assicurativo'&&insuranceKind==='protection'
    if(autoTrackPayments&&(!startDate||importoVers<=0))return
    const a:Asset={
      id:editingAsset?.id??uid(),name:String(f.get('name')),type:assetType,
      paid:Number(f.get('knownPaid'))||0,value:protection?0:Number(f.get('currentValue'))||0,
      istituto:String(f.get('istituto')||'')||undefined,freq,importoVers:importoVers||undefined,
      startDate,initialPayment,initialPaymentDate,
      durationYears,autoTrackPayments,insuranceKind:assetType==='assicurativo'?insuranceKind:undefined,
      deathBenefit:protection?(Number(f.get('deathBenefit'))||undefined):undefined,
      disabilityBenefit:protection?(Number(f.get('disabilityBenefit'))||undefined):undefined,
      beneficiary:protection?(String(f.get('beneficiary')||'').trim()||undefined):undefined,
      sourceAccountId:String(f.get('sourceAccountId')||'')||undefined,
      movimenti:editingAsset?.movimenti??[]
    }
    set(x=>{const assets=editingAsset?x.assets.map(item=>item.id===editingAsset.id?a:item):[...x.assets,a];return{...x,assets,expenses:[...x.expenses.filter(item=>!item.assetId),...assets.flatMap(assetLinkedExpenses)]}});e.currentTarget.reset();resetAssetForm()
  }
  const addMov=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const f=new FormData(e.currentTarget)
    const mov:AssetMovimento={id:editingMov?.movimento.id??uid(),data:String(f.get('data')),tipo:tipoMov,importo:Number(f.get('importo')),note:String(f.get('note'))||undefined}
    set(x=>{const assets=x.assets.map(a=>{
      if(a.id!==movInvId)return a
      const movs=editingMov?(a.movimenti??[]).map(item=>item.id===editingMov.movimento.id?mov:item):[...(a.movimenti??[]),mov]
      const ult=[...movs].filter(m=>m.tipo==='aggiornamento_valore').sort((x,y)=>y.data.localeCompare(x.data))[0]
      return{...a,movimenti:movs,value:ult?ult.importo:a.value}
    });return{...x,assets,expenses:[...x.expenses.filter(item=>!item.assetId),...assets.flatMap(assetLinkedExpenses)]}});e.currentTarget.reset();setMovInvId(null);setEditingMov(null)
  }
  return (
    <div className="flex flex-col gap-6">
      <Heading kicker="PATRIMONIO E SOSTEGNI" title="Risorse diverse, conti sempre chiari" text="Investimenti e benefit restano distinti; le prestazioni INPS/INAIL entrano nel bilancio soltanto quando vengono realmente pagate."/>
      {!hasAnyPatrimonyModule&&<Card className="border-primary/25 bg-primary/5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">NESSUN MODULO ATTIVO</p><h3 className="mt-2 text-xl font-semibold">Scegli cosa vuoi gestire.</h3><p className="mt-1 text-sm text-muted-foreground">Puoi attivare investimenti, assicurazioni, benefit aziendali e sostegni pubblici. I moduli non scelti restano fuori dal menu e dai moduli di inserimento.</p></div><button onClick={onOpenSettings} className="h-10 shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Personalizza l’app</button></div></Card>}
      {hasAssetModules&&<>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Capitale investito" value={pat.totVersato} detail="Esclude le polizze di puro rischio"/>
        <Metric label="Valore investimenti" value={pat.totValore}/>
        <Card><p className="text-sm text-muted-foreground">Rendimento investimenti</p><p className={`mt-3 text-2xl font-semibold ${pat.rend>=0?'text-green-600':'text-destructive'}`}>{pat.rend>=0?'+':''}{money.format(pat.rend)}</p><p className="mt-1 text-xs text-muted-foreground">{rendPerc>=0?'+':''}{rendPerc.toFixed(1)}%</p></Card>
        <Metric label="Premi di protezione versati" value={protectionPremiums} detail="Sono costi di copertura, non investimenti"/>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {visibleAssets.map(a=>{
          const movs=(a.movimenti??[]).slice().sort((x,y)=>y.data.localeCompare(x.data))
          const plan=assetPlanStatus(a,today)
          const status=assetFinancialStatus(a,today)
          const protection=isProtectionInsurance(a)
          const catEmoji={finanziario:'📈',assicurativo:'🛡️',risparmio:'🏦'}[a.type]??'💰'
          return (
            <Card key={a.id}>
              <div className="flex justify-between items-start">
                <div><p className="text-xs text-muted-foreground">{catEmoji} {a.type}{a.istituto?` · ${a.istituto}`:''}</p><h3 className="font-semibold">{a.name}</h3>{a.freq&&<p className="text-xs text-muted-foreground mt-0.5">{FREQ_LABEL[a.freq]}{a.importoVers?` · ${money.format(a.importoVers)}`:''}</p>}</div>
                <div className="flex gap-2"><button onClick={()=>{setEditingMov(null);setMovInvId(a.id);setTipoMov('versamento')}} className="text-xs border rounded-lg px-2 py-1 hover:bg-secondary">+ Extra</button><EditButton onClick={()=>{setEditingAsset(a);setFreq(a.freq??'mensile');setAssetType(a.type);setInsuranceKind(a.insuranceKind??'protection');setAutoTrackPayments(Boolean(a.autoTrackPayments));setShowForm(true)}} label="Modifica voce patrimoniale"/><button onClick={()=>set(x=>{const assets=x.assets.filter(v=>v.id!==a.id);return{...x,assets,expenses:x.expenses.filter(expense=>expense.assetId!==a.id)}})}><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div>
              </div>
              {protection?<><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-secondary p-2"><p className="text-xs text-muted-foreground">Premi versati</p><p className="font-semibold text-sm">{money.format(status.netPaid)}</p></div><div className="rounded-xl bg-secondary p-2"><p className="text-xs text-muted-foreground">Caso morte</p><p className="font-semibold text-sm">{a.deathBenefit?money.format(a.deathBenefit):'Da inserire'}</p></div><div className="rounded-xl bg-secondary p-2"><p className="text-xs text-muted-foreground">Invalidità / infortunio</p><p className="font-semibold text-sm">{a.disabilityBenefit?money.format(a.disabilityBenefit):'Da inserire'}</p></div></div><p className="mt-2 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-800 dark:bg-sky-950/20 dark:text-sky-200">Polizza di protezione: il premio acquista una copertura e non genera un rendimento finanziario.</p></>:<div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-secondary p-2"><p className="text-xs text-muted-foreground">Versato</p><p className="font-semibold text-sm">{money.format(status.netPaid)}</p></div><div className="rounded-xl bg-secondary p-2"><p className="text-xs text-muted-foreground">Valore</p><p className={`font-semibold text-sm ${status.netPaid===0?'text-foreground':status.returnAmount>=0?'text-green-600':'text-destructive'}`}>{money.format(status.value)}</p></div><div className="rounded-xl bg-secondary p-2"><p className="text-xs text-muted-foreground">Rendim.</p><p className={`font-semibold text-sm ${status.netPaid===0?'text-muted-foreground':status.returnAmount>=0?'text-green-600':'text-destructive'}`}>{status.netPaid===0?'N/D':`${status.returnAmount>=0?'+':''}${status.returnPercent.toFixed(1)}%`}</p></div></div>}
              {a.startDate&&a.importoVers&&<div className="mt-3 rounded-xl border bg-secondary/40 p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-widest text-primary">{protection?'Piano dei premi':'Piano dei versamenti'}</p><p className="mt-1 text-sm font-semibold">{money.format(a.importoVers)} · {FREQ_LABEL[a.freq??'mensile']}</p><p className="mt-1 text-xs text-muted-foreground">Prima rata {dateFullIt(a.startDate)}{a.sourceAccountId?` · da ${s.accounts.find(account=>account.id===a.sourceAccountId)?.name??'conto selezionato'}`:''}{a.initialPayment?` · iniziale ${money.format(a.initialPayment)}`:''}</p></div>{a.autoTrackPayments&&<span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">CALCOLO AUTOMATICO</span>}</div>{plan.totalInstallments>0&&<div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"><div><p className="text-muted-foreground">Durata</p><b>{a.durationYears} anni</b></div><div><p className="text-muted-foreground">Pagate / totali</p><b>{plan.paid} / {plan.totalInstallments}</b></div><div><p className="text-muted-foreground">Totale versato</p><b>{money.format(status.netPaid)}</b></div><div><p className="text-muted-foreground">Termine</p><b>{plan.endDate?dateFullIt(plan.endDate):'—'}</b></div></div>}{plan.remaining>0&&<p className="mt-3 border-t pt-2 text-xs text-muted-foreground">Restano {plan.remaining} rate, pari a {money.format(plan.estimatedRemaining)}{plan.nextDate?` · prossima ${dateFullIt(plan.nextDate)}`:''}.</p>}</div>}
              {movs.length>0&&<div className="mt-3 border-t pt-3">{movs.slice(0,3).map(m=><div key={m.id} className="flex items-center gap-2 py-1 text-xs text-muted-foreground"><span className="min-w-0 flex-1">{dateIt(m.data)} · {{versamento:'↓',prelievo:'↑',aggiornamento_valore:'📊'}[m.tipo]} {m.note||''}</span><span className={m.tipo==='prelievo'?'text-destructive':'text-green-600'}>{m.tipo==='prelievo'?'-':'+'}{money.format(m.importo)}</span><EditButton onClick={()=>{setEditingMov({assetId:a.id,movimento:m});setMovInvId(a.id);setTipoMov(m.tipo)}} label="Modifica movimento patrimonio"/></div>)}</div>}
              {movInvId===a.id&&<form key={editingMov?.movimento.id??`new-asset-movement-${a.id}`} onSubmit={addMov} className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2"><Field label="Tipo"><select value={tipoMov} onChange={e=>setTipoMov(e.target.value as AssetMovimento['tipo'])}><option value="versamento">{protection?'Premio extra':'Versamento extra'}</option><option value="prelievo">Prelievo / riscatto</option>{!protection&&<option value="aggiornamento_valore">Aggiornamento valore</option>}</select></Field><Field label="Data"><input name="data" type="date" required defaultValue={editingMov?.movimento.data??today}/></Field><Field label="Importo (€)"><input name="importo" type="number" min=".01" step=".01" required defaultValue={editingMov?.movimento.importo}/></Field><Field label="Note"><input name="note" placeholder={protection?'Es. premio aggiuntivo':'Es. versamento una tantum'} defaultValue={editingMov?.movimento.note}/></Field><div className="col-span-full flex gap-2"><button type="submit" className="h-9 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{editingMov?'Salva modifica':'Salva extra'}</button><button type="button" onClick={()=>{setMovInvId(null);setEditingMov(null)}} className="h-9 rounded-xl border px-4 text-sm">Annulla</button></div></form>}
            </Card>
          )
        })}
        <button onClick={()=>{if(showForm)resetAssetForm();else{setEditingAsset(null);setFreq('mensile');setAssetType(defaultAssetType);setInsuranceKind('protection');setAutoTrackPayments(true);setShowForm(true)}}} className="rounded-2xl border-2 border-dashed border-border hover:border-primary flex items-center justify-center gap-2 text-muted-foreground hover:text-primary p-5 min-h-[120px] transition-colors"><Plus className="size-5"/>Nuova voce patrimoniale</button>
      </div>
      {showForm&&<form key={editingAsset?.id??'new-asset'} onSubmit={submitAsset} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">
        {editingAsset&&<p className="col-span-full rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">Modifica “{editingAsset.name}”</p>}
        <Field label="Nome"><input name="name" required placeholder="Es. Polizza vita, PAC, Satispay..." defaultValue={editingAsset?.name}/></Field>
        <Field label="Categoria"><select value={assetType} onChange={event=>{const type=event.target.value as Asset['type'];setAssetType(type);setInsuranceKind('protection')}}>{modules.investments&&<><option value="finanziario">📈 Investimento finanziario</option><option value="risparmio">🏦 Risparmio vincolato</option></>}{modules.insurance&&<option value="assicurativo">🛡️ Assicurazione / Previdenza</option>}</select></Field>
        <Field label="Istituto"><input name="istituto" placeholder="Es. Fineco, Generali..." defaultValue={editingAsset?.istituto}/></Field>
        {assetType==='assicurativo'&&<Field label="Tipo di polizza"><select value={insuranceKind} onChange={event=>setInsuranceKind(event.target.value as InsuranceKind)}><option value="protection">Protezione puro rischio</option><option value="savings">Risparmio / gestione separata</option><option value="unit_linked">Unit linked / investimento</option></select></Field>}
        <Field label={assetType==='assicurativo'?'Importo premio ricorrente (€)':'Versamento ricorrente (€)'}><input name="importoVers" type="number" min="0" step=".01" placeholder="0,00" defaultValue={editingAsset?.importoVers}/></Field>
        <Field label="Frequenza"><FreqSelect value={freq} onChange={setFreq}/></Field>
        <Field label={assetType==='assicurativo'?'Data prima rata / premio':'Data primo versamento'}><input name="startDate" type="date" required={autoTrackPayments} defaultValue={editingAsset?.startDate}/></Field>
        <Field label={assetType==='assicurativo'?'Premio iniziale (€) · facoltativo':'Versamento iniziale (€) · facoltativo'}><input name="initialPayment" type="number" min="0" step=".01" placeholder="Es. 25,00" defaultValue={editingAsset?.initialPayment}/></Field>
        <Field label="Data iniziale (se diversa)"><input name="initialPaymentDate" type="date" defaultValue={editingAsset?.initialPaymentDate}/></Field>
        <Field label="Totale già versato conosciuto (€)"><input name="knownPaid" type="number" min="0" step=".01" placeholder="Facoltativo" defaultValue={editingAsset?.paid||undefined}/></Field>
        {assetType==='assicurativo'&&<Field label="Durata (anni)"><input name="durationYears" type="number" min="1" step="1" placeholder="Es. 18" defaultValue={editingAsset?.durationYears}/></Field>}
        <Field label="Conto di origine (facoltativo)"><select name="sourceAccountId" defaultValue={editingAsset?.sourceAccountId??''}><option value="">Nessun conto collegato</option>{s.accounts.map(account=><option key={account.id} value={account.id}>{account.name}</option>)}</select></Field>
        {assetType==='assicurativo'&&insuranceKind==='protection'?<>
          <Field label="Capitale assicurato caso morte (€)"><input name="deathBenefit" type="number" min="0" step=".01" placeholder="Es. 150000" defaultValue={editingAsset?.deathBenefit}/></Field>
          <Field label="Capitale invalidità / infortunio (€)"><input name="disabilityBenefit" type="number" min="0" step=".01" placeholder="Es. 150000" defaultValue={editingAsset?.disabilityBenefit}/></Field>
          <Field label="Beneficiario (facoltativo)"><input name="beneficiary" placeholder="Es. coniuge, eredi..." defaultValue={editingAsset?.beneficiary}/></Field>
        </>:<Field label={assetType==='assicurativo'?'Valore attuale / di riscatto (€)':'Valore attuale rilevato (€)'}><input name="currentValue" type="number" min="0" step=".01" placeholder="0,00" defaultValue={editingAsset?.value??0}/></Field>}
        <label className="col-span-full flex items-start gap-3 rounded-xl border bg-secondary/40 p-3 text-sm"><input type="checkbox" className="mt-1" checked={autoTrackPayments} onChange={event=>setAutoTrackPayments(event.target.checked)}/><span><b>Calcola automaticamente rate e versamenti maturati</b><span className="mt-1 block text-xs text-muted-foreground">Somma il versamento iniziale, le rate maturate e gli extra. Il totale conosciuto viene usato se è superiore.</span></span></label>
        <p className="col-span-full text-xs text-muted-foreground">{assetType==='assicurativo'&&insuranceKind==='protection'?'Il premio è una spesa di protezione e non ha rendimento. Comparirà nei Movimenti e nella Dashboard.':'Il versamento ricorrente e gli extra riducono la disponibilità come trasferimenti verso il patrimonio, non come spese di consumo.'}</p>
        <div className="col-span-full flex gap-3"><button type="submit" className="h-10 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">{editingAsset?'Salva modifiche':'Aggiungi'}</button><button type="button" onClick={resetAssetForm} className="h-10 rounded-xl border px-5 text-sm">Annulla</button></div>
      </form>}
      </>}
      {modules.benefits&&<><Benefits s={s} set={set}/><PublicBenefits s={s} set={set}/></>}
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

function PublicBenefits({s,set}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>}) {
  const today=new Date().toISOString().slice(0,10)
  const currentYear=today.slice(0,4)
  const [showForm,setShowForm]=useState(false)
  const [editing,setEditing]=useState<PublicBenefit|null>(null)
  const [catalogKey,setCatalogKey]=useState('inps-naspi')
  const [status,setStatus]=useState<PublicBenefitStatus>('valutazione')
  const [amountMode,setAmountMode]=useState<PublicBenefitAmountMode>('variable')
  const [frequency,setFrequency]=useState<Freq>('mensile')
  const [paymentBenefitId,setPaymentBenefitId]=useState<string|null>(null)
  const [editingPayment,setEditingPayment]=useState<{benefitId:string;payment:PublicBenefitPayment}|null>(null)
  const selectedCatalog=PUBLIC_BENEFIT_CATALOG.find(item=>item.key===catalogKey)??PUBLIC_BENEFIT_CATALOG[0]
  const monthlyExpected=s.publicBenefits.filter(item=>item.status==='approvata'&&item.amountMode==='fixed'&&item.frequency!=='unica'&&(!item.startDate||item.startDate<=today)&&(!item.endDate||item.endDate>=today)).reduce((total,item)=>total+toMensile(item.amount,item.frequency),0)
  const receivedThisYear=s.publicBenefits.flatMap(item=>item.payments).filter(payment=>payment.date.startsWith(currentYear)).reduce((total,payment)=>total+payment.amount,0)
  const pending=s.publicBenefits.filter(item=>item.status==='valutazione'||item.status==='domanda').length
  const paymentAllocated=(paymentId:string)=>s.expenses.filter(item=>item.publicBenefitSourcePaymentId===paymentId).reduce((total,item)=>total+item.amount,0)+s.cashWithdrawals.filter(item=>item.publicBenefitPaymentId===paymentId).reduce((total,item)=>total+item.amount,0)
  const reset=()=>{setShowForm(false);setEditing(null);setCatalogKey('inps-naspi');setStatus('valutazione');setAmountMode('variable');setFrequency('mensile')}
  const edit=(item:PublicBenefit)=>{setEditing(item);setCatalogKey(item.catalogKey);setStatus(item.status);setAmountMode(item.amountMode);setFrequency(item.frequency);setShowForm(true)}
  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault()
    const form=new FormData(event.currentTarget),catalog=PUBLIC_BENEFIT_CATALOG.find(item=>item.key===catalogKey)??selectedCatalog
    const name=String(form.get('name')||catalog.name).trim(),amount=amountMode==='fixed'?Number(form.get('amount')):0
    if(!name||amountMode==='fixed'&&amount<=0)return
    const benefit:PublicBenefit={
      id:editing?.id??uid(),catalogKey,name,authority:catalog.authority,category:catalog.category,status,
      amount,amountMode,frequency,
      applicationDate:String(form.get('applicationDate')||'')||undefined,
      startDate:String(form.get('startDate')||'')||undefined,
      endDate:String(form.get('endDate')||'')||undefined,
      nextPaymentDate:String(form.get('nextPaymentDate')||'')||undefined,
      beneficiary:String(form.get('beneficiary')||'').trim()||undefined,
      protocolNumber:String(form.get('protocolNumber')||'').trim()||undefined,
      officialUrl:catalog.officialUrl,
      notes:String(form.get('notes')||'').trim()||undefined,
      payments:editing?.payments??[]
    }
    set(value=>({...value,publicBenefits:editing?value.publicBenefits.map(item=>item.id===editing.id?benefit:item):[benefit,...value.publicBenefits]}))
    event.currentTarget.reset();reset()
  }
  const submitPayment=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault()
    const form=new FormData(event.currentTarget),benefitId=editingPayment?.benefitId??paymentBenefitId,benefit=s.publicBenefits.find(item=>item.id===benefitId)
    if(!benefitId||!benefit)return
    const amount=Number(form.get('amount')),date=String(form.get('date')),accountId=String(form.get('accountId')||'')||undefined,note=String(form.get('note')||'').trim()||undefined
    if(amount<=0||!date)return
    const paymentId=editingPayment?.payment.id??uid(),incomeId=editingPayment?.payment.incomeId??uid()
    const allocated=editingPayment?paymentAllocated(paymentId):0
    if(amount<allocated){window.alert(`Non puoi ridurre il pagamento sotto ${money.format(allocated)}: questa cifra è già collegata a spese o prelievi.`);return}
    const payment:PublicBenefitPayment={id:paymentId,date,amount,accountId,incomeId,note}
    const income:Income={id:incomeId,date,description:`${benefit.authority} · ${benefit.name}`,amount,kind:'personale',accountId,recurring:false,freq:'unica',incomeClass:'cash',publicBenefitId:benefit.id,publicBenefitPaymentId:paymentId}
    set(value=>({...value,
      publicBenefits:value.publicBenefits.map(item=>item.id===benefitId?{...item,payments:editingPayment?item.payments.map(current=>current.id===paymentId?payment:current):[...item.payments,payment]}:item),
      incomes:[income,...value.incomes.filter(item=>item.id!==incomeId)]
    }))
    event.currentTarget.reset();setPaymentBenefitId(null);setEditingPayment(null)
  }
  const removePayment=(benefitId:string,payment:PublicBenefitPayment)=>{const allocated=paymentAllocated(payment.id);if(!window.confirm(`Eliminare questo pagamento anche dai Movimenti?${allocated>0?` Le spese e i prelievi collegati, per ${money.format(allocated)}, resteranno registrati ma senza questa fonte.`:''}`))return;set(value=>({...value,publicBenefits:value.publicBenefits.map(item=>item.id===benefitId?{...item,payments:item.payments.filter(current=>current.id!==payment.id)}:item),incomes:value.incomes.filter(item=>item.id!==payment.incomeId),expenses:value.expenses.map(item=>item.publicBenefitSourcePaymentId===payment.id?{...item,publicBenefitSourcePaymentId:undefined}:item),cashWithdrawals:value.cashWithdrawals.map(item=>item.publicBenefitPaymentId===payment.id?{...item,publicBenefitPaymentId:undefined}:item)}))}
  const removeBenefit=(item:PublicBenefit)=>{if(!window.confirm(`Eliminare “${item.name}”? Verranno rimossi anche ${item.payments.length} pagamenti collegati dai Movimenti; spese e prelievi resteranno ma senza questa fonte.`))return;const incomeIds=new Set(item.payments.map(payment=>payment.incomeId)),paymentIds=new Set(item.payments.map(payment=>payment.id));set(value=>({...value,publicBenefits:value.publicBenefits.filter(benefit=>benefit.id!==item.id),incomes:value.incomes.filter(income=>!incomeIds.has(income.id)),expenses:value.expenses.map(expense=>expense.publicBenefitSourcePaymentId&&paymentIds.has(expense.publicBenefitSourcePaymentId)?{...expense,publicBenefitSourcePaymentId:undefined}:expense),cashWithdrawals:value.cashWithdrawals.map(withdrawal=>withdrawal.publicBenefitPaymentId&&paymentIds.has(withdrawal.publicBenefitPaymentId)?{...withdrawal,publicBenefitPaymentId:undefined}:withdrawal)}))}
  return <section className="mt-2 border-t pt-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-primary">SOSTEGNI PUBBLICI</p><h2 className="mt-2 text-2xl font-semibold">Prestazioni INPS e INAIL</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Tieni separati importo previsto e denaro realmente ricevuto. L’app non verifica il diritto alla prestazione: requisiti, durata e calcolo ufficiale vanno controllati con l’ente o un patronato.</p></div><button onClick={()=>{if(showForm)reset();else setShowForm(true)}} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="size-4"/>Aggiungi sostegno</button></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-3"><Metric label="Previsto al mese" value={monthlyExpected} detail="Solo prestazioni approvate a importo fisso"/><Metric label={`Ricevuto nel ${currentYear}`} value={receivedThisYear} detail="Pagamenti realmente registrati"/><Card><p className="text-sm text-muted-foreground">Da seguire</p><p className="mt-3 text-2xl font-semibold">{pending}</p><p className="mt-1 text-xs text-muted-foreground">In valutazione o con domanda presentata</p></Card></div>
    {showForm&&<form key={editing?.id??'new-public-benefit'} onSubmit={submit} className="mt-5 grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">
      {editing&&<p className="col-span-full rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">Modifica “{editing.name}”</p>}
      <Field label="Prestazione"><select value={catalogKey} onChange={event=>setCatalogKey(event.target.value)}>{(['INPS','INAIL'] as PublicBenefitAuthority[]).map(authority=><optgroup key={authority} label={authority}>{PUBLIC_BENEFIT_CATALOG.filter(item=>item.authority===authority).map(item=><option key={item.key} value={item.key}>{item.name}</option>)}</optgroup>)}</select></Field>
      <Field label="Nome da mostrare"><input name="name" required defaultValue={editing?.name??selectedCatalog.name} key={`${editing?.id??'new'}-${catalogKey}`} placeholder={selectedCatalog.name}/></Field>
      <Field label="Stato"><select value={status} onChange={event=>setStatus(event.target.value as PublicBenefitStatus)}>{(Object.keys(PUBLIC_BENEFIT_STATUS_LABEL) as PublicBenefitStatus[]).map(key=><option key={key} value={key}>{PUBLIC_BENEFIT_STATUS_LABEL[key]}</option>)}</select></Field>
      <div className="col-span-full rounded-xl bg-secondary/60 p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div><b>{selectedCatalog.authority} · {PUBLIC_BENEFIT_CATEGORY_LABEL[selectedCatalog.category]}</b><p className="mt-1 text-xs text-muted-foreground">{selectedCatalog.description}</p></div><a href={selectedCatalog.officialUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary underline underline-offset-2">Fonte ufficiale</a></div></div>
      <Field label="Importo"><select value={amountMode} onChange={event=>setAmountMode(event.target.value as PublicBenefitAmountMode)}><option value="variable">Variabile / ancora da definire</option><option value="fixed">Importo previsto noto</option></select></Field>
      {amountMode==='fixed'&&<Field label="Importo previsto (€)"><input name="amount" type="number" min=".01" step=".01" required defaultValue={editing?.amount||undefined}/></Field>}
      <Field label="Frequenza prevista"><FreqSelect value={frequency} onChange={setFrequency}/></Field>
      <Field label="Data domanda (facoltativa)"><input name="applicationDate" type="date" defaultValue={editing?.applicationDate}/></Field>
      <Field label="Decorrenza / inizio"><input name="startDate" type="date" defaultValue={editing?.startDate}/></Field>
      <Field label="Fine prevista"><input name="endDate" type="date" defaultValue={editing?.endDate}/></Field>
      <Field label="Prossimo pagamento previsto"><input name="nextPaymentDate" type="date" defaultValue={editing?.nextPaymentDate}/></Field>
      <Field label="Beneficiario"><input name="beneficiary" defaultValue={editing?.beneficiary} placeholder="Es. me stesso, figlio..."/></Field>
      <Field label="Protocollo / identificativo"><input name="protocolNumber" defaultValue={editing?.protocolNumber} placeholder="Facoltativo; evita dati sensibili"/></Field>
      <Field label="Note"><input name="notes" defaultValue={editing?.notes} placeholder="Es. pratica tramite patronato"/></Field>
      <div className="flex items-end gap-2"><button className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{editing?'Salva modifiche':'Aggiungi'}</button><button type="button" onClick={reset} className="h-10 rounded-xl border px-3 text-sm">Annulla</button></div>
    </form>}
    <div className="mt-5 grid gap-4 md:grid-cols-2">{s.publicBenefits.map(item=>{
      const last=[...item.payments].sort((a,b)=>b.date.localeCompare(a.date))[0]
      const received=item.payments.reduce((total,payment)=>total+payment.amount,0)
      const paymentOpen=paymentBenefitId===item.id||editingPayment?.benefitId===item.id
      const statusTone=item.status==='approvata'?'bg-green-100 text-green-700':item.status==='respinta'||item.status==='sospesa'?'bg-red-100 text-red-700':item.status==='terminata'?'bg-secondary text-muted-foreground':'bg-amber-100 text-amber-800'
      return <Card key={item.id}>
        <div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{item.authority}</span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusTone}`}>{PUBLIC_BENEFIT_STATUS_LABEL[item.status].toUpperCase()}</span></div><h3 className="mt-3 font-semibold">{item.name}</h3><p className="mt-1 text-xs text-muted-foreground">{PUBLIC_BENEFIT_CATEGORY_LABEL[item.category]}{item.beneficiary?` · ${item.beneficiary}`:''}</p></div><div className="flex gap-3"><EditButton onClick={()=>edit(item)} label="Modifica prestazione"/><button onClick={()=>removeBenefit(item)} aria-label="Elimina prestazione"><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div></div>
        <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-secondary/60 p-3"><p className="text-xs text-muted-foreground">Importo previsto</p><p className="mt-1 font-semibold">{item.amountMode==='fixed'?money.format(item.amount):'Da definire'}</p><p className="text-[10px] text-muted-foreground">{FREQ_LABEL[item.frequency]}</p></div><div className="rounded-xl bg-secondary/60 p-3"><p className="text-xs text-muted-foreground">Totale ricevuto</p><p className="mt-1 font-semibold text-green-700">{money.format(received)}</p><p className="text-[10px] text-muted-foreground">{item.payments.length} {item.payments.length===1?'pagamento':'pagamenti'}</p></div></div>
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2"><p><span className="text-muted-foreground">Periodo: </span>{item.startDate?dateFullIt(item.startDate):'non indicato'}{item.endDate?` → ${dateFullIt(item.endDate)}`:' → non definito'}</p><p><span className="text-muted-foreground">Prossimo accredito: </span>{item.nextPaymentDate?dateFullIt(item.nextPaymentDate):'non indicato'}</p></div>
        {item.officialUrl&&<a href={item.officialUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-semibold text-primary underline underline-offset-2">Controlla requisiti e regole sul sito {item.authority}</a>}
        {item.payments.length>0&&<div className="mt-4 divide-y border-t">{[...item.payments].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3).map(payment=>{const allocated=paymentAllocated(payment.id);return <div key={payment.id} className="flex items-center gap-2 py-2 text-xs"><span className="min-w-0 flex-1 text-muted-foreground">{dateFullIt(payment.date)}{payment.note?` · ${payment.note}`:''}<span className="block text-[10px]">Disponibile da assegnare: {money.format(Math.max(0,payment.amount-allocated))}</span></span><b className="text-green-700">+{money.format(payment.amount)}</b><EditButton onClick={()=>{setEditingPayment({benefitId:item.id,payment});setPaymentBenefitId(null)}} label="Modifica pagamento"/><button onClick={()=>removePayment(item.id,payment)} aria-label="Elimina pagamento"><Trash2 className="size-3.5 text-muted-foreground hover:text-destructive"/></button></div>})}</div>}
        {last&&item.payments.length>3&&<p className="mt-2 text-[10px] text-muted-foreground">Mostrati gli ultimi 3 pagamenti su {item.payments.length}.</p>}
        <div className="mt-3 flex gap-2"><button onClick={()=>{setEditingPayment(null);setPaymentBenefitId(item.id)}} className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Registra pagamento</button></div>
        {paymentOpen&&<form key={editingPayment?.payment.id??`new-public-payment-${item.id}`} onSubmit={submitPayment} className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2"><p className="col-span-full text-sm font-semibold">{editingPayment?'Modifica pagamento':'Pagamento realmente ricevuto'}</p><Field label="Data accredito"><input name="date" type="date" required defaultValue={editingPayment?.payment.date??today}/></Field><Field label="Importo ricevuto (€)"><input name="amount" type="number" min=".01" step=".01" required defaultValue={editingPayment?.payment.amount??(item.amountMode==='fixed'?item.amount:undefined)}/></Field><Field label="Conto di accredito"><select name="accountId" defaultValue={editingPayment?.payment.accountId??''}><option value="">Nessun conto collegato</option>{s.accounts.map(account=><option key={account.id} value={account.id}>{account.name}</option>)}</select></Field><Field label="Nota"><input name="note" defaultValue={editingPayment?.payment.note} placeholder="Es. mensilità, arretrati..."/></Field><p className="col-span-full text-xs text-muted-foreground">Salvando, verrà creata o aggiornata anche l’entrata corrispondente nei Movimenti.</p><div className="col-span-full flex gap-2"><button className="h-9 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Salva pagamento</button><button type="button" onClick={()=>{setPaymentBenefitId(null);setEditingPayment(null)}} className="h-9 rounded-xl border px-4 text-sm">Annulla</button></div></form>}
      </Card>
    })}{!s.publicBenefits.length&&<Card className="md:col-span-2"><p className="py-5 text-center text-sm text-muted-foreground">Nessuna prestazione pubblica registrata. Puoi iniziare anche da una domanda che stai soltanto valutando.</p></Card>}</div>
  </section>
}

// ── FINANZIAMENTI ──
function Financings({s,set,selfEmploymentEnabled,onOpenDeadlines}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;selfEmploymentEnabled:boolean;onOpenDeadlines:()=>void}) {
  const [showForm,setShowForm]=useState(false)
  const [editing,setEditing]=useState<Financing|null>(null)
  const [category,setCategory]=useState<FinancingCategory>('auto')
  const [freq,setFreq]=useState<Freq>('mensile')
  const [interestMode,setInterestMode]=useState<InterestMode>('payment')
  const [residualEntryMode,setResidualEntryMode]=useState<ResidualEntryMode>('automatic')
  const [showResidualAdvanced,setShowResidualAdvanced]=useState(false)
  const [originalAmount,setOriginalAmount]=useState(0)
  const [interestRate,setInterestRate]=useState(0)
  const [totalRepayable,setTotalRepayable]=useState(0)
  const [knownPayment,setKnownPayment]=useState(0)
  const [residualAmount,setResidualAmount]=useState<number|null>(null)
  const [installmentCount,setInstallmentCount]=useState(36)
  const [remainingInstallments,setRemainingInstallments]=useState(36)
  const [startDate,setStartDate]=useState('')
  const [nextPaymentDate,setNextPaymentDate]=useState('')
  const totalDueResidual=s.financings.reduce((total,item)=>total+financingInstallmentSchedule(item).reduce((sum,installment)=>sum+installment.amount,0),0)
  const principalResidual=s.financings.filter(item=>item.residualMode==='principal').reduce((total,item)=>total+Math.max(0,item.residualAmount),0)
  const monthly=s.financings.filter(item=>financingRemainingInstallments(item)>0).reduce((total,item)=>total+toMensile(item.paymentAmount,item.freq),0)
  const calculatedTotal=interestMode==='total'?totalRepayable:interestMode==='payment'?knownPayment*installmentCount:originalAmount
  const previewPayment=installmentAmount(originalAmount,interestMode,interestRate,calculatedTotal,installmentCount,freq,knownPayment)
  const previewStatus=financingStatusFromSchedule(startDate,freq,installmentCount,previewPayment)
  const residualMode:ResidualMode=residualEntryMode==='principal'?'principal':'total_due'
  const usesAutomaticResidual=residualEntryMode==='automatic'
  const previewResidual=roundCurrency(usesAutomaticResidual?previewStatus.residualAmount:Math.max(0,residualAmount??0))
  const previewRemaining=residualEntryMode==='principal'?remainingInstallments:usesAutomaticResidual?previewStatus.remaining:remainingInstallmentCount(previewResidual,previewPayment)
  const previewNextPayment=nextPaymentDate||previewStatus.nextDate||undefined
  const previewEndDate=installmentEndDate(startDate,freq,installmentCount)
  const previewFinancing:Financing={id:editing?.id??'preview',name:'Anteprima',category,kind:'personale',originalAmount,residualAmount:previewResidual,paymentAmount:previewPayment,freq,interestMode,interestRate,totalRepayable:calculatedTotal,installmentCount,startDate,endDate:previewEndDate,residualMode,residualEntryMode,remainingInstallments:previewRemaining,residualCalculatedFromSchedule:usesAutomaticResidual,nextPaymentDate:previewNextPayment,payments:editing?.payments??[]}
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
      residualEntryMode,
      remainingInstallments:previewRemaining,
      residualCalculatedFromSchedule:usesAutomaticResidual,
      nextPaymentDate:previewSchedule[0]?.date||previewNextPayment,
      payments:editing?.payments??[]
    }
    const originalAmountRequired=interestMode==='percentage'
    const manualResidualRequired=residualEntryMode!=='automatic'
    if(!financing.name||(originalAmountRequired&&financing.originalAmount<=0)||financing.paymentAmount<=0||!startDate||installmentCount<=0||(manualResidualRequired&&residualAmount===null)||(residualEntryMode==='principal'&&previewResidual>0&&remainingInstallments<=0))return
    set(x=>({...x,financings:editing?x.financings.map(item=>item.id===editing.id?financing:item):[financing,...x.financings]}))
    e.currentTarget.reset();resetForm()
  }
  const resetForm=()=>{setCategory('auto');setFreq('mensile');setInterestMode('payment');setResidualEntryMode('automatic');setShowResidualAdvanced(false);setOriginalAmount(0);setInterestRate(0);setTotalRepayable(0);setKnownPayment(0);setResidualAmount(null);setInstallmentCount(36);setRemainingInstallments(36);setStartDate('');setNextPaymentDate('');setEditing(null);setShowForm(false)}
  const edit=(item:Financing)=>{const entryMode=item.residualEntryMode??(item.residualMode==='principal'?'principal':item.residualCalculatedFromSchedule?'automatic':'total_due');setEditing(item);setCategory(item.category);setFreq(item.freq);setInterestMode(item.interestMode);setResidualEntryMode(entryMode);setShowResidualAdvanced(entryMode!=='automatic');setOriginalAmount(item.originalAmount);setInterestRate(item.interestRate);setTotalRepayable(item.totalRepayable);setKnownPayment(item.paymentAmount);setResidualAmount(entryMode==='automatic'?null:item.residualAmount);setInstallmentCount(item.installmentCount);setRemainingInstallments(financingRemainingInstallments(item));setStartDate(item.startDate);setNextPaymentDate(entryMode==='automatic'?'':item.nextPaymentDate??'');setShowForm(true)}
  const undoLastPayment=(item:Financing)=>{const payment=item.payments.at(-1);if(!payment||!window.confirm(`Annullare l’ultima rata registrata di ${money.format(payment.amount)}?`))return;set(value=>({...value,expenses:value.expenses.filter(expense=>expense.id!==payment.expenseId),financings:value.financings.map(financing=>financing.id===item.id?{...financing,residualAmount:roundCurrency(financing.residualAmount+payment.principalAmount),remainingInstallments:Math.min(financing.installmentCount,financing.remainingInstallments+1),nextPaymentDate:payment.dueDate,payments:financing.payments.filter(value=>value.id!==payment.id)}:financing)}))}
  return <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <Heading kicker="DEBITI E RATE" title="Finanziamenti e mutui" text="Piani rateali ordinati, con prossima rata e calendario automatico nelle Scadenze."/>
      <div className="flex flex-wrap gap-2"><button onClick={onOpenDeadlines} className="flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold hover:bg-secondary"><CalendarDays className="size-4"/>Calendario rate</button><button onClick={()=>{if(showForm)resetForm();else setShowForm(true)}} className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="size-4"/>Aggiungi finanziamento</button></div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Rate future da pagare" value={totalDueResidual} detail="Capitale, interessi e costi inclusi"/><Metric label="Capitale residuo dichiarato" value={principalResidual} detail="Usato nel patrimonio netto"/><Metric label="Impegno mensile" value={monthly}/><Card><p className="text-sm text-muted-foreground">Piani registrati</p><p className="mt-3 text-2xl font-semibold">{s.financings.length}</p><p className="mt-1 text-xs text-muted-foreground">Le rate alimentano automaticamente le Scadenze</p></Card></div>
    {showForm&&<form key={editing?.id??'new-financing'} onSubmit={submit} className="flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{editing?'Modifica piano':'Nuovo piano'}</p><h3 className="mt-1 text-lg font-semibold">{editing?editing.name:'Inserisci i dati del finanziamento'}</h3></div><button type="button" onClick={resetForm} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-secondary">Chiudi</button></div>
      <section className="rounded-xl border p-4"><h4 className="mb-4 font-semibold">1. Informazioni principali</h4><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Nome"><input name="name" required placeholder="Es. Auto, mutuo casa..." defaultValue={editing?.name}/></Field>
        <Field label="Categoria"><select value={category} onChange={e=>setCategory(e.target.value as FinancingCategory)}>{(Object.keys(FINANCING_LABEL) as FinancingCategory[]).map(key=><option key={key} value={key}>{FINANCING_LABEL[key]}</option>)}</select></Field>
        <Field label="Ambito"><select name="kind" defaultValue={editing?.kind??'personale'}><option value="personale">Personale</option>{(selfEmploymentEnabled||editing?.kind==='piva')&&<option value="piva">Lavoro autonomo</option>}</select></Field>
        <Field label="Conto di addebito"><select name="accountId" defaultValue={editing?.accountId??''}><option value="">Nessun conto</option>{s.accounts.map(account=><option key={account.id} value={account.id}>{account.name}</option>)}</select></Field>
      </div></section>
      <section className="rounded-xl border p-4"><h4 className="mb-1 font-semibold">2. Piano rateale</h4><p className="mb-4 text-sm text-muted-foreground">Per il calcolo rapido bastano durata, frequenza e data della prima rata.</p><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Numero totale di rate"><input type="number" min="1" max="1200" required value={installmentCount} onChange={e=>setInstallmentCount(Number(e.target.value))}/></Field>
        <Field label="Frequenza rate"><InstallmentFreqSelect value={freq} onChange={setFreq}/></Field>
        <Field label="Data della prima rata"><input type="date" required value={startDate} onChange={e=>setStartDate(e.target.value)}/></Field>
        <div className="flex items-end"><button type="button" onClick={()=>setShowResidualAdvanced(value=>!value)} className="h-10 w-full rounded-xl border px-3 text-left text-sm font-semibold hover:bg-secondary">{showResidualAdvanced?'Nascondi correzioni':'Correggi residuo o prossima rata'}</button></div>
        {showResidualAdvanced&&<div className="col-span-full grid gap-4 rounded-xl bg-secondary/50 p-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Come calcolo il debito residuo?"><select value={residualEntryMode} onChange={e=>{const value=e.target.value as ResidualEntryMode;setResidualEntryMode(value);setResidualAmount(value==='automatic'?null:residualAmount)}}><option value="automatic">Automaticamente dalle rate mancanti</option><option value="total_due">Inserisco il totale delle rate ancora da pagare</option><option value="principal">Inserisco il capitale residuo comunicato dall’istituto</option></select></Field>
          {residualEntryMode!=='automatic'&&<Field label={residualEntryMode==='principal'?'Capitale residuo comunicato (€)':'Totale delle rate ancora da pagare (€)'}><input name="residualAmount" type="number" min="0" step=".01" required value={residualAmount??''} onChange={e=>setResidualAmount(e.target.value===''?null:Number(e.target.value))}/></Field>}
          {residualEntryMode==='principal'&&<Field label="Rate ancora da pagare"><input type="number" min="0" max="1200" required value={remainingInstallments} onChange={e=>setRemainingInstallments(Number(e.target.value))}/></Field>}
          <Field label="Prossima rata (facoltativa)"><input type="date" value={nextPaymentDate} onChange={e=>setNextPaymentDate(e.target.value)}/></Field>
          <p className="col-span-full text-xs text-muted-foreground">Il totale delle rate future serve al flusso di cassa. Solo il capitale residuo comunicato dall’istituto viene sottratto nel patrimonio netto.</p>
        </div>}
      </div></section>
      <section className="rounded-xl border p-4"><h4 className="mb-1 font-semibold">3. Dati economici</h4><p className="mb-4 text-sm text-muted-foreground">Scegli soltanto il dato che conosci: il resto non è obbligatorio.</p><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Come vuoi inserire il piano?"><select value={interestMode} onChange={e=>setInterestMode(e.target.value as InterestMode)}><option value="payment">Conosco l’importo della rata</option><option value="total">Conosco il totale da restituire</option><option value="percentage">Conosco importo finanziato e tasso annuo</option></select></Field>
        {interestMode==='percentage'?<><Field label="Importo finanziato (€)"><input name="originalAmount" type="number" min=".01" step=".01" required value={originalAmount||''} onChange={e=>setOriginalAmount(Number(e.target.value))}/></Field><Field label="Tasso annuo %"><input type="number" min="0" step=".01" required value={interestRate||''} onChange={e=>setInterestRate(Number(e.target.value))} placeholder="Es. 6,50"/></Field></>:interestMode==='total'?<Field label="Totale da restituire (€)"><input type="number" min=".01" step=".01" required value={totalRepayable||''} onChange={e=>setTotalRepayable(Number(e.target.value))} placeholder="Capitale + interessi e costi"/></Field>:<Field label="Importo rata (€)"><input type="number" min=".01" step=".01" required value={knownPayment||''} onChange={e=>setKnownPayment(Number(e.target.value))} placeholder="Es. 225,40"/></Field>}
        {interestMode!=='percentage'&&<Field label="Importo finanziato (facoltativo)"><input name="originalAmount" type="number" min="0" step=".01" value={originalAmount||''} onChange={e=>setOriginalAmount(Number(e.target.value))} placeholder="Lascialo vuoto se non lo conosci"/></Field>}
      </div></section>
      {usesAutomaticResidual&&startDate&&previewPayment>0&&<div className="rounded-xl border border-primary/25 bg-primary/5 p-4"><p className="text-sm font-semibold text-primary">Calcolo automatico dalle date</p><p className="mt-1 text-sm text-muted-foreground">{previewStatus.paid} rate con data già trascorsa · {previewRemaining} ancora da pagare · {money.format(previewPayment)} × {previewRemaining} = <b className="text-foreground">{money.format(previewResidual)}</b>. È il totale dei pagamenti futuri, non il capitale residuo bancario.</p></div>}
      <div className="grid gap-3 rounded-xl bg-secondary/60 p-4 sm:grid-cols-2 xl:grid-cols-5"><div><p className="text-xs text-muted-foreground">Rata {interestMode==='payment'?'indicata':'calcolata'}</p><p className="mt-1 text-xl font-semibold">{money.format(previewPayment)}</p></div><div><p className="text-xs text-muted-foreground">Rate trascorse</p><p className="mt-1 text-xl font-semibold">{usesAutomaticResidual?previewStatus.paid:Math.max(0,installmentCount-previewRemaining)}</p></div><div><p className="text-xs text-muted-foreground">Rate mancanti</p><p className="mt-1 text-xl font-semibold text-primary">{previewRemaining}</p></div><div><p className="text-xs text-muted-foreground">{residualMode==='principal'?'Capitale residuo':'Rate future da pagare'}</p><p className="mt-1 text-xl font-semibold">{money.format(previewResidual)}</p></div><div><p className="text-xs text-muted-foreground">Ultima rata contrattuale</p><p className="mt-1 font-semibold">{previewEndDate?dateFullIt(previewEndDate):'Da calcolare'}</p></div></div>
      <div className="flex flex-wrap gap-3"><button className="h-10 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">{editing?'Salva modifiche':'Salva finanziamento'}</button><button type="button" onClick={resetForm} className="h-10 rounded-xl border px-5 text-sm">Annulla</button></div>
    </form>}
    <section><div className="mb-3"><h3 className="font-semibold">I tuoi piani rateali</h3><p className="text-sm text-muted-foreground">Una scheda pulita per ogni posizione; le singole rate sono visibili mese per mese in Scadenze.</p></div><div className="grid gap-4 xl:grid-cols-2">{s.financings.map(item=>{
      const plan=financingInstallmentSchedule(item)
      const displayedResidual=item.residualMode==='principal'?item.residualAmount:plan.reduce((total,installment)=>total+installment.amount,0)
      const progress=item.installmentCount>0?Math.min(100,Math.max(0,(item.installmentCount-plan.length)/item.installmentCount*100)):0
      const account=s.accounts.find(value=>value.id===item.accountId)
      return <Card key={item.id} className="overflow-hidden p-0">
        <div className="border-b p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">{FINANCING_LABEL[item.category]}</span><span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold">{item.kind==='piva'?'AUTONOMO':'PERSONALE'}</span></div><h3 className="mt-3 text-lg font-semibold">{item.name}</h3>{account&&<p className="mt-1 text-xs text-muted-foreground">Addebito su {account.name}</p>}</div><div className="flex gap-3"><EditButton onClick={()=>edit(item)} label="Modifica finanziamento"/><button onClick={()=>set(x=>({...x,financings:x.financings.filter(value=>value.id!==item.id)}))} aria-label="Elimina finanziamento"><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div></div>
          <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-secondary/70 p-3"><p className="text-xs text-muted-foreground">{item.residualMode==='principal'?'Capitale residuo comunicato':item.residualEntryMode==='automatic'?'Rate future stimate':'Rate future ancora da pagare'}</p><p className="mt-1 text-xl font-semibold">{money.format(displayedResidual)}</p></div><div className="rounded-xl bg-primary/10 p-3"><p className="text-xs text-primary">Rata {FREQ_LABEL[item.freq].toLowerCase()}</p><p className="mt-1 text-xl font-semibold text-primary">{money.format(item.paymentAmount)}</p></div></div>
        </div>
        <div className="p-5"><div className="flex items-end justify-between gap-3"><div><p className="text-xs text-muted-foreground">Avanzamento per numero di rate</p><p className="mt-1 text-sm font-semibold">{plan.length} rate mancanti su {item.installmentCount}</p></div><p className="text-sm font-semibold text-primary">{progress.toFixed(0)}%</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{width:`${progress}%`}}/></div>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Prima rata</p><p className="mt-1 font-semibold">{item.startDate?dateFullIt(item.startDate):'—'}</p></div><div><p className="text-xs text-muted-foreground">Prossima rata prevista</p><p className="mt-1 font-semibold text-primary">{plan[0]?.date?dateFullIt(plan[0].date):'Piano concluso'}</p></div><div><p className="text-xs text-muted-foreground">Ultima rata contrattuale</p><p className="mt-1 font-semibold">{item.endDate?dateFullIt(item.endDate):'—'}</p></div></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3"><p className="text-xs text-muted-foreground">{item.interestMode==='total'?`Totale da restituire ${money.format(item.totalRepayable)}`:item.interestMode==='payment'?`Rata inserita · Totale piano ${money.format(item.paymentAmount*item.installmentCount)}`:`Tasso annuo ${item.interestRate}% · Totale stimato ${money.format(item.totalRepayable)}`}{item.originalAmount>0?` · Importo finanziato ${money.format(item.originalAmount)}`:' · Importo finanziato non indicato'}{item.payments.length?` · ${item.payments.length} rate registrate`:''}</p>{item.payments.length>0&&<button onClick={()=>undoLastPayment(item)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Annulla ultima rata</button>}</div>
        </div>
      </Card>
    })}{!s.financings.length&&<Card className="xl:col-span-2"><p className="text-center text-sm text-muted-foreground">Nessun finanziamento inserito. Quando ne aggiungi uno, le rate compariranno anche nelle Scadenze.</p></Card>}</div></section>
  </div>
}

// ── ABBONAMENTI ──
function Subscriptions({s,set,onOpenMovements}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;onOpenMovements:()=>void}) {
  const today=new Date().toISOString().slice(0,10)
  const subscriptions=s.expenses.filter(item=>item.subscription||item.recurring)
  const active=subscriptions.filter(item=>(!item.subscription?.endDate||item.subscription.endDate>today)&&(!item.subscription?.startDate||item.subscription.startDate<=today))
  const upcoming=subscriptions.filter(item=>item.subscription?.startDate&&item.subscription.startDate>today)
  const ended=subscriptions.filter(item=>item.subscription?.endDate&&item.subscription.endDate<=today)
  const monthly=active.reduce((total,item)=>total+toMensile(item.amount,item.freq),0)
  const updateEnd=(id:string,endDate:string|null)=>set(value=>({...value,expenses:value.expenses.map(item=>item.id===id?{...item,recurring:true,subscription:{...item.subscription,endDate}}:item)}))
  const list=(items:Expense[],status:'active'|'upcoming'|'ended')=><div className="grid gap-3 md:grid-cols-2">{items.map(item=><Card key={item.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold">{item.description}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status==='active'?'bg-green-100 text-green-700':status==='upcoming'?'bg-amber-100 text-amber-700':'bg-secondary text-muted-foreground'}`}>{status==='active'?'ATTIVO':status==='upcoming'?'PROGRAMMATO':'CONCLUSO'}</span></div><p className="mt-1 text-xs text-muted-foreground">{item.category||'Senza categoria'} · {FREQ_LABEL[item.freq]}</p></div><b>{money.format(toMensile(item.amount,item.freq))}/mese</b></div><div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-secondary/60 p-3 text-xs"><div><p className="text-muted-foreground">Inizio</p><p className="mt-1 font-semibold">{item.subscription?.startDate?dateFullIt(item.subscription.startDate):'Non indicato'}</p></div><div><p className="text-muted-foreground">Fine</p><p className="mt-1 font-semibold">{item.subscription?.endDate?dateFullIt(item.subscription.endDate):'Non definita'}</p></div></div><div className="mt-3 flex flex-wrap gap-2">{status!=='ended'?<button onClick={()=>updateEnd(item.id,today)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Termina oggi</button>:<button onClick={()=>updateEnd(item.id,null)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Riattiva</button>}<button onClick={onOpenMovements} className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Modifica dati</button><button onClick={()=>set(value=>({...value,expenses:value.expenses.filter(expense=>expense.id!==item.id)}))} className="ml-auto rounded-lg px-2 py-1.5 text-xs text-destructive">Elimina</button></div></Card>)}{!items.length&&<Card className="md:col-span-2"><p className="text-center text-sm text-muted-foreground">Nessun abbonamento in questa sezione.</p></Card>}</div>
  return <div className="flex flex-col gap-6"><div className="flex flex-wrap items-end justify-between gap-4"><Heading kicker="COSTI RICORRENTI" title="Abbonamenti e spese fisse" text="Telefonia, streaming, utenze e altri costi che si ripetono nel tempo."/><button onClick={onOpenMovements} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="size-4"/>Nuovo costo ricorrente</button></div><div className="grid gap-4 sm:grid-cols-3"><Metric label="Costo mensile attivo" value={monthly}/><Metric label="Costo annuale stimato" value={monthly*12}/><Card><p className="text-sm text-muted-foreground">Costi ricorrenti attivi</p><p className="mt-3 text-2xl font-semibold">{active.length}</p><p className="mt-1 text-xs text-muted-foreground">{upcoming.length} programmati · {ended.length} conclusi</p></Card></div><section><h3 className="mb-3 font-semibold">Attivi</h3>{list(active,'active')}</section>{upcoming.length>0&&<section><h3 className="mb-3 font-semibold">Programmati</h3>{list(upcoming,'upcoming')}</section>}<section><h3 className="mb-3 font-semibold">Conclusi</h3>{list(ended,'ended')}</section></div>
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

// ── LAVORO AUTONOMO ──
function SelfEmployment({s,set,year,userId}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;year:number;userId:string}) {
  const today=new Date().toISOString().slice(0,10)
  const [showForm,setShowForm]=useState(false)
  const [editing,setEditing]=useState<Invoice|null>(null)
  const [uploading,setUploading]=useState(false)
  const [message,setMessage]=useState('')
  const [paymentDates,setPaymentDates]=useState<Record<string,string>>({})
  const t=totals(s,year),due=t.tax+t.contributions
  const invoices=s.invoices.filter(invoice=>new Date(`${invoice.issueDate}T12:00:00`).getFullYear()===year).sort((a,b)=>b.issueDate.localeCompare(a.issueDate))
  const issued=invoices.reduce((total,invoice)=>total+invoice.amount,0)
  const collected=invoices.filter(invoice=>invoice.paid).reduce((total,invoice)=>total+invoice.amount,0)
  const outstanding=invoices.filter(invoice=>!invoice.paid).reduce((total,invoice)=>total+invoice.amount,0)
  const overdue=invoices.filter(invoice=>!invoice.paid&&invoice.dueDate&&invoice.dueDate<today)
  const workMovements=[
    ...s.incomes.filter(item=>item.kind==='piva'&&item.incomeClass!=='benefit'&&item.date.startsWith(String(year))).map(item=>({id:`i-${item.id}`,date:item.date,label:item.description,amount:item.amount,type:'entrata' as const,invoiceId:item.invoiceId})),
    ...s.expenses.filter(item=>item.kind==='piva'&&item.date.startsWith(String(year))).map(item=>({id:`e-${item.id}`,date:item.date,label:item.description,amount:item.amount,type:'spesa' as const,invoiceId:undefined}))
  ].sort((a,b)=>b.date.localeCompare(a.date))
  const reset=()=>{setEditing(null);setShowForm(false);setMessage('')}
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();setMessage('')
    const formElement=event.currentTarget,form=new FormData(formElement),id=editing?.id??uid()
    const file=form.get('invoiceFile') as File|null
    let fileData={fileName:editing?.fileName,filePath:editing?.filePath,fileType:editing?.fileType}
    if(file&&file.size>0){
      if(file.size>10*1024*1024){setMessage('Il documento supera 10 MB.');return}
      const extension=file.name.split('.').pop()?.toLowerCase()
      if(!['pdf','xml','p7m','jpg','jpeg','png','webp'].includes(extension??'')){setMessage('Formato non supportato. Usa PDF, XML, P7M o un’immagine.');return}
      setUploading(true)
      const safeName=file.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'-')
      const filePath=`${userId}/${id}/${Date.now()}-${safeName}`
      const {error}=await sb.storage.from('invoices').upload(filePath,file,{contentType:file.type||undefined,upsert:false})
      if(error){setUploading(false);setMessage('Il documento non è stato caricato: l’archivio privato Supabase deve ancora essere attivato. Puoi salvare la fattura senza allegato.');return}
      if(editing?.filePath)await sb.storage.from('invoices').remove([editing.filePath])
      fileData={fileName:file.name,filePath,fileType:file.type||extension}
    }
    const invoice:Invoice={
      id,number:String(form.get('number')).trim(),issueDate:String(form.get('issueDate')),
      customer:String(form.get('customer')).trim(),amount:Number(form.get('amount')),
      dueDate:String(form.get('dueDate')||'')||undefined,notes:String(form.get('notes')||'').trim()||undefined,
      paid:editing?.paid??false,paidDate:editing?.paidDate,incomeId:editing?.incomeId,...fileData
    }
    if(!invoice.number||!invoice.customer||invoice.amount<=0){setUploading(false);return}
    set(value=>({...value,invoices:editing?value.invoices.map(item=>item.id===editing.id?invoice:item):[invoice,...value.invoices]}))
    setUploading(false);formElement.reset();reset()
  }
  const markPaid=(invoice:Invoice)=>{
    const paidDate=paymentDates[invoice.id]??today
    if(!/^\d{4}-\d{2}-\d{2}$/.test(paidDate))return
    const incomeId=invoice.incomeId??uid()
    set(value=>({...value,
      invoices:value.invoices.map(item=>item.id===invoice.id?{...item,paid:true,paidDate,incomeId}:item),
      incomes:[{id:incomeId,date:paidDate,description:`Fattura ${invoice.number} · ${invoice.customer}`,amount:invoice.amount,kind:'piva',recurring:false,freq:'unica',incomeClass:'cash',invoiceId:invoice.id},...value.incomes.filter(item=>item.id!==incomeId)]
    }))
  }
  const markUnpaid=(invoice:Invoice)=>{if(!window.confirm('Annullare l’incasso e rimuovere il movimento collegato?'))return;set(value=>({...value,invoices:value.invoices.map(item=>item.id===invoice.id?{...item,paid:false,paidDate:undefined,incomeId:undefined}:item),incomes:value.incomes.filter(item=>item.id!==invoice.incomeId)}))}
  const openDocument=async(invoice:Invoice)=>{if(!invoice.filePath)return;const {data,error}=await sb.storage.from('invoices').createSignedUrl(invoice.filePath,60);if(error||!data?.signedUrl){setMessage('Non riesco ad aprire il documento. Controlla l’archivio Supabase.');return}window.open(data.signedUrl,'_blank','noopener,noreferrer')}
  const removeInvoice=async(invoice:Invoice)=>{if(!window.confirm(`Eliminare la fattura ${invoice.number}? Verrà rimosso anche l’incasso collegato.`))return;if(invoice.filePath)await sb.storage.from('invoices').remove([invoice.filePath]);set(value=>({...value,invoices:value.invoices.filter(item=>item.id!==invoice.id),incomes:value.incomes.filter(item=>item.id!==invoice.incomeId)}))}
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><Heading kicker="LAVORO AUTONOMO" title="Fatture, incassi e fisco" text="Le fatture emesse restano separate dagli incassi: il fatturato di cassa cresce solo quando segni il pagamento."/><button onClick={()=>{if(showForm)reset();else{setEditing(null);setShowForm(true)}}} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="size-4"/>Nuova fattura</button></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Fatture emesse" value={issued} detail={`${invoices.length} documenti nel ${year}`}/><Metric label="Incassato" value={collected}/><Metric label="Da incassare" value={outstanding} detail={overdue.length?`${overdue.length} scadute`:'Nessuna fattura scaduta'} warn={overdue.length>0}/><Metric label="Fisco stimato" value={due} detail={`su incassi registrati: ${money.format(t.pivaIncome)}`}/></div>
      {showForm&&<form key={editing?.id??'new-invoice'} onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">{editing&&<p className="col-span-full rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">Modifica fattura {editing.number}</p>}<Field label="Numero fattura"><input name="number" required defaultValue={editing?.number} placeholder="Es. 12/2026"/></Field><Field label="Data emissione"><input name="issueDate" type="date" required defaultValue={editing?.issueDate??today}/></Field><Field label="Cliente"><input name="customer" required defaultValue={editing?.customer} placeholder="Nome o ragione sociale"/></Field><Field label="Importo (€)"><input name="amount" type="number" min=".01" step=".01" required defaultValue={editing?.amount}/></Field><Field label="Scadenza pagamento"><input name="dueDate" type="date" defaultValue={editing?.dueDate}/></Field><Field label="Documento (facoltativo)"><input name="invoiceFile" type="file" accept=".pdf,.xml,.p7m,image/jpeg,image/png,image/webp"/></Field><Field label="Note"><input name="notes" defaultValue={editing?.notes} placeholder="Facoltative"/></Field><div className="col-span-full flex flex-wrap items-center gap-3"><button type="submit" disabled={uploading} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50"><Upload className="size-4"/>{uploading?'Caricamento...':editing?'Salva modifiche':'Salva fattura'}</button><button type="button" onClick={reset} className="h-10 rounded-xl border px-5 text-sm">Annulla</button>{editing?.fileName&&<span className="text-xs text-muted-foreground">Allegato attuale: {editing.fileName}</span>}</div>{message&&<p className="col-span-full rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>}</form>}
      {!showForm&&message&&<p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>}
      <section><div className="mb-3"><h3 className="text-xl font-semibold">Registro fatture</h3><p className="text-sm text-muted-foreground">Segna la data d’incasso: verrà creato automaticamente il movimento di entrata.</p></div><div className="grid gap-4 md:grid-cols-2">{invoices.map(invoice=><Card key={invoice.id} className={invoice.dueDate&&!invoice.paid&&invoice.dueDate<today?'border-destructive/40':''}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${invoice.paid?'bg-green-100 text-green-700':'bg-amber-100 text-amber-800'}`}>{invoice.paid?'INCASSATA':'DA INCASSARE'}</span>{invoice.dueDate&&!invoice.paid&&invoice.dueDate<today&&<span className="rounded-full bg-destructive/10 px-2 py-1 text-[10px] font-semibold text-destructive">SCADUTA</span>}</div><h3 className="mt-3 truncate font-semibold">Fattura {invoice.number} · {invoice.customer}</h3><p className="mt-1 text-xs text-muted-foreground">Emessa {dateFullIt(invoice.issueDate)}{invoice.dueDate?` · scade ${dateFullIt(invoice.dueDate)}`:''}</p></div><div className="flex gap-3"><EditButton onClick={()=>{setEditing(invoice);setShowForm(true);setMessage('')}} label="Modifica fattura"/><button onClick={()=>void removeInvoice(invoice)} aria-label="Elimina fattura"><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div></div><p className="mt-4 text-2xl font-semibold">{money.format(invoice.amount)}</p>{invoice.notes&&<p className="mt-2 text-sm text-muted-foreground">{invoice.notes}</p>}<div className="mt-4 flex flex-wrap items-end gap-2 border-t pt-3">{invoice.filePath&&<button onClick={()=>void openDocument(invoice)} className="inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold"><FileText className="size-4"/>Apri {invoice.fileName??'documento'}</button>}{invoice.paid?<><div className="mr-auto text-xs text-muted-foreground">Incassata il {invoice.paidDate?dateFullIt(invoice.paidDate):'—'}</div><button onClick={()=>markUnpaid(invoice)} className="h-9 rounded-xl border px-3 text-xs font-semibold">Annulla incasso</button></>:<><Field label="Data incasso"><input type="date" value={paymentDates[invoice.id]??today} onChange={event=>setPaymentDates(value=>({...value,[invoice.id]:event.target.value}))}/></Field><button onClick={()=>markPaid(invoice)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground"><CheckCircle2 className="size-4"/>Segna incassata</button></>}</div></Card>)}{!invoices.length&&<Card className="md:col-span-2"><div className="py-7 text-center"><ReceiptText className="mx-auto size-9 text-muted-foreground/50"/><p className="mt-3 font-semibold">Nessuna fattura nel {year}</p><p className="mt-1 text-sm text-muted-foreground">Aggiungi il documento e conferma l’incasso quando arriva.</p></div></Card>}</div></section>
      <Card><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">Movimenti del lavoro autonomo</h3><p className="mt-1 text-sm text-muted-foreground">Incassi da fatture, altre entrate e costi professionali nello stesso posto.</p></div><BriefcaseBusiness className="size-5 text-primary"/></div><div className="mt-4 divide-y">{workMovements.slice(0,12).map(item=><div key={item.id} className="flex items-center gap-3 py-3"><div className={`grid size-8 place-items-center rounded-lg ${item.type==='entrata'?'bg-green-100 text-green-700':'bg-destructive/10 text-destructive'}`}>{item.type==='entrata'?<ArrowDownLeft className="size-4"/>:<FileUp className="size-4"/>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.label}</p><p className="text-xs text-muted-foreground">{dateFullIt(item.date)}{item.invoiceId?' · da fattura':''}</p></div><b className={item.type==='entrata'?'text-green-700':'text-destructive'}>{item.type==='entrata'?'+':'-'}{money.format(item.amount)}</b></div>)}{!workMovements.length&&<p className="py-5 text-sm text-muted-foreground">Nessun movimento professionale nel {year}.</p>}</div></Card>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]"><Card className="bg-primary text-primary-foreground"><p className="opacity-70">Totale fiscale stimato {year}</p><p className="mt-3 text-4xl font-semibold">{money.format(due)}</p><p className="mt-4">Accantonato {money.format(t.reserve)} · {t.reserve>=due?'Copertura completa':`Mancano ${money.format(due-t.reserve)}`}</p></Card><Card><h3 className="mb-3 font-semibold">Stima fiscale sugli incassi</h3><div className="grid grid-cols-3 gap-2 text-sm"><div><p className="text-xs text-muted-foreground">Imponibile</p><b>{money.format(t.taxable)}</b></div><div><p className="text-xs text-muted-foreground">Contributi</p><b>{money.format(t.contributions)}</b></div><div><p className="text-xs text-muted-foreground">Imposta</p><b>{money.format(t.tax)}</b></div></div></Card></div>
    </div>
  )
}

// ── SCADENZE ──
function Deadlines({s,set,financingsEnabled}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;financingsEnabled:boolean}) {
  const today=new Date().toISOString().slice(0,10)
  const [selectedMonth,setSelectedMonth]=useState(today.slice(0,7))
  const [showForm,setShowForm]=useState(false)
  const [freq,setFreq]=useState<Freq>('unica')
  const [editing,setEditing]=useState<Deadline|null>(null)
  const monthDate=new Date(`${selectedMonth}-01T12:00:00`)
  const monthLabel=new Intl.DateTimeFormat('it-IT',{month:'long',year:'numeric'}).format(monthDate)
  const shiftMonth=(amount:number)=>{const next=new Date(monthDate);next.setMonth(next.getMonth()+amount);setSelectedMonth(`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}`)}
  const manualDeadlines=s.deadlines.filter(item=>item.date.startsWith(selectedMonth)).sort((a,b)=>a.date.localeCompare(b.date))
  const financingDeadlines=(financingsEnabled?s.financings:[]).flatMap(financing=>financingInstallmentSchedule(financing).filter(installment=>installment.date.startsWith(selectedMonth)).map(installment=>({financing,installment}))).sort((a,b)=>a.installment.date.localeCompare(b.installment.date))
  const monthItems=[...manualDeadlines.map(deadline=>({type:'manual' as const,date:deadline.date,deadline})),...financingDeadlines.map(item=>({type:'financing' as const,date:item.installment.date,...item}))].sort((a,b)=>a.date.localeCompare(b.date))
  const monthTotal=manualDeadlines.filter(item=>!item.paid).reduce((total,item)=>total+item.amount,0)+financingDeadlines.reduce((total,item)=>total+item.installment.amount,0)
  const futureInstallments=(financingsEnabled?s.financings:[]).reduce((total,financing)=>total+financingInstallmentSchedule(financing).length,0)
  const payInstallment=(financing:Financing,installment:{date:string;amount:number})=>{
    if(!window.confirm(`Registrare come pagata la rata di ${money.format(installment.amount)} di “${financing.name}”?`))return
    const paidDate=new Date().toISOString().slice(0,10),expenseId=uid(),principalAmount=financingPrincipalReduction(financing,installment.amount)
    set(value=>({...value,
      expenses:[{id:expenseId,date:paidDate,description:`Rata ${financing.name}`,amount:installment.amount,kind:financing.kind,accountId:financing.accountId,recurring:false,freq:'unica',category:'Finanziamenti'},...value.expenses],
      financings:value.financings.map(item=>item.id===financing.id?{...item,residualAmount:roundCurrency(Math.max(0,item.residualAmount-principalAmount)),remainingInstallments:Math.max(0,item.remainingInstallments-1),residualEntryMode:item.residualMode==='principal'?'principal':'total_due',residualCalculatedFromSchedule:false,nextPaymentDate:nextInstallmentAfter(installment.date,item.freq),payments:[...item.payments,{id:uid(),dueDate:installment.date,paidDate,amount:installment.amount,principalAmount,expenseId}]}:item)
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
      <div className="flex flex-wrap items-end justify-between gap-4"><Heading kicker="CALENDARIO" title="Scadenze mensili" text={financingsEnabled?'Scadenze manuali e rate dei finanziamenti, riunite automaticamente mese per mese.':'Pagamenti e promemoria manuali, organizzati mese per mese.'}/><button onClick={()=>{setEditing(null);setFreq('unica');setShowForm(v=>!v)}} className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="size-4"/>Aggiungi scadenza</button></div>
      <Card><div className="flex flex-wrap items-center justify-between gap-4"><button onClick={()=>shiftMonth(-1)} className="grid size-10 place-items-center rounded-xl border hover:bg-secondary" aria-label="Mese precedente"><ChevronLeft className="size-4"/></button><div className="text-center"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Mese visualizzato</p><h3 className="mt-1 text-xl font-semibold capitalize">{monthLabel}</h3>{selectedMonth!==today.slice(0,7)&&<button onClick={()=>setSelectedMonth(today.slice(0,7))} className="mt-1 text-xs font-medium text-primary">Torna al mese corrente</button>}</div><button onClick={()=>shiftMonth(1)} className="grid size-10 place-items-center rounded-xl border hover:bg-secondary" aria-label="Mese successivo"><ChevronRight className="size-4"/></button></div></Card>
      <div className={`grid gap-4 ${financingsEnabled?'sm:grid-cols-3':''}`}><Metric label={`Totale programmato · ${monthLabel}`} value={monthTotal}/>{financingsEnabled&&<><Card><p className="text-sm text-muted-foreground">Rate automatiche nel mese</p><p className="mt-3 text-2xl font-semibold">{financingDeadlines.length}</p><p className="mt-1 text-xs text-muted-foreground">Generate dai finanziamenti</p></Card><Card><p className="text-sm text-muted-foreground">Rate future complessive</p><p className="mt-3 text-2xl font-semibold">{futureInstallments}</p><p className="mt-1 text-xs text-muted-foreground">Distribuite nei prossimi mesi</p></Card></>}</div>
      {showForm&&<form key={editing?.id??'new-deadline'} onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">{editing&&<p className="col-span-full rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">Modifica “{editing.title}”</p>}<Field label="Descrizione"><input name="title" required placeholder="Es. Assicurazione auto" defaultValue={editing?.title}/></Field><Field label="Data"><input name="date" type="date" required defaultValue={editing?.date}/></Field><Field label="Importo (€)"><input name="amount" type="number" step=".01" required defaultValue={editing?.amount}/></Field><Field label="Priorità"><select name="priority" defaultValue={editing?.priority??'alta'}><option value="alta">Alta</option><option value="media">Media</option><option value="bassa">Bassa</option></select></Field><Field label="Frequenza"><FreqSelect value={freq} onChange={setFreq}/></Field><div className="col-span-full flex gap-3"><button type="submit" className="h-10 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">{editing?'Salva modifiche':'Aggiungi'}</button><button type="button" onClick={()=>{setShowForm(false);setEditing(null)}} className="h-10 rounded-xl border px-5 text-sm">Annulla</button></div></form>}
      <section><div className="mb-3"><h3 className="font-semibold capitalize">Pagamenti di {monthLabel}</h3><p className="text-sm text-muted-foreground">{financingsEnabled?'Vedi solo il mese selezionato. Le rate con etichetta “Automatica” arrivano direttamente dai finanziamenti.':'Vedi solo il mese selezionato e aggiungi qui i tuoi promemoria di pagamento.'}</p></div><div className="flex flex-col gap-3">{monthItems.map(item=>{
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
function Previsioni({s,set,selfEmploymentEnabled}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;selfEmploymentEnabled:boolean}) {
  const today=new Date().toISOString().slice(0,10)
  const [data,setData]=useState(today)
  const [simType,setSimType]=useState<SimulationType>('mutuo')
  const [freq,setFreq]=useState<Freq>('mensile')
  const [simInterestMode,setSimInterestMode]=useState<InterestMode>('payment')
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
    const amountRequired=!isLoan||simInterestMode==='percentage'
    if(!simulation.name||(amountRequired&&simulation.amount<=0)||(isLoan&&(!simStartDate||simInstallmentCount<=0||simPreviewPayment<=0))||(simAmount>0&&simDownPayment>simAmount))return
    set(value=>({...value,simulations:editing?value.simulations.map(item=>item.id===editing.id?simulation:item):[simulation,...value.simulations]}));setSelectedId(simulation.id)
    e.currentTarget.reset();resetSimulationForm()
  }
  const resetSimulationForm=()=>{setEditing(null);setSimType('mutuo');setFreq('mensile');setSimInterestMode('payment');setSimAmount(0);setSimDownPayment(0);setSimInterestRate(0);setSimTotalRepayable(0);setSimKnownPayment(0);setSimInstallmentCount(36);setSimStartDate('')}
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
      <Field label="Ambito"><select name="kind" defaultValue={editing?.kind??'personale'}><option value="personale">Personale</option>{(selfEmploymentEnabled||editing?.kind==='piva')&&<option value="piva">Lavoro autonomo</option>}</select></Field>
      <Field label={isLoan?(simInterestMode==='percentage'?'Importo da finanziare (€)':'Costo del bene/progetto (facoltativo)'):'Importo (€)'}><input type="number" min={isLoan&&simInterestMode!=='percentage'?'0':'.01'} step=".01" required={!isLoan||simInterestMode==='percentage'} value={simAmount||''} onChange={e=>setSimAmount(Number(e.target.value))} placeholder={isLoan&&simInterestMode!=='percentage'?'Puoi lasciarlo vuoto':''}/></Field>
      {isLoan?<>
        <Field label="Anticipo (€)"><input type="number" min="0" step=".01" value={simDownPayment||''} onChange={e=>setSimDownPayment(Number(e.target.value))}/></Field>
        <Field label="Frequenza rate"><InstallmentFreqSelect value={freq} onChange={setFreq}/></Field>
        <Field label="Come vuoi inserire il piano?"><select value={simInterestMode} onChange={e=>setSimInterestMode(e.target.value as InterestMode)}><option value="payment">Conosco l’importo della rata</option><option value="total">Conosco il totale da restituire</option><option value="percentage">Conosco importo finanziato e tasso annuo</option></select></Field>
        {simInterestMode==='percentage'?<Field label="Tasso annuo %"><input type="number" min="0" step=".01" required value={simInterestRate||''} onChange={e=>setSimInterestRate(Number(e.target.value))}/></Field>:simInterestMode==='total'?<Field label="Totale da restituire (€)"><input type="number" min=".01" step=".01" required value={simTotalRepayable||''} onChange={e=>setSimTotalRepayable(Number(e.target.value))} placeholder="Capitale + interessi e costi"/></Field>:<Field label="Importo rata (€)"><input type="number" min=".01" step=".01" required value={simKnownPayment||''} onChange={e=>setSimKnownPayment(Number(e.target.value))} placeholder="Es. 225,40"/></Field>}
        <Field label="Numero totale di rate"><input type="number" min="1" max="1200" required value={simInstallmentCount} onChange={e=>setSimInstallmentCount(Number(e.target.value))}/></Field>
        <Field label="Data della prima rata"><input type="date" required value={simStartDate} onChange={e=>setSimStartDate(e.target.value)}/></Field>
        <div className="col-span-full grid gap-3 rounded-xl bg-secondary/60 p-4 sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Rata {simInterestMode==='payment'?'indicata':'stimata'}</p><p className="font-semibold">{money.format(simPreviewPayment)}</p></div><div><p className="text-xs text-muted-foreground">Totale rate</p><p className="font-semibold">{money.format(simPreviewPayment*simInstallmentCount)}</p></div><div><p className="text-xs text-muted-foreground">Data ultima rata</p><p className="font-semibold">{simPreviewEnd?dateFullIt(simPreviewEnd):'Da calcolare'}</p></div><div><p className="text-xs text-muted-foreground">Rate mancanti a oggi</p><p className="font-semibold">{simPreviewProgress?.remaining??0} di {simInstallmentCount||0}</p></div></div>
      </>:<><Field label="Frequenza"><FreqSelect value={freq} onChange={setFreq}/></Field><Field label="Data inizio (facoltativa)"><input type="date" value={simStartDate} onChange={e=>setSimStartDate(e.target.value)}/></Field></>}
      <button className="self-end h-10 rounded-xl bg-primary px-5 font-semibold text-primary-foreground md:col-span-1">{editing?<Pencil className="mr-2 inline size-4"/>:<Plus className="mr-2 inline size-4"/>}{editing?'Salva modifiche':'Salva scenario'}</button>
    </form>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Margine mensile attuale" value={baseMonthly} warn={baseMonthly<0}/><Metric label="Impatto scenario/mese" value={monthlyImpact}/><Metric label={projectedMonthly>=0?'Residuo mensile':'Mancanza mensile'} value={Math.abs(projectedMonthly)} warn={projectedMonthly<0}/><Metric label="Liquidità dopo anticipo" value={projectedLiquidity} warn={projectedLiquidity<0}/></div>
    {selected&&<Card className={projectedMonthly<0||projectedLiquidity<0?'border-destructive/40 bg-destructive/5':'border-green-500/30 bg-green-50/50 dark:bg-green-950/20'}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{SIMULATION_LABEL[selected.type]}</p><h3 className="mt-1 text-xl font-semibold">{selected.name}</h3><p className="mt-2 text-sm text-muted-foreground">{selected.amount>0?`Importo ${money.format(selected.amount)}`:'Importo non indicato'}{selected.downPayment>0?` · Anticipo ${money.format(selected.downPayment)}`:''}{scenarioPayment>0?` · Rata ${selected.interestMode==='payment'?'indicata':'stimata'} ${money.format(scenarioPayment)} ${FREQ_LABEL[selected.freq].toLowerCase()}`:''}</p></div><div className={`rounded-xl px-4 py-2 text-sm font-semibold ${projectedMonthly>=0&&projectedLiquidity>=0?'bg-green-600 text-white':'bg-destructive text-destructive-foreground'}`}>{projectedMonthly>=0&&projectedLiquidity>=0?'Sostenibile con i dati inseriti':`Mancano ${money.format(Math.max(0,-projectedMonthly))}/mese`}</div></div>{selectedPlan&&<div className="mt-4 grid gap-3 rounded-xl bg-background/70 p-4 sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Prima rata</p><p className="font-semibold">{selected.startDate?dateFullIt(selected.startDate):'—'}</p></div><div><p className="text-xs text-muted-foreground">Ultima rata</p><p className="font-semibold">{selectedPlan.endDate?dateFullIt(selectedPlan.endDate):'—'}</p></div><div><p className="text-xs text-muted-foreground">Rate trascorse</p><p className="font-semibold">{selectedPlan.paid}</p></div><div><p className="text-xs text-muted-foreground">Rate mancanti</p><p className="font-semibold text-primary">{selectedPlan.remaining} di {selected.installmentCount}</p></div></div>}<p className="mt-4 text-xs text-muted-foreground">{selected.type==='mutuo'||selected.type==='finanziamento'?(selected.interestMode==='total'?`Calcolo sul totale da restituire di ${money.format(selected.totalRepayable)}.`:selected.interestMode==='payment'?`Calcolo sulla rata indicata di ${money.format(selected.paymentAmount)} per ${selected.installmentCount} rate.`:`Calcolo con tasso annuo del ${selected.interestRate}%. `):''} Stima indicativa: non include spese bancarie, assicurazioni, variazioni dei tassi o costi non registrati.</p></Card>}
    {expiredSubscriptions.length>0&&<Card><h3 className="font-semibold">Abbonamenti conclusi entro la data scelta</h3><p className="mt-1 text-sm text-muted-foreground">Liberano {money.format(releasedMonthly)} al mese.</p><div className="mt-3">{expiredSubscriptions.map(item=><div key={item.id} className="flex justify-between border-t py-2 text-sm"><span>{item.description}</span><span className="text-green-600">+{money.format(toMensile(item.amount,item.freq))}/mese</span></div>)}</div></Card>}
    <section><h3 className="mb-3 font-semibold">Scenari salvati</h3><div className="grid gap-3 md:grid-cols-2">{s.simulations.map(item=><Card key={item.id} className={item.id===selectedId?'border-primary':''}><div className="flex items-start justify-between gap-3"><button onClick={()=>setSelectedId(item.id)} className="min-w-0 flex-1 text-left"><p className="text-xs font-semibold text-primary">{SIMULATION_LABEL[item.type]}</p><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.amount>0?money.format(item.amount):'Importo non indicato'} · {item.kind==='piva'?'Lavoro autonomo':'Personale'}</p></button><EditButton onClick={()=>editSimulation(item)} label="Modifica scenario"/><button onClick={()=>set(value=>({...value,simulations:value.simulations.filter(scenario=>scenario.id!==item.id)}))} aria-label="Elimina scenario"><Trash2 className="size-4 text-muted-foreground hover:text-destructive"/></button></div></Card>)}{!s.simulations.length&&<Card className="md:col-span-2"><p className="text-center text-sm text-muted-foreground">Salva il primo scenario per iniziare il confronto.</p></Card>}</div></section>
  </div>
}

type ManagedUser={id:string;email:string;createdAt:string;lastSignInAt:string|null;confirmedAt:string|null}

function AccountAccess({user}:{user:any}){
  const [users,setUsers]=useState<ManagedUser[]>([])
  const [inviteEmail,setInviteEmail]=useState('')
  const [loading,setLoading]=useState(false)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')
  const adminEmails=(process.env.NEXT_PUBLIC_ADMIN_EMAILS??process.env.NEXT_PUBLIC_ADMIN_EMAIL??'').split(',').map(email=>email.trim().toLowerCase()).filter(Boolean)
  const isAdmin=Boolean(user.email&&adminEmails.includes(user.email.toLowerCase()))
  const authorizedFetch=async(input:string,init?:RequestInit)=>{const{data:{session}}=await sb.auth.getSession();if(!session?.access_token)throw new Error('Sessione scaduta.');return fetch(input,{...init,headers:{...init?.headers,Authorization:`Bearer ${session.access_token}`}})}
  const loadUsers=useCallback(async()=>{if(!isAdmin)return;setLoading(true);setError('');try{const response=await authorizedFetch('/api/admin/users');const data=await response.json();if(!response.ok)throw new Error(data.error??'Impossibile caricare gli utenti.');setUsers(data.users??[])}catch(fetchError){setError(fetchError instanceof Error?fetchError.message:'Errore di connessione.')}finally{setLoading(false)}},[isAdmin])
  useEffect(()=>{void loadUsers()},[loadUsers])
  const sendReset=async()=>{setMessage('');setError('');const{error:resetError}=await sb.auth.resetPasswordForEmail(user.email,{redirectTo:`${window.location.origin}/auth/update-password`});if(resetError)setError(resetError.message);else setMessage('Email per cambiare password inviata.')}
  const invite=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(!inviteEmail)return;setLoading(true);setMessage('');setError('');try{const response=await authorizedFetch('/api/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:inviteEmail})});const data=await response.json();if(!response.ok)throw new Error(data.error??'Invito non inviato.');setInviteEmail('');setMessage(`Invito inviato a ${data.user.email}.`);await loadUsers()}catch(inviteError){setError(inviteError instanceof Error?inviteError.message:'Errore di connessione.')}finally{setLoading(false)}}
  return <><Card><div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-5"/></div><div className="flex-1"><h3 className="font-semibold">Sicurezza dell’account</h3><p className="mt-1 text-sm text-muted-foreground">Accesso attuale: {user.email}</p><button onClick={()=>void sendReset()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold hover:bg-secondary"><KeyRound className="size-4"/>Cambia password via email</button></div></div>{message&&<p className="mt-4 rounded-xl bg-primary/10 p-3 text-sm text-primary">{message}</p>}{error&&<p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}</Card>{isAdmin&&<Card><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">Gestione accessi</h3><p className="mt-1 text-sm text-muted-foreground">Solo gli indirizzi invitati possono creare un ambiente personale.</p></div><Users className="size-5 text-primary"/></div><form onSubmit={invite} className="mt-4 flex flex-col gap-2 sm:flex-row"><input type="email" required value={inviteEmail} onChange={event=>setInviteEmail(event.target.value)} placeholder="email@esempio.it" className="h-10 flex-1 rounded-xl border bg-background px-3 text-sm"/><button disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Mail className="size-4"/>Invita utente</button></form><div className="mt-5 divide-y"><div className="grid grid-cols-[1fr_auto] gap-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"><span>Utente</span><span>Stato</span></div>{users.map(account=><div key={account.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{account.email}</p><p className="text-xs text-muted-foreground">{account.lastSignInAt?`Ultimo accesso ${new Intl.DateTimeFormat('it-IT',{dateStyle:'medium'}).format(new Date(account.lastSignInAt))}`:'Mai entrato'}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${account.confirmedAt?'bg-green-100 text-green-700':'bg-amber-100 text-amber-800'}`}>{account.confirmedAt?'ATTIVO':'INVITATO'}</span></div>)}{loading&&!users.length&&<p className="py-4 text-sm text-muted-foreground">Caricamento utenti...</p>}</div></Card>}</>
}

// ── SETUP ──
function Setup({s,set,onSave,saveMsg,saving,logout,user}:{s:BudgetState;set:React.Dispatch<React.SetStateAction<BudgetState>>;onSave:()=>void;saveMsg:string;saving:boolean;logout:()=>void;user:any}) {
  const update=(k:keyof BudgetState['profile'],v:string)=>set(x=>({...x,profile:{...x.profile,[k]:k==='name'||k==='ateco'?v:Number(v)}}))
  const [newCat,setNewCat]=useState('')
  const [editingCategoryId,setEditingCategoryId]=useState<string|null>(null)
  const [categoryDraft,setCategoryDraft]=useState('')
  const saveCategoryName=(id:string)=>{const next=categoryDraft.trim();if(!next)return;set(value=>{const current=value.categories.find(item=>item.id===id);if(!current)return value;return{...value,categories:value.categories.map(item=>item.id===id?{...item,name:next}:item),expenses:value.expenses.map(item=>item.category===current.name?{...item,category:next}:item)}});setEditingCategoryId(null);setCategoryDraft('')}
  const moduleDataCount=(id:AppModule)=>({
    financings:s.financings.length,
    investments:s.assets.filter(item=>item.type!=='assicurativo').length,
    insurance:s.assets.filter(item=>item.type==='assicurativo').length,
    simulations:s.simulations.length,
    goals:s.goals.length,
    selfEmployment:s.invoices.length+s.incomes.filter(item=>item.kind==='piva').length+s.expenses.filter(item=>item.kind==='piva').length,
    benefits:s.benefits.length+s.publicBenefits.length,
    advisor:0
  })[id]
  const toggleModule=(id:AppModule)=>{
    const active=s.preferences.modules[id],count=moduleDataCount(id)
    if(active&&count>0&&!window.confirm(`Nascondere questo modulo? ${count} elementi resteranno salvati e ricompariranno quando lo riattivi.`))return
    set(value=>({...value,preferences:{...value.preferences,modules:{...value.preferences.modules,[id]:!active}}}))
  }
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Heading kicker="CONFIGURAZIONE" title="Impostazioni" text="Decidi quali strumenti usare e come deve apparire il tuo Bilancio."/>
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">PERSONALIZZA L’APP</p><h3 className="mt-2 text-xl font-semibold">Attiva soltanto ciò che ti serve</h3><p className="mt-1 text-sm text-muted-foreground">Nascondere un modulo non elimina mai i dati già inseriti e non modifica lo storico.</p></div><button onClick={()=>set(value=>({...value,preferences:{...value.preferences,onboardingCompleted:false}}))} className="h-10 shrink-0 rounded-xl border px-3 text-xs font-semibold hover:bg-secondary">Ripeti configurazione guidata</button></div>
        <div className="mt-5 rounded-2xl bg-secondary/60 p-4"><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">SEMPRE ATTIVI</p><div className="mt-3 flex flex-wrap gap-2">{CORE_FEATURES.map(item=><span key={item} className="rounded-full border bg-card px-3 py-1.5 text-xs font-semibold"><CheckCircle2 className="mr-1.5 inline size-3.5 text-primary"/>{item}</span>)}</div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">{MODULE_CATALOG.map(({id,label,description,icon:Icon})=>{const active=s.preferences.modules[id],count=moduleDataCount(id);return <div key={id} className={`rounded-2xl border p-4 transition-colors ${active?'border-primary/40 bg-primary/5':'bg-background'}`}><div className="flex items-start gap-3"><div className={`grid size-10 shrink-0 place-items-center rounded-xl ${active?'bg-primary text-primary-foreground':'bg-secondary text-primary'}`}><Icon className="size-4"/></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{label}</p><p className="mt-1 text-xs leading-snug text-muted-foreground">{description}</p></div><button type="button" role="switch" aria-checked={active} aria-label={`${active?'Disattiva':'Attiva'} ${label}`} onClick={()=>toggleModule(id)} className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${active?'bg-primary':'bg-border'}`}><span className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition-all ${active?'left-6':'left-1'}`}/></button></div>{count>0&&<p className="mt-2 text-[11px] font-semibold text-primary">{count} {count===1?'elemento salvato':'elementi salvati'}</p>}</div></div></div>})}</div>
      </Card>
      <AccountAccess user={user}/>
      {s.preferences.modules.selfEmployment&&<Card>
        <h3 className="font-semibold mb-4">Profilo fiscale del lavoro autonomo</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {([['name','Nome',true],['ateco','Codice ATECO',true],['profitability','Redditività %',false],['substituteTax','Imposta %',false],['contributions','Contributi %',false],['taxReserve','Accantonamento %',false]] as const).map(([k,l,isText])=>(
            <Field key={k} label={l}><input type={isText?'text':'number'} value={s.profile[k]} onChange={e=>update(k,e.target.value)}/></Field>
          ))}
        </div>
      </Card>}
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
        <div className="grid gap-2 sm:grid-cols-2">{([['forecast','Previsioni 30/60/90 giorni'],['alerts','Avvisi e prossime scadenze'],['goals','Obiettivi di risparmio'],['subscriptions','Abbonamenti senza scadenza'],['charts','Grafici e indicatori']] as const).filter(([key])=>key!=='goals'||s.preferences.modules.goals).map(([key,label])=><label key={key} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm"><span>{label}</span><input type="checkbox" checked={s.dashboard[key]} onChange={event=>set(value=>({...value,dashboard:{...value.dashboard,[key]:event.target.checked}}))}/></label>)}</div>
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
