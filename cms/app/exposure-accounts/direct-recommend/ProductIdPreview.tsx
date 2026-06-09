"use client";

import { getProductsSearch } from "@/api/product";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { catchErrorMessage, parseProductIds } from "@/lib/utils";
import { format } from "date-fns";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  appendDirectRecommendProductId,
  buildDirectRecommendProductPreviewRows,
  removeDirectRecommendProductId,
} from "./productPreview";
import type { DirectRecommendProductSummary } from "./productPreview";

interface ProductIdPreviewProps {
  productInput: string;
  onProductInputChange: (value: string) => void;
}

function normalizeProductSearchResponse(
  response: unknown
): DirectRecommendProductSummary[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const payload = response as { data?: unknown; results?: unknown };
  if (Array.isArray(payload.data)) {
    return payload.data;
  }
  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  return [];
}

function formatLastEpisodeDate(dateValue: string | null) {
  return dateValue ? format(new Date(dateValue), "yyyy-MM-dd") : "-";
}

async function fetchProductDetailById(
  productId: number
): Promise<DirectRecommendProductSummary | null> {
  const response = await apiClient.request<{
    results?: DirectRecommendProductSummary[];
  }>({
    url: "/v1/query/partners/products",
    method: "GET",
    queryParams: {
      page: 1,
      count_per_page: 1,
      search_target: "product-id",
      search_word: String(productId),
    },
  });

  return response.results?.find(
    (product) => Number(product.product_id) === productId
  ) ?? null;
}

export default function ProductIdPreview({
  productInput,
  onProductInputChange,
}: ProductIdPreviewProps) {
  const productIds = useMemo(() => parseProductIds(productInput), [productInput]);
  const hasProductIds = productIds.length > 0;
  const selectedProductIds = useMemo(() => new Set(productIds), [productIds]);
  const [products, setProducts] = useState<DirectRecommendProductSummary[]>([]);
  const [productDetails, setProductDetails] = useState<
    Record<number, DirectRecommendProductSummary>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setErrorMessage("");

    (async () => {
      try {
        const response = await getProductsSearch();
        if (!mounted) {
          return;
        }
        setProducts(normalizeProductSearchResponse(response));
      } catch (error) {
        if (!mounted) {
          return;
        }
        setProducts([]);
        setErrorMessage(
          catchErrorMessage(error) || "작품 정보를 불러오지 못했습니다."
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const missingProductIds = productIds.filter(
      (productId) => !productDetails[productId]
    );
    if (missingProductIds.length === 0) {
      return;
    }

    let mounted = true;
    setIsDetailLoading(true);
    setErrorMessage("");

    (async () => {
      try {
        const nextDetails = await Promise.all(
          missingProductIds.map(fetchProductDetailById)
        );
        if (!mounted) {
          return;
        }

        setProductDetails((prev) => {
          const merged = { ...prev };
          nextDetails.forEach((product, index) => {
            const productId = missingProductIds[index];
            merged[productId] = product ?? { product_id: productId };
          });
          return merged;
        });
      } catch (error) {
        if (!mounted) {
          return;
        }
        setErrorMessage(
          catchErrorMessage(error) || "작품 상세 정보를 불러오지 못했습니다."
        );
      } finally {
        if (mounted) {
          setIsDetailLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [productDetails, productIds]);

  const previewProducts = useMemo(() => {
    const productById = new Map(
      products.map((product) => [Number(product.product_id), product])
    );

    Object.values(productDetails).forEach((product) => {
      const productId = Number(product.product_id);
      productById.set(productId, {
        ...(productById.get(productId) ?? {}),
        ...product,
      });
    });

    return Array.from(productById.values());
  }, [productDetails, products]);

  const rows = useMemo(
    () => buildDirectRecommendProductPreviewRows(productIds, previewProducts),
    [productIds, previewProducts]
  );

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products
      .filter((product) => {
        if (!keyword) {
          return true;
        }

        return (
          product.title?.toLowerCase().includes(keyword) ||
          product.author_nickname?.toLowerCase().includes(keyword) ||
          String(product.product_id).includes(keyword)
        );
      })
      .slice(0, 50);
  }, [products, search]);

  const handleSelectProduct = (productId: number) => {
    onProductInputChange(appendDirectRecommendProductId(productIds, productId));
    setSearch("");
    setOpen(false);
  };

  const handleRemoveProduct = (productId: number) => {
    onProductInputChange(removeDirectRecommendProductId(productIds, productId));
  };

  return (
    <div className="mt-3 space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[360px] justify-between"
            disabled={isLoading}
          >
            <span className="truncate">
              {isLoading ? "작품 목록 불러오는 중" : "작품명/ID/작가명 검색"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-0">
          <Command>
            <CommandInput
              placeholder="작품명, ID, 작가명 입력"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>검색된 작품이 없습니다.</CommandEmpty>
              <CommandGroup>
                {filteredProducts.map((product) => {
                  const isSelected = selectedProductIds.has(product.product_id);

                  return (
                    <CommandItem
                      key={product.product_id}
                      value={`${product.product_id} ${product.title ?? ""} ${
                        product.author_nickname ?? ""
                      }`}
                      disabled={isSelected}
                      onSelect={() => handleSelectProduct(product.product_id)}
                    >
                      <Check
                        className={
                          isSelected ? "h-4 w-4 opacity-100" : "h-4 w-4 opacity-0"
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate">
                          {product.title || `작품 ${product.product_id}`}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          ID {product.product_id} ·{" "}
                          {product.author_nickname || "-"} ·{" "}
                          {product.count_episode ?? "-"}화
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {errorMessage ? (
        <div className="text-sm text-destructive">{errorMessage}</div>
      ) : null}

      {hasProductIds ? (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">작품 ID</TableHead>
                <TableHead>작품명</TableHead>
                <TableHead className="w-[180px]">작가명</TableHead>
                <TableHead className="w-[100px] text-right">회차수</TableHead>
                <TableHead className="w-[150px]">최근회차등록일</TableHead>
                <TableHead className="w-[90px] text-center">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isDetailLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    작품 정보를 불러오는 중입니다.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={`${row.productId}-${index}`}>
                    <TableCell className="font-medium">{row.productId}</TableCell>
                    <TableCell>
                      {row.title ?? (
                        <span className="text-destructive">
                          작품을 찾을 수 없음
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{row.authorNickname ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {row.countEpisode ?? "-"}
                    </TableCell>
                    <TableCell>{formatLastEpisodeDate(row.lastEpisodeDate)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveProduct(row.productId)}
                      >
                        삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
