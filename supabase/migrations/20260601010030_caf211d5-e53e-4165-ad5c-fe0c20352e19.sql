ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS description TEXT;
CREATE INDEX IF NOT EXISTS idx_activities_owner_status ON public.activities(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_activities_updated ON public.activities(updated_at DESC);