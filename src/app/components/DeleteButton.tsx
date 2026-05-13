"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("상품을 삭제하시겠어요? 이 작업은 되돌릴 수 없습니다.")) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch {
      alert("삭제에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors disabled:opacity-50"
    >
      {loading ? "삭제 중..." : "삭제"}
    </button>
  );
}
