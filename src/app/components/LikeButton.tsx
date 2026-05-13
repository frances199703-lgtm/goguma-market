"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  productId: string;
  initialCount: number;
  /** "icon" = 아이콘만, "full" = 아이콘 + 카운트 + 테두리 박스 */
  variant?: "icon" | "full";
}

export default function LikeButton({ productId, initialCount, variant = "icon" }: Props) {
  const [isLiked, setIsLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsLiked(localStorage.getItem(`liked_${productId}`) === "true");
  }, [productId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);

    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setCount((c) => (newLiked ? c + 1 : Math.max(c - 1, 0)));

    try {
      const supabase = createClient();
      await supabase.rpc(newLiked ? "increment_likes" : "decrement_likes", {
        p_id: productId,
      });
      localStorage.setItem(`liked_${productId}`, String(newLiked));
    } catch {
      setIsLiked(!newLiked);
      setCount((c) => (newLiked ? Math.max(c - 1, 0) : c + 1));
    } finally {
      setLoading(false);
    }
  };

  if (variant === "full") {
    return (
      <button
        onClick={toggle}
        className={`flex items-center gap-1.5 p-2.5 border rounded-xl transition-colors ${
          isLiked
            ? "border-red-300 text-red-500 bg-red-50"
            : "border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400"
        }`}
      >
        <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {count > 0 && <span className="text-sm font-medium">{count}</span>}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1 transition-colors ${
        isLiked ? "text-red-500" : "text-gray-400 hover:text-red-400"
      }`}
    >
      <svg className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      {count > 0 && <span className="text-xs">{count}</span>}
    </button>
  );
}
