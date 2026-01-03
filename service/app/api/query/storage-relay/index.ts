import { useMutation } from "@tanstack/react-query";
import { instance } from "../../axios";
import { IStorageRelayRequest, IStorageRelayResponse } from "./dto";

export const useStorageRelay = () => {
  // 서로 다른 도메인 간 세션 스토리지와 로컬 스토리지 값을 전달할 수 없기에 리다이렉트된 페이지에서 처리
  return useMutation<IStorageRelayResponse, Error, IStorageRelayRequest>({
    mutationFn: async (data: IStorageRelayRequest) => {
      return await instance.put("/v1/command/auth/token/relay/callback", data);
    },
  });
};

