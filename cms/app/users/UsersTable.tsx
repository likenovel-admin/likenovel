"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { Button } from "@/components/ui/button";
import { IUser } from "@/types/user";
import { useRouter } from "next/navigation";

interface Props {
  data: IUser[];
  tab?: string;
  loading?: boolean;
}

export default function UsersTable({ data, loading, tab }: Props) {
  const route = useRouter();
  const columns: Column[] = [
    { header: "User_ID", key: "user_id" },
    { header: "이메일", key: "email" },
    ...(tab !== "signout"
      ? [
          { header: "이름", key: "name" },
          { header: "닉네임", key: "nickname" },
          { header: "연락처", key: "phone" },
        ]
      : []),
    { header: "가입일", key: "created_date" },
    { header: "최근 접속일", key: "latest_signed_date" },
    ...(tab === "signout"
      ? [
          { header: "탈퇴일", key: "signoff_date" },
          {
            header: "이용약관",
            key: "agree_terms_yn",
            render: (_: unknown, row: IUser) =>
              row.agree_terms_yn === "Y" ? "동의함" : "동의 안함",
          },
          {
            header: "광고성 정보 수신",
            key: "noti_yn",
            render: (_: unknown, row: IUser) =>
              row.noti_yn === "Y" ? "동의함" : "동의 안함",
          },
        ]
      : [
          {
            header: "관리",
            key: "actions",
            render: (_: unknown, row: IUser) => (
              <Button
                variant="outline"
                onClick={() => route.push(`/users/${row.user_id}`)}
              >
                관리
              </Button>
            ),
          },
        ]),
  ];

  return <CommonTable columns={columns} data={data} loading={loading} />;
}
