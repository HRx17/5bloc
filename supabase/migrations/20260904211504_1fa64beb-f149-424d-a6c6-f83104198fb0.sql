CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE m RECORD;
BEGIN
  SELECT pm.id, pm.project_id, pm.role, pm.invite_email, pm.invite_expires, pm.accepted_at,
         p.name AS project_name, o.name AS org_name
  INTO m
  FROM project_members pm
  JOIN projects p ON p.id = pm.project_id
  LEFT JOIN organisations o ON o.id = p.org_id
  WHERE pm.invite_token = p_token;
  IF m.id IS NULL THEN RETURN NULL; END IF;
  RETURN to_jsonb(m);
END $$;

CREATE OR REPLACE FUNCTION public.accept_project_invite(p_token text, p_full_name text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m RECORD; v_profile uuid; v_email text;
BEGIN
  SELECT id, email INTO v_profile, v_email FROM profiles WHERE auth_id = auth.uid();
  IF v_profile IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'No profile'); END IF;

  SELECT * INTO m FROM project_members WHERE invite_token = p_token;
  IF m.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Invalid invite'); END IF;
  IF m.invite_expires IS NOT NULL AND m.invite_expires <> ''
     AND (m.invite_expires)::timestamptz < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invite expired');
  END IF;
  IF m.invite_email IS NOT NULL AND v_email IS NOT NULL
     AND lower(m.invite_email) <> lower(v_email) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invite was sent to a different email');
  END IF;

  UPDATE project_members
     SET profile_id = v_profile, accepted_at = now(), invite_token = NULL
   WHERE id = m.id;

  IF p_full_name IS NOT NULL AND btrim(p_full_name) <> '' THEN
    UPDATE profiles SET full_name = p_full_name WHERE id = v_profile AND coalesce(full_name, '') = '';
  END IF;

  RETURN jsonb_build_object('ok', true, 'project_id', m.project_id, 'role', m.role);
END $$;

CREATE OR REPLACE FUNCTION public.get_org_invite_by_token(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE m RECORD;
BEGIN
  SELECT oi.id, oi.org_id, oi.email, oi.member_role, oi.user_role, oi.expires_at, oi.accepted_at,
         o.name AS org_name
  INTO m
  FROM organisation_invites oi
  LEFT JOIN organisations o ON o.id = oi.org_id
  WHERE oi.invite_token = p_token;
  IF m.id IS NULL THEN RETURN NULL; END IF;
  RETURN to_jsonb(m);
END $$;

CREATE OR REPLACE FUNCTION public.accept_org_invite(p_token text, p_full_name text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m RECORD; v_profile uuid; v_email text;
BEGIN
  SELECT id, email INTO v_profile, v_email FROM profiles WHERE auth_id = auth.uid();
  IF v_profile IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'No profile'); END IF;

  SELECT * INTO m FROM organisation_invites WHERE invite_token = p_token;
  IF m.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Invalid invite'); END IF;
  IF m.expires_at IS NOT NULL AND m.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invite expired');
  END IF;
  IF m.email IS NOT NULL AND v_email IS NOT NULL AND lower(m.email) <> lower(v_email) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invite was sent to a different email');
  END IF;

  UPDATE profiles
     SET org_id = m.org_id,
         role = COALESCE(NULLIF(m.user_role, ''), role),
         full_name = CASE WHEN coalesce(full_name,'') = '' THEN p_full_name ELSE full_name END
   WHERE id = v_profile;

  UPDATE organisation_invites SET accepted_at = now(), invite_token = NULL WHERE id = m.id;

  RETURN jsonb_build_object('ok', true, 'org_id', m.org_id,
    'role', COALESCE(NULLIF(m.user_role, ''), 'architect'));
END $$;

CREATE OR REPLACE FUNCTION public.next_invoice_number(p_org_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE next_num int;
BEGIN
  IF NOT public.is_org_member(p_org_id) THEN
    RAISE EXCEPTION 'Not a member of this organisation';
  END IF;
  SELECT COALESCE(MAX(NULLIF(regexp_replace(invoice_number, '\D', '', 'g'), '')::int), 0) + 1
    INTO next_num FROM invoices WHERE org_id = p_org_id;
  RETURN 'INV-' || LPAD(next_num::text, 3, '0');
END $$;

CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id uuid, p_title text, p_body text DEFAULT NULL,
  p_type text DEFAULT NULL, p_href text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO notifications (user_id, title, body, type, href)
  VALUES (p_user_id, p_title, p_body, p_type, p_href)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END $$;

CREATE OR REPLACE FUNCTION public.get_my_messaging_profile()
RETURNS TABLE (id uuid, full_name text, email text, role text, avatar_url text, org_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.email, p.role, p.avatar_url, p.org_id
  FROM profiles p WHERE p.auth_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.search_messaging_profiles(search_query text, result_limit int DEFAULT 8)
RETURNS TABLE (id uuid, full_name text, email text, role text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.email, p.role, p.avatar_url
  FROM profiles p
  WHERE p.auth_id <> auth.uid()
    AND (p.email ILIKE '%' || search_query || '%' OR p.full_name ILIKE '%' || search_query || '%')
  ORDER BY p.full_name NULLS LAST
  LIMIT LEAST(GREATEST(coalesce(result_limit, 8), 1), 25)
$$;

CREATE OR REPLACE FUNCTION public.create_conversation(
  p_type text, p_title text DEFAULT NULL, p_project_id uuid DEFAULT NULL,
  p_member_ids uuid[] DEFAULT '{}')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_profile uuid; v_org uuid; v_conv uuid; v_member uuid;
BEGIN
  SELECT id, org_id INTO v_profile, v_org FROM profiles WHERE auth_id = auth.uid();
  IF v_profile IS NULL THEN RAISE EXCEPTION 'No profile'; END IF;

  INSERT INTO conversations (org_id, project_id, type, title, created_by)
  VALUES (v_org, p_project_id, coalesce(p_type, 'dm'), p_title, v_profile)
  RETURNING id INTO v_conv;

  INSERT INTO conversation_members (conversation_id, profile_id)
  VALUES (v_conv, v_profile)
  ON CONFLICT (conversation_id, profile_id) DO NOTHING;

  FOREACH v_member IN ARRAY coalesce(p_member_ids, '{}'::uuid[]) LOOP
    INSERT INTO conversation_members (conversation_id, profile_id)
    VALUES (v_conv, v_member)
    ON CONFLICT (conversation_id, profile_id) DO NOTHING;
  END LOOP;

  RETURN v_conv;
END $$;

REVOKE ALL ON FUNCTION public.get_invite_by_token(text) FROM public;
REVOKE ALL ON FUNCTION public.accept_project_invite(text, text) FROM public;
REVOKE ALL ON FUNCTION public.get_org_invite_by_token(text) FROM public;
REVOKE ALL ON FUNCTION public.accept_org_invite(text, text) FROM public;
REVOKE ALL ON FUNCTION public.next_invoice_number(uuid) FROM public;
REVOKE ALL ON FUNCTION public.notify_user(uuid, text, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.get_my_messaging_profile() FROM public;
REVOKE ALL ON FUNCTION public.search_messaging_profiles(text, int) FROM public;
REVOKE ALL ON FUNCTION public.create_conversation(text, text, uuid, uuid[]) FROM public;

GRANT EXECUTE ON FUNCTION public.get_invite_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_invite_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_project_invite(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_org_invite(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_invoice_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_user(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_messaging_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_messaging_profiles(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_conversation(text, text, uuid, uuid[]) TO authenticated;