const WEBP_MIME_TYPE = "image/webp";
const WEBP_QUALITY = 0.92;
export const PRODUCT_COVER_MAX_IMAGE_DIMENSION = 1024;

interface PrepareWebpUploadOptions {
  maxDimension?: number;
}

export const calculateImageResizeDimensions = (
  width: number,
  height: number,
  maxDimension?: number
) => {
  if (width <= 0 || height <= 0) {
    throw new Error("Invalid image size.");
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

const getBaseFileName = (fileName: string) => {
  const extensionIndex = fileName.lastIndexOf(".");
  if (extensionIndex <= 0) {
    return fileName;
  }

  return fileName.slice(0, extensionIndex);
};

const createWebpFileName = (fileName: string) =>
  `${getBaseFileName(fileName)}.webp`;

const loadImageFromFile = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image file."));
    };

    image.src = objectUrl;
  });

const convertImageFileToWebp = async (
  file: File,
  options: PrepareWebpUploadOptions = {}
): Promise<File> => {
  const webpFileName = createWebpFileName(file.name);
  const isAlreadyWebp =
    file.type === WEBP_MIME_TYPE && file.name.toLowerCase().endsWith(".webp");

  if (isAlreadyWebp && !options.maxDimension) {
    return file;
  }

  if (file.type === WEBP_MIME_TYPE && !options.maxDimension) {
    return new File([file], webpFileName, {
      type: WEBP_MIME_TYPE,
      lastModified: file.lastModified,
    });
  }

  const image = await loadImageFromFile(file);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  if (width <= 0 || height <= 0) {
    throw new Error("Invalid image size.");
  }

  const targetDimensions = calculateImageResizeDimensions(
    width,
    height,
    options.maxDimension
  );

  if (
    targetDimensions.width === width &&
    targetDimensions.height === height &&
    isAlreadyWebp
  ) {
    return file;
  }

  if (
    targetDimensions.width === width &&
    targetDimensions.height === height &&
    file.type === WEBP_MIME_TYPE
  ) {
    return new File([file], webpFileName, {
      type: WEBP_MIME_TYPE,
      lastModified: file.lastModified,
    });
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetDimensions.width;
  canvas.height = targetDimensions.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to get canvas context.");
  }

  context.drawImage(
    image,
    0,
    0,
    targetDimensions.width,
    targetDimensions.height
  );

  const webpBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, WEBP_MIME_TYPE, WEBP_QUALITY);
  });

  if (!webpBlob) {
    throw new Error("Failed to encode image as webp.");
  }

  if (webpBlob.type !== WEBP_MIME_TYPE) {
    throw new Error("Browser did not encode image as webp.");
  }

  return new File([webpBlob], webpFileName, {
    type: WEBP_MIME_TYPE,
    lastModified: Date.now(),
  });
};

export const prepareWebpUpload = async (
  file: File,
  options: PrepareWebpUploadOptions = {}
) => {
  const uploadFile = await convertImageFileToWebp(file, options);
  return {
    uploadFile,
    uploadFileName: createWebpFileName(file.name),
  };
};
