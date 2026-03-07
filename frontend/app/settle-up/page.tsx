'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Redirect old /settle-up route to dashboard
export default function SettleUpRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Redirecting to Dashboard...
    </div>
  );
}
