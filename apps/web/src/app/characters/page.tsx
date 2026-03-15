"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CharactersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-zinc-500 dark:text-zinc-400">이동 중...</p>
    </div>
  );
}
