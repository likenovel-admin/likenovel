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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

interface PropsType {
  default?: number;
  setProduct: Dispatch<SetStateAction<number | undefined>>;
}

export default function ProductSearch(props: PropsType) {
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [productOption, setProductOption] = useState<IProduct[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
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
    const newTimeoutId = setTimeout(async () => {
      const newOption = [...products].filter((product) =>
        product.title.toLowerCase().includes(value.toLowerCase())
      );
      setProductOption(newOption);
    }, 1000);
    timeoutId.current = newTimeoutId;
  };

  useEffect(() => {
    handleFetchProduct();
  }, []);

  useEffect(() => {
    if (props.default && !selectedProduct) {
      const originSelectedProduct = products.find(
        (product) => Number(product.product_id) === Number(props.default)
      );
      setSelectedProduct(originSelectedProduct || null);
    }
  }, [props.default, products, selectedProduct]);

  return (
    <div className="w-[300px]">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedProduct ? selectedProduct.title : "작품명을 검색하세요"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[300px] p-0 max-h-[300px] overflow-auto">
          <Command>
            <CommandInput
              placeholder="상품명을 입력하세요..."
              value={search}
              onValueChange={(value) => {
                handleSearch(value);
              }}
            />
            <CommandEmpty>검색된 상품이 없습니다.</CommandEmpty>
            <CommandGroup>
              {productOption.map((product) => (
                <CommandItem
                  key={product.product_id}
                  value={product.title}
                  onSelect={() => {
                    setSelectedProduct(product);
                    props.setProduct(product.product_id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProduct?.product_id === product.product_id
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
    </div>
  );
}
