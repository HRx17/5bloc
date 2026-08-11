-- Snapshot of remote get_portal_payload (SECURITY DEFINER) for fresh deploys.
-- Returns public client-portal JSON for a valid portal_token.

CREATE OR REPLACE FUNCTION public.get_portal_payload(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  proj public.projects%ROWTYPE;
  org_name text;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO proj
  FROM public.projects
  WHERE portal_token = p_token AND COALESCE(portal_enabled, true) = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT name INTO org_name FROM public.organisations WHERE id = proj.org_id;

  RETURN json_build_object(
    'project', json_build_object(
      'id', proj.id,
      'name', proj.name,
      'city', proj.city,
      'state', proj.state,
      'type', proj.type,
      'phase', COALESCE(proj.phase_key, 'pre_design'),
      'status', proj.status,
      'firmName', COALESCE(org_name, 'Architecture firm')
    ),
    'documents', COALESCE((
      SELECT json_agg(row_to_json(x))
      FROM (
        SELECT d.id, d.original_filename AS name, d.status, d.created_at
        FROM public.documents d
        WHERE d.project_id = proj.id AND COALESCE(d.shared_with_client, false) = true
        ORDER BY d.created_at DESC
      ) x
    ), '[]'::json),
    'milestones', COALESCE((
      SELECT json_agg(row_to_json(x))
      FROM (
        SELECT m.id, m.phase_key, m.label, m.completion, m.fee, m.paid
        FROM public.phase_milestones m
        WHERE m.project_id = proj.id
        ORDER BY m.created_at
      ) x
    ), '[]'::json),
    'site_updates', COALESCE((
      SELECT json_agg(row_to_json(x))
      FROM (
        SELECT v.id, v.visit_date AS date,
               COALESCE('Site visit #' || v.visit_number::text, 'Site visit') AS title,
               COALESCE(v.notes, '') AS description,
               COALESCE(v.supervisor, 'Site team') AS inspector
        FROM public.site_visits v
        WHERE v.project_id = proj.id
        ORDER BY v.visit_date DESC
      ) x
    ), '[]'::json),
    'invoices', COALESCE((
      SELECT json_agg(row_to_json(x))
      FROM (
        SELECT i.id, i.invoice_number, i.amount, i.status, i.due_date
        FROM public.invoices i
        WHERE i.project_id = proj.id AND i.status IN ('sent', 'paid', 'overdue')
        ORDER BY i.created_at DESC
      ) x
    ), '[]'::json)
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_portal_payload(text) TO anon, authenticated;
