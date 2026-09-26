import { AdminPanel } from "@/components/AdminPanel";

export const metadata = {
  title: "Admin — Maltina",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="admin-page">
      <AdminPanel />
    </main>
  );
}
