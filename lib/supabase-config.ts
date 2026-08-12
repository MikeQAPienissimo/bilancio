export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ?? 'https://qqijeduwhggffmffbunb.supabase.co'

// La chiave anon di Supabase è pubblica per definizione. La sicurezza dei dati
// deve essere garantita dalle policy RLS, non nascondendo questa chiave.
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxaWplZHV3aGdnZmZtZmZidW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzQ2NzQsImV4cCI6MjEwMjExMDY3NH0.xRHLaN7QPOUWYToSUecXWYvw3gPa87YFhB2taGqilmI'
