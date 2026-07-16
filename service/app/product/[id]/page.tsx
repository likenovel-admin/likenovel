import { IProduct } from "@/types";
import ProductDetailClient from "./ProductDetailClient";

interface Props {
  params: {
    id: string;
  };
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

export default async function ProductDetailPage({ params }: Props) {
  const productId = Number(params.id);
  const initialProduct = await getInitialProduct(productId);

  return (
    <ProductDetailClient
      productId={productId}
      initialProduct={initialProduct}
    />
  );
}
