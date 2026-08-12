import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase-config'

type AdvisorMessage = {
  role: 'user' | 'assistant'
  content: string
}

type AnthropicResponse = {
  content?: Array<{ type?: string; text?: string }>
  error?: { message?: string }
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
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Advisor AI non configurato: aggiungi ANTHROPIC_API_KEY su Vercel e avvia un nuovo deploy.' },
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
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5',
        max_tokens: 1_200,
        thinking: { type: 'disabled' },
        system,
        messages
      })
    })

    const data = await response.json() as AnthropicResponse
    if (!response.ok) {
      console.error('Anthropic API error', response.status, data.error?.message)
      const error = response.status === 401
        ? 'La chiave Anthropic configurata non è valida.'
        : response.status === 429
          ? 'Limite AI raggiunto. Riprova tra poco.'
          : 'Il servizio AI è temporaneamente non disponibile.'
      return NextResponse.json({ error }, { status: response.status === 429 ? 429 : 502 })
    }

    const content = data.content
      ?.filter(block => block.type === 'text' && typeof block.text === 'string')
      .map(block => block.text)
      .join('\n')
      .trim()

    if (!content) return NextResponse.json({ error: 'L’AI non ha restituito una risposta.' }, { status: 502 })
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Advisor route error', error)
    return NextResponse.json({ error: 'Errore di connessione al servizio AI.' }, { status: 502 })
  }
}
