import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

/** The "(protected)" folder is a route group: it shares this layout without adding "/protected" to the URL */
export default function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
