import { useRouter } from "next/navigation";
import Button from "../common/Button";

type Props = {
  onSave?: () => void;
  onSubmit?: () => void;
  onUpdate?: () => void;
  actionType?: "save" | "submit";
  isSubmitting?: boolean;
};

const BottomButton = ({
  onSave,
  onSubmit,
  onUpdate,
  actionType,
  isSubmitting,
}: Props) => {
  const router = useRouter();
  return (
    <div className="flex gap-1 w-full justify-center pt-[80px] px-16pxr pb-16pxr bg-white">
      <div className="hidden md:flex md:max-w-[70%] gap-8pxr w-full">
        {actionType === "save" ? (
          <>
            <Button
              className="flex-1 rounded-[14px]"
              variant="secondary"
              size={"xl"}
              type="button"
              onClick={onSave}
              disabled={isSubmitting}
            >
              임시저장
            </Button>
            <Button
              className="flex-1 rounded-[14px]"
              size={"xl"}
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              등록
            </Button>
          </>
        ) : (
          <>
            <Button
              className="flex-1 rounded-[14px]"
              variant="secondary"
              size={"xl"}
              onClick={() => router.back()}
              type="button"
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              className="flex-1 rounded-[14px]"
              size={"xl"}
              type="button"
              onClick={onUpdate}
              disabled={isSubmitting}
            >
              수정
            </Button>
          </>
        )}
      </div>
      <div className="flex md:hidden gap-1 w-full">
        {actionType === "save" ? (
          <>
            <Button
              className="flex-[40]"
              variant="secondary"
              size={"md"}
              type="button"
              onClick={onSave}
              disabled={isSubmitting}
            >
              임시저장
            </Button>
            <Button
              className="flex-[60]"
              size={"md"}
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              등록
            </Button>
          </>
        ) : (
          <>
            <Button
              className="flex-[40]"
              variant="secondary"
              size={"md"}
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              className="flex-[60]"
              size={"md"}
              type="button"
              onClick={onUpdate}
              disabled={isSubmitting}
            >
              수정
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default BottomButton;
