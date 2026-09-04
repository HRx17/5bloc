CREATE TABLE public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  org_id uuid references public.organisations(id) on delete set null,
  kind text not null default 'card',
  label text,
  brand text,
  last4 text,
  upi_vpa text,
  exp_month int,
  exp_year int,
  provider text default 'razorpay',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
CREATE INDEX payment_methods_profile_idx ON public.payment_methods(profile_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payment methods" ON public.payment_methods FOR ALL TO authenticated
  USING (profile_id = public.my_profile_id()) WITH CHECK (profile_id = public.my_profile_id());