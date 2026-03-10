"use client";

import { getProductsSearch } from "@/api/product";
import { IProduct } from "@/types/product";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";

interface PropsType {
  selectedProducts: IProduct[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<IProduct[]>>;
}

export default function MultiProductSearch({
  selectedProducts,
  setSelectedProducts,
}: PropsType) {
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [productOption, setProductOption] = useState<IProduct[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const handleFetchProduct = async () => {
    try {
      const res = await getProductsSearch();
      setProducts(res || []);
      setProductOption(res || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout(timeoutId.current as NodeJS.Timeout);
    const newTimeoutId = setTimeout(() => {
      const newOption = [...products].filter((product) =>
        product.title.toLowerCase().includes(value.toLowerCase())
      );
      setProductOption(newOption);
    }, 500);
    timeoutId.current = newTimeoutId;
  };

  const isSelected = (productId: number) =>
    selectedProducts.some((p) => p.product_id === productId);

  const handleSelect = (product: IProduct) => {
    if (isSelected(product.product_id)) {
      setSelectedProducts((prev) =>
        prev.filter((p) => p.product_id !== product.product_id)
      );
    } else {
      setSelectedProducts((prev) => [...prev, product]);
    }
  };

  const handleRemove = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.filter((p) => p.product_id !== productId)
    );
  };

  useEffect(() => {
    handleFetchProduct();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[300px] justify-between"
          >
            <span className="truncate">
              {selectedProducts.length > 0
                ? `${selectedProducts.length}개 작품 선택됨`
                : "작품명을 검색하세요"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[300px] p-0 max-h-[300px] overflow-auto">
          <Command>
            <CommandInput
              placeholder="작품명을 입력하세요..."
              value={search}
              onValueChange={(value) => handleSearch(value)}
            />
            <CommandEmpty>검색된 작품이 없습니다.</CommandEmpty>
            <CommandGroup>
              {productOption.map((product) => (
                <CommandItem
                  key={product.product_id}
                  value={product.title}
                  onSelect={() => handleSelect(product)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isSelected(product.product_id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {product.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedProducts.map((product) => (
            <span
              key={product.product_id}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
            >
              {product.title}
              <button
                type="button"
                onClick={() => handleRemove(product.product_id)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
