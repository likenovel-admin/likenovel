import { IUser } from "@/types";

export const getUser = (): IUser | null => {
  const user = sessionStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};
