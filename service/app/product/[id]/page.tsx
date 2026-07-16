import { IProduct } from "@/types";
import ProductDetailClient from "./ProductDetailClient";

interface Props {
  params: {
    id: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
}

interface ProductDetailShellResponse {
  data: IProduct;
}

const getInitialProduct = async (productId: number): Promise<IProduct | null> => {
  const apiServerUri =
    process.env.API_SERVER_URI || process.env.NEXT_PUBLIC_API_SERVER_URI;

  if (!apiServerUri || !Number.isFinite(productId) || productId <= 0) {
    return null;
  }

  try {
    const response = await fetch(
      `${apiServerUri.replace(/\/$/, "")}/v1/query/products/${productId}/detail-shell`,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.error("[product-detail] detail shell request failed", {
        productId,
        status: response.status,
      });
      return null;
    }

    const payload = (await response.json()) as ProductDetailShellResponse;
    return payload.data || null;
  } catch (error) {
    console.error("[product-detail] detail shell request failed", {
      productId,
      error,
    });
    return null;
  }
};

const getSearchParamString = (searchParams: Props["searchParams"]): string => {
  const params = new URLSearchParams();

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value !== undefined) {
      params.set(key, value);
    }
  });

  return params.toString();
};

export default async function ProductDetailPage({ params, searchParams }: Props) {
  const productId = Number(params.id);
  const initialProduct = await getInitialProduct(productId);
  const initialSearchParamString = getSearchParamString(searchParams);

  return (
    <ProductDetailClient
      productId={productId}
      initialProduct={initialProduct}
      initialSearchParamString={initialSearchParamString}
    />
  );
}
