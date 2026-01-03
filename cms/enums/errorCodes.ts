export enum ErrorCodes {
  M0000 = "M0000",
  E4010 = "E4010", // access 토큰 만료
  E4011 = "E4011", // refresh 토큰 만료
  E4012 = "E4012", // 본인인증이 안 된 경우
  E4220 = "E4220", // email 값 validation 에러
  E4221 = "E4221", // password 값 validation 에러
  E4222 = "E4222", // state 값 validation 에러
  E4223 = "E4223", // 로그인 값 validation 에러
  E4224 = "E4224", // file name 값 validation 에러
  E4225 = "E4225", // 작품 등록/수정 값 validation 에러
  E4226 = "E4226", // 회차 저장/등록/수정 값 validation 에러
  E4227 = "E4227", // 작품 공지 저장/등록/수정 값 validation 에러
  E4228 = "E4228", // cp/편집자 신청 값 validation 에러
  E4229 = "E4229", // 프로필 추가/수정 신청 값 validation 에러
  E4230 = "E4230", // 작품 등록/수정 시 유효하지 않는 작가명(닉네임)
}
