import assert from "node:assert/strict";
import { DEFAULT_PRODUCT_IMAGE } from "@/constants/common";
import { IProduct } from "@/types";
import { getAdultCoverImageSrc } from "@/utils/adultCoverImage";

const createProduct = (overrides: Partial<IProduct> = {}) =>
  ({
    title: "테스트 작품",
    adultYn: "N",
    image: {
      coverImagePath: "https://cdn.likenovel.net/cover/sample.webp",
    },
    ...overrides,
  }) as IProduct;

assert.equal(
  getAdultCoverImageSrc(createProduct(), false),
  "https://cdn.likenovel.net/cover/sample.webp",
);

assert.equal(
  getAdultCoverImageSrc(createProduct({ adultYn: "Y" }), false),
  DEFAULT_PRODUCT_IMAGE,
);

assert.equal(
  getAdultCoverImageSrc(createProduct({ adultYn: "Y" }), true),
  "https://cdn.likenovel.net/cover/sample.webp",
);
