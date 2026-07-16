import useConfirmStore from "@/store/confirmStore";
import { useRouter } from "next/navigation";
import Button from "../common/Button";

interface Props {
  isDirty?: boolean;
  isSubmitting?: boolean;
  isCoverUploading?: boolean;
  onSubmitIntentChange: (intent: "default" | "episode") => void;
}

const BottomButton = ({
  isDirty,
  isSubmitting = false,
  isCoverUploading = false,
  onSubmitIntentChange,
}: Props) => {
  const router = useRouter();
  const { setConfirm } = useConfirmStore();
  const isSubmitDisabled = isSubmitting || isCoverUploading;
  const submitLabel = isCoverUploading
    ? "표지 업로드 중..."
    : isSubmitting
      ? "등록 중..."
      : "등록";

  const handleCancel = () => {
    if (isDirty) {
      setConfirm({
        content: (
          <div>
            <p>저장하지 않은 정보가 있습니다</p>
            <p>페이지를 나가시겠습니까?</p>
          </div>
        ),
        buttonCount: 2,
        onConfirm: () => {
          router.push("/product/author");
        },
      });
    } else {
      router.push("/product/author");
    }
  };

  return (
    <div className="flex gap-1 w-full justify-center pt-8 px-16pxr pb-16pxr bg-[#F7F8FA] ">
      <div className="hidden md:flex md:max-w-[65%] gap-1 w-full">
        <Button
          type="button"
          className="flex-[35] rounded-[14px]"
          variant="secondary"
          size={"xl"}
          onClick={handleCancel}
        >
          취소
        </Button>
        <Button
          className="flex-[30] rounded-[14px]"
          size={"xl"}
          disabled={isSubmitDisabled}
          isLoading={isSubmitting}
          onClick={() => onSubmitIntentChange("default")}
        >
          {submitLabel}
        </Button>
        <Button
          variant="black"
          className="flex-[40] rounded-[14px]"
          size={"xl"}
          disabled={isSubmitDisabled}
          isLoading={isSubmitting}
          onClick={() => onSubmitIntentChange("episode")}
        >
          저장하고 회차쓰기
        </Button>
      </div>
      <div className="flex md:hidden flex-col gap-1 w-full">
        <div className="flex gap-1 w-full">
          <Button
            type="button"
            className="flex-[30]"
            variant="secondary"
            size={"md"}
            onClick={handleCancel}
          >
            취소
          </Button>
          <Button
            className="flex-[70]"
            size={"md"}
            disabled={isSubmitDisabled}
            isLoading={isSubmitting}
            onClick={() => onSubmitIntentChange("default")}
          >
            {submitLabel}
          </Button>
        </div>
        <Button
          variant="black"
          className="w-full"
          size={"md"}
          disabled={isSubmitDisabled}
          isLoading={isSubmitting}
          onClick={() => onSubmitIntentChange("episode")}
        >
          저장하고 회차쓰기
        </Button>
      </div>
    </div>
  );
};

export default BottomButton;
