import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase-config'

function jsonError(error:string,status:number){return NextResponse.json({error},{status})}

async function getAdmin(request:Request){
  const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY
  const adminEmail=process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if(!serviceRoleKey||!adminEmail)return{error:jsonError('Gestione inviti non ancora configurata.',503)}
  const authorization=request.headers.get('authorization')
  const token=authorization?.startsWith('Bearer ')?authorization.slice(7):''
  if(!token)return{error:jsonError('Accesso non autorizzato.',401)}
  const verifier=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
  const {data:{user},error}=await verifier.auth.getUser(token)
  if(error||!user)return{error:jsonError('Sessione scaduta.',401)}
  if(user.email?.toLowerCase()!==adminEmail)return{error:jsonError('Funzione riservata all’amministratore.',403)}
  const admin=createClient(SUPABASE_URL,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
  return{admin}
}

export async function GET(request:Request){
  const access=await getAdmin(request)
  if('error'in access)return access.error
  const {data,error}=await access.admin.auth.admin.listUsers({page:1,perPage:100})
  if(error)return jsonError(error.message,502)
  return NextResponse.json({users:data.users.map(user=>({id:user.id,email:user.email??'',createdAt:user.created_at,lastSignInAt:user.last_sign_in_at??null,confirmedAt:user.email_confirmed_at??null}))})
}

export async function POST(request:Request){
  const access=await getAdmin(request)
  if('error'in access)return access.error
  let body:{email?:unknown}
  try{body=await request.json()}catch{return jsonError('Richiesta non valida.',400)}
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():''
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return jsonError('Indirizzo email non valido.',400)
  const siteUrl=process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/,'')??new URL(request.url).origin
  const {data,error}=await access.admin.auth.admin.inviteUserByEmail(email,{redirectTo:`${siteUrl}/auth/update-password`})
  if(error)return jsonError(error.message,422)
  return NextResponse.json({user:{id:data.user.id,email:data.user.email??email,createdAt:data.user.created_at,lastSignInAt:data.user.last_sign_in_at??null,confirmedAt:data.user.email_confirmed_at??null}})
}
