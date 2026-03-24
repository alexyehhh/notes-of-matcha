CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
begin
  -- Only create a profile after the user verifies their email
  if new.email_confirmed_at is null then
    return new;
  end if;

  insert into public.profiles (id, email, name, username)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'username'
  )
  on conflict (id) do update
  set
    email = coalesce(public.profiles.email, excluded.email),
    name = coalesce(public.profiles.name, excluded.name),
    username = coalesce(public.profiles.username, excluded.username);

  delete from public.pending_users where user_id = new.id;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_unverified_users()
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
declare
  deleted_count integer;
begin
  delete from auth.users
  where email_confirmed_at is null
    and created_at < now() - interval '1 hour';

  delete from public.pending_users
  where created_at < now() - interval '1 hour';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$function$;
