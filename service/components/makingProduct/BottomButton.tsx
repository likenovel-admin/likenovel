import useConfirmStore from "@/store/confirmStore";
import { useRouter } from "next/navigation";
import Button from "../common/Button";

interface Props {
  isDirty?: boolean;
}

const BottomButton = ({ isDirty }: Props) => {
  const router = useRouter();
  const { setConfirm } = useConfirmStore();

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
      <div className="hidden md:flex md:max-w-[50%] gap-1 w-full">
        <Button
          type="button"
          className="flex-[35] rounded-[14px]"
          variant="secondary"
          size={"xl"}
          onClick={handleCancel}
        >
          취소
        </Button>
        <Button className="flex-[65] rounded-[14px]" size={"xl"}>
          등록
        </Button>
      </div>
      <div className="flex md:hidden gap-1 w-full">
        <Button
          type="button"
          className="flex-[15]"
          variant="secondary"
          size={"md"}
          onClick={handleCancel}
        >
          취소
        </Button>
        <Button className="flex-[85]" size={"md"}>
          등록
        </Button>
      </div>
    </div>
  );
};

export default BottomButton;
