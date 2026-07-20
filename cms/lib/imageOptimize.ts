const BANNER_WEBP_QUALITY = 0.95;
const COVER_WEBP_QUALITY = 0.92;
const WEBP_MIME_TYPE = "image/webp";
export const PRODUCT_COVER_MAX_IMAGE_DIMENSION = 1024;
export const CHARACTER_IMAGE_WIDTH = 728;
export const CHARACTER_IMAGE_HEIGHT = 828;

export type CharacterImageCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type UploadableImageFile = {
  file: File;
  fileName: string;
  contentType: string;
};

const WEBP_CONVERTIBLE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

export const isSupportedCharacterImageFile = (file: File) =>
  WEBP_CONVERTIBLE_TYPES.has(file.type) || file.type === WEBP_MIME_TYPE;

const replaceExtensionWithWebp = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) return `${fileName}.webp`;
  return `${fileName.slice(0, dotIndex)}.webp`;
};

export const calculateImageResizeDimensions = (
  width: number,
  height: number,
  maxDimension?: number,
) => {
  if (width <= 0 || height <= 0) {
    throw new Error("이미지 크기가 올바르지 않습니다.");
  }

  const normalizedMaxDimension = maxDimension ? Math.floor(maxDimension) : 0;
  const longestSide = Math.max(width, height);

  if (normalizedMaxDimension <= 0 || longestSide <= normalizedMaxDimension) {
    return { width, height };
  }

  const scale = normalizedMaxDimension / longestSide;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

export const calculateTopCropSourceRect = (
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
) => {
  if (
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    targetWidth <= 0 ||
    targetHeight <= 0
  ) {
    throw new Error("이미지 크기가 올바르지 않습니다.");
  }

  const sourceAspectRatio = sourceWidth / sourceHeight;
  const targetAspectRatio = targetWidth / targetHeight;

  if (sourceAspectRatio > targetAspectRatio) {
    const width = Math.min(
      sourceWidth,
      Math.round(sourceHeight * targetAspectRatio),
    );
    return {
      x: Math.floor((sourceWidth - width) / 2),
      y: 0,
      width,
      height: sourceHeight,
    };
  }

  return {
    x: 0,
    y: 0,
    width: sourceWidth,
    height: Math.min(
      sourceHeight,
      Math.round(sourceWidth / targetAspectRatio),
    ),
  };
};

const loadImageBitmap = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 변환을 위한 로드에 실패했습니다."));
    };
    image.src = url;
  });
};

const canvasToWebpBlob = (
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("webp 변환에 실패했습니다."));
          return;
        }
        if (blob.type !== WEBP_MIME_TYPE) {
          reject(new Error("브라우저가 webp 형식으로 변환하지 못했습니다."));
          return;
        }
        resolve(blob);
      },
      WEBP_MIME_TYPE,
      quality,
    );
  });
};

export async function prepareBannerImageForUpload(
  file: File,
): Promise<UploadableImageFile> {
  if (file.type === WEBP_MIME_TYPE) {
    return {
      file,
      fileName: replaceExtensionWithWebp(file.name),
      contentType: WEBP_MIME_TYPE,
    };
  }

  if (!WEBP_CONVERTIBLE_TYPES.has(file.type)) {
    return {
      file,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    };
  }

  try {
    const image = await loadImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("이미지 변환 컨텍스트를 만들 수 없습니다.");
    }

    context.drawImage(image, 0, 0);
    const blob = await canvasToWebpBlob(canvas, BANNER_WEBP_QUALITY);
    const fileName = replaceExtensionWithWebp(file.name);

    return {
      file: new File([blob], fileName, {
        type: WEBP_MIME_TYPE,
        lastModified: file.lastModified,
      }),
      fileName,
      contentType: WEBP_MIME_TYPE,
    };
  } catch (error) {
    console.warn("배너 이미지 webp 변환 실패, 원본으로 업로드합니다.", error);
    return {
      file,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    };
  }
}

export async function prepareCoverImageForUpload(
  file: File,
): Promise<UploadableImageFile> {
  const fileName = replaceExtensionWithWebp(file.name);

  try {
    const image = await loadImageBitmap(file);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    const targetDimensions = calculateImageResizeDimensions(
      width,
      height,
      PRODUCT_COVER_MAX_IMAGE_DIMENSION,
    );

    if (
      file.type === WEBP_MIME_TYPE &&
      targetDimensions.width === width &&
      targetDimensions.height === height
    ) {
      return {
        file,
        fileName,
        contentType: WEBP_MIME_TYPE,
      };
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetDimensions.width;
    canvas.height = targetDimensions.height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("이미지 변환 컨텍스트를 만들 수 없습니다.");
    }

    context.drawImage(
      image,
      0,
      0,
      targetDimensions.width,
      targetDimensions.height,
    );

    const blob = await canvasToWebpBlob(canvas, COVER_WEBP_QUALITY);

    return {
      file: new File([blob], fileName, {
        type: WEBP_MIME_TYPE,
        lastModified: file.lastModified,
      }),
      fileName,
      contentType: WEBP_MIME_TYPE,
    };
  } catch (error) {
    console.error("표지 이미지 webp 변환 실패", error);
    throw new Error("표지 이미지 변환에 실패했습니다.");
  }
}

export async function prepareCharacterImageFromCover(
  coverImageUrl: string,
  productId: number,
): Promise<UploadableImageFile> {
  if (!coverImageUrl) {
    throw new Error(
      "선택한 작품에 표지 이미지가 없습니다. 캐릭터 이미지를 직접 등록해 주세요.",
    );
  }

  try {
    const response = await fetch(coverImageUrl, {
      credentials: "omit",
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`표지 이미지 응답 오류: ${response.status}`);
    }

    const sourceBlob = await response.blob();
    if (!sourceBlob.type.startsWith("image/")) {
      throw new Error("표지 파일이 이미지 형식이 아닙니다.");
    }

    const sourceFile = new File([sourceBlob], `cover-${productId}`, {
      type: sourceBlob.type,
    });
    const image = await loadImageBitmap(sourceFile);
    const sourceRect = calculateTopCropSourceRect(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height,
      CHARACTER_IMAGE_WIDTH,
      CHARACTER_IMAGE_HEIGHT,
    );
    const canvas = document.createElement("canvas");
    canvas.width = CHARACTER_IMAGE_WIDTH;
    canvas.height = CHARACTER_IMAGE_HEIGHT;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("이미지 변환 컨텍스트를 만들 수 없습니다.");
    }

    context.drawImage(
      image,
      sourceRect.x,
      sourceRect.y,
      sourceRect.width,
      sourceRect.height,
      0,
      0,
      CHARACTER_IMAGE_WIDTH,
      CHARACTER_IMAGE_HEIGHT,
    );

    const blob = await canvasToWebpBlob(canvas, COVER_WEBP_QUALITY);
    const fileName = `character-${productId}.webp`;

    return {
      file: new File([blob], fileName, { type: WEBP_MIME_TYPE }),
      fileName,
      contentType: WEBP_MIME_TYPE,
    };
  } catch (error) {
    console.error("표지 기반 캐릭터 이미지 생성 실패", error);
    throw new Error(
      "표지 이미지로 캐릭터 이미지를 만들지 못했습니다. 캐릭터 이미지를 직접 등록해 주세요.",
    );
  }
}

export async function cropCharacterImageForUpload(
  file: File,
  crop: CharacterImageCropRect,
): Promise<File> {
  if (!isSupportedCharacterImageFile(file)) {
    throw new Error("JPG, PNG, WebP 이미지만 사용할 수 있습니다.");
  }

  const image = await loadImageBitmap(file);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const x = Math.max(0, Math.min(Math.round(crop.x), sourceWidth - 1));
  const y = Math.max(0, Math.min(Math.round(crop.y), sourceHeight - 1));
  const width = Math.max(
    1,
    Math.min(Math.round(crop.width), sourceWidth - x),
  );
  const height = Math.max(
    1,
    Math.min(Math.round(crop.height), sourceHeight - y),
  );

  const canvas = document.createElement("canvas");
  canvas.width = CHARACTER_IMAGE_WIDTH;
  canvas.height = CHARACTER_IMAGE_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("이미지 변환 컨텍스트를 만들 수 없습니다.");
  }

  context.drawImage(
    image,
    x,
    y,
    width,
    height,
    0,
    0,
    CHARACTER_IMAGE_WIDTH,
    CHARACTER_IMAGE_HEIGHT,
  );

  const blob = await canvasToWebpBlob(canvas, COVER_WEBP_QUALITY);
  return new File([blob], replaceExtensionWithWebp(file.name), {
    type: WEBP_MIME_TYPE,
    lastModified: file.lastModified,
  });
}
