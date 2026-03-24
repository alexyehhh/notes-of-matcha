CREATE EXTENSION IF NOT EXISTS pg_cron;

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

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$function$;

DO $$
begin
  if not exists (
    select 1
    from cron.job
    where jobname = 'cleanup_unverified_users'
  ) then
    perform cron.schedule(
      'cleanup_unverified_users',
      '0 * * * *',
      $$select public.cleanup_unverified_users();$$
    );
  end if;
end $$;
