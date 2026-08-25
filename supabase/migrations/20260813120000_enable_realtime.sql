-- Enable Realtime so list/detail cards pick up status changes without a refresh.
-- REPLICA IDENTITY FULL is required for UPDATE/DELETE events when RLS is on.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'invoices',
    'bids',
    'tenders',
    'projects',
    'documents',
    'rfis',
    'issues',
    'clients',
    'meetings',
    'project_expenses',
    'consultant_payments',
    'site_visits',
    'submittals',
    'contractors',
    'project_members',
    'permits',
    'transmittals',
    'messages'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    EXCEPTION
      WHEN undefined_table THEN NULL;
    END;
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_object THEN NULL;
      WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;
