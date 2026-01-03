import { useAddProductReview } from "@/app/api/query/product-review";
import useToastStore from "@/store/toastStore";
import { IProduct } from "@/types";
import { getUser } from "@/utils/getUser";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "../common/Button";
import Editor from "../common/Editor";
import Input from "../form/input";
const MAX_CHARACTERS = 20000;
const MIN_CHARACTERS = 300;

interface RecommendFormAreaProps {
  product: IProduct | null;
}

const RecommendFormArea = ({ product }: RecommendFormAreaProps) => {
  const user = getUser();
  const router = useRouter();
  const labelClassName =
    "text-13pxr md:text-16pxr text-dark-gray-500 font-semibold mb-10pxr";
  const requiredLabelClassName = `${labelClassName} after:content-['*'] after:text-red-100`;
  const inputTextClassName =
    "text-14pxr md:text-16pxr h-40pxr md:h-44pxr text-dark-gray-500 placeholder:text-dark-gray-100 w-[100%] pl-9pxr pr-11pxr";
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const { mutate: addProductReview, isPending } = useAddProductReview();
  const { setToast } = useToastStore();

  const handleSubmit = () => {
    if (isPending) return;

    if (!product?.productId) {
      setToast({
        message: "추천할 작품을 먼저 선택해주세요.",
        type: "warning",
      });
      return;
    }
    if (!title.trim()) {
      setToast({
        message: "제목을 입력해주세요.",
        type: "warning",
      });
      return;
    }
    if (!value.trim()) {
      setToast({
        message: "내용을 입력해주세요.",
        type: "warning",
      });
      return;
    }

    // Extract text content from HTML by removing tags
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = value;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    const contentLength = textContent.trim().length;

    if (contentLength < MIN_CHARACTERS) {
      setToast({
        message: `내용은 최소 ${MIN_CHARACTERS}자 이상 입력해주세요.`,
        type: "warning",
      });
      return;
    }

    if (contentLength > MAX_CHARACTERS) {
      setToast({
        message: `내용은 최대 ${MAX_CHARACTERS}자까지 입력 가능합니다.`,
        type: "warning",
      });
      return;
    }

    addProductReview(
      {
        product_id: product.productId,
        review_text: value,
        user_id: user?.userId,
        review_title: title,
      },
      {
        onSuccess: () => {
          setToast({
            message: "추천작품이 등록되었습니다.",
            type: "success",
          });
          setTitle("");
          setValue("");
          router.back();
        },
        onError: (error: any) => {
          setToast({
            message:
              error?.response?.data?.message ||
              "등록에 실패했습니다. 다시 시도해주세요.",
            type: "error",
          });
        },
      }
    );
  };

  return (
    <div className="mt-4">
      <Input
        placeholder="제목을 입력해주세요"
        label="제목"
        inputStyle={inputTextClassName}
        labelStyle={requiredLabelClassName}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className={`mt-4 ${requiredLabelClassName}`}>내용</div>
      <Editor value={value} onChange={(value) => setValue(value)} />

      <Button
        className="mt-12 w-full"
        onClick={handleSubmit}
        disabled={isPending || !product}
      >
        등록
      </Button>
    </div>
  );
};

export default RecommendFormArea;
