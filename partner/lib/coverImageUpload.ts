const COVER_WEBP_QUALITY = 0.92;
const WEBP_MIME_TYPE = "image/webp";
export const PRODUCT_COVER_MAX_IMAGE_DIMENSION = 1024;

type UploadableImageFile = {
  file: File;
  fileName: string;
  contentType: string;
};

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
  quality = COVER_WEBP_QUALITY,
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

    const blob = await canvasToWebpBlob(canvas);

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
