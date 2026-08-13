import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase-config'

function jsonError(error:string,status:number){return NextResponse.json({error},{status})}

const emailValue=(value:unknown)=>typeof value==='string'?value.trim().toLowerCase():''
const validEmail=(value:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

function dataSummary(value:unknown){
  const data=value&&typeof value==='object'?value as Record<string,unknown>:{}
  const count=(key:string)=>Array.isArray(data[key])?data[key].length:0
  return{
    accounts:count('accounts'),
    incomes:count('incomes'),
    expenses:count('expenses'),
    financings:count('financings'),
    assets:count('assets'),
    invoices:count('invoices'),
    benefits:count('benefits')+count('publicBenefits'),
    goals:count('goals'),
    simulations:count('simulations')
  }
}

function hasUserData(value:unknown){
  return Object.values(dataSummary(value)).some(count=>count>0)
}

async function getAdmin(request:Request){
  const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY
  const adminEmails=(process.env.ADMIN_EMAILS??process.env.ADMIN_EMAIL??'').split(',').map(email=>email.trim().toLowerCase()).filter(Boolean)
  if(!serviceRoleKey||!adminEmails.length)return{error:jsonError('Gestione inviti non ancora configurata.',503)}
  const authorization=request.headers.get('authorization')
  const token=authorization?.startsWith('Bearer ')?authorization.slice(7):''
  if(!token)return{error:jsonError('Accesso non autorizzato.',401)}
  const verifier=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
  const {data:{user},error}=await verifier.auth.getUser(token)
  if(error||!user)return{error:jsonError('Sessione scaduta.',401)}
  if(!user.email||!adminEmails.includes(user.email.toLowerCase()))return{error:jsonError('Funzione riservata all’amministratore.',403)}
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

export async function PUT(request:Request){
  const access=await getAdmin(request)
  if('error'in access)return access.error
  let body:{sourceEmail?:unknown;targetEmail?:unknown;dryRun?:unknown;replace?:unknown}
  try{body=await request.json()}catch{return jsonError('Richiesta non valida.',400)}
  const sourceEmail=emailValue(body.sourceEmail),targetEmail=emailValue(body.targetEmail)
  if(!validEmail(sourceEmail)||!validEmail(targetEmail))return jsonError('Indica due indirizzi email validi.',400)
  if(sourceEmail===targetEmail)return jsonError('Account sorgente e destinazione devono essere diversi.',400)

  const {data:userList,error:listError}=await access.admin.auth.admin.listUsers({page:1,perPage:100})
  if(listError)return jsonError(listError.message,502)
  const sourceUser=userList.users.find(user=>user.email?.toLowerCase()===sourceEmail)
  const targetUser=userList.users.find(user=>user.email?.toLowerCase()===targetEmail)
  if(!sourceUser)return jsonError(`Account sorgente non trovato: ${sourceEmail}.`,404)
  if(!targetUser)return jsonError(`Account di destinazione non trovato: ${targetEmail}.`,404)

  const [{data:sourceRow,error:sourceError},{data:targetRow,error:targetError}]=await Promise.all([
    access.admin.from('user_data').select('data,updated_at').eq('id',sourceUser.id).maybeSingle(),
    access.admin.from('user_data').select('data,updated_at').eq('id',targetUser.id).maybeSingle()
  ])
  if(sourceError)return jsonError(`Impossibile leggere l’account sorgente: ${sourceError.message}`,502)
  if(targetError)return jsonError(`Impossibile controllare la destinazione: ${targetError.message}`,502)
  if(!sourceRow?.data||!hasUserData(sourceRow.data))return jsonError('L’account sorgente non contiene dati da copiare.',422)

  const sourceData=JSON.parse(JSON.stringify(sourceRow.data)) as Record<string,unknown>
  const invoices=Array.isArray(sourceData.invoices)?sourceData.invoices as Array<Record<string,unknown>>:[]
  const attachments=invoices.filter(invoice=>typeof invoice.filePath==='string'&&invoice.filePath.length>0)
  const targetHasData=hasUserData(targetRow?.data)
  if(Boolean(body.dryRun)){
    return NextResponse.json({
      source:{email:sourceEmail,updatedAt:sourceRow.updated_at,summary:dataSummary(sourceData)},
      target:{email:targetEmail,hasData:targetHasData,updatedAt:targetRow?.updated_at??null,summary:dataSummary(targetRow?.data)},
      attachments:attachments.length
    })
  }
  if(targetHasData&&!Boolean(body.replace)){
    return NextResponse.json({error:'La destinazione contiene già dei dati.',requiresConfirmation:true}, {status:409})
  }

  const uploadedPaths:string[]=[]
  try{
    const copyStamp=Date.now()
    for(const invoice of attachments){
      const sourcePath=String(invoice.filePath)
      const {data:file,error:downloadError}=await access.admin.storage.from('invoices').download(sourcePath)
      if(downloadError||!file)throw new Error(`Allegato non leggibile: ${String(invoice.fileName??sourcePath)}.`)
      const invoiceId=String(invoice.id??'documento').replace(/[^a-zA-Z0-9_-]/g,'-')
      const sourceName=sourcePath.split('/').pop()??'allegato'
      const targetPath=`${targetUser.id}/${invoiceId}/${copyStamp}-${sourceName}`
      const {error:uploadError}=await access.admin.storage.from('invoices').upload(targetPath,file,{contentType:typeof invoice.fileType==='string'?invoice.fileType:undefined,upsert:false})
      if(uploadError)throw new Error(`Copia allegato non riuscita: ${String(invoice.fileName??sourcePath)}.`)
      uploadedPaths.push(targetPath)
      invoice.filePath=targetPath
    }
    const {error:writeError}=await access.admin.from('user_data').upsert({id:targetUser.id,data:sourceData,updated_at:new Date().toISOString()})
    if(writeError)throw new Error(`Salvataggio finale non riuscito: ${writeError.message}`)
  }catch(copyError){
    if(uploadedPaths.length)await access.admin.storage.from('invoices').remove(uploadedPaths)
    return jsonError(copyError instanceof Error?copyError.message:'Copia non riuscita.',502)
  }

  return NextResponse.json({
    copied:true,
    sourceEmail,
    targetEmail,
    summary:dataSummary(sourceData),
    attachments:uploadedPaths.length,
    sourcePreserved:true
  })
}
