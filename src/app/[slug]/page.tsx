import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SlugRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const link = await prisma.shortLink.findUnique({ where: { slug } });

  if (!link) {
    notFound();
  }

  if (!link.isActive) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">
            Link unavailable
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            This link has been disabled by its owner.
          </p>
        </div>
      </main>
    );
  }

  redirect(link.destinationUrl);
}