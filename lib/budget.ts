export type Kind = 'personale' | 'piva'
export type Freq = 'settimanale' | 'mensile' | 'bimestrale' | 'trimestrale' | 'semestrale' | 'annuale' | 'unica'
export type AccountType = 'conto' | 'carta' | 'fido' | 'contanti' | 'piva'

export type Income = {
  id: string; date: string; description: string; amount: number
  kind: Kind; accountId?: string; recurring?: boolean; freq?: Freq
  incomeClass?: 'cash' | 'benefit' | 'reimbursement'
  benefitId?: string
  benefitTransactionId?: string
  publicBenefitId?: string
  publicBenefitPaymentId?: string
  invoiceId?: string
  reimbursementExpenseId?: string
  reimbursementPaymentId?: string
}
export type ReimbursementMethod = 'transfer' | 'cash' | 'payroll' | 'other'
export type ReimbursementPayment = {
  id: string
  date: string
  amount: number
  method: ReimbursementMethod
  accountId?: string
  incomeId: string
  note?: string
}
export type Expense = Income & {
  category: string
  freq: Freq
  expenseClass?: 'consumption' | 'investment_transfer' | 'insurance_premium'
  assetId?: string
  benefitAmount?: number
  cashWithdrawalId?: string
  publicBenefitSourcePaymentId?: string
  subscription?: {
    startDate?: string
    endDate?: string | null
  }
  reimbursement?: {
    debtor: string
    reason: 'work' | 'personal'
    expectedDate?: string
    payments: ReimbursementPayment[]
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
export type InsuranceKind = 'protection' | 'savings' | 'unit_linked'
export type Asset = {
  id: string; name: string
  type: 'finanziario' | 'assicurativo' | 'risparmio'
  paid: number; value: number; istituto?: string
  freq?: Freq; importoVers?: number
  startDate?: string
  initialPayment?: number
  initialPaymentDate?: string
  durationYears?: number
  autoTrackPayments?: boolean
  sourceAccountId?: string
  insuranceKind?: InsuranceKind
  deathBenefit?: number
  disabilityBenefit?: number
  beneficiary?: string
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
export type ResidualEntryMode = 'automatic' | 'total_due' | 'principal'
export type FinancingPayment = {
  id: string
  dueDate: string
  paidDate: string
  amount: number
  principalAmount: number
  expenseId: string
}
export type FinancingPayoff = {
  id: string
  date: string
  type: 'partial' | 'full'
  amount: number
  residualReduction: number
  expenseId: string
  accountId?: string
  note?: string
  previousResidualAmount: number
  previousRemainingInstallments: number
  previousNextPaymentDate?: string
  previousResidualEntryMode?: ResidualEntryMode
  previousResidualCalculatedFromSchedule?: boolean
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
  residualEntryMode?: ResidualEntryMode
  remainingInstallments: number
  residualCalculatedFromSchedule?: boolean
  nextPaymentDate?: string
  payments: FinancingPayment[]
  payoffs: FinancingPayoff[]
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
  settimanale: 4, mensile: 1, bimestrale: 1/2,
  trimestrale: 1/3, semestrale: 1/6, annuale: 1/12, unica: 0
}
export function toMensile(amount: number, freq: Freq = 'mensile') {
  return amount * FREQ_MULT[freq]
}

export function installmentsPerYear(freq: Freq) {
  if (freq === 'unica') return 1
  if (freq === 'settimanale') return 52
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
  if (installmentCount <= 0) return 0
  if (interestMode === 'payment') return Math.max(0, knownPayment)
  if (interestMode === 'total') return Math.max(0, totalRepayable) / installmentCount
  if (principal <= 0) return 0
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
  if (financing.residualEntryMode === 'automatic' || financing.residualCalculatedFromSchedule) {
    return installmentProgress(financing.startDate, financing.freq, financing.installmentCount).remaining
  }
  if (financing.residualAmount <= 0 || financing.paymentAmount <= 0) return 0
  if (Number.isFinite(financing.remainingInstallments)) return Math.max(0, Math.floor(financing.remainingInstallments))
  return remainingInstallmentCount(financing.residualAmount, financing.paymentAmount)
}

export function financingInstallmentSchedule(financing: Financing, asOfDate = isoDate(new Date())) {
  if (financing.residualEntryMode === 'automatic' || financing.residualCalculatedFromSchedule) {
    return installmentSchedule(financing.startDate, financing.freq, financing.installmentCount)
      .filter(installment => installment.date >= asOfDate)
      .map(installment => ({ ...installment, amount: financing.paymentAmount }))
  }
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
    if (installment.date < asOfDate) paid += 1
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
  let progress={paid:0,remaining:totalInstallments,nextDate:'',endDate:''}
  if(asset.startDate&&asset.freq&&totalInstallments>0)progress=installmentProgress(asset.startDate,asset.freq,totalInstallments,asOfDate)
  else if(asset.startDate&&asset.freq&&asset.freq!=='unica'){
    const start=new Date(`${asset.startDate}T12:00:00`)
    if(!Number.isNaN(start.getTime())){
      let paid=0,nextDate=''
      for(let index=0;index<2400;index+=1){
        const date=isoDate(addInstallmentInterval(start,asset.freq,index))
        if(date<asOfDate)paid+=1
        else{nextDate=date;break}
      }
      progress={paid,remaining:0,nextDate,endDate:''}
    }
  }
  return {
    ...progress,
    totalInstallments,
    estimatedPaid:roundCurrency(progress.paid*(asset.importoVers??0)),
    estimatedRemaining:roundCurrency(progress.remaining*(asset.importoVers??0))
  }
}

export function isProtectionInsurance(asset: Asset) {
  return asset.type === 'assicurativo' && (asset.insuranceKind ?? 'protection') === 'protection'
}

export function assetFinancialStatus(asset: Asset, asOfDate = isoDate(new Date())) {
  const movs = asset.movimenti ?? []
  const registeredPaid = roundCurrency(movs.filter(movement => movement.tipo === 'versamento' && movement.data <= asOfDate).reduce((total, movement) => total + movement.importo, 0))
  const withdrawals = roundCurrency(movs.filter(movement => movement.tipo === 'prelievo' && movement.data <= asOfDate).reduce((total, movement) => total + movement.importo, 0))
  const initialPaid = asset.initialPayment && (!asset.initialPaymentDate || asset.initialPaymentDate <= asOfDate) ? roundCurrency(asset.initialPayment) : 0
  const automaticPaid = asset.autoTrackPayments ? assetPlanStatus(asset, asOfDate).estimatedPaid : 0
  const calculatedPaid = roundCurrency(initialPaid + registeredPaid + automaticPaid)
  const grossPaid = roundCurrency(Math.max(0, asset.paid ?? 0, calculatedPaid))
  const netPaid = roundCurrency(Math.max(0, grossPaid - withdrawals))
  const latestValue = [...movs].filter(movement => movement.tipo === 'aggiornamento_valore' && movement.data <= asOfDate).sort((left, right) => right.data.localeCompare(left.data))[0]
  const value = roundCurrency(Math.max(0, latestValue?.importo ?? asset.value ?? 0))
  const returnAmount = roundCurrency(value - netPaid)
  return {
    registeredPaid,
    initialPaid,
    withdrawals,
    automaticPaid,
    calculatedPaid,
    grossPaid,
    netPaid,
    value,
    returnAmount,
    returnPercent: netPaid > 0 ? returnAmount / netPaid * 100 : 0
  }
}

export function assetPlanExpense(asset: Asset): Expense | null {
  if (!asset.autoTrackPayments || !asset.startDate || !asset.freq || asset.freq === 'unica' || !asset.importoVers || asset.importoVers <= 0) return null
  const protection = isProtectionInsurance(asset)
  return {
    id: `asset-plan-${asset.id}`,
    assetId: asset.id,
    date: asset.startDate,
    description: protection ? `Premio ${asset.name}` : `Versamento ${asset.name}`,
    amount: roundCurrency(asset.importoVers),
    kind: 'personale',
    accountId: asset.sourceAccountId,
    recurring: true,
    freq: asset.freq,
    category: protection ? 'Assicurazioni' : 'Investimenti',
    expenseClass: protection ? 'insurance_premium' : 'investment_transfer',
    subscription: { startDate: asset.startDate, endDate: assetPlanStatus(asset).endDate || null }
  }
}

export function assetInitialExpense(asset: Asset): Expense | null {
  if (!asset.initialPayment || asset.initialPayment <= 0 || !asset.initialPaymentDate) return null
  const protection = isProtectionInsurance(asset)
  return {
    id: `asset-initial-${asset.id}`,
    assetId: asset.id,
    date: asset.initialPaymentDate,
    description: protection ? `Premio iniziale ${asset.name}` : `Versamento iniziale ${asset.name}`,
    amount: roundCurrency(asset.initialPayment),
    kind: 'personale',
    accountId: asset.sourceAccountId,
    recurring: false,
    freq: 'unica',
    category: protection ? 'Assicurazioni' : 'Investimenti',
    expenseClass: protection ? 'insurance_premium' : 'investment_transfer'
  }
}

export function assetMovementExpense(asset: Asset, movement: AssetMovimento): Expense | null {
  if (movement.tipo !== 'versamento' || movement.importo <= 0) return null
  const protection = isProtectionInsurance(asset)
  return {
    id: `asset-movement-${movement.id}`,
    assetId: asset.id,
    date: movement.data,
    description: movement.note || (protection ? `Premio extra ${asset.name}` : `Versamento extra ${asset.name}`),
    amount: roundCurrency(movement.importo),
    kind: 'personale',
    accountId: asset.sourceAccountId,
    recurring: false,
    freq: 'unica',
    category: protection ? 'Assicurazioni' : 'Investimenti',
    expenseClass: protection ? 'insurance_premium' : 'investment_transfer'
  }
}

export function assetLinkedExpenses(asset: Asset) {
  return [assetPlanExpense(asset), assetInitialExpense(asset), ...(asset.movimenti ?? []).map(movement => assetMovementExpense(asset, movement))]
    .filter((expense): expense is Expense => Boolean(expense))
}

export function reimbursementStatus(expense: Expense) {
  if (!expense.reimbursement) {
    return { received: 0, outstanding: 0, state: 'settled' as const }
  }
  const received = roundCurrency((expense.reimbursement?.payments ?? []).reduce((total, payment) => total + payment.amount, 0))
  const outstanding = roundCurrency(Math.max(0, expense.amount - received))
  return {
    received,
    outstanding,
    state: outstanding <= 0 ? 'settled' as const : received > 0 ? 'partial' as const : 'open' as const
  }
}

export function isActiveAt(startDate: string | undefined, endDate: string | null | undefined, atDate: string) {
  if (startDate && startDate > atDate) return false
  if (endDate && endDate < atDate) return false
  return true
}

export function createEmptyState(): BudgetState {
  return {
    version: 17,
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
  const assets: Asset[] = (v.assets ?? []).map(asset => {
    const legacyPolizzaVita = (v.version ?? 0) < 16 && asset.type === 'assicurativo' && asset.name.trim().toLocaleLowerCase('it').replace(/\s+/g, '') === 'polizzavita'
    return {
      ...asset,
      insuranceKind: asset.type === 'assicurativo' ? asset.insuranceKind ?? 'protection' : undefined,
      autoTrackPayments: Boolean(asset.autoTrackPayments || ((v.version ?? 0) < 16 && asset.startDate && asset.importoVers && asset.freq && asset.freq !== 'unica')),
      deathBenefit: asset.deathBenefit ?? (legacyPolizzaVita ? 150000 : undefined),
      disabilityBenefit: asset.disabilityBenefit ?? (legacyPolizzaVita ? 150000 : undefined),
      movimenti: asset.movimenti ?? []
    }
  })
  const migratedExpenses: Expense[] = (v.expenses ?? []).map(expense => ({
    ...expense,
    freq: expense.freq ?? 'mensile',
    expenseClass: expense.expenseClass ?? 'consumption',
    reimbursement: expense.reimbursement ? { ...expense.reimbursement, payments: expense.reimbursement.payments ?? [] } : undefined,
    subscription: expense.subscription ?? (expense.recurring ? { startDate: expense.date, endDate: null } : undefined)
  }))
  const linkedAssetExpenses = assets.flatMap(assetLinkedExpenses)
  const expenses = [...migratedExpenses.filter(expense => !expense.assetId), ...linkedAssetExpenses]
  return {
    ...empty, ...v, version: 17,
    profile: { ...empty.profile, ...v.profile },
    limiteSpesa: v.limiteSpesa ?? empty.limiteSpesa,
    accounts: v.accounts ?? [],
    categories: v.categories ?? [],
    assets,
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
      const residualEntryMode = financing.residualEntryMode
        ?? (residualMode === 'principal' ? 'principal' : financing.residualCalculatedFromSchedule || oldAutomaticResidual ? 'automatic' : 'total_due')
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
        residualEntryMode,
        remainingInstallments,
        residualCalculatedFromSchedule: oldAutomaticResidual || financing.residualCalculatedFromSchedule,
        nextPaymentDate: oldAutomaticResidual ? scheduleStatus.nextDate : financing.nextPaymentDate ?? nextInstallmentDate(startDate, financing.freq),
        payments,
        payoffs: financing.payoffs ?? []
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
    expenses,
    incomes: (v.incomes ?? []).map(i => ({ ...i, freq: i.freq ?? 'mensile' as Freq }))
  }
}

export function totals(s: BudgetState, y: number) {
  const today = isoDate(new Date())
  const incomes = s.incomes.filter(i => new Date(i.date).getFullYear() === y)
  const cashIncomes = incomes.filter(i => i.incomeClass !== 'benefit')
  const earnedIncomes = cashIncomes.filter(i => i.incomeClass !== 'reimbursement')
  const expenses = s.expenses.filter(i => new Date(i.date).getFullYear() === y && i.expenseClass !== 'investment_transfer')
  const sum = (a: { amount: number }[]) => a.reduce((n, x) => n + x.amount, 0)
  const pivaIncome = sum(earnedIncomes.filter(i => i.kind === 'piva'))
  const taxable = pivaIncome * s.profile.profitability / 100
  const contributions = taxable * s.profile.contributions / 100
  const tax = Math.max(0, taxable - contributions) * s.profile.substituteTax / 100
  const reserve = pivaIncome * s.profile.taxReserve / 100
  const totalIncome = sum(earnedIncomes)
  const reimbursementIncome = sum(incomes.filter(i => i.incomeClass === 'reimbursement'))
  const benefitIncome = sum(incomes.filter(i => i.incomeClass === 'benefit'))
  const personalIncome = sum(earnedIncomes.filter(i => i.kind === 'personale'))
  const totalExpense = sum(expenses)
  const cashExpense = expenses.reduce((n, expense) => n + Math.max(0, expense.amount - (expense.benefitAmount ?? 0)), 0)
  const liquidity = s.accounts.reduce((n, a) => n + a.balance, 0)
  const assets = s.assets.filter(asset => !isProtectionInsurance(asset)).reduce((n, asset) => n + assetFinancialStatus(asset).value, 0)
  const receivables = roundCurrency(s.expenses.reduce((total, expense) => total + reimbursementStatus(expense).outstanding, 0))
  // Nel patrimonio netto entra soltanto il capitale residuo dichiarato.
  // Il totale delle rate future contiene anche interessi e costi e non è una passività contabile confrontabile con gli attivi.
  const financingDebt = s.financings
    .filter(financing => financing.residualMode === 'principal')
    .reduce((n, financing) => n + Math.max(0, financing.residualAmount), 0)
  const financingDebtUnknown = s.financings.filter(financing => financing.residualAmount > 0 && financing.residualMode !== 'principal').length
  const monthlyFinancing = s.financings.filter(financing => financing.residualAmount > 0).reduce((n, financing) => n + toMensile(financing.paymentAmount, financing.freq), 0)
  const mensileSpese = s.expenses.filter(e => e.expenseClass !== 'investment_transfer' && (e.recurring || e.subscription) && (!e.subscription || isActiveAt(e.subscription.startDate, e.subscription.endDate, today)))
    .reduce((n, e) => n + toMensile(Math.max(0, e.amount - (e.benefitAmount ?? 0)), e.freq), 0)
  const totalMonthlyExpenses = mensileSpese + monthlyFinancing
  // Limite attivo: il più restrittivo tra fisso e percentuale
  const limFisso = s.limiteSpesa.fisso > 0 ? s.limiteSpesa.fisso : Infinity
  const limPerc = s.limiteSpesa.perc > 0 ? (totalIncome * s.limiteSpesa.perc / 100) : Infinity
  const limiteAttivo = Math.min(limFisso, limPerc)
  const usatoLimite = (limiteAttivo < Infinity && limiteAttivo > 0) ? totalMonthlyExpenses / limiteAttivo : 0
  return {
    incomes, expenses, pivaIncome, personalIncome, taxable, contributions, tax, reserve,
    totalIncome, reimbursementIncome, benefitIncome, totalExpense, cashExpense, liquidity, assets, receivables, financingDebt, financingDebtUnknown, monthlyFinancing,
    netWorth: liquidity + assets + receivables - financingDebt,
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
    const recurringExpenses=s.expenses.filter(item=>item.expenseClass!=='investment_transfer'&&(item.recurring||item.subscription)&&isActiveAt(item.subscription?.startDate??item.date,item.subscription?.endDate,monthEnd)).reduce((total,item)=>total+toMensile(item.amount,item.freq),0)
    const oneOffExpenses=s.expenses.filter(item=>item.expenseClass!=='investment_transfer'&&!item.recurring&&!item.subscription&&item.date.startsWith(monthKey)).reduce((total,item)=>total+item.amount,0)
    return {month,entrate:recurringIncome+oneOffIncome,spese:recurringExpenses+oneOffExpenses}
  })
}

export function patrimoniTotals(assets: Asset[]) {
  let totVersato = 0, totValore = 0, rend = 0
  assets.forEach(a => {
    if (isProtectionInsurance(a)) return
    const status = assetFinancialStatus(a)
    totVersato += status.netPaid
    totValore += status.value
    if (status.netPaid > 0) rend += status.returnAmount
  })
  return { totVersato: roundCurrency(totVersato), totValore: roundCurrency(totValore), rend: roundCurrency(rend) }
}
