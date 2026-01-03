"use client";

import RecommendFormArea from "@/components/review/RecommendFormArea";
import RecommendProductSearch from "@/components/review/RecommendProductSearch";
import { IProduct } from "@/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Page = () => {
  const router = useRouter();
  const [product, setProduct] = useState<IProduct | null>(null);

  return (
    <div className="relative bg-white h-full max-w-[1120px] mx-auto flex flex-col items-center">
      <header className="flex justify-center items-center h-[60px] border-b relative w-full">
        추천작품 쓰기
        <button
          className="w-[18px] h-[18px] absolute right-3"
          onClick={() => {
            router.back();
          }}
        >
          <Image src="/images/close.svg" alt="back" fill />
        </button>
      </header>
      <div className="md:max-w-[800px] w-full p-4">
        <RecommendProductSearch product={product} setProduct={setProduct} />
        <RecommendFormArea product={product} />
      </div>
    </div>
  );
};

export default Page;
