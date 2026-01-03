import { useCreateChat } from "@/app/api/query/message";
import SquareBadge from "@/components/common/SquareBadge";
import UserNickname from "@/components/common/UserNickname";
import { DEFAULT_PRODUCT_IMAGE } from "@/constants/common";
import useToastStore from "@/store/toastStore";
import { IProductsContractOffered } from "@/types";
import { getFormattingDate } from "@/utils/getFormattingDate";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface IProposalListProps {
  data: IProductsContractOffered[];
}

const ProposalList = ({ data }: IProposalListProps) => {
  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <div className="pt-20 pb-20 text-center text-dark-gray-400">
        보낸 제안이 없습니다.
      </div>
    );
  }

  return (
    <div className="pt-6 gap-5 flex flex-col">
      {data?.map((item) => (
        <ProposalItem key={item.offer_id} {...item} />
      ))}
    </div>
  );
};

const ProposalItem = ({
  offer_id,
  cover_image_path,
  title,
  author_name,
  illustrator_name,
  created_date,
  waiting_for_free_yn,
  six_nine_path_yn,
  offer_price,
  offer_profit,
  author_profit,
  author_accept_yn,
  use_yn,
  author_user_id,
}: IProductsContractOffered) => {
  const createChatMutation = useCreateChat();
  const { setToast } = useToastStore();
  const router = useRouter();

  // Determine status based on author_accept_yn
  const getStatus = () => {
    if (author_accept_yn === "Y") {
      return { label: "수락됨", color: "bg-[#e6f0ff] text-[#2f7fff]" };
    } else if (author_accept_yn === "N") {
      return { label: "거절", color: "bg-[#feeaea] text-red-100" };
    }
    return { label: "확인중", color: "bg-[#e6f0ff] text-[#2f7fff]" };
  };

  const status = getStatus();

  const handleCreateChat = (targetUserId: number) => {
    router.push("/product/message");
    // if (createChatMutation.isPending) return;

    // createChatMutation.mutate(
    //   {
    //     target_user_id: targetUserId,
    //   },
    //   {
    //     onSuccess: (response: any) => {
    //       setToast({
    //         message: "채팅방이 생성되었습니다.",
    //         type: "success",
    //       });
    //       router.push("/product/message");
    //     },
    //     onError: (error: any) => {
    //       setToast({
    //         message:
    //           error?.response?.data?.message || "채팅방 생성에 실패했습니다.",
    //         type: "error",
    //       });
    //     },
    //   }
    // );
  };

  // Format price
  const formatPrice = (price: number) => {
    return `${(price / 10000).toLocaleString()}만원`;
  };

  // Determine badge types
  const badgeTypes: ("waitForFree" | "timePass" | "freeEpisodes")[] = [];
  if (waiting_for_free_yn === "Y") badgeTypes.push("waitForFree");
  if (six_nine_path_yn === "Y") badgeTypes.push("timePass");

  return (
    <div className="flex gap-4 border-t pt-5">
      <div className="relative flex items-start min-h-[120px] min-w-[80px] overflow-hidden rounded-md">
        <Image
          src={cover_image_path || DEFAULT_PRODUCT_IMAGE}
          fill
          alt={title}
          objectFit="cover"
        />
        {badgeTypes.length > 0 && (
          <div className="z-10 absolute bottom-[2px] right-[2px]">
            <SquareBadge
              type={badgeTypes}
              size="small"
              // freeEpisodeNumber={freeEpisodeNumber}
              // timePassValue={timePassValue}
            />
          </div>
        )}
      </div>
      <div className="my-auto gap-2 md:flex w-full">
        <div className="gap-2 flex-[7]">
          <div className="text-15pxr md:text-17pxr font-semibold">{title}</div>
          <div className="flex gap-2">
            {/* <div className="text-12pxr md:text-14pxr text-dark-gray-500">
              {author_name}
              {illustrator_name && ` / ${illustrator_name}`}
            </div> */}
            <UserNickname
              userNickname={author_name}
              product={
                {
                  badge: {
                    // authorEventLevelBadgeImagePath: writerLevelImage,
                  },
                } as any
              }
            />
            {illustrator_name ? (
              <>
                <span className="text-gray-300">|</span>
                <div className=" text-dark-gray-500 text-12pxr md:text-14pxr">
                  {illustrator_name}
                </div>
              </>
            ) : null}
          </div>
          <div className="text-11pxr md:text-12pxr text-dark-gray-500">
            {getFormattingDate(created_date, "YYYY.MM.DD")}
          </div>
        </div>
        <div className="gap-2 flex-[3]">
          <div className="font-normal text-11pxr md:text-14pxr">
            <span className="text-dark-gray-500">제시한 선인세 :</span>{" "}
            {formatPrice(offer_price)}
          </div>
          <div className="font-normal text-11pxr md:text-14pxr">
            <span className="text-dark-gray-500">
              정산비 CP {offer_profit} :
            </span>{" "}
            작가 {author_profit}
          </div>
        </div>

        {!author_accept_yn ? (
          <div
            className={`w-[38px] h-[20px] md:w-[74px] md:h-[30px] md:text-14pxr rounded-full text-10pxr font-semibold flex items-center justify-center ml-auto ${"bg-[#e6f0ff] text-[#2f7fff]"}`}
          >
            {status.label}
          </div>
        ) : author_accept_yn === "N" ? (
          <div
            className={`w-[38px] h-[20px] md:w-[74px] md:h-[30px] md:text-14pxr rounded-full text-10pxr font-semibold flex items-center justify-center ml-auto ${
              author_accept_yn === "N"
                ? "bg-[#feeaea] text-red-100"
                : "bg-[#e6f0ff] text-[#2f7fff]"
            }`}
          >
            {status.label}
          </div>
        ) : (
          <button
            className="w-[74px] h-[30px] border rounded-full flex gap-1 items-center justify-center text-12pxr mt-1"
            onClick={() => handleCreateChat(author_user_id)}
          >
            <Image
              src="/images/message-full.svg"
              alt="메세지 보내기"
              width={15}
              height={15}
            />
            메세지
          </button>
        )}
      </div>
    </div>
  );
};

export default ProposalList;
