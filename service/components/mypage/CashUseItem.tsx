import { ICash } from "@/types";
import { getFormattingDate } from "@/utils/getFormattingDate";

const CashUseItem = ({
  amount,
  category,
  productTitle,
  episodeTitle,
  createdDate,
  product_title,
  episode_title,
  created_date,
}: ICash) => {
  const resolvedProductTitle = productTitle ?? product_title ?? "";
  const resolvedEpisodeTitle = episodeTitle ?? episode_title ?? "";
  const resolvedCreatedDate = createdDate ?? created_date ?? "";
  const formattedCreatedDate = resolvedCreatedDate
    ? getFormattingDate(resolvedCreatedDate, "YYYY.MM.DD HH:mm")
    : "";

  return (
    <div className="border p-5 w-full rounded-xl md:rounded-3xl">
      <div className="flex justify-between">
        <div className="text-15pxr md:text-16pxr font-medium">
          {resolvedProductTitle}
        </div>
        <div
          className={`text-12pxr md:text-14pxr font-normal min-w-10 text-right ${
            category === "used" || category === "use"
              ? "text-[#ff5e03]"
              : "text-[#176bf2]"
          }`}
        >
          {category === "used" || category === "use" ? "사용" : "충전"}
        </div>
      </div>
      <div className="flex justify-between">
        <div className="flex flex-col gap-2">
          {resolvedEpisodeTitle ? (
            <div className="text-dark-gray-400 font-medium text-12pxr md:text-13pxr">
              {resolvedEpisodeTitle}
            </div>
          ) : null}
          {formattedCreatedDate ? (
            <div className="text-dark-gray-400 font-normal text-11pxr md:text-12pxr">
              {formattedCreatedDate}
            </div>
          ) : null}
        </div>
        <div className="text-13pxr md:text-16pxr font-semibold">
          {amount.toLocaleString()}원
        </div>
      </div>
    </div>
  );
};

export default CashUseItem;
