'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const isPublicForGuests = pathname === '/' || pathname.startsWith('/auth');

    function buildRedirectUrl() {
      const search = searchParams.toString();
      const full = search ? `${pathname}?${search}` : pathname;
      return `/auth?redirect=${encodeURIComponent(full)}`;
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !isPublicForGuests) {
        router.replace(buildRedirectUrl());
      } else if (session && pathname.startsWith('/auth')) {
        router.replace('/');
      } else {
        setReady(true);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session && !isPublicForGuests) {
          router.replace(buildRedirectUrl());
        } else if (session && pathname.startsWith('/auth')) {
          router.replace('/');
        }
        setReady(true);
      }
    );

    return () => subscription.unsubscribe();
  }, [pathname, searchParams, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
