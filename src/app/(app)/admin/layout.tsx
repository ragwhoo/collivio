import { requireAdmin } from "@/lib/auth/session";
import { AdminNav } from "@/components/app/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-7xl">
      <AdminNav />
      {children}
    </div>
  );
}
