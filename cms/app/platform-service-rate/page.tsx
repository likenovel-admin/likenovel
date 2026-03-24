"use client";

import {
  useDeletePlatformServiceRateProduct,
  useEditPlatformServiceRateGlobal,
  useEditPlatformServiceRateProduct,
  useGetPlatformServiceRateConfig,
} from "@/api/platformServiceRate";
import { getProductsSearch } from "@/api/product";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import {
  IPlatformServiceRateOverrideItem,
  IProductSimpleItem,
} from "@/types/platformServiceRate";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";

type TabKey = "global" | "exception";

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabKey>("global");
  const [globalRateInput, setGlobalRateInput] = useState("30");
  const [searchWord, setSearchWord] = useState("");
  const [products, setProducts] = useState<IProductSimpleItem[]>([]);
  const [draftRates, setDraftRates] = useState<Record<number, string>>({});
  const [addedOverrides, setAddedOverrides] = useState<
    IPlatformServiceRateOverrideItem[]
  >([]);

  const { data, isLoading, isFetching, refetch } =
    useGetPlatformServiceRateConfig();
  const updateGlobal = useEditPlatformServiceRateGlobal();
  const updateProduct = useEditPlatformServiceRateProduct();
  const deleteProduct = useDeletePlatformServiceRateProduct();

  useEffect(() => {
    if (data) {
      setGlobalRateInput(String(data.next_global_rate ?? 30));
      const nextDrafts: Record<number, string> = {};
      data.overrides.forEach((item) => {
        nextDrafts[item.product_id] = String(item.next_rate ?? "");
      });
      setDraftRates(nextDrafts);
      setAddedOverrides([]);
    }
  }, [data]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await getProductsSearch();
        const normalizedRows = Array.isArray(rows)
          ? rows
          : Array.isArray((rows as any)?.data)
            ? (rows as any).data
            : [];
        if (!mounted) return;
        setProducts(
          (normalizedRows as IProductSimpleItem[]).map((row) => ({
            product_id: row.product_id,
            title: row.title,
          }))
        );
      } catch (error) {
        if (!mounted) return;
        showAlert("오류", catchErrorMessage(error), "확인");
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const displayedOverrides = useMemo(() => {
    const merged = [...(data?.overrides ?? [])];
    addedOverrides.forEach((item) => {
      if (!merged.some((row) => row.product_id === item.product_id)) {
        merged.push(item);
      }
    });
    return merged.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  }, [data?.overrides, addedOverrides]);

  const existingProductIds = useMemo(
    () => new Set(displayedOverrides.map((item) => item.product_id)),
    [displayedOverrides]
  );

  const filteredProducts = useMemo(() => {
    const keyword = searchWord.trim().toLowerCase();
    if (!keyword) return [];

    return products
      .filter((item) => !existingProductIds.has(item.product_id))
      .filter(
        (item) =>
          item.title.toLowerCase().includes(keyword) ||
          String(item.product_id).includes(keyword)
      )
      .slice(0, 10);
  }, [products, searchWord, existingProductIds]);

  const nextEffectiveMonthLabel = data?.next_effective_month
    ? format(new Date(data.next_effective_month), "yyyy.MM.dd")
    : "-";

  const handleSaveGlobal = () => {
    const rate = Number(globalRateInput);
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      showAlert("오류", "플랫폼 수수료율은 0~100 사이여야 합니다.", "확인");
      return;
    }

    if (updateGlobal.isPending) return;
    updateGlobal.mutate(
      { rate },
      {
        onSuccess: async () => {
          await refetch();
          showAlert("완료", "다음 달 적용 예정 수수료율을 저장했습니다.", "확인");
        },
        onError: (error) => {
          showAlert("오류", catchErrorMessage(error), "확인");
        },
      }
    );
  };

  const handleAddOverride = (product: IProductSimpleItem) => {
    setAddedOverrides((prev) => [
      ...prev,
      {
        product_id: product.product_id,
        title: product.title,
        current_rate: null,
        next_rate: Number(globalRateInput || data?.next_global_rate || 30),
        effective_month: data?.next_effective_month || "",
      },
    ]);
    setDraftRates((prev) => ({
      ...prev,
      [product.product_id]: String(data?.next_global_rate ?? 30),
    }));
    setSearchWord("");
  };

  const handleSaveOverride = (productId: number) => {
    const rate = Number(draftRates[productId] ?? "");
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      showAlert("오류", "예외 수수료율은 0~100 사이여야 합니다.", "확인");
      return;
    }

    if (updateProduct.isPending) return;
    updateProduct.mutate(
      { product_id: productId, rate },
      {
        onSuccess: async () => {
          await refetch();
          showAlert("완료", "작품 예외 수수료율을 저장했습니다.", "확인");
        },
        onError: (error) => {
          showAlert("오류", catchErrorMessage(error), "확인");
        },
      }
    );
  };

  const handleDeleteOverride = (productId: number) => {
    if (deleteProduct.isPending) return;
    deleteProduct.mutate(productId, {
      onSuccess: async () => {
        await refetch();
        showAlert("완료", "다음 달부터 작품 예외를 제거했습니다.", "확인");
      },
      onError: (error) => {
        showAlert("오류", catchErrorMessage(error), "확인");
      },
    });
  };

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4" />
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card>
          <CardHeader>
            <CardTitle>플랫폼 수수료 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <div>변경한 플랫폼 수수료율은 다음 월 1일 00:00부터 적용됩니다.</div>
              <div>이미 집계된 월매출/월정산에는 소급 반영되지 않습니다.</div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={activeTab === "global" ? "default" : "outline"}
                onClick={() => setActiveTab("global")}
              >
                전역
              </Button>
              <Button
                variant={activeTab === "exception" ? "default" : "outline"}
                onClick={() => setActiveTab("exception")}
              >
                예외
              </Button>
            </div>

            {activeTab === "global" && (
              <div className="space-y-4">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableHead>현재 적용 중 플랫폼 수수료율</TableHead>
                      <TableCell>{data?.current_global_rate ?? 30}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>다음 적용 시점</TableHead>
                      <TableCell>{nextEffectiveMonthLabel} 00:00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>다음 달 적용 예정 수수료율</TableHead>
                      <TableCell className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={globalRateInput}
                          onChange={(e) => setGlobalRateInput(e.target.value)}
                          className="w-[160px]"
                        />
                        <span>%</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>웹 결제 수수료</TableHead>
                      <TableCell>0% (읽기 전용)</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="flex justify-end">
                  <Button onClick={handleSaveGlobal}>저장</Button>
                </div>
              </div>
            )}

            {activeTab === "exception" && (
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <div className="mb-2 text-sm font-medium">작품 검색</div>
                  <Input
                    value={searchWord}
                    onChange={(e) => setSearchWord(e.target.value)}
                    placeholder="작품명 또는 작품 ID 검색"
                  />
                  {filteredProducts.length > 0 && (
                    <div className="mt-3 rounded-md border">
                      <Table>
                        <TableBody>
                          {filteredProducts.map((item) => (
                            <TableRow key={item.product_id}>
                              <TableCell className="w-[100px]">
                                {item.product_id}
                              </TableCell>
                              <TableCell>{item.title}</TableCell>
                              <TableCell className="w-[120px] text-right">
                                <Button
                                  variant="outline"
                                  onClick={() => handleAddOverride(item)}
                                >
                                  추가
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <Table>
                  <TableBody>
                    <TableRow>
                      <TableHead className="w-[120px]">작품 ID</TableHead>
                      <TableHead>작품명</TableHead>
                      <TableHead className="w-[140px]">현재 적용</TableHead>
                      <TableHead className="w-[180px]">다음 달 적용</TableHead>
                      <TableHead className="w-[160px]">적용 시점</TableHead>
                      <TableHead className="w-[220px]">작업</TableHead>
                    </TableRow>
                    {displayedOverrides.map((item) => (
                      <TableRow key={item.product_id}>
                        <TableCell>{item.product_id}</TableCell>
                        <TableCell>{item.title || "-"}</TableCell>
                        <TableCell>
                          {item.current_rate == null ? "글로벌" : `${item.current_rate}%`}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={draftRates[item.product_id] ?? ""}
                              onChange={(e) =>
                                setDraftRates((prev) => ({
                                  ...prev,
                                  [item.product_id]: e.target.value,
                                }))
                              }
                              className="w-[120px]"
                            />
                            <span>%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.effective_month
                            ? format(new Date(item.effective_month), "yyyy.MM.dd")
                            : nextEffectiveMonthLabel}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleSaveOverride(item.product_id)}
                            >
                              저장
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDeleteOverride(item.product_id)}
                            >
                              글로벌 복귀
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {displayedOverrides.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                          등록된 작품 예외가 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <FullPageLoader
        isLoading={
          isLoading ||
          isFetching ||
          updateGlobal.isPending ||
          updateProduct.isPending ||
          deleteProduct.isPending
        }
      />
    </SidebarInset>
  );
}
