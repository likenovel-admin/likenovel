"use client";

import {
  useAddCommentEpisode,
  useEvaluateEpisode,
  useSelectEpisodeEvaluation,
  useSelectViewerPath,
} from "@/app/api/query/episode";
import { EvaluationItems } from "@/components/common/ProductEvaluation";
import ProductReaction from "@/components/viewer/ProductReaction";
import { useAuthWrapper } from "@/hooks/useAuthWrapper";
import useAuthStore from "@/store/authStore";
import useToastStore from "@/store/toastStore";
import { IEvaluation } from "@/types";
import { mergeKeysEvaluation } from "@/utils/common";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { sumTimesEvaluation } from "../../utils/common";

interface RatingFormProps {
  productId?: number;
  episodeId?: number;
  commentTotalCount?: number;
}
export default function RatingForm({
  productId,
  episodeId,
  commentTotalCount = 0,
}: RatingFormProps) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const { withAuth } = useAuthWrapper();
  const { setToast } = useToastStore();
  const evaluateEpisode = useEvaluateEpisode();
  const addCommentEpisode = useAddCommentEpisode();

  const { data: episodeData, refetch } = useSelectViewerPath(episodeId || 0);
  const { data: episodeEvaluationData, refetch: refetchEvaluation } =
    useSelectEpisodeEvaluation(
      productId || 0,
      episodeId || 0,
      !!productId && !!episodeId
    );

  const prettyCount = useMemo(() => {
    if (episodeEvaluationData?.data) {
      return sumTimesEvaluation(
        episodeEvaluationData.data as unknown as Record<string, number>
      ).toLocaleString("ko-KR");
    }
    return 0;
  }, [episodeEvaluationData]);

  const { evaluationData, hasUserEvaluated } = useMemo(() => {
    return {
      evaluationData: episodeEvaluationData?.data ?? ({} as IEvaluation),
      hasUserEvaluated: episodeData?.data?.evaluationYn === "Y" || submitted,
    };
  }, [episodeEvaluationData, episodeData, submitted]);

  useEffect(() => {
    refetch();
  }, [isAuthenticated]);

  function toggle(value: string) {
    if (hasUserEvaluated) return;
    setSelected(value);
  }

  const handleSubmitEvaluation = withAuth(async () => {
    // Check if already evaluated or no selection
    if (hasUserEvaluated || !selected) return;

    // Check if episodeId is provided
    if (!episodeId) {
      setToast({
        message: "에피소드 정보가 없습니다.",
        type: "error",
      });
      return;
    }

    try {
      // Call API to submit evaluation
      await evaluateEpisode.mutateAsync(
        {
          episodeId: episodeId,
          body: {
            rating: selected.replace("-", ""),
          },
        },
        {
          onSuccess: () => {
            // Update UI state on success
            setSubmitted(true);
            refetchEvaluation();

            // Invalidate product detail query to update evaluation container
            if (productId) {
              queryClient.invalidateQueries({
                queryKey: ["selectProductDetail", productId],
              });
            }

            setToast({
              message: "평가가 완료되었습니다.",
              type: "success",
            });
          },
          onError: () => {
            setToast({
              message: "평가 등록에 실패했습니다.",
              type: "error",
            });
          },
        }
      );
    } catch (error) {
      setToast({
        message: "평가 등록에 실패했습니다.",
        type: "error",
      });
    }
  });

  const handleSubmitComment = withAuth(async () => {
    if (!comment.trim()) return;

    if (!episodeId) {
      setToast({
        message: "에피소드 정보가 없습니다.",
        type: "error",
      });
      return;
    }

    try {
      await addCommentEpisode.mutateAsync(
        {
          episodeId: episodeId,
          body: {
            content: comment.trim(),
          },
        },
        {
          onSuccess: () => {
            setComment("");
            // Invalidate comment queries to refresh comment list
            queryClient.invalidateQueries({
              queryKey: ["selectComment", productId, episodeId],
            });
            setToast({
              message: "댓글이 등록되었습니다.",
              type: "success",
            });
          },
          onError: () => {
            setToast({
              message: "댓글 등록에 실패했습니다.",
              type: "error",
            });
          },
        }
      );
    } catch (error) {
      setToast({
        message: "댓글 등록에 실패했습니다.",
        type: "error",
      });
    }
  });

  return (
    <div className="mx-auto max-w-5xl ">
      {!hasUserEvaluated ? (
        <>
          <div className="rounded-[16px] border-0 md:border border-[#E7EAEE] bg-white ">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-[22px] pt-[18px] pb-[10px] border-0 md:border-b">
              <div className="text-lg flex items-center font-semibold text-[#111317] tracking-[2%] leading-[18px]">
                평가해 주세요!
                <span className="mx-[13px] h-[10px] w-[1px] bg-[#E3E4EB]"></span>
                <span className="text-[#6B6E76] font-normal text-[13px] tracking-[-2%] leading-[18px]">
                  총{" "}
                  <span className="text-[#0456D9] font-semibold">
                    {prettyCount}명
                  </span>{" "}
                  참여 중
                </span>
              </div>
            </div>

            {/* Grid options */}
            <div
              role="group"
              aria-label="poll options"
              className="grid grid-cols-2 gap-5pxr md:gap-10pxr md:grid-cols-3 px-[34px] pt-[25px] pb-[30px] [&>:nth-child(9)]:col-span-2 md:[&>:nth-child(9)]:col-span-1"
            >
              {EvaluationItems.map((opt, i) => {
                const isSelected = selected === opt.value;
                return (
                  <button
                    key={opt.label}
                    onClick={() => toggle(opt.value)}
                    aria-pressed={isSelected}
                    className={`px-[32px] py-[18px] pill ${
                      isSelected ? "pill-selected" : ""
                    }`}
                  >
                    <div className="flex items-center justify-center gap-[11px] ">
                      <span className="font-normal text-base text-[#111317] leading-[18px] tracking-[-2%]">
                        <Image
                          src={opt.image}
                          alt={opt.label}
                          width={24}
                          height={24}
                          className="min-w-[24px]"
                        />
                      </span>
                      <span
                        className={`font-normal text-base text-[#111317] leading-[18px] tracking-[-2%] whitespace-nowrap ${
                          isSelected ? "text-white font-semibold" : ""
                        }`}
                      >
                        {opt.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Submit button */}
          <div className="mt-[11px] flex justify-end">
            <button
              onClick={handleSubmitEvaluation}
              disabled={!selected || evaluateEpisode.isPending}
              className={`rounded-[14px] px-[28px] py-[13px] text-white ${
                selected && !evaluateEpisode.isPending
                  ? "bg-[#111317] hover:bg-[#333]"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {evaluateEpisode.isPending ? "평가 중..." : "평가하기"}
            </button>
          </div>

          {/* Divider */}
          <div className="mt-[25px] h-px w-full bg-[#F0F2F6]" />
        </>
      ) : (
        <>
          {/* Existing evaluation results */}
          {evaluationData && (
            <div className="mt-[25px] border-0 rounded-[16px] md:border border-[#E7EAEE] bg-white ">
              <div className="flex items-center justify-between gap-4 px-[22px] pt-[18px] pb-[10px] border-0 md:border-b">
                <div className="text-lg flex items-center font-semibold text-[#111317] tracking-[2%] leading-[18px]">
                  평가 결과
                  <span className="mx-[13px] h-[10px] w-[1px] bg-[#E3E4EB]"></span>
                  <span className="text-[#6B6E76] font-normal text-[13px] tracking-[-2%] leading-[18px]">
                    총{" "}
                    <span className="text-[#0456D9] font-semibold">
                      {prettyCount}명
                    </span>{" "}
                    참여 중
                  </span>
                </div>
              </div>
              <div className="px-22pxr py-18pxr">
                <ProductReaction
                  evaluations={mergeKeysEvaluation(
                    evaluationData as unknown as Record<string, number>
                  )}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Comment box */}
      <div className="mt-[23px]">
        <h3 className="text-[22px] font-bold tracking-[-2%]">
          작품 댓글 {commentTotalCount}
        </h3>
        <div className="mt-[16px] rounded-[16px] bg-[#F7F7F7] gap-22pxr pl-[22px] flex items-center justify-between px-[12px] py-[10px]">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="댓글을 입력해 주세요"
            className="bg-[#F7F7F7] flex-1 outline-none focus:border-0 focus:outline-none"
          />
          <button
            onClick={handleSubmitComment}
            disabled={!comment.trim() || addCommentEpisode.isPending}
            className={`rounded-[20px] bg-[#E9E9E9] px-[18px] py-[10px] text-[#888B92] ${
              comment.trim() && !addCommentEpisode.isPending
                ? "!bg-[#176BF2] !text-white"
                : ""
            }`}
          >
            등록
            {/* {addCommentEpisode.isPending ? "등록 중..." : "등록"} */}
          </button>
        </div>
      </div>
    </div>
  );
}
