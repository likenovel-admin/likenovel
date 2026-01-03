"use client";
import { useGetBadge, useUpdateBadge } from "@/api/badge";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Input } from "@/components/ui/input";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { catchErrorMessage, showAlert } from "@/lib/utils";

export default function Page() {
  const updateBadge = useUpdateBadge();
  const { data, refetch, isLoading, isFetching } = useGetBadge();

  const handleUpdateBadge = (id: string, promotion_conditions: number) => {
    if (updateBadge.isPending) {
      return;
    }
    updateBadge.mutate(
      {
        id,
        body: {
          promotion_conditions,
        },
      },
      {
        onSuccess: () => {
          refetch();
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
  };
  return (
    <>
      <SidebarInset className="bg-sidebar-inset-background">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4"></div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <h1>뱃지 관리</h1>
          {data && data?.results.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>뱃지명</TableHead>
                  <TableHead>승급 조건</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results?.map((badge) => (
                  <TableRow key={badge.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <strong
                          className={`whitespace-nowrap badge badge-${badge.badge_name.toLowerCase()}`}
                        >
                          {badge.badge_name.toLowerCase() === "master"
                            ? "M"
                            : badge.promotion_conditions}
                        </strong>
                        <span>{badge.badge_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        defaultValue={badge.promotion_conditions}
                        onBlur={(e) =>
                          handleUpdateBadge(
                            badge.id + "",
                            Number(e.target.value)
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="px-4 py-2 text-center text-sm text-muted-foreground flex items-center justify-center h-24">
              No data
            </div>
          )}
        </div>
        <FullPageLoader
          isLoading={isLoading || isFetching || updateBadge.isPending}
        />
      </SidebarInset>
    </>
  );
}
