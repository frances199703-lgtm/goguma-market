"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, Product } from "@/types";

const STATUSES: Product["status"][] = ["판매중", "예약중", "판매완료"];

export default function EditForm({ product }: { product: Product }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: product.title,
    description: product.description ?? "",
    price: String(product.price),
    seller_name: product.seller_name,
    category: product.category,
    status: product.status,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product.image_url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      let image_url = product.image_url;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);
        image_url = urlData.publicUrl;
      } else if (imagePreview === null) {
        image_url = null;
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({
          title: form.title,
          description: form.description || null,
          price: parseInt(form.price),
          image_url,
          seller_name: form.seller_name,
          category: form.category,
          status: form.status,
        })
        .eq("id", product.id);

      if (updateError) throw updateError;

      router.push(`/products/${product.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-gray-900">상품 수정</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        {/* 이미지 */}
        <div className="bg-white px-4 py-4 border-b border-gray-100">
          <div className="flex gap-3 items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 shrink-0 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-orange-400 hover:text-orange-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs">사진 변경</span>
            </button>

            {imagePreview && (
              <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="미리보기"
                  fill
                  className="object-cover"
                  unoptimized={imagePreview.startsWith("blob:")}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/50 text-white rounded-full text-xs hover:bg-black/70 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </div>

        {/* 카테고리 */}
        <div className="bg-white mt-2 px-4 py-4">
          <p className="text-sm font-medium text-gray-700 mb-3">카테고리 <span className="text-orange-500">*</span></p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm({ ...form, category: cat })}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  form.category === cat
                    ? "bg-orange-500 border-orange-500 text-white font-medium"
                    : "border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 판매 상태 */}
        <div className="bg-white mt-2 px-4 py-4">
          <p className="text-sm font-medium text-gray-700 mb-3">판매 상태</p>
          <div className="flex gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm({ ...form, status: s })}
                className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                  form.status === s
                    ? "bg-orange-500 border-orange-500 text-white font-medium"
                    : "border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 입력 필드 */}
        <div className="bg-white mt-2 divide-y divide-gray-100">
          <div className="px-4 py-3.5">
            <input
              type="text"
              placeholder="상품명 *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={100}
              className="w-full text-base text-gray-900 placeholder-gray-400 outline-none"
            />
          </div>

          <div className="px-4 py-3.5 flex items-center gap-2">
            <span className="text-gray-500 font-medium shrink-0">₩</span>
            <input
              type="number"
              placeholder="가격 *"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
              min={0}
              className="w-full text-base text-gray-900 placeholder-gray-400 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="px-4 py-3.5">
            <textarea
              placeholder="상품 설명"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={6}
              className="w-full text-base text-gray-900 placeholder-gray-400 outline-none resize-none"
            />
          </div>

          <div className="px-4 py-3.5">
            <input
              type="text"
              placeholder="판매자 이름 *"
              value={form.seller_name}
              onChange={(e) => setForm({ ...form, seller_name: e.target.value })}
              required
              className="w-full text-base text-gray-900 placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        {error && (
          <p className="mt-2 mx-4 px-4 py-3 bg-red-50 text-sm text-red-500 rounded-xl">{error}</p>
        )}

        <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-100 px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3.5 rounded-2xl transition-colors"
            >
              {loading ? "수정 중..." : "수정 완료"}
            </button>
          </div>
        </div>

        <div className="h-24" />
      </form>
    </div>
  );
}
