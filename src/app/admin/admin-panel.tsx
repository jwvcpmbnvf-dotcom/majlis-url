"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

interface LinkDto {
  id: string;
  slug: string;
  destinationUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function linkFromOrigin(slug: string): string {
  return `${window.location.origin}/${slug}`;
}

export default function AdminPanel() {
  const router = useRouter();
  const [links, setLinks] = useState<LinkDto[]>([]);
  const [destinationUrl, setDestinationUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadLinks = useCallback(async () => {
    const response = await fetch("/api/links");
    if (response.status === 401) {
      router.replace("/");
      router.refresh();
      return;
    }
    const data = await response.json().catch(() => null);
    if (response.ok && data && Array.isArray(data.links)) {
      setLinks(data.links);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    async function fetchLinks() {
      const response = await fetch("/api/links");
      if (response.status === 401) {
        router.replace("/");
        router.refresh();
        return;
      }
      const data = await response.json().catch(() => null);
      if (response.ok && data && Array.isArray(data.links)) {
        setLinks(data.links);
      }
      setLoading(false);
    }
    fetchLinks();
  }, [router]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setShortUrl(null);
    setCreating(true);
    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationUrl, slug }),
      });
      if (response.status === 401) {
        router.replace("/");
        router.refresh();
        return;
      }
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          (data && typeof data.error === "string" ? data.error : null) ??
            "Failed to create link"
        );
        return;
      }
      if (data && typeof data.shortUrl === "string") {
        setShortUrl(data.shortUrl);
      }
      setDestinationUrl("");
      setSlug("");
      await loadLinks();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(link: LinkDto) {
    setError(null);
    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      if (response.status === 401) {
        router.replace("/");
        router.refresh();
        return;
      }
      if (!response.ok) {
        setError("Failed to update link");
        return;
      }
      await loadLinks();
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  async function handleDelete(link: LinkDto) {
    setError(null);
    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (response.status === 401) {
        router.replace("/");
        router.refresh();
        return;
      }
      if (!response.ok) {
        setError("Failed to delete link");
        return;
      }
      await loadLinks();
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Ignore; session will be invalid on the next request anyway.
    }
    router.replace("/");
    router.refresh();
  }

  async function handleCopy(link: LinkDto) {
    try {
      await navigator.clipboard.writeText(linkFromOrigin(link.slug));
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setError("Could not copy the link");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">URL Shortener</h1>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          Logout
        </button>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium text-zinc-700">New short link</h2>
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="destination"
              className="block text-sm font-medium text-zinc-700"
            >
              Destination URL
            </label>
            <input
              id="destination"
              type="url"
              required
              placeholder="https://drive.google.com/..."
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-zinc-700"
            >
              Short code <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <div className="mt-1 flex items-center">
              <span className="rounded-l-lg border border-r-0 border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
                {typeof window !== "undefined" ? window.location.origin.replace(/^https?:\/\//, "") : ""}/
              </span>
              <input
                id="slug"
                type="text"
                placeholder="a"
                maxLength={64}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="block w-full rounded-r-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              />
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Letters, numbers, - and _. Leave empty for an automatic short code.
            </p>
          </div>

          {shortUrl ? (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2">
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2"
              >
                {shortUrl}
              </a>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard
                    .writeText(shortUrl)
                    .then(() => setCopiedId("new"))
                    .catch(() => setError("Could not copy the link"))
                }
                className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                {copiedId === "new" ? "Copied" : "Copy"}
              </button>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-medium text-zinc-700">Saved links</h2>
        {loading ? (
          <p className="mt-2 text-sm text-zinc-500">Loading...</p>
        ) : links.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No links yet.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {links.map((link) => (
              <li
                key={link.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <a
                    href={linkFromOrigin(link.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm font-medium text-zinc-900"
                  >
                    /{link.slug}
                  </a>
                  <span
                    className={
                      link.isActive
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                        : "rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600"
                    }
                  >
                    {link.isActive ? "Active" : "Disabled"}
                  </span>
                </div>
                <p
                  title={link.destinationUrl}
                  className="mt-1 truncate text-sm text-zinc-500"
                >
                  {link.destinationUrl}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <button
                    onClick={() => handleCopy(link)}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-700 transition-colors hover:bg-zinc-100"
                  >
                    {copiedId === link.id ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => handleToggle(link)}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-700 transition-colors hover:bg-zinc-100"
                  >
                    {link.isActive ? "Disable" : "Enable"}
                  </button>
                  {confirmDeleteId === link.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-500">Delete?</span>
                      <button
                        onClick={() => handleDelete(link)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-white transition-colors hover:bg-red-700"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-700 transition-colors hover:bg-zinc-100"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(link.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-red-600 transition-colors hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}