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

const year = new Date().getFullYear()
const d = (m: number, n: number) => `${year}-${String(m).padStart(2,'0')}-${String(n).padStart(2,'0')}`

export const demoState: BudgetState = {
  version: 3,
  profile: { name: 'Michele', ateco: '62.01.00', profitability: 67, substituteTax: 5, contributions: 26.07, taxReserve: 35 },
  limiteSpesa: { fisso: 3000, perc: 70 },
  accounts: [
    { id: 'a1', name: 'Conto principale', type: 'conto', balance: 12840, limit: 0 },
    { id: 'a2', name: 'Carta Gold', type: 'carta', balance: -740, limit: 3000, plafond: 3000, giornoEstratto: 1, giornoAddebito: 15, tassoRevolving: 0, usaRevolving: false },
    { id: 'a3', name: 'Conto P.IVA', type: 'piva', balance: 6250, limit: 0 },
    { id: 'a4', name: 'Fido Intesa', type: 'fido', balance: 0, limit: 0, fidoMax: 5000, fidoAlert: 3000, fidoTasso: 8.5 }
  ],
  categories: [
    { id: 'c1', name: 'Casa', budget: 1000 },
    { id: 'c2', name: 'Alimentari', budget: 450 },
    { id: 'c3', name: 'Mobilità', budget: 300 },
    { id: 'c4', name: 'Software', budget: 180 },
    { id: 'c5', name: 'Servizi', budget: 250 },
    { id: 'c6', name: 'Professionisti', budget: 500 }
  ],
  assets: [
    { id: 'as1', name: 'ETF Piano futuro', type: 'finanziario', paid: 8200, value: 9140, istituto: 'Fineco', freq: 'mensile', importoVers: 200, movimenti: [
      { id: 'm1', data: `${year}-01-15`, tipo: 'versamento', importo: 200 },
      { id: 'm2', data: `${year}-03-01`, tipo: 'aggiornamento_valore', importo: 9140, note: 'Aggiorn. trimestrale' }
    ]},
    { id: 'as2', name: 'Polizza vita', type: 'assicurativo', paid: 4200, value: 4380, istituto: 'Generali', freq: 'annuale', importoVers: 1200, movimenti: [
      { id: 'm3', data: `${year}-02-10`, tipo: 'versamento', importo: 1200 }
    ]}
  ],
  deadlines: [
    { id: 'd1', title: 'Acconto INPS', date: d(6,30), amount: 1680, paid: true, priority: 'alta' },
    { id: 'd2', title: 'Assicurazione auto', date: d(7,12), amount: 620, paid: true, priority: 'media', freq: 'annuale' },
    { id: 'd3', title: 'Rinnovo dominio', date: d(8,2), amount: 42, paid: true, priority: 'bassa', freq: 'annuale' }
  ],
  incomes: [
    ['i1',1,12,'Stipendio',2200,'personale','a1'],
    ['i2',1,24,'Sito web — Studio Forma',1800,'piva','a3'],
    ['i3',2,12,'Stipendio',2200,'personale','a1'],
    ['i4',2,27,'Consulenza prodotto',2450,'piva','a3'],
    ['i5',3,12,'Stipendio',2200,'personale','a1'],
    ['i6',4,29,'Consulenza UX',2100,'piva','a3'],
    ['i7',5,12,'Stipendio',2200,'personale','a1']
  ].map(x => ({ id: String(x[0]), date: d(Number(x[1]),Number(x[2])), description: String(x[3]), amount: Number(x[4]), kind: x[5] as Kind, accountId: String(x[6]), freq: 'mensile' as Freq })),
  expenses: [
    ['e1',1,5,'Affitto',780,'personale','Casa','mensile'],
    ['e2',1,18,'Adobe Creative Cloud',67,'piva','Software','mensile'],
    ['e3',2,5,'Affitto',780,'personale','Casa','mensile'],
    ['e4',2,14,'Spesa alimentare',284,'personale','Alimentari','unica'],
    ['e5',3,5,'Affitto',780,'personale','Casa','mensile'],
    ['e6',3,16,'Hosting e domini',129,'piva','Servizi','annuale'],
    ['e7',4,20,'Trasporti',176,'personale','Mobilità','mensile'],
    ['e8',5,22,'Commercialista',420,'piva','Professionisti','annuale']
  ].map(x => ({ id: String(x[0]), date: d(Number(x[1]),Number(x[2])), description: String(x[3]), amount: Number(x[4]), kind: x[5] as Kind, category: String(x[6]), freq: x[7] as Freq, accountId: x[5]==='piva'?'a3':'a1' }))
}

export const money = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
export const dateIt = (v: string) => new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short' }).format(new Date(`${v}T12:00:00`))
export const uid = () => crypto.randomUUID()

export function migrate(v: Partial<BudgetState>): BudgetState {
  return {
    ...demoState, ...v, version: 3,
    profile: { ...demoState.profile, ...v.profile },
    limiteSpesa: v.limiteSpesa ?? demoState.limiteSpesa,
    accounts: v.accounts ?? demoState.accounts,
    categories: v.categories ?? demoState.categories,
    assets: v.assets ?? demoState.assets,
    deadlines: v.deadlines ?? demoState.deadlines,
    expenses: (v.expenses ?? demoState.expenses).map(e => ({ freq: 'mensile' as Freq, ...e })),
    incomes: (v.incomes ?? demoState.incomes).map(i => ({ freq: 'mensile' as Freq, ...i }))
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
  const usatoLimite = limiteAttivo < Infinity ? mensileSpese / limiteAttivo : 0
  return {
    incomes, expenses, pivaIncome, taxable, contributions, tax, reserve,
    totalIncome, totalExpense, liquidity, assets,
    netWorth: liquidity + assets,
    mensileSpese, limiteAttivo, usatoLimite
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
