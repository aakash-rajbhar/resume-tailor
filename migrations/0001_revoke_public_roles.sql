-- Public Supabase roles must not be able to touch the app tables.
-- Row Level Security is already enabled on every table without policies, which
-- denies access to `anon` and `authenticated`; revoking the grants makes the
-- intent explicit and holds even if RLS is ever disabled by mistake.
DO $$
DECLARE
  table_name text;
  role_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users',
    'accounts',
    'sessions',
    'verification_tokens',
    'profiles',
    'experience',
    'projects',
    'skills',
    'education',
    'certifications',
    'jobs',
    'verified_facts',
    'llm_cache'
  ] LOOP
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
        EXECUTE format('REVOKE ALL ON TABLE %I FROM %I', table_name, role_name);
      END IF;
    END LOOP;
  END LOOP;
END $$;
