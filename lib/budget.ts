export type Kind = 'personale' | 'piva'
export type Freq = 'settimanale' | 'mensile' | 'bimestrale' | 'trimestrale' | 'semestrale' | 'annuale' | 'unica'
export type AccountType = 'conto' | 'carta' | 'fido' | 'contanti' | 'piva'

export type Income = {
  id: string; date: string; description: string; amount: number
  kind: Kind; accountId?: string; recurring?: boolean; freq?: Freq
  incomeClass?: 'cash' | 'benefit'
  benefitId?: string
  benefitTransactionId?: string
  publicBenefitId?: string
  publicBenefitPaymentId?: string
  invoiceId?: string
}
export type Expense = Income & {
  category: string
  freq: Freq
  benefitAmount?: number
  cashWithdrawalId?: string
  publicBenefitSourcePaymentId?: string
  subscription?: {
    startDate?: string
    endDate?: string | null
  }
}
export type CashWithdrawal = {
  id: string
  date: string
  amount: number
  accountId?: string
  publicBenefitPaymentId?: string
  note?: string
}
export type Account = {
  id: string; name: string; type: AccountType; balance: number; limit: number
  // Carta di credito
  plafond?: number; giornoEstratto?: number; giornoAddebito?: number; tassoRevolving?: number; usaRevolving?: boolean
  // Fido
  fidoMax?: number; fidoAlert?: number; fidoTasso?: number
}
export type Category = { id: string; name: string; budget: number }
export type Asset = {
  id: string; name: string
  type: 'finanziario' | 'assicurativo' | 'risparmio'
  paid: number; value: number; istituto?: string
  freq?: Freq; importoVers?: number
  startDate?: string
  durationYears?: number
  autoTrackPayments?: boolean
  sourceAccountId?: string
  movimenti?: AssetMovimento[]
}
export type AssetMovimento = {
  id: string; data: string
  tipo: 'versamento' | 'prelievo' | 'aggiornamento_valore'
  importo: number; note?: string
}
export type Deadline = {
  id: string; title: string; date: string; amount: number
  paid: boolean; priority: 'alta' | 'media' | 'bassa'
  freq?: Freq
}
export type FinancingCategory = 'mutuo' | 'auto' | 'prestito' | 'leasing' | 'altro'
export type InterestMode = 'percentage' | 'total' | 'payment'
export type ResidualMode = 'total_due' | 'principal'
export type FinancingPayment = {
  id: string
  dueDate: string
  paidDate: string
  amount: number
  principalAmount: number
  expenseId: string
}
export type Financing = {
  id: string
  name: string
  category: FinancingCategory
  kind: Kind
  originalAmount: number
  residualAmount: number
  paymentAmount: number
  freq: Freq
  interestMode: InterestMode
  interestRate: number
  totalRepayable: number
  installmentCount: number
  startDate: string
  endDate: string
  accountId?: string
  residualMode: ResidualMode
  remainingInstallments: number
  residualCalculatedFromSchedule?: boolean
  nextPaymentDate?: string
  payments: FinancingPayment[]
}
export type SimulationType = 'mutuo' | 'finanziamento' | 'spesa' | 'entrata'
export type Simulation = {
  id: string
  name: string
  type: SimulationType
  amount: number
  downPayment: number
  interestMode: InterestMode
  interestRate: number
  totalRepayable: number
  paymentAmount: number
  installmentCount: number
  durationMonths?: number
  freq: Freq
  startDate?: string
  kind: Kind
}
export type LimiteSpesa = { fisso: number; perc: number }
export type SavingsGoal = {
  id: string
  name: string
  kind: 'emergency' | 'goal'
  targetAmount: number
  currentAmount: number
  targetDate?: string
}
export type Invoice = {
  id: string
  number: string
  issueDate: string
  customer: string
  amount: number
  dueDate?: string
  paid: boolean
  paidDate?: string
  incomeId?: string
  fileName?: string
  filePath?: string
  fileType?: string
  notes?: string
}
export type BenefitType = 'meal' | 'welfare' | 'fuel'
export type WelfareCategory = 'shopping' | 'health' | 'education' | 'transport' | 'care' | 'sport' | 'culture' | 'travel' | 'pension' | 'other'
export type BenefitTransaction = {
  id: string
  date: string
  type: 'topup' | 'spend'
  amount: number
  note?: string
  description?: string
  category?: string
  source?: 'employer' | 'personal' | 'adjustment'
  incomeId?: string
  expenseId?: string
}
export type BenefitAccreditMode = 'none' | 'fixed' | 'variable' | 'meal_count'
export type BenefitWallet = {
  id: string
  name: string
  type: BenefitType
  welfareCategory?: WelfareCategory
  issuer?: string
  balance: number
  expiryDate?: string
  notes?: string
  accreditMode: BenefitAccreditMode
  monthlyAmount?: number
  mealValue?: number
  expectedMealCount?: number
  creditDay?: number
  transactions: BenefitTransaction[]
}
export type PublicBenefitAuthority = 'INPS' | 'INAIL'
export type PublicBenefitCategory = 'disoccupazione' | 'famiglia' | 'genitorialita' | 'inclusione' | 'disabilita' | 'malattia' | 'infortunio' | 'superstiti' | 'lavoro' | 'altro'
export type PublicBenefitStatus = 'valutazione' | 'domanda' | 'approvata' | 'sospesa' | 'terminata' | 'respinta'
export type PublicBenefitAmountMode = 'fixed' | 'variable'
export type PublicBenefitPayment = {
  id: string
  date: string
  amount: number
  accountId?: string
  incomeId: string
  note?: string
}
export type PublicBenefit = {
  id: string
  catalogKey: string
  name: string
  authority: PublicBenefitAuthority
  category: PublicBenefitCategory
  status: PublicBenefitStatus
  amount: number
  amountMode: PublicBenefitAmountMode
  frequency: Freq
  applicationDate?: string
  startDate?: string
  endDate?: string
  nextPaymentDate?: string
  beneficiary?: string
  protocolNumber?: string
  officialUrl?: string
  notes?: string
  payments: PublicBenefitPayment[]
}
export type DashboardPreferences = {
  forecast: boolean
  alerts: boolean
  goals: boolean
  subscriptions: boolean
  charts: boolean
}
export type AppModule = 'financings' | 'investments' | 'insurance' | 'simulations' | 'goals' | 'selfEmployment' | 'benefits' | 'advisor'
export type AppPreferences = {
  onboardingCompleted: boolean
  modules: Record<AppModule, boolean>
}
export type TaxProfile = {
  name: string; ateco: string; profitability: number
  substituteTax: number; contributions: number; taxReserve: number
}
export type BudgetState = {
  version: number
  profile: TaxProfile
  incomes: Income[]
  expenses: Expense[]
  accounts: Account[]
  categories: Category[]
  assets: Asset[]
  deadlines: Deadline[]
  financings: Financing[]
  simulations: Simulation[]
  goals: SavingsGoal[]
  invoices: Invoice[]
  benefits: BenefitWallet[]
  publicBenefits: PublicBenefit[]
  cashWithdrawals: CashWithdrawal[]
  dashboard: DashboardPreferences
  preferences: AppPreferences
  limiteSpesa: LimiteSpesa
}

export const EMPTY_MODULES: Record<AppModule, boolean> = {
  financings: false,
  investments: false,
  insurance: false,
  simulations: false,
  goals: false,
  selfEmployment: false,
  benefits: false,
  advisor: false
}

export const ALL_MODULES: Record<AppModule, boolean> = {
  financings: true,
  investments: true,
  insurance: true,
  simulations: true,
  goals: true,
  selfEmployment: true,
  benefits: true,
  advisor: true
}

export const FREQ_LABEL: Record<Freq, string> = {
  settimanale: 'Settimanale', mensile: 'Mensile', bimestrale: 'Bimestrale',
  trimestrale: 'Trimestrale', semestrale: 'Semestrale', annuale: 'Annuale', unica: 'Una tantum'
}
export const FREQ_MULT: Record<Freq, number> = {
  settimanale: 52/12, mensile: 1, bimestrale: 1/2,
  trimestrale: 1/3, semestrale: 1/6, annuale: 1/12, unica: 0
}
export function toMensile(amount: number, freq: Freq = 'mensile') {
  return amount * FREQ_MULT[freq]
}

export function installmentsPerYear(freq: Freq) {
  if (freq === 'unica') return 1
  return FREQ_MULT[freq] * 12
}

export function installmentAmount(
  principal: number,
  interestMode: InterestMode,
  annualRate: number,
  totalRepayable: number,
  installmentCount: number,
  freq: Freq,
  knownPayment = 0
) {
  if (principal <= 0 || installmentCount <= 0) return 0
  if (interestMode === 'payment') return Math.max(0, knownPayment)
  if (interestMode === 'total') return Math.max(0, totalRepayable) / installmentCount
  const periodicRate = annualRate / 100 / installmentsPerYear(freq)
  if (periodicRate <= 0) return principal / installmentCount
  return principal * periodicRate / (1 - Math.pow(1 + periodicRate, -installmentCount))
}

function addMonthsClamped(value: Date, months: number) {
  const result = new Date(value)
  const day = result.getDate()
  result.setDate(1)
  result.setMonth(result.getMonth() + months)
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
  result.setDate(Math.min(day, lastDay))
  return result
}

function addInstallmentInterval(value: Date, freq: Freq, intervals: number) {
  if (freq === 'settimanale') {
    const result = new Date(value)
    result.setDate(result.getDate() + intervals * 7)
    return result
  }
  const months = ({mensile:1,bimestrale:2,trimestrale:3,semestrale:6,annuale:12,unica:0} as Record<Freq,number>)[freq]
  return addMonthsClamped(value, intervals * months)
}

function isoDate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function installmentEndDate(startDate: string, freq: Freq, installmentCount: number) {
  if (!startDate || installmentCount <= 0) return ''
  const start = new Date(`${startDate}T12:00:00`)
  if (Number.isNaN(start.getTime())) return ''
  return isoDate(addInstallmentInterval(start, freq, Math.max(0, installmentCount - 1)))
}

export function installmentSchedule(startDate: string, freq: Freq, installmentCount: number) {
  if (!startDate || installmentCount <= 0) return []
  const start = new Date(`${startDate}T12:00:00`)
  if (Number.isNaN(start.getTime())) return []
  return Array.from({ length: installmentCount }, (_, index) => ({
    number: index + 1,
    date: isoDate(addInstallmentInterval(start, freq, index))
  }))
}

export function remainingInstallmentCount(residualAmount: number, paymentAmount: number) {
  if (residualAmount <= 0 || paymentAmount <= 0) return 0
  return Math.ceil(residualAmount / paymentAmount)
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function nextInstallmentDate(startDate: string, freq: Freq, asOfDate = isoDate(new Date())) {
  if (!startDate) return ''
  const start = new Date(`${startDate}T12:00:00`)
  if (Number.isNaN(start.getTime())) return ''
  for (let index = 0; index < 2400; index += 1) {
    const date = isoDate(addInstallmentInterval(start, freq, index))
    if (date >= asOfDate) return date
  }
  return ''
}

export function residualInstallmentSchedule(
  startDate: string,
  freq: Freq,
  residualAmount: number,
  paymentAmount: number,
  asOfDate = isoDate(new Date())
) {
  const installmentCount = remainingInstallmentCount(residualAmount, paymentAmount)
  const nextDate = nextInstallmentDate(startDate, freq, asOfDate)
  if (!nextDate || installmentCount <= 0) return []
  return installmentSchedule(nextDate, freq, installmentCount).map((installment, index) => ({
    ...installment,
    amount: Math.min(paymentAmount, Math.max(0, residualAmount - paymentAmount * index))
  }))
}

export function financingRemainingInstallments(financing: Financing) {
  if (financing.residualAmount <= 0 || financing.paymentAmount <= 0) return 0
  if (Number.isFinite(financing.remainingInstallments)) return Math.max(0, Math.floor(financing.remainingInstallments))
  return remainingInstallmentCount(financing.residualAmount, financing.paymentAmount)
}

export function financingInstallmentSchedule(financing: Financing, asOfDate = isoDate(new Date())) {
  const installmentCount = financingRemainingInstallments(financing)
  const nextDate = financing.nextPaymentDate && financing.nextPaymentDate >= asOfDate
    ? financing.nextPaymentDate
    : nextInstallmentDate(financing.nextPaymentDate || financing.startDate, financing.freq, asOfDate)
  if (!nextDate || installmentCount <= 0) return []
  return installmentSchedule(nextDate, financing.freq, installmentCount).map((installment, index) => ({
    ...installment,
    amount: financing.residualMode === 'total_due'
      ? Math.min(financing.paymentAmount, Math.max(0, financing.residualAmount - financing.paymentAmount * index))
      : financing.paymentAmount
  }))
}

export function nextInstallmentAfter(date: string, freq: Freq) {
  return installmentSchedule(date, freq, 2)[1]?.date ?? ''
}

export function financingPrincipalReduction(financing: Financing, paymentAmount: number) {
  if (financing.residualMode === 'total_due') return Math.min(financing.residualAmount, paymentAmount)
  const periodicRate = Math.max(0, financing.interestRate) / 100 / installmentsPerYear(financing.freq)
  const interestPart = financing.interestMode === 'percentage' ? financing.residualAmount * periodicRate : 0
  return Math.min(financing.residualAmount, Math.max(0, paymentAmount - interestPart))
}

export function installmentProgress(startDate: string, freq: Freq, installmentCount: number, asOfDate = isoDate(new Date())) {
  const endDate = installmentEndDate(startDate, freq, installmentCount)
  if (!startDate || !endDate || installmentCount <= 0) {
    return { paid: 0, remaining: Math.max(0, installmentCount), nextDate: '', endDate }
  }
  const schedule = installmentSchedule(startDate, freq, installmentCount)
  let paid = 0
  let nextDate = ''
  for (const installment of schedule) {
    if (installment.date <= asOfDate) paid += 1
    else if (!nextDate) nextDate = installment.date
  }
  return { paid, remaining: Math.max(0, installmentCount - paid), nextDate, endDate }
}

export function financingStatusFromSchedule(startDate: string, freq: Freq, installmentCount: number, paymentAmount: number, asOfDate = isoDate(new Date())) {
  const progress = installmentProgress(startDate, freq, installmentCount, asOfDate)
  return {
    ...progress,
    residualAmount: roundCurrency(Math.max(0, paymentAmount) * progress.remaining)
  }
}

export function assetPlanStatus(asset: Asset, asOfDate = isoDate(new Date())) {
  const totalInstallments=asset.durationYears&&asset.freq
    ? Math.max(1,Math.round(asset.durationYears*installmentsPerYear(asset.freq)))
    : 0
  const progress=asset.startDate&&asset.freq&&totalInstallments>0
    ? installmentProgress(asset.startDate,asset.freq,totalInstallments,asOfDate)
    : {paid:0,remaining:totalInstallments,nextDate:'',endDate:''}
  return {
    ...progress,
    totalInstallments,
    estimatedPaid:roundCurrency(progress.paid*(asset.importoVers??0)),
    estimatedRemaining:roundCurrency(progress.remaining*(asset.importoVers??0))
  }
}

export function isActiveAt(startDate: string | undefined, endDate: string | null | undefined, atDate: string) {
  if (startDate && startDate > atDate) return false
  if (endDate && endDate < atDate) return false
  return true
}

export function createEmptyState(): BudgetState {
  return {
    version: 14,
    profile: {
      name: '',
      ateco: '',
      profitability: 0,
      substituteTax: 0,
      contributions: 0,
      taxReserve: 0
    },
    limiteSpesa: { fisso: 0, perc: 0 },
    accounts: [],
    categories: [],
    assets: [],
    deadlines: [],
    financings: [],
    simulations: [],
    goals: [],
    invoices: [],
    benefits: [],
    publicBenefits: [],
    cashWithdrawals: [],
    dashboard: { forecast: true, alerts: true, goals: true, subscriptions: true, charts: true },
    preferences: { onboardingCompleted: false, modules: { ...EMPTY_MODULES } },
    incomes: [],
    expenses: []
  }
}

export const money = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const dateIt = (v: string) => new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short' }).format(new Date(`${v}T12:00:00`))
export const dateFullIt = (v: string) => new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${v}T12:00:00`))
export const uid = () => crypto.randomUUID()

export function migrate(v: Partial<BudgetState>): BudgetState {
  const empty = createEmptyState()
  const preferences = v.preferences
    ? {
        onboardingCompleted: v.preferences.onboardingCompleted ?? true,
        modules: { ...empty.preferences.modules, ...v.preferences.modules }
      }
    : { onboardingCompleted: true, modules: { ...ALL_MODULES } }
  return {
    ...empty, ...v, version: 14,
    profile: { ...empty.profile, ...v.profile },
    limiteSpesa: v.limiteSpesa ?? empty.limiteSpesa,
    accounts: v.accounts ?? [],
    categories: v.categories ?? [],
    assets: v.assets ?? [],
    deadlines: v.deadlines ?? [],
    financings: (v.financings ?? []).map(financing => {
      const installmentCount = financing.installmentCount ?? 0
      const startDate = financing.startDate ?? ''
      const residualMode = financing.residualMode ?? 'total_due' as ResidualMode
      const payments = financing.payments ?? []
      const oldAutomaticResidual = (v.version ?? 0) < 10
        && residualMode === 'total_due'
        && financing.interestMode === 'payment'
        && payments.length === 0
        && Math.abs(financing.residualAmount - financing.originalAmount) < 0.005
      const scheduleStatus = financingStatusFromSchedule(startDate, financing.freq, installmentCount, financing.paymentAmount)
      const remainingInstallments = oldAutomaticResidual
        ? scheduleStatus.remaining
        : financing.remainingInstallments ?? remainingInstallmentCount(financing.residualAmount, financing.paymentAmount)
      const migrated: Financing = {
        ...financing,
        residualAmount: oldAutomaticResidual ? scheduleStatus.residualAmount : financing.residualAmount,
        interestMode: financing.interestMode ?? 'percentage' as InterestMode,
        totalRepayable: financing.totalRepayable ?? financing.originalAmount,
        installmentCount,
        startDate,
        endDate: financing.endDate ?? installmentEndDate(startDate, financing.freq, installmentCount),
        residualMode,
        remainingInstallments,
        residualCalculatedFromSchedule: oldAutomaticResidual || financing.residualCalculatedFromSchedule,
        nextPaymentDate: oldAutomaticResidual ? scheduleStatus.nextDate : financing.nextPaymentDate ?? nextInstallmentDate(startDate, financing.freq),
        payments
      }
      return { ...migrated, endDate: installmentEndDate(startDate, financing.freq, installmentCount) || migrated.endDate }
    }),
    goals: v.goals ?? [],
    invoices: v.invoices ?? [],
    benefits: (v.benefits ?? []).map(benefit => ({ ...benefit, accreditMode: benefit.accreditMode ?? 'none', transactions: benefit.transactions ?? [] })),
    publicBenefits: (v.publicBenefits ?? []).map(benefit => ({
      ...benefit,
      status: benefit.status ?? 'valutazione',
      amount: benefit.amount ?? 0,
      amountMode: benefit.amountMode ?? 'variable',
      frequency: benefit.frequency ?? 'mensile',
      payments: benefit.payments ?? []
    })),
    cashWithdrawals: v.cashWithdrawals ?? [],
    dashboard: { ...empty.dashboard, ...v.dashboard },
    preferences,
    simulations: (v.simulations ?? []).map(simulation => {
      const installmentCount = simulation.installmentCount ?? Math.max(0, simulation.durationMonths ?? 0)
      const principal = Math.max(0, simulation.amount - simulation.downPayment)
      const interestMode = simulation.interestMode ?? 'percentage' as InterestMode
      const totalRepayable = simulation.totalRepayable ?? principal
      return {
        ...simulation,
        interestMode,
        totalRepayable,
        installmentCount,
        paymentAmount: simulation.paymentAmount ?? installmentAmount(principal, interestMode, simulation.interestRate ?? 0, totalRepayable, installmentCount, simulation.freq)
      }
    }),
    expenses: (v.expenses ?? []).map(e => ({
      ...e,
      freq: e.freq ?? 'mensile' as Freq,
      subscription: e.subscription ?? (e.recurring ? { startDate: e.date, endDate: null } : undefined)
    })),
    incomes: (v.incomes ?? []).map(i => ({ ...i, freq: i.freq ?? 'mensile' as Freq }))
  }
}

export function totals(s: BudgetState, y: number) {
  const today = isoDate(new Date())
  const incomes = s.incomes.filter(i => new Date(i.date).getFullYear() === y)
  const cashIncomes = incomes.filter(i => i.incomeClass !== 'benefit')
  const expenses = s.expenses.filter(i => new Date(i.date).getFullYear() === y)
  const sum = (a: { amount: number }[]) => a.reduce((n, x) => n + x.amount, 0)
  const pivaIncome = sum(cashIncomes.filter(i => i.kind === 'piva'))
  const taxable = pivaIncome * s.profile.profitability / 100
  const contributions = taxable * s.profile.contributions / 100
  const tax = Math.max(0, taxable - contributions) * s.profile.substituteTax / 100
  const reserve = pivaIncome * s.profile.taxReserve / 100
  const totalIncome = sum(cashIncomes)
  const benefitIncome = sum(incomes.filter(i => i.incomeClass === 'benefit'))
  const personalIncome = sum(cashIncomes.filter(i => i.kind === 'personale'))
  const totalExpense = sum(expenses)
  const cashExpense = expenses.reduce((n, expense) => n + Math.max(0, expense.amount - (expense.benefitAmount ?? 0)), 0)
  const liquidity = s.accounts.reduce((n, a) => n + a.balance, 0)
  const assets = s.assets.reduce((n, a) => n + a.value, 0)
  const financingDebt = s.financings.reduce((n, financing) => n + Math.max(0, financing.residualAmount), 0)
  const monthlyFinancing = s.financings.filter(financing => financing.residualAmount > 0).reduce((n, financing) => n + toMensile(financing.paymentAmount, financing.freq), 0)
  const mensileSpese = s.expenses.filter(e => (e.recurring || e.subscription) && (!e.subscription || isActiveAt(e.subscription.startDate, e.subscription.endDate, today)) && !['finanziario','assicurativo','risparmio'].includes(e.category))
    .reduce((n, e) => n + toMensile(Math.max(0, e.amount - (e.benefitAmount ?? 0)), e.freq), 0)
  const totalMonthlyExpenses = mensileSpese + monthlyFinancing
  // Limite attivo: il più restrittivo tra fisso e percentuale
  const limFisso = s.limiteSpesa.fisso > 0 ? s.limiteSpesa.fisso : Infinity
  const limPerc = s.limiteSpesa.perc > 0 ? (totalIncome * s.limiteSpesa.perc / 100) : Infinity
  const limiteAttivo = Math.min(limFisso, limPerc)
  const usatoLimite = (limiteAttivo < Infinity && limiteAttivo > 0) ? totalMonthlyExpenses / limiteAttivo : 0
  return {
    incomes, expenses, pivaIncome, personalIncome, taxable, contributions, tax, reserve,
    totalIncome, benefitIncome, totalExpense, cashExpense, liquidity, assets, financingDebt, monthlyFinancing,
    netWorth: liquidity + assets - financingDebt,
    mensileSpese: totalMonthlyExpenses,
    limiteAttivo: isFinite(limiteAttivo) ? limiteAttivo : Infinity,
    usatoLimite: isNaN(usatoLimite) ? 0 : usatoLimite
  }
}

export function monthlyData(s: BudgetState, y: number) {
  return ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'].map((month, index) => {
    const monthKey=`${y}-${String(index+1).padStart(2,'0')}`
    const monthEnd=isoDate(new Date(y,index+1,0,12))
    const recurringIncome=s.incomes.filter(item=>item.incomeClass!=='benefit'&&item.recurring&&item.date<=monthEnd).reduce((total,item)=>total+toMensile(item.amount,item.freq??'mensile'),0)
    const oneOffIncome=s.incomes.filter(item=>item.incomeClass!=='benefit'&&!item.recurring&&item.date.startsWith(monthKey)).reduce((total,item)=>total+item.amount,0)
    const recurringExpenses=s.expenses.filter(item=>(item.recurring||item.subscription)&&isActiveAt(item.subscription?.startDate??item.date,item.subscription?.endDate,monthEnd)).reduce((total,item)=>total+toMensile(item.amount,item.freq),0)
    const oneOffExpenses=s.expenses.filter(item=>!item.recurring&&!item.subscription&&item.date.startsWith(monthKey)).reduce((total,item)=>total+item.amount,0)
    return {month,entrate:recurringIncome+oneOffIncome,spese:recurringExpenses+oneOffExpenses}
  })
}

export function patrimoniTotals(assets: Asset[]) {
  let totVersato = 0, totValore = 0
  assets.forEach(a => {
    const movs = a.movimenti ?? []
    const versatoRegistrato = movs.filter(m => m.tipo==='versamento').reduce((n,m)=>n+m.importo,0)
    const prelevato = movs.filter(m => m.tipo==='prelievo').reduce((n,m)=>n+m.importo,0)
    const versato = a.autoTrackPayments ? Math.max(versatoRegistrato,assetPlanStatus(a).estimatedPaid) : versatoRegistrato
    const ult = [...movs].filter(m=>m.tipo==='aggiornamento_valore').sort((x,y)=>y.data.localeCompare(x.data))[0]
    totVersato += versato - prelevato
    totValore += ult ? ult.importo : (a.value)
  })
  return { totVersato, totValore, rend: totValore - totVersato }
}
