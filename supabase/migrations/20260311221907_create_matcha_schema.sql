
  create table "public"."flavor_profiles" (
    "id" uuid not null default gen_random_uuid(),
    "entry_id" uuid not null,
    "grassy" boolean not null default false,
    "nutty" boolean not null default false,
    "floral" boolean not null default false
      );


alter table "public"."flavor_profiles" enable row level security;


  create table "public"."matcha_entries" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null default ''::text,
    "brand" text not null default ''::text,
    "prefecture" text not null default ''::text,
    "notes" text not null default ''::text,
    "color" text not null default '#3e6f2c'::text,
    "favorite" boolean not null default false,
    "image_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."matcha_entries" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."taste_analysis" (
    "id" uuid not null default gen_random_uuid(),
    "entry_id" uuid not null,
    "sweetness" smallint not null default 5,
    "bitterness" smallint not null default 5,
    "green" smallint not null default 5,
    "umami" smallint not null default 5,
    "astringency" smallint not null default 5
      );


alter table "public"."taste_analysis" enable row level security;

CREATE UNIQUE INDEX flavor_profiles_entry_id_key ON public.flavor_profiles USING btree (entry_id);

CREATE UNIQUE INDEX flavor_profiles_pkey ON public.flavor_profiles USING btree (id);

CREATE UNIQUE INDEX matcha_entries_pkey ON public.matcha_entries USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX taste_analysis_entry_id_key ON public.taste_analysis USING btree (entry_id);

CREATE UNIQUE INDEX taste_analysis_pkey ON public.taste_analysis USING btree (id);

alter table "public"."flavor_profiles" add constraint "flavor_profiles_pkey" PRIMARY KEY using index "flavor_profiles_pkey";

alter table "public"."matcha_entries" add constraint "matcha_entries_pkey" PRIMARY KEY using index "matcha_entries_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."taste_analysis" add constraint "taste_analysis_pkey" PRIMARY KEY using index "taste_analysis_pkey";

alter table "public"."flavor_profiles" add constraint "flavor_profiles_entry_id_fkey" FOREIGN KEY (entry_id) REFERENCES public.matcha_entries(id) ON DELETE CASCADE not valid;

alter table "public"."flavor_profiles" validate constraint "flavor_profiles_entry_id_fkey";

alter table "public"."flavor_profiles" add constraint "flavor_profiles_entry_id_key" UNIQUE using index "flavor_profiles_entry_id_key";

alter table "public"."matcha_entries" add constraint "matcha_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."matcha_entries" validate constraint "matcha_entries_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."taste_analysis" add constraint "taste_analysis_astringency_check" CHECK (((astringency >= 1) AND (astringency <= 10))) not valid;

alter table "public"."taste_analysis" validate constraint "taste_analysis_astringency_check";

alter table "public"."taste_analysis" add constraint "taste_analysis_bitterness_check" CHECK (((bitterness >= 1) AND (bitterness <= 10))) not valid;

alter table "public"."taste_analysis" validate constraint "taste_analysis_bitterness_check";

alter table "public"."taste_analysis" add constraint "taste_analysis_entry_id_fkey" FOREIGN KEY (entry_id) REFERENCES public.matcha_entries(id) ON DELETE CASCADE not valid;

alter table "public"."taste_analysis" validate constraint "taste_analysis_entry_id_fkey";

alter table "public"."taste_analysis" add constraint "taste_analysis_entry_id_key" UNIQUE using index "taste_analysis_entry_id_key";

alter table "public"."taste_analysis" add constraint "taste_analysis_green_check" CHECK (((green >= 1) AND (green <= 10))) not valid;

alter table "public"."taste_analysis" validate constraint "taste_analysis_green_check";

alter table "public"."taste_analysis" add constraint "taste_analysis_sweetness_check" CHECK (((sweetness >= 1) AND (sweetness <= 10))) not valid;

alter table "public"."taste_analysis" validate constraint "taste_analysis_sweetness_check";

alter table "public"."taste_analysis" add constraint "taste_analysis_umami_check" CHECK (((umami >= 1) AND (umami <= 10))) not valid;

alter table "public"."taste_analysis" validate constraint "taste_analysis_umami_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."flavor_profiles" to "anon";

grant insert on table "public"."flavor_profiles" to "anon";

grant references on table "public"."flavor_profiles" to "anon";

grant select on table "public"."flavor_profiles" to "anon";

grant trigger on table "public"."flavor_profiles" to "anon";

grant truncate on table "public"."flavor_profiles" to "anon";

grant update on table "public"."flavor_profiles" to "anon";

grant delete on table "public"."flavor_profiles" to "authenticated";

grant insert on table "public"."flavor_profiles" to "authenticated";

grant references on table "public"."flavor_profiles" to "authenticated";

grant select on table "public"."flavor_profiles" to "authenticated";

grant trigger on table "public"."flavor_profiles" to "authenticated";

grant truncate on table "public"."flavor_profiles" to "authenticated";

grant update on table "public"."flavor_profiles" to "authenticated";

grant delete on table "public"."flavor_profiles" to "service_role";

grant insert on table "public"."flavor_profiles" to "service_role";

grant references on table "public"."flavor_profiles" to "service_role";

grant select on table "public"."flavor_profiles" to "service_role";

grant trigger on table "public"."flavor_profiles" to "service_role";

grant truncate on table "public"."flavor_profiles" to "service_role";

grant update on table "public"."flavor_profiles" to "service_role";

grant delete on table "public"."matcha_entries" to "anon";

grant insert on table "public"."matcha_entries" to "anon";

grant references on table "public"."matcha_entries" to "anon";

grant select on table "public"."matcha_entries" to "anon";

grant trigger on table "public"."matcha_entries" to "anon";

grant truncate on table "public"."matcha_entries" to "anon";

grant update on table "public"."matcha_entries" to "anon";

grant delete on table "public"."matcha_entries" to "authenticated";

grant insert on table "public"."matcha_entries" to "authenticated";

grant references on table "public"."matcha_entries" to "authenticated";

grant select on table "public"."matcha_entries" to "authenticated";

grant trigger on table "public"."matcha_entries" to "authenticated";

grant truncate on table "public"."matcha_entries" to "authenticated";

grant update on table "public"."matcha_entries" to "authenticated";

grant delete on table "public"."matcha_entries" to "service_role";

grant insert on table "public"."matcha_entries" to "service_role";

grant references on table "public"."matcha_entries" to "service_role";

grant select on table "public"."matcha_entries" to "service_role";

grant trigger on table "public"."matcha_entries" to "service_role";

grant truncate on table "public"."matcha_entries" to "service_role";

grant update on table "public"."matcha_entries" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."taste_analysis" to "anon";

grant insert on table "public"."taste_analysis" to "anon";

grant references on table "public"."taste_analysis" to "anon";

grant select on table "public"."taste_analysis" to "anon";

grant trigger on table "public"."taste_analysis" to "anon";

grant truncate on table "public"."taste_analysis" to "anon";

grant update on table "public"."taste_analysis" to "anon";

grant delete on table "public"."taste_analysis" to "authenticated";

grant insert on table "public"."taste_analysis" to "authenticated";

grant references on table "public"."taste_analysis" to "authenticated";

grant select on table "public"."taste_analysis" to "authenticated";

grant trigger on table "public"."taste_analysis" to "authenticated";

grant truncate on table "public"."taste_analysis" to "authenticated";

grant update on table "public"."taste_analysis" to "authenticated";

grant delete on table "public"."taste_analysis" to "service_role";

grant insert on table "public"."taste_analysis" to "service_role";

grant references on table "public"."taste_analysis" to "service_role";

grant select on table "public"."taste_analysis" to "service_role";

grant trigger on table "public"."taste_analysis" to "service_role";

grant truncate on table "public"."taste_analysis" to "service_role";

grant update on table "public"."taste_analysis" to "service_role";


  create policy "Users can delete own flavor profiles"
  on "public"."flavor_profiles"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.matcha_entries e
  WHERE ((e.id = flavor_profiles.entry_id) AND (e.user_id = auth.uid())))));



  create policy "Users can insert own flavor profiles"
  on "public"."flavor_profiles"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.matcha_entries e
  WHERE ((e.id = flavor_profiles.entry_id) AND (e.user_id = auth.uid())))));



  create policy "Users can update own flavor profiles"
  on "public"."flavor_profiles"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.matcha_entries e
  WHERE ((e.id = flavor_profiles.entry_id) AND (e.user_id = auth.uid())))));



  create policy "Users can view own flavor profiles"
  on "public"."flavor_profiles"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.matcha_entries e
  WHERE ((e.id = flavor_profiles.entry_id) AND (e.user_id = auth.uid())))));



  create policy "Users can delete own entries"
  on "public"."matcha_entries"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own entries"
  on "public"."matcha_entries"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own entries"
  on "public"."matcha_entries"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own entries"
  on "public"."matcha_entries"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users can view own profile"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "Users can delete own taste analysis"
  on "public"."taste_analysis"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.matcha_entries e
  WHERE ((e.id = taste_analysis.entry_id) AND (e.user_id = auth.uid())))));



  create policy "Users can insert own taste analysis"
  on "public"."taste_analysis"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.matcha_entries e
  WHERE ((e.id = taste_analysis.entry_id) AND (e.user_id = auth.uid())))));



  create policy "Users can update own taste analysis"
  on "public"."taste_analysis"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.matcha_entries e
  WHERE ((e.id = taste_analysis.entry_id) AND (e.user_id = auth.uid())))));



  create policy "Users can view own taste analysis"
  on "public"."taste_analysis"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.matcha_entries e
  WHERE ((e.id = taste_analysis.entry_id) AND (e.user_id = auth.uid())))));


CREATE TRIGGER matcha_entries_updated_at BEFORE UPDATE ON public.matcha_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


