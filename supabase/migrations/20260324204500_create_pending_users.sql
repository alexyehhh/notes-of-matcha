CREATE TABLE IF NOT EXISTS public.pending_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS pending_users_username_key
  ON public.pending_users (username);

CREATE UNIQUE INDEX IF NOT EXISTS pending_users_email_key
  ON public.pending_users (email);

ALTER TABLE public.pending_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert pending users" ON public.pending_users;
CREATE POLICY "Anyone can insert pending users"
  ON public.pending_users
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view pending users" ON public.pending_users;
CREATE POLICY "Anyone can view pending users"
  ON public.pending_users
  FOR SELECT
  TO public
  USING (true);
