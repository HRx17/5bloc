revoke execute on function public.is_conversation_member(uuid) from anon, public;
revoke execute on function public.get_or_create_project_channel(uuid, text) from anon, public;
revoke execute on function public.list_project_channel_messages(uuid, text, integer) from anon, public;
revoke execute on function public.post_project_channel_message(uuid, text, text) from anon, public;
grant execute on function public.is_conversation_member(uuid) to authenticated;
grant execute on function public.get_or_create_project_channel(uuid, text) to authenticated;
grant execute on function public.list_project_channel_messages(uuid, text, integer) to authenticated;
grant execute on function public.post_project_channel_message(uuid, text, text) to authenticated;