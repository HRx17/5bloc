alter table public.conversation_members
  add constraint conversation_members_unique unique (conversation_id, profile_id);

create or replace function public.is_conversation_member(_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_members cm
    join public.profiles p on p.id = cm.profile_id
    where cm.conversation_id = _conversation_id and p.auth_id = auth.uid()
  )
$$;

create or replace function public.get_or_create_project_channel(p_project_id uuid, p_channel text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me uuid;
  v_org uuid;
  v_id uuid;
  v_channel text := lower(coalesce(nullif(trim(p_channel), ''), 'general'));
begin
  select id, org_id into v_me, v_org from public.profiles where auth_id = auth.uid();
  if v_me is null then raise exception 'No profile'; end if;
  if not public.can_access_project(p_project_id) then raise exception 'No access to project'; end if;

  select id into v_id from public.conversations
   where project_id = p_project_id and type = 'project' and lower(coalesce(title, 'general')) = v_channel
   limit 1;

  if v_id is null then
    insert into public.conversations (org_id, project_id, type, title, created_by)
    values (v_org, p_project_id, 'project', v_channel, v_me)
    returning id into v_id;
  end if;

  insert into public.conversation_members (conversation_id, profile_id)
  values (v_id, v_me)
  on conflict (conversation_id, profile_id) do nothing;

  return v_id;
end;
$$;

create or replace function public.list_project_channel_messages(
  p_project_id uuid, p_channel text default 'general', p_limit integer default 200)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_conv uuid := public.get_or_create_project_channel(p_project_id, p_channel);
  v_msgs jsonb;
begin
  select coalesce(jsonb_agg(m order by m.created_at), '[]'::jsonb) into v_msgs
  from (
    select msg.id, msg.body, msg.body as text, msg.created_at, msg.sender_id,
           coalesce(pr.full_name, pr.email, 'Someone') as sender,
           coalesce(pr.role, 'member') as role,
           msg.attachment_name, msg.attachment_url
    from public.messages msg
    left join public.profiles pr on pr.id = msg.sender_id
    where msg.conversation_id = v_conv
    order by msg.created_at desc
    limit greatest(1, least(coalesce(p_limit, 200), 500))
  ) m;
  return jsonb_build_object('channel', lower(coalesce(nullif(trim(p_channel), ''), 'general')), 'messages', v_msgs);
end;
$$;

create or replace function public.post_project_channel_message(
  p_project_id uuid, p_channel text, p_body text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_conv uuid := public.get_or_create_project_channel(p_project_id, p_channel);
  v_me uuid;
  v_row public.messages;
  v_name text;
  v_role text;
begin
  if coalesce(trim(p_body), '') = '' then raise exception 'Message body required'; end if;
  select id, coalesce(full_name, email, 'Someone'), coalesce(role, 'member')
    into v_me, v_name, v_role from public.profiles where auth_id = auth.uid();

  insert into public.messages (conversation_id, sender_id, body)
  values (v_conv, v_me, p_body)
  returning * into v_row;

  update public.conversations set last_message_at = now() where id = v_conv;

  return jsonb_build_object(
    'id', v_row.id, 'body', v_row.body, 'text', v_row.body,
    'created_at', v_row.created_at, 'sender_id', v_row.sender_id,
    'sender', v_name, 'role', v_role,
    'channel', lower(coalesce(nullif(trim(p_channel), ''), 'general'))
  );
end;
$$;

drop policy if exists messages_access on public.messages;
create policy messages_access on public.messages
  for all to authenticated
  using (public.is_conversation_member(conversation_id))
  with check (public.is_conversation_member(conversation_id) and sender_id = public.my_profile_id());

grant execute on function public.is_conversation_member(uuid) to authenticated;
grant execute on function public.get_or_create_project_channel(uuid, text) to authenticated;
grant execute on function public.list_project_channel_messages(uuid, text, integer) to authenticated;
grant execute on function public.post_project_channel_message(uuid, text, text) to authenticated;