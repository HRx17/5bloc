-- Reliable conversation creation under RLS (used by messaging API).

CREATE OR REPLACE FUNCTION public.create_conversation(
  p_type text,
  p_title text DEFAULT NULL,
  p_project_id uuid DEFAULT NULL,
  p_member_ids uuid[] DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := public.my_profile_id();
  conv_id uuid;
  mid uuid;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.conversations (type, title, project_id, created_by, org_id)
  VALUES (
    COALESCE(NULLIF(p_type, ''), 'group'),
    p_title,
    p_project_id,
    me,
    (SELECT org_id FROM public.profiles WHERE id = me)
  )
  RETURNING id INTO conv_id;

  INSERT INTO public.conversation_members (conversation_id, profile_id)
  VALUES (conv_id, me);

  FOREACH mid IN ARRAY COALESCE(p_member_ids, '{}')
  LOOP
    IF mid IS NOT NULL AND mid <> me THEN
      INSERT INTO public.conversation_members (conversation_id, profile_id)
      VALUES (conv_id, mid);
    END IF;
  END LOOP;

  RETURN conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_conversation(text, text, uuid, uuid[]) TO authenticated;
