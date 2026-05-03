import { useCreateChat } from "@/app/api/query/message";
import {
  useUserAcceptOffer,
  useUserRejectOffer,
} from "@/app/api/query/mypage/user";
import { IUserContractOffer } from "@/app/api/query/mypage/user/dto";
import { resolveProductCoverImage } from "@/constants/common";
import useConfirmStore from "@/store/confirmStore";
import useToastStore from "@/store/toastStore";
import { getFormattingDate } from "@/utils/getFormattingDate";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import UserNickname from "../common/UserNickname";
import Check from "/public/images/check.svg";
import Close from "/public/images/close.svg";

interface OfferListProps {
  data: IUserContractOffer[];
  sortType: string;
}

const OfferList = ({ data, sortType }: OfferListProps) => {
  const { setConfirm } = useConfirmStore();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const acceptOfferMutation = useUserAcceptOffer();
  const rejectOfferMutation = useUserRejectOffer();
  const createChatMutation = useCreateChat();

  // Sort data based on sortType
  const sortedData = [...data].sort((a, b) => {
    if (sortType === "latest") {
      // Sort by updated_date (newest first)
      return (
        new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime()
      );
    } else if (sortType === "alphabet") {
      // Sort by title alphabetically
      return a.title.toString().localeCompare(b.title.toString());
    }
    return 0;
  });

  const handleAccept = (offerId: number, offer: IUserContractOffer) => {
    if (acceptOfferMutation.isPending || createChatMutation.isPending) return;
    setConfirm({
      content: "이 제안을 수락하시겠습니까?",
      confirmText: "수락",
      onConfirm: () => {
        acceptOfferMutation.mutate(
          { id: offerId },
          {
            onSuccess: () => {
              // After accepting offer, automatically create chat room with the offer message
              createChatMutation.mutate(
                {
                  target_user_id: offer.offer_user_id,
                  default_message: offer.offer_message,
                },
                {
                  onSuccess: (response: any) => {
                    setToast({
                      message: "제안을 수락하고 채팅방이 생성되었습니다.",
                      type: "success",
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["selectUserContractOffers"],
                    });
                    // Navigate to the specific chat room
                    const roomId = response?.data?.data?.room_id;
                    if (roomId) {
                      router.push(`/product/message?room=${roomId}`);
                    } else {
                      router.push("/product/message");
                    }
                  },
                  onError: (error: any) => {
                    // Even if chat creation fails, the offer is still accepted
                    setToast({
                      message:
                        "제안은 수락되었으나 채팅방 생성에 실패했습니다.",
                      type: "warning",
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["selectUserContractOffers"],
                    });
                  },
                }
              );
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message || "제안 수락에 실패했습니다.",
                type: "error",
              });
            },
          }
        );
      },
    });
  };

  const handleReject = (offerId: number) => {
    if (rejectOfferMutation.isPending) return;
    setConfirm({
      content: "이 제안을 거절하시겠습니까?",
      confirmText: "거절",
      onConfirm: () => {
        rejectOfferMutation.mutate(
          { id: offerId },
          {
            onSuccess: () => {
              setToast({
                message: "제안을 거절했습니다.",
                type: "success",
              });
              queryClient.invalidateQueries({
                queryKey: ["selectUserContractOffers"],
              });
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message || "제안 거절에 실패했습니다.",
                type: "error",
              });
            },
          }
        );
      },
    });
  };

  const handleCreateChat = (targetUserId: number, offerMessage?: string) => {
    if (createChatMutation.isPending) return;

    // createChatMutation.mutate(
    //   {
    //     target_user_id: targetUserId,
    //     default_message: offerMessage,
    //   },
    //   {
    //     onSuccess: (response: any) => {
    //       setToast({
    //         message: "채팅방이 생성되었습니다.",
    //         type: "success",
    //       });
    //       // Navigate to the specific chat room
    //       const roomId = response?.data?.data?.room_id;
    //       if (roomId) {
    //         router.push(`/product/message?room=${roomId}`);
    //       } else {
    //         router.push("/product/message");
    //       }
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
    router.push("/product/message");
  };

  return (
    <ul className="px-3 md:px-0border-t md:border-0 gap-3 flex flex-col">
      {sortedData.map((offer: IUserContractOffer) => {
        // Convert API response to component props format
        const offerItem = {
          userProfileImage: offer.offerer_profile_image_path,
          userEventLevelBadgeImagePath: offer.userEventLevelBadgeImagePath,
          userNickname: offer.offerer_nickname,
          // You may want to add offer_date to the API response
          offerAmount: offer.offer_price,
          cpProfit: offer.offer_profit,
          authorProfit: offer.author_profit,
          offerAt: getFormattingDate(offer.updated_date, "YYYY.MM.DD HH:mm:ss"),
          title: offer.title,
          bookCoverImage: resolveProductCoverImage(offer.cover_image_path),
          // message: "작가님 작품 잘보고 있습니다. 진지하게 이야기 나눠보고.",
          isMessage: offer.author_accept_yn === "Y",
          isDecided: offer.author_accept_yn !== null,
          isRejected: offer.author_accept_yn === "N",
          onAccept: () => handleAccept(offer.offer_id, offer),
          onReject: () => handleReject(offer.offer_id),
          onMessage: () =>
            handleCreateChat(offer.author_user_id, offer.offer_message),
        };

        return (
          <li key={offer.offer_id}>
            <OfferItem
              {...offerItem}
              isLoading={
                acceptOfferMutation.isPending ||
                rejectOfferMutation.isPending ||
                createChatMutation.isPending
              }
            />
          </li>
        );
      })}
    </ul>
  );
};

interface OfferItemProps {
  userProfileImage: string;
  userNickname: string;
  userEventLevelBadgeImagePath: string;
  offerAmount: number;
  cpProfit: number;
  authorProfit: number;
  offerAt: string;
  title: string;
  bookCoverImage: string;
  // message: string;
  isMessage: boolean;
  isDecided: boolean;
  isRejected: boolean;
  isLoading: boolean;
  onAccept: () => void;
  onReject: () => void;
  onMessage: () => void;
}

const OfferItem = ({
  userProfileImage,
  userNickname,
  userEventLevelBadgeImagePath,
  offerAmount,
  cpProfit,
  authorProfit,
  offerAt,
  title,
  bookCoverImage,
  // message,
  isMessage,
  isDecided,
  isRejected,
  isLoading,
  onAccept,
  onReject,
  onMessage,
}: OfferItemProps) => {
  return (
    <div className="md:border border-0 rounded-xl overflow-hidden">
      <div className="flex pt-7 md:pl-5 pb-4 pr-27pxr">
        <div className="mr-3 relative rounded-full w-[42px] md:w-[30px] h-[42px] md:h-[30px] overflow-hidden">
          <Image src={userProfileImage} fill alt="프로필 사진" />
        </div>
        <div className="flex flex-col flex-1 md:flex-row md:items-center">
          <div>
            <div className="text-14pxr md:text-16pxr font-normal flex gap-1">
              <UserNickname
                userNickname={userNickname}
                product={
                  {
                    badge: {
                      authorEventLevelBadgeImagePath:
                        userEventLevelBadgeImagePath,
                    },
                  } as any
                }
              />{" "}
              으로 부터 제안을 받았어요.
            </div>
            <div className="flex items-center gap-2 text-dark-gray-500 font-normal text-12pxr md:text-14pxr">
              <div className="w-3 h-3 md:w-4 md:h-4 relative">
                <Image src={"/images/won-coin.svg"} alt="코인" fill />
              </div>
              제시한 선인세 :{" "}
              <span className="font-semibold">
                <span className="text-primary-100">
                  {offerAmount.toLocaleString()}
                </span>
                원
              </span>{" "}
              <span> · 정산비 CP {cpProfit} : 작가</span>
              <span>{authorProfit}</span>
            </div>
          </div>
          <div className="text-13pxr md:ml-auto text-dark-gray-400">
            {offerAt}
          </div>
        </div>
        <div className="hidden md:contents">
          <ButtonArea
            isMessage={isMessage}
            isDecided={isDecided}
            isRejected={isRejected}
            isLoading={isLoading}
            onAccept={onAccept}
            onReject={onReject}
            onMessage={onMessage}
          />
        </div>
      </div>
      <div className="px-5 py-4 bg-light-gray-100 rounded-b-xl md:rounded-none flex gap-4">
        <div className="min-w-[30px]">
          <Image
            src={bookCoverImage}
            width={30}
            height={45}
            objectFit="none"
            className="rounded-md overflow-hidden"
            alt="책표지"
          />
        </div>

        <div className="flex gap-1 flex-col justify-center">
          <div className="text-13pxr md:text-14pxr text-dark-gray-500">
            {title}
          </div>
          {/* {message && (
            <div className="text-11pxr md:text-14pxr text-dark-gray-400 flex gap-0.5">
              <Image
                src="/images/message-full.svg"
                width={12}
                height={12}
                alt="메세지"
              />
              {message}
            </div>
          )} */}
        </div>
      </div>
      <div className="md:hidden">
        <ButtonArea
          isMessage={isMessage}
          isDecided={isDecided}
          isRejected={isRejected}
          onAccept={onAccept}
          onReject={onReject}
          onMessage={onMessage}
        />
      </div>
    </div>
  );
};

const ButtonArea = ({
  isMessage,
  isDecided,
  isRejected,
  isLoading,
  onAccept,
  onReject,
  onMessage,
}: {
  isMessage: boolean;
  isDecided: boolean;
  isRejected: boolean;
  isLoading?: boolean;
  onAccept: () => void;
  onReject: () => void;
  onMessage: () => void;
}) => {
  return (
    <div className="ml-auto mt-3 text-end w-fit md:ml-[74px] flex gap-1.5">
      {!isDecided ? (
        // Show accept/reject buttons for new offers
        <>
          <button
            onClick={onReject}
            disabled={isLoading}
            className="p-1 h-fit md:p-2 text-12pxr md:text-14pxr gap-1.5 flex items-center border rounded-full hover:bg-gray-50 disabled:opacity-50"
          >
            <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#FEEAEA] flex justify-center items-center">
              <Close className="w-[6px] h-[6px] md:w-[9px] md:h-[9px] text-red-100" />
            </div>
            거절
          </button>
          <button
            onClick={onAccept}
            disabled={isLoading}
            className="p-1 h-fit md:p-2 text-12pxr md:text-14pxr gap-1.5 flex items-center border rounded-full hover:bg-gray-50 disabled:opacity-50"
          >
            <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#E6F0FF] flex justify-center items-center">
              <Check className="w-[13px] h-[9px] text-primary-200" />
            </div>
            수락
          </button>
        </>
      ) : isMessage ? (
        // Show message button only for accepted offers
        <button
          onClick={onMessage}
          disabled={isLoading}
          className="w-[74px] h-[30px] border rounded-full flex gap-1 items-center justify-center text-12pxr mt-1 hover:bg-gray-50 disabled:opacity-50"
        >
          <Image
            src="/images/message-full.svg"
            alt="메세지 보내기"
            width={15}
            height={15}
          />
          메세지
        </button>
      ) : isRejected ? (
        // Show rejected status for rejected offers
        <div className="text-12pxr md:text-14pxr text-gray-400 mt-1">
          거절됨
        </div>
      ) : null}
    </div>
  );
};
export default OfferList;
