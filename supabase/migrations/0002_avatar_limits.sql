-- Limites do bucket de avatares: até 2 MB e só imagens png, jpeg ou webp.
-- O servidor também valida antes do upload; aqui é a garantia no Storage.

update storage.buckets
set
  file_size_limit = 2097152,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'avatars';
