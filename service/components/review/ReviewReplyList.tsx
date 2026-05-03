import { useSelectProductReview } from "@/app/api/query/product-review";
import { resolveProductCoverImage } from "@/constants/common";
import { useGenre } from "@/contexts/GenreContext";
import useBottomSheetStore from "@/store/bottomSheetStore";
import useModalStore from "@/store/modalStore";
import { getFormattingDate } from "@/utils/getFormattingDate";
import { getUpdateFrequency } from "@/utils/getUpdateFrequency";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import BottomSheet from "../common/BottomSheet";
import Button from "../common/Button";
import Modal from "../common/Modal";
import Spinner from "../common/Spinner";
import SquareBadge from "../common/SquareBadge";
import Tab from "../common/Tab";
import UserNickname from "../common/UserNickname";
import GenreSelectModal from "../modal/GenreSelectModal";
import Close from "/public/images/close.svg";

const ReviewReplyList = () => {
  const [type, setType] = useState("latest");
  const { setModal } = useModalStore();
  const { setBottomSheet } = useBottomSheetStore();
  const { selectedGenres, removeGenre } = useGenre();

  // Pass selectedGenres to API to fetch filtered data
  const { data, isLoading } = useSelectProductReview(selectedGenres);

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModal(<GenreSelectModal />);
  };

  const handleOpenBottomSheet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBottomSheet(<GenreSelectModal />);
  };

  const reviews = useMemo(() => {
    if (!data?.data) return [];

    // Data is already filtered by API, just need to sort
    const sortedData = [...data.data];

    // Sort by type
    if (type === "latest") {
      // Sort by created date (newest first)
      sortedData.sort((a, b) => {
        const dateA = new Date(a.review.updatedDate).getTime();
        const dateB = new Date(b.review.updatedDate).getTime();
        return dateB - dateA;
      });
    } else if (type === "like") {
      // Sort by likes count (highest first)
      sortedData.sort((a, b) => {
        return (b.review.likesCount || 0) - (a.review.likesCount || 0);
      });
    }

    return sortedData;
  }, [data, type]);

  return (
    <div className="w-full h-auto px-4 mt-4">
      <div className="flex justify-between items-center">
        <Tab
          activeTab={type}
          onTabChange={setType}
          tabs={[
            { label: "최근 업데이트순", value: "latest" },
            { label: "공감 많은 순", value: "like" },
          ]}
          style="check"
        />
        {/* Mobile: Rounded button */}
        <button
          className="w-7 h-7 md:hidden rounded-full flex items-center justify-center border text-14pxr"
          onClick={handleOpenBottomSheet}
        >
          <Image src="/images/filter.svg" alt="필터" width={15} height={15} />
        </button>
        {/* Desktop: Button with text */}
        <Button
          variant="secondary"
          size="sm"
          className="hidden md:flex"
          onClick={handleOpenModal}
        >
          <Image src="/images/filter.svg" alt="필터" width={15} height={15} />
          <span className="ml-1 text-14pxr text-gray-600">장르 필터</span>
        </Button>
      </div>

      {/* Selected Genres Display */}
      {selectedGenres.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedGenres.map((genre) => (
            <button
              key={genre}
              className="flex items-center gap-2 px-3 py-1.5 border border-dark-gray-100 rounded-full text-13pxr text-dark-gray-500"
              onClick={() => removeGenre(genre)}
            >
              <span>{genre}</span>
              <Close className="w-2 h-2 text-light-gray-600" />
            </button>
          ))}
        </div>
      )}

      <ul className="md:px-0border-t md:border-0 gap-3 flex flex-col md:mt-4">
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            {reviews.map((item) => (
              <li key={item.review.id}>
                <ReviewReplyItem
                  reviewId={item.review.id}
                  userId={item.review.reviewer?.nickname || ""}
                  reviewReplyAt={getFormattingDate(
                    item.review.createdDate,
                    "YYYY.MM.DD"
                  )}
                  title={item.product.title}
                  reply={item.review.reviewText}
                  userProfileImage={
                    item.review.reviewer?.profileImagePath ||
                    "/images/message-default-picture.svg"
                  }
                  bookCoverImage={
                    resolveProductCoverImage(item.product.image?.coverImagePath)
                  }
                  likeAmount={item.review.likesCount || 0}
                  messageAmount={item.review.commentsCount || 0}
                  // episode={item.product.trendindex?.hasEpisodeCount || 0}
                  episode={item.product.totalOpenEpisodeCount || 0}
                  releaseTerm={item.product.properties?.updateFrequency}
                  userRole={item.review.reviewer?.userRole || ""}
                  userInterestLevelBadgeImagePath={
                    item.review.reviewer?.userInterestLevelBadgeImagePath || ""
                  }
                  userEventLevelBadgeImagePath={
                    item.review.reviewer?.userEventLevelBadgeImagePath || ""
                  }
                />
              </li>
            ))}
          </>
        )}
      </ul>
      <Modal size="sm" />
      <BottomSheet />
    </div>
  );
};

interface ReviewReplyItemProps {
  reviewId: number;
  userId: string;
  reviewReplyAt: string;
  title: string;
  reply: string;
  userProfileImage: string;
  bookCoverImage: string;
  likeAmount: number;
  messageAmount: number;
  episode: number;
  releaseTerm?: string;
  userRole: string;
  userInterestLevelBadgeImagePath: string;
  userEventLevelBadgeImagePath: string;
}

const ReviewReplyItem = ({
  reviewId,
  userProfileImage,
  bookCoverImage,
  userId,
  reviewReplyAt,
  title,
  reply,
  likeAmount,
  messageAmount,
  episode,
  releaseTerm,
  userRole,
  userInterestLevelBadgeImagePath,
  userEventLevelBadgeImagePath,
}: ReviewReplyItemProps) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/review/${reviewId}`);
  };

  // Extract text from HTML and limit to 300 characters
  const getTextOnly = (html: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    return textContent.length > 300
      ? textContent.substring(0, 300) + "..."
      : textContent;
  };

  return (
    <div
      className="md:border border-0 rounded-xl overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex pt-7 md:pl-5 pb-4">
        <div className="mr-3 relative rounded-full w-[42px] md:w-[30px] h-[42px] md:h-[30px] overflow-hidden">
          <Image src={userProfileImage} fill alt="프로필 사진" />
        </div>
        <div className="flex flex-col flex-1 md:flex-row md:items-center relative">
          <div>
            <div className="text-14pxr md:text-16pxr font-normal flex gap-1">
              <UserNickname
                userNickname={userId}
                product={
                  {
                    badge: {
                      authorInterestLevelBadgeImagePath:
                        userInterestLevelBadgeImagePath || "",
                      authorEventLevelBadgeImagePath:
                        userEventLevelBadgeImagePath || "",
                    },
                  } as any
                }
              />
              {userRole === "CP" && <SquareBadge type={"CP"} />}
              {userRole === "editor" && <SquareBadge type={"editor"} />}
            </div>
            <div
              className="flex items-center gap-2 text-14pxr md:text-16pxr mt-1 font-medium"
              dangerouslySetInnerHTML={{ __html: getTextOnly(reply) }}
            />
            <div className="text-13pxr text-dark-gray-400">{reviewReplyAt}</div>
          </div>
        </div>
      </div>
      <div className="px-3 py-3 bg-light-gray-100 rounded-b-xl md:rounded-none flex gap-2.5">
        <div>
          <Image
            src={bookCoverImage}
            width={30}
            height={45}
            objectFit="contain"
            className="rounded-md overflow-hidden"
            alt="책표지"
          />
        </div>
        <div className="flex gap-1 flex-col">
          <div className="text-13pxr md:text-14pxr text-dark-gray-500">
            {title}
          </div>
          <div className="text-11pxr md:text-14pxr text-dark-gray-500 flex gap-0.5">
            총 {episode}화
            {releaseTerm && (
              <>
                <span className="text-gray-400 mx-1">·</span>
                {getUpdateFrequency(releaseTerm || "")}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewReplyList;
