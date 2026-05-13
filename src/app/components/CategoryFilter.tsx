import Link from "next/link";
import { CATEGORIES } from "@/types";

const ALL_CATEGORIES = ["전체", ...CATEGORIES];

export default function CategoryFilter({ selected }: { selected: string }) {
  return (
    <>
      {ALL_CATEGORIES.map((cat) => (
        <Link
          key={cat}
          href={cat === "전체" ? "/" : `/?category=${encodeURIComponent(cat)}`}
          className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
            selected === cat
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {cat}
        </Link>
      ))}
    </>
  );
}
