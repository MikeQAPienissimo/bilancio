-- Archivio privato per i documenti delle fatture.
-- Il primo segmento del percorso deve essere l'ID dell'utente autenticato.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invoices',
  'invoices',
  false,
  10485760,
  array[
    'application/pdf',
    'application/xml',
    'text/xml',
    'application/pkcs7-mime',
    'application/octet-stream',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read own invoice files" on storage.objects;
create policy "Users can read own invoice files"
on storage.objects for select
to authenticated
using (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload own invoice files" on storage.objects;
create policy "Users can upload own invoice files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update own invoice files" on storage.objects;
create policy "Users can update own invoice files"
on storage.objects for update
to authenticated
using (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own invoice files" on storage.objects;
create policy "Users can delete own invoice files"
on storage.objects for delete
to authenticated
using (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text);
