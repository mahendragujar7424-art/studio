
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';

/**
 * Next.js Layout for the /dashboard route group.
 * This ensures the Sidebar and core dashboard structure are persistent
 * and do not unmount during navigation between dashboard sub-pages.
 */
export default function DashboardPersistentLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
