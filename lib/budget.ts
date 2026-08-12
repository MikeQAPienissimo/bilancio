export type EntryKind = 'personale' | 'piva'
export type ExpenseKind = 'personale' | 'piva'

export type Income = { id: string; date: string; description: string; amount: number; kind: EntryKind }
export type Expense = { id: string; date: string; description: string; amount: number; kind: ExpenseKind; category: string }
export type TaxProfile = {
  name: string
  ateco: string
  profitability: number
  substituteTax: number
  contributions: number
  taxReserve: number
}
export type BudgetState = { profile: TaxProfile; incomes: Income[]; expenses: Expense[] }

const year = new Date().getFullYear()
const d = (month: number, day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

export const demoState: BudgetState = {
  profile: { name: 'Andrea Rossi', ateco: '62.01.00', profitability: 67, substituteTax: 5, contributions: 26.07, taxReserve: 35 },
  incomes: [
    { id: 'i1', date: d(1, 12), description: 'Stipendio', amount: 2200, kind: 'personale' },
    { id: 'i2', date: d(1, 24), description: 'Sito web — Studio Forma', amount: 1800, kind: 'piva' },
    { id: 'i3', date: d(2, 12), description: 'Stipendio', amount: 2200, kind: 'personale' },
    { id: 'i4', date: d(2, 27), description: 'Consulenza prodotto', amount: 2450, kind: 'piva' },
    { id: 'i5', date: d(3, 12), description: 'Stipendio', amount: 2200, kind: 'personale' },
    { id: 'i6', date: d(3, 21), description: 'Identità visiva — Noma', amount: 1320, kind: 'piva' },
    { id: 'i7', date: d(4, 12), description: 'Stipendio', amount: 2200, kind: 'personale' },
    { id: 'i8', date: d(4, 29), description: 'Consulenza UX', amount: 2100, kind: 'piva' },
    { id: 'i9', date: d(5, 12), description: 'Stipendio', amount: 2200, kind: 'personale' },
    { id: 'i10', date: d(5, 26), description: 'Dashboard SaaS', amount: 2800, kind: 'piva' },
  ],
  expenses: [
    { id: 'e1', date: d(1, 5), description: 'Affitto', amount: 780, kind: 'personale', category: 'Casa' },
    { id: 'e2', date: d(1, 18), description: 'Adobe Creative Cloud', amount: 67, kind: 'piva', category: 'Software' },
    { id: 'e3', date: d(2, 5), description: 'Affitto', amount: 780, kind: 'personale', category: 'Casa' },
    { id: 'e4', date: d(2, 14), description: 'Spesa alimentare', amount: 284, kind: 'personale', category: 'Alimentari' },
    { id: 'e5', date: d(3, 5), description: 'Affitto', amount: 780, kind: 'personale', category: 'Casa' },
    { id: 'e6', date: d(3, 16), description: 'Hosting e domini', amount: 129, kind: 'piva', category: 'Servizi' },
    { id: 'e7', date: d(4, 5), description: 'Affitto', amount: 780, kind: 'personale', category: 'Casa' },
    { id: 'e8', date: d(4, 20), description: 'Trasporti', amount: 176, kind: 'personale', category: 'Mobilità' },
    { id: 'e9', date: d(5, 5), description: 'Affitto', amount: 780, kind: 'personale', category: 'Casa' },
    { id: 'e10', date: d(5, 22), description: 'Commercialista', amount: 420, kind: 'piva', category: 'Professionisti' },
  ],
}

export const money = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
export const dateIt = (value: string) => new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`))
export const uid = () => crypto.randomUUID()

export function totals(state: BudgetState, selectedYear: number) {
  const incomes = state.incomes.filter((item) => new Date(item.date).getFullYear() === selectedYear)
  const expenses = state.expenses.filter((item) => new Date(item.date).getFullYear() === selectedYear)
  const personalIncome = incomes.filter((i) => i.kind === 'personale').reduce((a, b) => a + b.amount, 0)
  const pivaIncome = incomes.filter((i) => i.kind === 'piva').reduce((a, b) => a + b.amount, 0)
  const personalExpense = expenses.filter((i) => i.kind === 'personale').reduce((a, b) => a + b.amount, 0)
  const pivaExpense = expenses.filter((i) => i.kind === 'piva').reduce((a, b) => a + b.amount, 0)
  const taxable = pivaIncome * state.profile.profitability / 100
  const contributions = taxable * state.profile.contributions / 100
  const tax = Math.max(0, taxable - contributions) * state.profile.substituteTax / 100
  const reserve = pivaIncome * state.profile.taxReserve / 100
  return { incomes, expenses, personalIncome, pivaIncome, personalExpense, pivaExpense, totalIncome: personalIncome + pivaIncome, totalExpense: personalExpense + pivaExpense, taxable, contributions, tax, reserve, available: personalIncome + pivaIncome - personalExpense - pivaExpense - reserve }
}

export function monthlyData(state: BudgetState, selectedYear: number) {
  const labels = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
  return labels.map((month, index) => ({
    month,
    entrate: state.incomes.filter((i) => new Date(i.date).getFullYear() === selectedYear && new Date(i.date).getMonth() === index).reduce((a, b) => a + b.amount, 0),
    spese: state.expenses.filter((i) => new Date(i.date).getFullYear() === selectedYear && new Date(i.date).getMonth() === index).reduce((a, b) => a + b.amount, 0),
  }))
}
