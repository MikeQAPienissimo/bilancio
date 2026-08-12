export type Kind = 'personale' | 'piva'
export type Freq = 'settimanale' | 'mensile' | 'bimestrale' | 'trimestrale' | 'semestrale' | 'annuale' | 'unica'
export type AccountType = 'conto' | 'carta' | 'fido' | 'contanti' | 'piva'

export type Income = {
  id: string; date: string; description: string; amount: number
  kind: Kind; accountId?: string; recurring?: boolean; freq?: Freq
}
export type Expense = Income & {
  category: string
  freq: Freq
  subscription?: {
    startDate?: string
    endDate?: string | null
  }
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
  limiteSpesa: LimiteSpesa
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

function installmentsPerYear(freq: Freq) {
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

export function installmentProgress(startDate: string, freq: Freq, installmentCount: number, asOfDate = isoDate(new Date())) {
  const endDate = installmentEndDate(startDate, freq, installmentCount)
  if (!startDate || !endDate || installmentCount <= 0) {
    return { paid: 0, remaining: Math.max(0, installmentCount), nextDate: '', endDate }
  }
  const start = new Date(`${startDate}T12:00:00`)
  let paid = 0
  let nextDate = ''
  for (let index = 0; index < installmentCount; index += 1) {
    const dueDate = isoDate(addInstallmentInterval(start, freq, index))
    if (dueDate <= asOfDate) paid += 1
    else if (!nextDate) nextDate = dueDate
  }
  return { paid, remaining: Math.max(0, installmentCount - paid), nextDate, endDate }
}

export function isActiveAt(startDate: string | undefined, endDate: string | null | undefined, atDate: string) {
  if (startDate && startDate > atDate) return false
  if (endDate && endDate < atDate) return false
  return true
}

export function createEmptyState(): BudgetState {
  return {
    version: 6,
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
    incomes: [],
    expenses: []
  }
}

export const money = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
export const dateIt = (v: string) => new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short' }).format(new Date(`${v}T12:00:00`))
export const dateFullIt = (v: string) => new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${v}T12:00:00`))
export const uid = () => crypto.randomUUID()

export function migrate(v: Partial<BudgetState>): BudgetState {
  const empty = createEmptyState()
  return {
    ...empty, ...v, version: 6,
    profile: { ...empty.profile, ...v.profile },
    limiteSpesa: v.limiteSpesa ?? empty.limiteSpesa,
    accounts: v.accounts ?? [],
    categories: v.categories ?? [],
    assets: v.assets ?? [],
    deadlines: v.deadlines ?? [],
    financings: (v.financings ?? []).map(financing => {
      const installmentCount = financing.installmentCount ?? 0
      const startDate = financing.startDate ?? ''
      return {
        ...financing,
        interestMode: financing.interestMode ?? 'percentage' as InterestMode,
        totalRepayable: financing.totalRepayable ?? financing.originalAmount,
        installmentCount,
        startDate,
        endDate: financing.endDate ?? installmentEndDate(startDate, financing.freq, installmentCount)
      }
    }),
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
    expenses: (v.expenses ?? []).map(e => ({ ...e, freq: e.freq ?? 'mensile' as Freq })),
    incomes: (v.incomes ?? []).map(i => ({ ...i, freq: i.freq ?? 'mensile' as Freq }))
  }
}

export function totals(s: BudgetState, y: number) {
  const incomes = s.incomes.filter(i => new Date(i.date).getFullYear() === y)
  const expenses = s.expenses.filter(i => new Date(i.date).getFullYear() === y)
  const sum = (a: { amount: number }[]) => a.reduce((n, x) => n + x.amount, 0)
  const pivaIncome = sum(incomes.filter(i => i.kind === 'piva'))
  const taxable = pivaIncome * s.profile.profitability / 100
  const contributions = taxable * s.profile.contributions / 100
  const tax = Math.max(0, taxable - contributions) * s.profile.substituteTax / 100
  const reserve = pivaIncome * s.profile.taxReserve / 100
  const totalIncome = sum(incomes)
  const personalIncome = sum(incomes.filter(i => i.kind === 'personale'))
  const totalExpense = sum(expenses)
  const liquidity = s.accounts.reduce((n, a) => n + a.balance, 0)
  const assets = s.assets.reduce((n, a) => n + a.value, 0)
  const financingDebt = s.financings.reduce((n, financing) => n + Math.max(0, financing.residualAmount), 0)
  const monthlyFinancing = s.financings.reduce((n, financing) => n + toMensile(financing.paymentAmount, financing.freq), 0)
  const mensileSpese = s.expenses.filter(e => (e.recurring || e.subscription) && !['finanziario','assicurativo','risparmio'].includes(e.category))
    .reduce((n, e) => n + toMensile(e.amount, e.freq), 0)
  const totalMonthlyExpenses = mensileSpese + monthlyFinancing
  // Limite attivo: il più restrittivo tra fisso e percentuale
  const limFisso = s.limiteSpesa.fisso > 0 ? s.limiteSpesa.fisso : Infinity
  const limPerc = s.limiteSpesa.perc > 0 ? (totalIncome * s.limiteSpesa.perc / 100) : Infinity
  const limiteAttivo = Math.min(limFisso, limPerc)
  const usatoLimite = (limiteAttivo < Infinity && limiteAttivo > 0) ? totalMonthlyExpenses / limiteAttivo : 0
  return {
    incomes, expenses, pivaIncome, personalIncome, taxable, contributions, tax, reserve,
    totalIncome, totalExpense, liquidity, assets, financingDebt, monthlyFinancing,
    netWorth: liquidity + assets - financingDebt,
    mensileSpese: totalMonthlyExpenses,
    limiteAttivo: isFinite(limiteAttivo) ? limiteAttivo : Infinity,
    usatoLimite: isNaN(usatoLimite) ? 0 : usatoLimite
  }
}

export function monthlyData(s: BudgetState, y: number) {
  return ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'].map((month, index) => ({
    month,
    entrate: s.incomes.filter(i => new Date(i.date).getFullYear()===y && new Date(i.date).getMonth()===index).reduce((n,x)=>n+x.amount,0),
    spese: s.expenses.filter(i => new Date(i.date).getFullYear()===y && new Date(i.date).getMonth()===index).reduce((n,x)=>n+x.amount,0)
  }))
}

export function patrimoniTotals(assets: Asset[]) {
  let totVersato = 0, totValore = 0
  assets.forEach(a => {
    const movs = a.movimenti ?? []
    const versato = movs.filter(m => m.tipo==='versamento').reduce((n,m)=>n+m.importo,0)
    const prelevato = movs.filter(m => m.tipo==='prelievo').reduce((n,m)=>n+m.importo,0)
    const ult = [...movs].filter(m=>m.tipo==='aggiornamento_valore').sort((x,y)=>y.data.localeCompare(x.data))[0]
    totVersato += versato - prelevato
    totValore += ult ? ult.importo : (a.value)
  })
  return { totVersato, totValore, rend: totValore - totVersato }
}
