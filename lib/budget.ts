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

export function createEmptyState(): BudgetState {
  return {
    version: 3,
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
    incomes: [],
    expenses: []
  }
}

export const money = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
export const dateIt = (v: string) => new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short' }).format(new Date(`${v}T12:00:00`))
export const uid = () => crypto.randomUUID()

export function migrate(v: Partial<BudgetState>): BudgetState {
  const empty = createEmptyState()
  return {
    ...empty, ...v, version: 3,
    profile: { ...empty.profile, ...v.profile },
    limiteSpesa: v.limiteSpesa ?? empty.limiteSpesa,
    accounts: v.accounts ?? [],
    categories: v.categories ?? [],
    assets: v.assets ?? [],
    deadlines: v.deadlines ?? [],
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
  const totalExpense = sum(expenses)
  const liquidity = s.accounts.reduce((n, a) => n + a.balance, 0)
  const assets = s.assets.reduce((n, a) => n + a.value, 0)
  const mensileSpese = s.expenses.filter(e => !['finanziario','assicurativo','risparmio'].includes(e.category))
    .reduce((n, e) => n + toMensile(e.amount, e.freq), 0)
  // Limite attivo: il più restrittivo tra fisso e percentuale
  const limFisso = s.limiteSpesa.fisso > 0 ? s.limiteSpesa.fisso : Infinity
  const limPerc = s.limiteSpesa.perc > 0 ? (totalIncome * s.limiteSpesa.perc / 100) : Infinity
  const limiteAttivo = Math.min(limFisso, limPerc)
  const usatoLimite = (limiteAttivo < Infinity && limiteAttivo > 0) ? mensileSpese / limiteAttivo : 0
  return {
    incomes, expenses, pivaIncome, taxable, contributions, tax, reserve,
    totalIncome, totalExpense, liquidity, assets,
    netWorth: liquidity + assets,
    mensileSpese, limiteAttivo: isFinite(limiteAttivo) ? limiteAttivo : Infinity, usatoLimite: isNaN(usatoLimite) ? 0 : usatoLimite
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
