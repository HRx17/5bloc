-- Calendar scheduling, location/link, reminder tracking, and meeting email prefs.

ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS meeting_url text,
  ADD COLUMN IF NOT EXISTS reminder_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS attendee_emails text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes text;

UPDATE public.meetings
SET starts_at = (meeting_date::timestamp AT TIME ZONE 'UTC')
WHERE starts_at IS NULL AND meeting_date IS NOT NULL;

UPDATE public.meetings
SET status = CASE
  WHEN starts_at IS NOT NULL AND starts_at < now() THEN 'completed'
  ELSE 'scheduled'
END
WHERE status IS NULL OR status = '' OR status = 'scheduled';

CREATE INDEX IF NOT EXISTS meetings_starts_at_idx ON public.meetings (starts_at);
CREATE INDEX IF NOT EXISTS meetings_reminder_due_idx ON public.meetings (starts_at)
  WHERE reminder_sent_at IS NULL AND reminder_minutes > 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_meetings boolean NOT NULL DEFAULT true;
