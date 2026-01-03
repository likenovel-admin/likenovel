import { ErrorCodes } from "@/enums/errorCodes";

export interface ICustomError {
  response: {
    status: number;
    data?: {
      code?: ErrorCodes;
    };
  };
}
