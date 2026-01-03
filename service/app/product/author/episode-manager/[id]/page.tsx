"use client";

import { useSelectProductDetail } from "@/app/api/query/product";
import Button from "@/components/common/Button";
import { IComment } from "@/components/common/CommentArea";
import Modal from "@/components/common/Modal";
import ProductCoverArea from "@/components/episodeManager/ProductCoverArea";
import { AlarmContents } from "@/components/modal/SendAlarmModal";
import useModalStore from "@/store/modalStore";
import { IEpisode, IEvaluation, INotice, IProduct } from "@/types";
import { mergeKeysEvaluation } from "@/utils/common";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

const Page = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { setModal } = useModalStore();
  const pathSegments = pathname.split("/");
  const productId = Number(pathSegments[pathSegments.length - 1]);

  const { data, isPending, isSuccess } = useSelectProductDetail(productId);

  const { productData, evaluationData, episodes, noticeData, comments } =
    useMemo(() => {
      return {
        productData: data?.data.product as IProduct,
        evaluationData: data?.data.evaluations ?? ({} as IEvaluation),
        noticeData: (data?.data.notices as INotice[]) || [],
        episodes: (data?.data?.episodes as IEpisode[]) || [],
        comments: (data?.data?.comments as IComment[]) || [],
      };
    }, [data]);

  const handleOpenSendNotification = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModal(<AlarmContents productId={productData?.productId} />);
  };

  return (
    <div className="w-full h-auto mt-[-12px] mb-[-102px] md:mb-0">
      <div className="flex flex-col w-full max-w-[1120px] mx-auto">
        <ProductCoverArea
          evaluations={mergeKeysEvaluation(evaluationData as IEvaluation)}
          data={productData}
          isSuccess={isSuccess}
          isLoading={isPending}
          episodes={episodes}
          notices={noticeData}
          comments={comments}
        />
      </div>
      <div className="sticky px-5 pb-5 bottom-0 w-full bg-white mt-8 rounded-t-lg shadow-xl pt-4 flex md:hidden gap-2">
        <Button variant="secondary" onClick={handleOpenSendNotification}>
          독자 알림
          <span className="text-gray-400">
            {" "}
            ({productData?.remainingNotificationCount || 0}회 남음)
          </span>
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            router.push(`/making-episode/${productData.productId}`);
          }}
        >
          회차/공지 쓰기
        </Button>
      </div>
      <Modal size="sm" />
    </div>
  );
};

export default Page;
