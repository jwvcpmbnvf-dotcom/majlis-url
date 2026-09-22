import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import AdminPanel from "./admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAuthenticated())) {
    redirect("/");
  }

  return (
    <main className="flex min-h-svh justify-center bg-zinc-50 px-4 py-8">
      <div className="w-full max-w-xl">
        <AdminPanel />
      </div>
    </main>
  );
}