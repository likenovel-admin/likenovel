const WEBP_QUALITY = 0.82;

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

const replaceExtensionWithWebp = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) return `${fileName}.webp`;
  return `${fileName.slice(0, dotIndex)}.webp`;
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
  quality = WEBP_QUALITY,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("webp 변환에 실패했습니다."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
};

export async function prepareBannerImageForUpload(
  file: File,
): Promise<UploadableImageFile> {
  if (file.type === "image/webp") {
    return {
      file,
      fileName: replaceExtensionWithWebp(file.name),
      contentType: "image/webp",
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
    const blob = await canvasToWebpBlob(canvas);
    const fileName = replaceExtensionWithWebp(file.name);

    return {
      file: new File([blob], fileName, {
        type: "image/webp",
        lastModified: file.lastModified,
      }),
      fileName,
      contentType: "image/webp",
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
