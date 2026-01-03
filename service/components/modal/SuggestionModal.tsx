import { useAddContractOffer } from "@/app/api/query/mypage/user";
import useToastStore from "@/store/toastStore";
import { Dispatch, SetStateAction } from "react";
import { Controller, useForm } from "react-hook-form";
import ModalBottomButton from "../common/ModalBottomButton";
import ModalContainer from "../common/ModalContainer";
import RadioButton from "../common/RadioButtom";
import TextArea from "../form/textarea";

interface SuggestionModalProps extends CommonModalProps {
  title: string;
  productId: number;
}

const TitleContents = ({ title }: { title: string }) => {
  return (
    <div className="flex flex-col text-center">
      <span>{`"${title}"`}</span>
      <span className="text-14pxr text-gray-600 font-normal">
        작품에 계약을 제안합니다.
      </span>
    </div>
  );
};
const SuggestionModal = ({
  isOpen,
  setIsOpen,
  onClose,
  title,
  productId,
}: SuggestionModalProps) => {
  return (
    <ModalContainer
      title={<TitleContents title={title} />}
      isOpen={isOpen}
      onClose={onClose}
      size="full"
    >
      <SuggestionContents
        onClose={onClose}
        setIsOpen={setIsOpen}
        productId={productId}
      />
    </ModalContainer>
  );
};

const SuggestionContents = ({
  onClose,
  setIsOpen,
  productId,
}: {
  onClose: () => void;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  productId: number;
}) => {
  const { control, handleSubmit, register } = useForm({
    defaultValues: {
      advancePayment: "~50",
      settlementRatioSnippet: "15:85",
      message: "",
    },
  });
  const { setToast } = useToastStore();
  const { mutate: addContractOffer, isPending } = useAddContractOffer();

  const onSubmit = (data: any) => {
    if (isPending) return;
    // Parse settlement ratio to extract CP and Author profit rates
    // Format: "15:85" -> cp_profit_rate: 15, author_profit_rate: 85
    const [cpRate, authorRate] = data.settlementRatioSnippet
      .split(":")
      .map(Number);
    const cpProfitRate = cpRate || 15;
    const authorProfitRate = authorRate || 85;

    addContractOffer(
      {
        product_id: productId,
        body: {
          advance_payment_range: data.advancePayment,
          cp_profit_rate: cpProfitRate,
          author_profit_rate: authorProfitRate,
          message: data.message,
        },
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          setToast({
            type: "success",
            message: "제안이 완료되었습니다.",
          });
        },
        onError: (error: any) => {
          console.error("Contract offer error:", error);
          console.error("Error response:", error?.response);
          setToast({
            type: "error",
            message: error?.response?.data?.message || "제안에 실패했습니다.",
          });
        },
      }
    );
  };

  return (
    <div className="h-full flex flex-col items-center md:w-[500px]">
      <form onSubmit={handleSubmit(onSubmit)} className="contents">
        <div className="w-full px-5 py-6 flex-1">
          <div className="text-14pxr font-semibold md:text-16pxr">
            선인세 제안
          </div>
          <Controller
            control={control}
            name="advancePayment"
            render={({ field }) => {
              return (
                <div className="grid grid-cols-3 gap-2 mt-2 border-b pb-5">
                  <RadioButton
                    label="50만원 이하"
                    value="~50"
                    name="advancePayment"
                    checked={field.value === "~50"}
                    onChange={field.onChange}
                  />
                  <RadioButton
                    label="100만원"
                    value="50~100"
                    name="advancePayment"
                    checked={field.value === "50~100"}
                    onChange={field.onChange}
                  />
                  <RadioButton
                    label="200만원"
                    value="100~200"
                    name="advancePayment"
                    checked={field.value === "100~200"}
                    onChange={field.onChange}
                  />
                  <RadioButton
                    label="300만원"
                    value="200~300"
                    name="advancePayment"
                    checked={field.value === "200~300"}
                    onChange={field.onChange}
                  />
                  <RadioButton
                    label="400만원"
                    value="300~400"
                    name="advancePayment"
                    checked={field.value === "300~400"}
                    onChange={field.onChange}
                  />
                  <RadioButton
                    label="500만원 이상"
                    value="500~"
                    name="advancePayment"
                    checked={field.value === "500~"}
                    onChange={field.onChange}
                  />
                </div>
              );
            }}
          />
          <div className="text-14pxr font-semibold md:text-16pxr mt-5">
            정산비 제안
          </div>
          <Controller
            control={control}
            name="settlementRatioSnippet"
            render={({ field }) => {
              return (
                <div className="grid grid-cols-2 gap-2 mt-2 border-b pb-5">
                  <RadioButton
                    label="CP 1.5 : 작가 8.5"
                    value="15:85"
                    name="settlementRatioSnippet"
                    checked={field.value === "15:85"}
                    onChange={field.onChange}
                  />
                  <RadioButton
                    label="CP 2 : 작가 8"
                    value="20:80"
                    name="settlementRatioSnippet"
                    checked={field.value === "20:80"}
                    onChange={field.onChange}
                  />
                  <RadioButton
                    label="CP 3 : 작가 7"
                    value="30:70"
                    name="settlementRatioSnippet"
                    checked={field.value === "30:70"}
                    onChange={field.onChange}
                  />
                  <RadioButton
                    label="CP 4 : 작가 6"
                    value="40:60"
                    name="settlementRatioSnippet"
                    checked={field.value === "40:60"}
                    onChange={field.onChange}
                  />
                  <RadioButton
                    label="CP 5 : 작가 5"
                    value="50:50"
                    name="settlementRatioSnippet"
                    checked={field.value === "50:50"}
                    onChange={field.onChange}
                  />
                </div>
              );
            }}
          />
          <Controller
            control={control}
            name="message"
            render={({ field }) => {
              return (
                <TextArea
                  label="보낼 메세지"
                  maxLength={100}
                  labelStyle="text-14pxr font-semibold md:text-16pxr mt-5 mb-2"
                  inputStyle="w-full h-[100px]"
                  placeholder="내용을 적어주세요."
                  {...field}
                  additionalText={
                    <div className="text-12pxr text-gray-500">
                      <b>{field.value?.length ?? 0}</b>/100
                    </div>
                  }
                />
              );
            }}
          />
        </div>
        <div className="w-full sticky bottom-0 mt-auto bg-white md:mt-6">
          <ModalBottomButton
            leftButton={{
              text: "취소",
              onClick: onClose,
            }}
            rightButton={{
              text: "제안",
              className: "text-primary-100",
              onClick: handleSubmit(onSubmit),
              disabled: isPending,
            }}
          />
        </div>
      </form>
    </div>
  );
};

export default SuggestionModal;
