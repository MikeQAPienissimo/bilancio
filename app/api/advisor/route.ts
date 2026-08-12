import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase-config'

type AdvisorMessage = {
  role: 'user' | 'assistant'
  content: string
}

const MAX_SYSTEM_LENGTH = 20_000
const MAX_MESSAGE_LENGTH = 4_000

function normalizeMessages(value: unknown): AdvisorMessage[] | null {
  if (!Array.isArray(value)) return null

  const messages = value.slice(-19).map((message): AdvisorMessage | null => {
    if (!message || typeof message !== 'object') return null
    const role = 'role' in message ? message.role : null
    const content = 'content' in message ? message.content : null
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null
    const cleanContent = content.trim().slice(0, MAX_MESSAGE_LENGTH)
    return cleanContent ? { role, content: cleanContent } : null
  })

  if (messages.some(message => message === null)) return null
  return messages as AdvisorMessage[]
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Advisor AI non configurato: aggiungi OPENAI_API_KEY su Vercel e avvia un nuovo deploy.' },
      { status: 503 }
    )
  }

  const authorization = request.headers.get('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) return NextResponse.json({ error: 'Accesso non autorizzato.' }, { status: 401 })

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Sessione scaduta: esci e accedi di nuovo.' }, { status: 401 })
  }

  let body: { system?: unknown; messages?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida.' }, { status: 400 })
  }

  const system = typeof body.system === 'string'
    ? body.system.trim().slice(0, MAX_SYSTEM_LENGTH)
    : ''
  const messages = normalizeMessages(body.messages)
  if (!system || !messages?.length || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Messaggio non valido.' }, { status: 400 })
  }

  try {
    const openai = new OpenAI({ apiKey })
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-5.6-luna',
      instructions: system,
      input: messages.map(message => ({ role: message.role, content: message.content })),
      reasoning: { effort: 'low' },
      max_output_tokens: 1_200
    })
    const content = response.output_text.trim()

    if (!content) return NextResponse.json({ error: 'L’AI non ha restituito una risposta.' }, { status: 502 })
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Advisor route error', error)
    if (error instanceof OpenAI.AuthenticationError) {
      return NextResponse.json({ error: 'La chiave OpenAI configurata non è valida.' }, { status: 502 })
    }
    if (error instanceof OpenAI.RateLimitError) {
      return NextResponse.json({ error: 'Limite AI raggiunto. Riprova tra poco.' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Errore di connessione al servizio OpenAI.' }, { status: 502 })
  }
}
