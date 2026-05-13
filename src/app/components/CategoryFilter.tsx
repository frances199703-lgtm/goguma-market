"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/types";

const ALL_CATEGORIES = ["전체", ...CATEGORIES];

export default function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("category") ?? "전체";

  const handleSelect = (cat: string) => {
    const params = new URLSearchParams();
    if (cat !== "전체") params.set("category", cat);
    router.push(cat === "전체" ? "/" : `/?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {ALL_CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => handleSelect(cat)}
          className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
            selected === cat
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
