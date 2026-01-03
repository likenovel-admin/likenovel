"use client";

import { useAcceptApplyRole, useDenyApplyRole } from "@/api/applyRole";
import { DocumentsPopup } from "@/app/users/apply-of-qualification/components/popup";
import CommonTable, { Column } from "@/components/common/CommonTable";
import { Button } from "@/components/ui/button";
import { catchErrorMessage, confirm, showAlert } from "@/lib/utils";
import { IApplyRole } from "@/types/applyRole";
import { IStatisticPayment } from "@/types/statistic";
import { useState } from "react";

interface Props {
  data: IApplyRole[];
  loading?: boolean;
  refetch: () => void;
}

export default function ApplyTable({ data, loading, refetch }: Props) {
  const [showDocumentsPopup, setShowDocumentsPopup] = useState<{
    open: boolean;
    fileList: {
      name: string;
      url: string;
    }[];
  }>({
    open: false,
    fileList: [],
  });

  const acceptApplyRole = useAcceptApplyRole();
  const denyApplyRole = useDenyApplyRole();

  const handleOpenDocumentsPopup = (
    attach_file_name_1st: string,
    attach_file_name_2nd: string,
    attach_file_path_1st: string,
    attach_file_path_2nd: string
  ) => {
    const fileList = [];

    if (attach_file_name_1st) {
      fileList.push({
        name: attach_file_name_1st,
        url: attach_file_path_1st,
      });
    }

    if (attach_file_name_2nd) {
      fileList.push({
        name: attach_file_name_2nd,
        url: attach_file_path_2nd,
      });
    }
    setShowDocumentsPopup({
      open: true,
      fileList,
    });
  };

  const handleCloseDocumentsPopup = () => {
    setShowDocumentsPopup({
      open: false,
      fileList: [],
    });
  };

  const handleAccept = async (id: string) => {
    if (acceptApplyRole.isPending) return;

    const result = await confirm({
      title: "권한 신청 승인",
      text: "정말 승인하시겠습니까?",
      confirm: "승인",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;

    acceptApplyRole.mutate(id, {
      onSuccess: () => {
        refetch();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  const handleDeny = async (id: string) => {
    if (denyApplyRole.isPending) return;

    const result = await confirm({
      title: "권한 신청 반려",
      text: "정말 반려하시겠습니까?",
      confirm: "반려",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;

    denyApplyRole.mutate(id, {
      onSuccess: () => {
        refetch();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  const columns: Column[] = [
    { header: "신청 구분", key: "apply_type" },
    { header: "이메일", key: "email" },
    { header: "닉네임", key: "nickname" },
    { header: "회사명", key: "company_name" },
    { header: "연락 이메일", key: "contact_email" },
    {
      header: "서류",
      key: "document",
      render: (_, row: IApplyRole) => (
        <Button
          variant="outline"
          onClick={() =>
            handleOpenDocumentsPopup(
              row.attach_file_name_1st,
              row.attach_file_name_2nd,
              row.attach_file_path_1st,
              row.attach_file_path_2nd
            )
          }
        >
          확인
        </Button>
      ),
    },
    {
      header: "처리",
      key: "status",
      render: (_, row: IApplyRole) => (
        <>
          {row?.approval_code == "accepted" ? (
            "승인됨"
          ) : row?.approval_code == "denied" ? (
            "반려됨"
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleAccept(row.id + "")}
              >
                승인
              </Button>
              <Button variant="outline" onClick={() => handleDeny(row.id + "")}>
                반려
              </Button>
            </div>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
      {showDocumentsPopup.open && (
        <DocumentsPopup
          close={() => handleCloseDocumentsPopup()}
          fileList={showDocumentsPopup.fileList}
        />
      )}
    </>
  );
}
