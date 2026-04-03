# Quickstart: User Authentication System

**Branch**: `009-user-auth` | **Date**: 2026-04-03

## Prerequisites

- Existing pdf-chatbox development environment running (backend + frontend)
- Supabase project with existing `documents`, `document_chunks`, `chat_messages` tables
- Google Cloud Console access (for OAuth credentials)

## Setup Steps

### 1. Supabase Dashboard Configuration

1. **Enable Email/Password auth**: Supabase Dashboard → Authentication → Providers → Email → Enable
   - Disable "Confirm email" for development (optional for initial release per spec)
   - Set minimum password length to 8 characters

2. **Enable Google OAuth**: Supabase Dashboard → Authentication → Providers → Google → Enable
   - Requires Google OAuth Client ID and Client Secret (see step 2)
   - Set redirect URL: `http://localhost:3000/auth/callback` (dev)

3. **Configure redirect URLs**: Supabase Dashboard → Authentication → URL Configuration
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 2. Google Cloud Console Setup

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application type)
3. Add authorized redirect URI: `<SUPABASE_URL>/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase Dashboard (step 1.2)

### 3. Environment Variables

**Backend** (`backend/.env`) — add:
```
# Existing
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# No new backend env vars needed — JWT verification uses the existing service role client
```

**Frontend** (`frontend/.env.local`) — add:
```
# Existing
NEXT_PUBLIC_API_URL=http://localhost:8000

# New
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Note: The anon key is a public key (safe to expose in frontend). It is NOT the service role key.

### 4. Database Migration

Run in Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5. Install Frontend Dependencies

```bash
cd frontend
npm install @supabase/supabase-js @supabase/ssr
```

### 6. Verify

1. Start backend: `cd backend && uvicorn main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to `http://localhost:3000` — should redirect to login page
4. Register with email/password → should land in main app
5. Upload a PDF → should work as before
6. Sign out → should redirect to login page
7. Sign in with Google (if configured) → should land in main app with same documents
