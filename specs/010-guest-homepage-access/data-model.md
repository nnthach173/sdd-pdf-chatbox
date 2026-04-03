# Data Model: Guest Homepage Access

**Branch**: `010-guest-homepage-access` | **Date**: 2026-04-03

## Overview

This feature introduces no new database entities, fields, or schema changes. It is a purely frontend routing and rendering change.

## Behavioral States (not persisted)

These are in-memory UI states, not data model entities.

| State | Description | Source |
|-------|-------------|--------|
| Guest (unauthenticated) | `user === null` after `supabase.auth.getUser()` | Supabase client auth state |
| Authenticated | `user !== null` with a valid session | Supabase client auth state |

## URL Shape (new query param)

The `/auth` route gains support for a `redirect` query parameter:

| Parameter | Type | Validation | Example |
|-----------|------|------------|---------|
| `redirect` | `string` (URL-encoded path) | Must start with `/` (same-origin only) | `/auth?redirect=%2F%3Fdoc%3Dabc123` |

This parameter is read by `AuthForm` after successful login. It is never stored — it exists only in the URL during the auth flow.
