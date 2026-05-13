import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Product } from "@/types";
import CategoryFilter from "./components/CategoryFilter";
import LikeButton from "./components/LikeButton";

const STATUS_STYLE: Record<Product["status"], { bg: string; text: string }> = {
  판매중: { bg: "bg-orange-100", text: "text-orange-600" },
  예약중: { bg: "bg-yellow-100", text: "text-yellow-700" },
  판매완료: { bg: "bg-gray-100", text: "text-gray-500" },
};

function formatPrice(price: number) {
  return `₩${price.toLocaleString("ko-KR")}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data: products } = await query;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xl">🍠</span>
            <span className="text-lg font-bold text-orange-500">고구마마켓</span>
          </div>

          {/* 검색바 */}
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <span className="text-sm text-gray-400">상품을 검색해보세요</span>
          </div>

          {/* 알림 */}
          <button className="shrink-0 p-1.5 text-gray-500 hover:text-orange-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.437L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>

        {/* 카테고리 칩 */}
        <div className="max-w-2xl mx-auto px-4 pb-2">
          <Suspense>
            <CategoryFilter />
          </Suspense>
        </div>
      </header>

      {/* 상품 목록 */}
      <main className="max-w-2xl mx-auto bg-white divide-y divide-gray-100">
        {!products || products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-gray-400">
            <span className="text-7xl">🍠</span>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-500">아직 등록된 상품이 없어요</p>
              <p className="text-sm mt-1">첫 번째 상품을 등록해보세요!</p>
            </div>
          </div>
        ) : (
          products.map((product: Product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="flex gap-4 p-4 hover:bg-gray-50 transition-colors active:bg-gray-100"
            >
              {/* 썸네일 */}
              <div className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-gray-100">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.title}
                    fill
                    className={`object-cover ${product.status === "판매완료" ? "opacity-50" : ""}`}
                    sizes="96px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🍠</div>
                )}
                {product.status !== "판매중" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${STATUS_STYLE[product.status].bg} ${STATUS_STYLE[product.status].text}`}>
                      {product.status}
                    </span>
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <p className={`text-sm font-medium leading-snug line-clamp-2 ${product.status === "판매완료" ? "text-gray-400" : "text-gray-900"}`}>
                    {product.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {product.seller_name} · {timeAgo(product.created_at)}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className={`text-base font-bold ${product.status === "판매완료" ? "text-gray-400" : "text-gray-900"}`}>
                    {formatPrice(product.price)}
                  </span>

                  {/* 찜 버튼 */}
                  <LikeButton productId={product.id} initialCount={product.likes_count} />
                </div>
              </div>
            </Link>
          ))
        )}
      </main>

      {/* 상품 등록 FAB */}
      <Link href="/products/new" className="fixed bottom-6 right-4 sm:right-[calc(50%-320px)] flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-sm px-5 py-3.5 rounded-full shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:-translate-y-0.5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        상품 등록
      </Link>
    </div>
  );
}
