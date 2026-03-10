const WEBP_MIME_TYPE = "image/webp";
const WEBP_QUALITY = 0.92;

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

const convertImageFileToWebp = async (file: File): Promise<File> => {
  const webpFileName = createWebpFileName(file.name);
  const isAlreadyWebp =
    file.type === WEBP_MIME_TYPE && file.name.toLowerCase().endsWith(".webp");

  if (isAlreadyWebp) {
    return file;
  }

  if (file.type === WEBP_MIME_TYPE) {
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

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to get canvas context.");
  }

  context.drawImage(image, 0, 0, width, height);

  const webpBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, WEBP_MIME_TYPE, WEBP_QUALITY);
  });

  if (!webpBlob) {
    throw new Error("Failed to encode image as webp.");
  }

  return new File([webpBlob], webpFileName, {
    type: WEBP_MIME_TYPE,
    lastModified: Date.now(),
  });
};

export const prepareWebpUpload = async (file: File) => {
  const uploadFile = await convertImageFileToWebp(file);
  return {
    uploadFile,
    uploadFileName: createWebpFileName(file.name),
  };
};

