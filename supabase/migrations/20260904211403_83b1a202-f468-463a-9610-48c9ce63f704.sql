CREATE OR REPLACE FUNCTION public.get_portal_project(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE p RECORD; result jsonb;
BEGIN
  SELECT * INTO p FROM projects WHERE portal_token = p_token AND portal_enabled = true;
  IF p.id IS NULL THEN RETURN NULL; END IF;
  SELECT jsonb_build_object(
    'project', to_jsonb(p) - 'portal_token',
    'org_name', (SELECT name FROM organisations o WHERE o.id = p.org_id),
    'milestones', COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.milestone_date NULLS LAST)
        FROM phase_milestones m WHERE m.project_id = p.id), '[]'::jsonb),
    'documents', COALESCE((SELECT jsonb_agg(jsonb_build_object(
          'id', d.id, 'name', d.name, 'original_filename', d.original_filename,
          'folder', d.folder, 'phase', d.phase, 'version', d.version,
          'file_type', d.file_type, 'extension', d.extension,
          'size_bytes', d.size_bytes, 'created_at', d.created_at,
          'approval_status', d.approval_status, 'approval_note', d.approval_note)
        ORDER BY d.created_at DESC)
        FROM documents d
        WHERE d.project_id = p.id AND d.shared_with_client = true AND d.status = 'active'), '[]'::jsonb),
    'questions', COALESCE((SELECT jsonb_agg(jsonb_build_object(
          'id', q.id, 'question', q.question, 'answer', q.answer,
          'created_at', q.created_at, 'answered_at', q.answered_at)
        ORDER BY q.created_at DESC)
        FROM portal_questions q WHERE q.project_id = p.id), '[]'::jsonb),
    'settings', COALESCE((SELECT to_jsonb(s) FROM client_portal_settings s WHERE s.project_id = p.id),
      jsonb_build_object('show_overview', true, 'show_documents', true, 'show_approvals', true,
        'show_questions', true, 'show_payments', true, 'show_site', true, 'show_drawings', true))
  ) INTO result;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.get_portal_payload(p_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.get_portal_project(p_token)
$$;

CREATE OR REPLACE FUNCTION public.approve_portal_document(
  p_token text, p_document_id uuid, p_action text, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_project uuid;
BEGIN
  IF p_action NOT IN ('approve','reject') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Unknown action');
  END IF;
  SELECT id INTO v_project FROM projects WHERE portal_token = p_token AND portal_enabled = true;
  IF v_project IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Portal not found'); END IF;
  UPDATE documents SET approval_status = CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'rejected' END,
    approval_note = p_note
  WHERE id = p_document_id AND project_id = v_project AND shared_with_client = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Document not shared'); END IF;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.submit_portal_question(
  p_token text, p_question text, p_name text DEFAULT NULL, p_email text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p RECORD; v_id uuid;
BEGIN
  SELECT id, org_id INTO p FROM projects WHERE portal_token = p_token AND portal_enabled = true;
  IF p.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Portal not found'); END IF;
  IF coalesce(btrim(p_question), '') = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Question required');
  END IF;
  INSERT INTO portal_questions (project_id, org_id, question, asker_name, asker_email)
  VALUES (p.id, p.org_id, left(p_question, 4000), p_name, p_email)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END $$;

CREATE OR REPLACE FUNCTION public.get_portal_document_key(p_token text, p_document_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_project uuid; d RECORD;
BEGIN
  SELECT id INTO v_project FROM projects WHERE portal_token = p_token AND portal_enabled = true;
  IF v_project IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Portal not found'); END IF;
  SELECT id, name, original_filename, r2_key, storage_path, file_type INTO d
  FROM documents WHERE id = p_document_id AND project_id = v_project AND shared_with_client = true;
  IF d.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Document not shared'); END IF;
  RETURN jsonb_build_object('ok', true, 'key', coalesce(d.r2_key, d.storage_path),
    'name', coalesce(d.name, d.original_filename), 'file_type', d.file_type);
END $$;

REVOKE ALL ON FUNCTION public.get_portal_project(text) FROM public;
REVOKE ALL ON FUNCTION public.get_portal_payload(text) FROM public;
REVOKE ALL ON FUNCTION public.approve_portal_document(text, uuid, text, text) FROM public;
REVOKE ALL ON FUNCTION public.submit_portal_question(text, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.get_portal_document_key(text, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_portal_project(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_payload(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_portal_document(text, uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_portal_question(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_document_key(text, uuid) TO anon, authenticated;