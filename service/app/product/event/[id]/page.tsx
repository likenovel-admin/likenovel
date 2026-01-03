"use client";

import { instance } from "@/app/api/axios";
import { useSelectEventDetail } from "@/app/api/query/event";
import Button from "@/components/common/Button";
import Spinner from "@/components/common/Spinner";
import ProductListCard from "@/components/event/ProductCard";
import { IProduct } from "@/types";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const { data: eventData, isLoading } = useSelectEventDetail(eventId, 1);
  const [sortedData, setSortedData] = useState<IProduct[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const event = eventData?.data;

  // Parse product_ids and fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!event?.product_ids) return;

      try {
        setIsFetching(true);

        // Parse product_ids: can be string "[2, 3, 4]" or array [2, 3, 4]
        let productIds: number[] = [];
        if (typeof event.product_ids === "string") {
          productIds = JSON.parse(event.product_ids);
        } else {
          productIds = event.product_ids;
        }

        // Fetch all product details in parallel using Promise.all
        const productDetailsPromises = productIds.map(async (productId) => {
          try {
            const response = await instance.get(
              `/v1/query/products/${productId}/details-group`
            );
            return response.data?.data?.product || null;
          } catch (err) {
            console.error(`Failed to fetch product ${productId}:`, err);
            return null;
          }
        });

        const productDetails = await Promise.all(productDetailsPromises);

        // Filter out null values and sort by productId order
        const validProducts = productDetails.filter(
          (product): product is IProduct => product !== null
        );

        // Sort by the order in product_ids array
        const sorted = validProducts.sort((a, b) => {
          const indexA = productIds.indexOf(a.productId);
          const indexB = productIds.indexOf(b.productId);
          return indexA - indexB;
        });

        setSortedData(sorted);
        setIsFetching(false);
      } catch (err) {
        console.error("Failed to parse product_ids or fetch products:", err);
        setIsFetching(false);
        setSortedData([]);
      }
    };

    fetchProductDetails();
  }, [event]);

  if (isLoading || isFetching) {
    return (
      <div className="w-full h-full md:max-w-[1120px] mx-auto flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full h-full md:max-w-[1120px] mx-auto flex items-center flex-col">
      {/* <h1 className="text-21pxr md:text-32pxr font-bold mt-4">
        {event?.title}
      </h1> */}
      {/* <span className="text-11pxr text-dark-gray-500 md:text-13pxr mt-19pxr">
        {getFormattingDate(event?.start_date || "", "YYYY.MM.DD")} ~{" "}
        {getFormattingDate(event?.end_date || "", "YYYY.MM.DD")}
      </span> */}
      {event?.detail_image_path && (
        <div className="px-0 lg:px-4 mt-32pxr w-full">
          <Image
            src={event?.detail_image_path}
            alt={event?.title}
            width={700}
            height={920}
            className="w-full h-auto"
          />
        </div>
      )}
      <div className="w-full md:max-w-[1120px] px-[20px] lg:px-0">
        <div className="h-[52px] w-full mt-[66px] pb-[22px] border-b border-[#C0C6D2]">
          <h1 className="text-21pxr md:text-24pxr font-bold mt-4 text-black-100">
            {event?.account_name}
          </h1>
        </div>
        <div className="flex flex-col gap-10pxr w-full">
          {sortedData.map((product) => (
            <ProductListCard
              key={product.productId}
              data={product}
              hasPromotionBadge
            />
          ))}
        </div>
        {event?.information && (
          <div className="mt-[66px] bg-[#FAFAFA] w-full p-[22px]">
            <div
              dangerouslySetInnerHTML={{ __html: event.information }}
              className="prose prose-sm md:prose-base max-w-none"
            />
          </div>
        )}
      </div>
      <div className="w-full md:max-w-[176px] px-4 md:px-0 mt-5">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => router.back()}
        >
          목록
        </Button>
      </div>
    </div>
  );
};

export default Page;
