export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">404</h1>
        <p className="mt-1 text-sm text-zinc-500">
          The page you are looking for was not found.
        </p>
      </div>
    </main>
  );
}