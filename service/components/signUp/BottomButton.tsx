import { useRouter } from "next/navigation";
import Button from "../common/Button";

interface Props {
  isLoading?: boolean;
}

const BottomButton = ({ isLoading }: Props) => {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-1 w-full justify-center pb-16pxr bg-white">
      <div className="hidden md:block w-full border border-t-light-gray-500 border-b-0 border-l-0 border-r-0 mb-28pxr" />
      <div className="hidden md:flex gap-1 w-full">
        <Button
          type="button"
          className="rounded-[14px] flex-[30]"
          variant="secondary"
          size={"xl"}
          onClick={() => {
            router.back();
          }}
        >
          취소
        </Button>
        <Button
          className="rounded-[14px] flex-[70]"
          size={"xl"}
          isLoading={isLoading}
        >
          확인
        </Button>
      </div>
      <div className="flex md:hidden gap-1 w-full">
        <Button
          className="flex-[15]"
          variant="secondary"
          size={"md"}
          onClick={() => {
            router.back();
          }}
        >
          취소
        </Button>
        <Button className="flex-[85]" size={"md"}>
          확인
        </Button>
      </div>
    </div>
  );
};

export default BottomButton;
