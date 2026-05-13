export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar_url?: string;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  status: "selling" | "reserved" | "sold";
  category: string;
  images: string[];
  seller_id: string;
  seller?: User;
  location?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatRoom {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  product?: Product;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
}

export interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export const CATEGORIES = [
  "디지털/가전",
  "의류/잡화",
  "가구/인테리어",
  "도서/티켓",
  "스포츠/레저",
  "유아동",
  "게임/취미",
  "뷰티/미용",
  "반려동물",
  "기타",
] as const;

export type Category = (typeof CATEGORIES)[number];
