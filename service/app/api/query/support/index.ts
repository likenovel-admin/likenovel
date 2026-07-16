import { instance } from "@/app/api/axios";

export type CreateSupportQnaRequest = {
  category: string;
  subject: string;
  content: string;
  email: string;
};

type CreateSupportQnaResponse = {
  data: {
    qnaId: number;
  };
};

export const createSupportQna = async (
  request: CreateSupportQnaRequest
): Promise<number> => {
  const response = await instance.post<CreateSupportQnaResponse>(
    "/v1/command/support/qnas",
    request
  );
  return response.data.data.qnaId;
};
