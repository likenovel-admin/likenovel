"use client";

import { useSponsorshipSettlement } from "@/api/sponsorship-recodes";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { sponsorshipSettlementStatus } from "@/constants/sponsorship";
import { useProfile } from "@/hooks/useProfile";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { ISponsorshipRecode } from "@/types/sponsorship-recodes";
import { format } from "date-fns";

interface Props {
  data: ISponsorshipRecode[];
  loading?: boolean;
  refetch: () => void;
}

export default function SponsorShipsTable({ data, loading, refetch }: Props) {
  const sponsorshipSettlement = useSponsorshipSettlement();
  const { isAdmin } = useProfile();

  const handleSettlement = async (id: string) => {
    if (sponsorshipSettlement.isPending) {
      return;
    }
    sponsorshipSettlement.mutate(id + "", {
      onSuccess: () => {
        refetch();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  const columns: Column[] = [
    {
      header: "Date",
      key: "created_date",
      render: (_, row: ISponsorshipRecode) => {
        return row.created_date
          ? format(new Date(row.created_date), "yyyy.MM.dd")
          : "-";
      },
    },
    {
      header: "작품명",
      key: "title",
    },
    {
      header: "작품ID",
      key: "product_id",
    },
    {
      header: "작가명",
      key: "author_nickname",
    },
    {
      header: "후원자",
      key: "user_name",
    },
    {
      header: "후원금액",
      key: "donation_price",
    },
    {
      header: "정산여부",
      key: "settlement_status",
      render: (_, row: ISponsorshipRecode) => {
        const status = row?.settlement_status;

        // Admin logic
        if (isAdmin) {
          if (status === "not-in-settlement") {
            return (
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  onClick={() => handleSettlement(row.product_id + "")}
                >
                  정산하기
                </Button>
              </div>
            );
          } else if (status === "completed-settlement") {
            return "정산 완료";
          } else {
            return status ? sponsorshipSettlementStatus[status] : "";
          }
        }

        // Author logic
        if (status === "not-in-settlement") {
          return "정산 미완료";
        } else if (status === "completed-settlement") {
          return "정산 완료";
        } else {
          return status ? sponsorshipSettlementStatus[status] : "";
        }
      },
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
      <FullPageLoader isLoading={sponsorshipSettlement.isPending} />
    </>
  );
}
