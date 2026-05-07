"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }
    params.delete("page");
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={submit} className="relative">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
        size={18}
      />
      <input
        type="text"
        placeholder="Search by drug, mutation, sponsor, or condition…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full pl-12 pr-12 py-3.5 text-base bg-paper-raised"
      />
      {pending && (
        <Loader2
          className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint animate-spin"
          size={18}
        />
      )}
    </form>
  );
}
