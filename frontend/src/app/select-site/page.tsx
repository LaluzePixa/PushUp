'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Site Selection Page - Redirect to Sites Management
 *
 * This page redirects to the main sites management page.
 * Consolidated to avoid duplicate site management implementations.
 */
export default function SelectSitePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the sites management page
    router.replace('/setup/sites');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Redirecting to site management...</p>
      </div>
    </div>
  );
}
