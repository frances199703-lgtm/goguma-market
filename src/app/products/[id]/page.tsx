import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Product } from "@/types";
import LikeButton from "@/app/components/LikeButton";
import DeleteButton from "@/app/components/DeleteButton";

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

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const product = data as Product;
  const isSoldOut = product.status === "판매완료";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 -ml-1.5 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-base font-semibold text-gray-900 flex-1 truncate">
            {product.title}
          </h1>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/products/${product.id}/edit`}
              className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
            >
              수정
            </Link>
            <DeleteButton productId={product.id} />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto bg-white">
        {/* 이미지 */}
        <div className="relative w-full aspect-square bg-gray-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              className={`object-cover ${isSoldOut ? "opacity-60" : ""}`}
              sizes="(max-width: 672px) 100vw, 672px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">🍠</div>
          )}

          {product.status !== "판매중" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-base font-bold px-4 py-1.5 rounded-full ${STATUS_STYLE[product.status].bg} ${STATUS_STYLE[product.status].text}`}>
                {product.status}
              </span>
            </div>
          )}
        </div>

        {/* 판매자 정보 */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg shrink-0">
            🍠
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{product.seller_name}</p>
            <p className="text-xs text-gray-400">{timeAgo(product.created_at)}</p>
          </div>
        </div>

        {/* 상품 정보 */}
        <div className="px-4 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="text-lg font-bold text-gray-900 leading-snug">{product.title}</h2>
            <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[product.status].bg} ${STATUS_STYLE[product.status].text}`}>
              {product.status}
            </span>
          </div>

          <p className="text-xs text-gray-400 mb-4">{product.category}</p>

          {product.description && (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          )}
        </div>

        {/* 가격 + 채팅 버튼 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            {/* 찜 버튼 */}
            <LikeButton productId={product.id} initialCount={product.likes_count} variant="full" />

            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</p>
            </div>

            <button
              disabled={isSoldOut}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors shrink-0"
            >
              {isSoldOut ? "판매완료" : "채팅하기"}
            </button>
          </div>
        </div>

        {/* fixed 버튼 여백 */}
        <div className="h-24" />
      </div>
    </div>
  );
}
