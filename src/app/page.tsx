import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (await isAuthenticated()) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-zinc-50 px-4 py-8">
      <LoginForm />
    </main>
  );
}