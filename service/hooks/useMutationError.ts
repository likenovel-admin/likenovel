import { ErrorMessages } from "@/constants/errorMessages";
import { ErrorCodes } from "@/enums/errorCodes";
import useToastStore from "@/store/toastStore";
import { ICustomError } from "@/types";

const useMutationError = () => {
  const { setToast } = useToastStore();

  const defaultMutationHandler = (error: ICustomError) => {
    const errorCode = error.response?.data?.code;

    if (errorCode && Object.values(ErrorCodes).includes(errorCode)) {
      const message =
        ErrorMessages[errorCode as ErrorCodes] ||
        "알 수 없는 에러가 발생했습니다.";
      setToast({
        message,
        type: "error",
      });
    }
  };

  return { defaultMutationHandler };
};

export default useMutationError;
