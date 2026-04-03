import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense>
        <AuthForm />
      </Suspense>
    </div>
  );
}
