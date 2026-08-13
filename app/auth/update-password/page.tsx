'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { CheckCircle2, KeyRound, Landmark } from 'lucide-react'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase-config'

const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY)

export default function UpdatePasswordPage(){
  const router=useRouter()
  const [ready,setReady]=useState(false)
  const [password,setPassword]=useState('')
  const [confirmation,setConfirmation]=useState('')
  const [loading,setLoading]=useState(false)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setReady(Boolean(data.session)))
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setReady(Boolean(session)))
    return()=>subscription.unsubscribe()
  },[])

  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();setError('');setMessage('')
    if(password.length<8){setError('La password deve contenere almeno 8 caratteri.');return}
    if(password!==confirmation){setError('Le due password non coincidono.');return}
    setLoading(true)
    const {error:updateError}=await supabase.auth.updateUser({password})
    setLoading(false)
    if(updateError){setError(updateError.message);return}
    setMessage('Password impostata correttamente. Ora puoi entrare nel tuo spazio.')
    setTimeout(()=>router.replace('/'),1200)
  }

  return <main className="grid min-h-screen place-items-center bg-background p-4 text-foreground"><div className="w-full max-w-sm"><div className="mb-8 flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Landmark className="size-5"/></div><div><p className="font-bold">Bilancio</p><p className="text-xs text-muted-foreground">Sicurezza account</p></div></div><section className="rounded-2xl border bg-card p-6 shadow-sm"><div className="mb-5 flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><KeyRound className="size-5"/></div><div><h1 className="text-xl font-semibold">Imposta la password</h1><p className="mt-1 text-sm text-muted-foreground">Vale per un nuovo invito e per il recupero di un account esistente.</p></div></div>{!ready&&!message?<div className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">Apri questa pagina dal link ricevuto via email. Se il link è scaduto, richiedine uno nuovo dalla schermata di accesso.</div>:message?<div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary"><CheckCircle2 className="mr-2 inline size-4"/>{message}</div>:<form onSubmit={submit} className="flex flex-col gap-4"><label className="text-sm font-medium">Nuova password<input type="password" minLength={8} required autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border bg-background px-3 focus:border-primary focus:outline-none"/></label><label className="text-sm font-medium">Ripeti password<input type="password" minLength={8} required autoComplete="new-password" value={confirmation} onChange={event=>setConfirmation(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border bg-background px-3 focus:border-primary focus:outline-none"/></label>{error&&<p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<button disabled={loading} className="h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading?'Salvataggio...':'Imposta password'}</button></form>}</section></div></main>
}
