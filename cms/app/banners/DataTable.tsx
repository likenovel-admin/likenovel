"use client";

import { useDeleteBanner } from "@/api/banner";
import BannerThumbnailPreview from "@/app/banners/BannerThumbnailPreview";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { bannerPosition } from "@/enums/banner";
import { usesUnifiedBannerImage } from "@/lib/bannerImagePolicy";
import {
  catchErrorMessage,
  confirm,
  formatDateRange,
  showAlert,
} from "@/lib/utils";
import { IBanner } from "@/types/banner";
import { useRouter } from "next/navigation";

interface Props {
  data: IBanner[];
  loading?: boolean;
  listQuery?: string;
  refetch: () => void;
}

export default function BannersTable({
  data,
  loading,
  listQuery,
  refetch,
}: Props) {
  const router = useRouter();
  const deleteBanner = useDeleteBanner();

  const handleDelete = async (id: string) => {
    if (deleteBanner.isPending) {
      return;
    }
    const result = await confirm({
      title: "배너를 삭제하시겠습니까?",
      text: "삭제 후 복구할 수 없습니다.",
      confirm: "삭제",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;
    deleteBanner.mutate(id, {
      onSuccess: () => {
        refetch();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  const handleEdit = (id: string) => {
    router.push(listQuery ? `/banners/${id}?${listQuery}` : `/banners/${id}`);
  };

  const columns: Column[] = [
    {
      header: "노출 위치",
      key: "position",
      render: (_, row: IBanner) =>
        row.position
          ? bannerPosition[
              `${row.position}${row.division ? `-${row.division}` : ""}`
            ]
          : "",
    },
    { header: "배너명", key: "title" },
    {
      header: "썸네일",
      key: "image_path",
      render: (_, row: IBanner) => {
        const positionValue = `${row.position}${row.division ? `-${row.division}` : ""}`;
        const isUnified = usesUnifiedBannerImage(positionValue);

        return (
          <div className="flex items-center gap-2">
            <BannerThumbnailPreview
              src={row.image_path}
              label={isUnified ? "IMG" : "PC"}
              alt={`${row.title} 배너`}
            />
            {!isUnified && (
              <BannerThumbnailPreview
                src={row.mobile_image_path}
                label="MO"
                alt={`${row.title} 모바일 배너`}
                className="h-10 w-8"
              />
            )}
          </div>
        );
      },
    },
    {
      header: "노출 기간",
      key: "date",
      render: (_, row: IBanner) =>
        formatDateRange(row.show_start_date, row.show_end_date),
    },
    { header: "노출 순서", key: "show_order" },
    {
      header: "상태",
      key: "status",
      render: (_, row: IBanner) => (row.show === "Y" ? "활성" : "비활성"),
    },
    {
      header: "관리",
      key: "actions",
      render: (_, row: IBanner) => (
        <div className="flex gap-2 items-center">
          <Button variant="outline" onClick={() => handleEdit(row.id + "")}>
            수정
          </Button>
          <Button variant="outline" onClick={() => handleDelete(row.id + "")}>
            삭제
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
      <FullPageLoader isLoading={deleteBanner.isPending} />
    </>
  );
}
