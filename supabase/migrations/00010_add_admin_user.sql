-- ============================================================
-- TEXTILE IMPRESSIONS — Add new admin user
-- ============================================================
-- Creates the admin account for textile.impression93@gmail.com.
-- Run this migration against your Supabase project, then use
-- "Forgot password" to set a secure login password.
-- ============================================================

DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Look up the user first to avoid duplicate conflicts.
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'textile.impression93@gmail.com';

  -- Create the auth user if it doesn't already exist.
  -- A random UUID is used as a placeholder password; the real
  -- owner should reset it via Supabase "Forgot password".
  IF v_admin_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'textile.impression93@gmail.com',
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      NOW(),
      jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email'],
        'role', 'admin'
      ),
      jsonb_build_object('full_name', 'Textile Impressions Admin'),
      NOW(),
      NOW()
    )
    RETURNING id INTO v_admin_id;
  END IF;

  -- Ensure the profile has admin privileges.
  UPDATE public.profiles
  SET
    role = 'admin',
    full_name = COALESCE(full_name, 'Textile Impressions Admin')
  WHERE id = v_admin_id;

  -- If no profile row exists yet, create one.
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    v_admin_id,
    'textile.impression93@gmail.com',
    'Textile Impressions Admin',
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;
END $$;
