REVOKE EXECUTE ON FUNCTION public.accept_project_invite(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.accept_org_invite(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_invoice_number(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_user(uuid, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_messaging_profile() FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_messaging_profiles(text, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_conversation(text, text, uuid, uuid[]) FROM anon;