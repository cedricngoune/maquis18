import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminProviders } from '@/components/admin/AdminProviders';

export const metadata: Metadata = {
  title: 'Administration — Maquis 18',
  robots: { index: false, follow: false }, // keep the back-office out of Google
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminProviders>{children}</AdminProviders>;
}
