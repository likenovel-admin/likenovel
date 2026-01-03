import { ErrorCodes } from "@/enums/errorCodes";

export const ErrorMessages: Partial<Record<ErrorCodes, string>> = {
  [ErrorCodes.M0000]: "이미 가입된 이메일입니다.",
  [ErrorCodes.E4010]: "로그인이 필요합니다.",
  [ErrorCodes.E4011]: "로그인이 필요합니다.",
  [ErrorCodes.E4012]: "본인인증이 필요합니다.",
  [ErrorCodes.E4220]: "이메일 형식이 올바르지 않습니다.",
  [ErrorCodes.E4221]:
    "비밀번호는 8자 이상 20자 이하, 영문, 특문, 숫자를 포함해야합니다.",
  [ErrorCodes.E4222]: "state 값이 올바르지 않습니다.",
  [ErrorCodes.E4223]: "이메일 또는 비밀번호가 올바르지 않습니다.",
  [ErrorCodes.E4224]: "파일 형식이 올바르지 않습니다.",
  [ErrorCodes.E4225]: "작품 등록/수정 값이 올바르지 않습니다.",
  [ErrorCodes.E4226]: "회차 저장/등록/수정 값이 올바르지 않습니다.",
  [ErrorCodes.E4227]: "작품 공지 저장/등록/수정 값이 올바르지 않습니다.",
  [ErrorCodes.E4228]: "cp/편집자 신청 값이 올바르지 않습니다.",
  [ErrorCodes.E4229]: "프로필 추가/수정 신청 값이 올바르지 않습니다.",
  [ErrorCodes.E4230]: "작가명이 올바르지 않습니다.",
};
