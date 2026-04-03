# Data Model: User Authentication System

**Branch**: `009-user-auth` | **Date**: 2026-04-03

## Entity Relationship

```text
auth.users (Supabase-managed)
  │
  ├──1:1──► profiles (public schema)
  │           id (PK, FK → auth.users.id)
  │           display_name
  │           email
  │           avatar_url
  │           created_at
  │
  └──1:N──► documents (existing, modified)
              owner_id (TEXT) ── now stores auth.users.id instead of browser UUID
              │
              ├──1:N──► document_chunks (existing, unchanged)
              └──1:N──► chat_messages (existing, unchanged)
```

## New Table: `profiles`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, FK → `auth.users(id)` ON DELETE CASCADE | Matches Supabase Auth user ID |
| `display_name` | TEXT | | User's display name (from registration or Google profile) |
| `email` | TEXT | NOT NULL | User's email address |
| `avatar_url` | TEXT | | Profile image URL (populated from Google OAuth if available) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Account creation timestamp |

### Auto-creation Trigger

A PostgreSQL trigger on `auth.users` INSERT automatically creates a `profiles` row:

```sql
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

## Modified Table: `documents`

No schema change — `owner_id` remains TEXT. The values stored change:

| Before (008-per-user-storage) | After (009-user-auth) |
|-------------------------------|----------------------|
| Browser-generated UUID (e.g., `f47ac10b-...`) | Supabase Auth user UUID (e.g., `a1b2c3d4-...`) |
| Set from `X-User-ID` header | Extracted from verified JWT token |

Existing rows with old browser UUIDs become orphaned (per clarification — no migration).

## Unchanged Tables

- **`document_chunks`**: No changes. Referenced via `document_id` FK.
- **`chat_messages`**: No changes. Referenced via `document_id` FK.

## State Transitions

### User Lifecycle

```text
[Anonymous Visitor] ──signup──► [Registered User] ──login──► [Authenticated Session]
                                                                      │
                                                                  ◄──logout──┘
                                                                      │
                                                              [Session Expired] ──login──► [Authenticated Session]
```

### Session Lifecycle

```text
[Created] ──active use──► [Valid] ──idle > 1 hour──► [Expired] ──refresh token──► [Refreshed/Valid]
                                                          │
                                                    ──logout──► [Terminated]
```

Note: Supabase Auth handles session refresh automatically via refresh tokens. The access token (JWT) has a short TTL (default 1 hour); the refresh token lasts longer (default 1 week). `@supabase/ssr` auto-refreshes transparently.
