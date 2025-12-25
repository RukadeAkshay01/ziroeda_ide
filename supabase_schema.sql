-- ==========================================
-- ZiroEDA COMPLETE SCHEMA (FRESH INSTALL SAFE)
-- ==========================================
-- 1. CLEANUP (Safe for fresh projects)
-- We use CASCADE to automatically remove dependent triggers and foreign keys.
-- We drop functions separately to ensure a clean slate.
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.project_versions CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP FUNCTION IF EXISTS update_likes_count CASCADE;
DROP FUNCTION IF EXISTS update_comments_count CASCADE;
DROP FUNCTION IF EXISTS update_forks_count CASCADE;
DROP FUNCTION IF EXISTS increment_views CASCADE;
DROP FUNCTION IF EXISTS increment_forks CASCADE;
-- 2. CREATE TABLES
-- Projects
CREATE TABLE public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text NOT NULL,
  description text,
  owner_id text NOT NULL, 
  owner_name text,
  is_public boolean DEFAULT false,
  tags text[],
  fork_of_id uuid REFERENCES public.projects(id),
  forks_count int DEFAULT 0,
  likes_count int DEFAULT 0,
  views_count int DEFAULT 0,
  comments_count int DEFAULT 0,
  design jsonb
);
-- Versions
CREATE TABLE public.project_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  version_number int NOT NULL,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  design jsonb NOT NULL,
  preview_url text,
  commit_message text
);
-- Comments
CREATE TABLE public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id text NOT NULL,
  user_name text,
  content text NOT NULL,
  is_resolved boolean DEFAULT false,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Likes
CREATE TABLE public.likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id text NOT NULL,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(project_id, user_id)
);
-- 3. CREATE FUNCTIONS & TRIGGERS
-- Auto-update Likes Count
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.projects SET likes_count = likes_count + 1 WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.projects SET likes_count = likes_count - 1 WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE PROCEDURE update_likes_count();
-- Auto-update Comments Count
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.projects SET comments_count = comments_count + 1 WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.projects SET comments_count = comments_count - 1 WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_comment_change
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE PROCEDURE update_comments_count();
-- Auto-update Forks Count
CREATE OR REPLACE FUNCTION update_forks_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.fork_of_id IS NOT NULL) THEN
    UPDATE public.projects SET forks_count = forks_count + 1 WHERE id = NEW.fork_of_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_project_fork
AFTER INSERT ON public.projects
FOR EACH ROW EXECUTE PROCEDURE update_forks_count();
-- Increment Views RPC
CREATE OR REPLACE FUNCTION increment_views(row_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.projects
  SET views_count = views_count + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
-- 4. DISABLE SECURITY (Make it Public)
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;


ALTER TABLE projects ADD COLUMN chat_history jsonb;

ALTER TABLE projects ADD COLUMN public_access text DEFAULT 'private';