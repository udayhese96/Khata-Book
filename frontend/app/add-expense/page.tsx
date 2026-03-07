'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Redirect old /add-expense route to new /add-purchase
export default function AddExpenseRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/add-purchase');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Redirecting to Add Purchase...
    </div>
  );
}
