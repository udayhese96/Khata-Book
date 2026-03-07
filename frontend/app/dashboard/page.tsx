'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Redirect /dashboard to home page
export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Redirecting...
    </div>
  );
}
