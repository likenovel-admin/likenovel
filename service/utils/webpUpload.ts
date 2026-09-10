const WEBP_MIME_TYPE = "image/webp";
const JPEG_MIME_TYPE = "image/jpeg";
const PNG_MIME_TYPE = "image/png";
const ENCODE_QUALITY = 0.92;
export const PRODUCT_COVER_MAX_IMAGE_DIMENSION = 1024;

// Safari on older iOS silently returns a png blob instead of webp, so webp is
// preferred but never required. jpeg is the fallback every browser can encode.
const ENCODE_MIME_TYPE_PREFERENCE = [WEBP_MIME_TYPE, JPEG_MIME_TYPE] as const;

// The upload endpoints accept these directly. Anything else must be re-encoded
// before it can be uploaded.
const UPLOADABLE_MIME_TYPES: readonly string[] = [
  WEBP_MIME_TYPE,
  JPEG_MIME_TYPE,
  PNG_MIME_TYPE,
];

interface PrepareImageUploadOptions {
  maxDimension?: number;
}

export interface DecodedImageSource {
  width: number;
  height: number;
  // Set by the browser decoder and consumed by the browser encoder. Tests
  // supply their own decode/encode pair and leave this out.
  drawable?: CanvasImageSource;
}

export interface EncodeImageOptions {
  width: number;
  height: number;
  mimeType: string;
  quality: number;
}

export interface ImageUploadDeps {
  decodeImage: (file: File) => Promise<DecodedImageSource>;
  encodeImage: (
    source: DecodedImageSource,
    options: EncodeImageOptions
  ) => Promise<Blob | null>;
}

export interface PreparedImageUpload {
  uploadFile: File;
  uploadFileName: string;
  contentType: string;
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

const decodeImageInBrowser = (file: File): Promise<DecodedImageSource> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
        drawable: image,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image file."));
    };

    image.src = objectUrl;
  });

const encodeImageInBrowser = async (
  source: DecodedImageSource,
  options: EncodeImageOptions
): Promise<Blob | null> => {
  const { drawable } = source;
  if (!drawable) {
    throw new Error("Decoded image is missing its drawable source.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to get canvas context.");
  }

  // jpeg has no alpha channel, so transparent source pixels would otherwise
  // flatten to black. webp keeps its alpha channel and needs no fill.
  if (options.mimeType === JPEG_MIME_TYPE) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, options.width, options.height);
  }

  context.drawImage(drawable, 0, 0, options.width, options.height);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, options.mimeType, options.quality);
  });
};

const browserImageUploadDeps: ImageUploadDeps = {
  decodeImage: decodeImageInBrowser,
  encodeImage: encodeImageInBrowser,
};

export const prepareImageUpload = async (
  file: File,
  options: PrepareImageUploadOptions = {},
  deps: ImageUploadDeps = browserImageUploadDeps
): Promise<PreparedImageUpload> => {
  // A webp upload with no resize target never needed decoding, and browsers
  // that cannot decode webp at all still have to be able to send it through.
  if (!options.maxDimension && file.type === WEBP_MIME_TYPE) {
    return {
      uploadFile: file,
      uploadFileName: file.name,
      contentType: WEBP_MIME_TYPE,
    };
  }

  const source = await deps.decodeImage(file);

  if (source.width <= 0 || source.height <= 0) {
    throw new Error("Invalid image size.");
  }

  const targetDimensions = calculateImageResizeDimensions(
    source.width,
    source.height,
    options.maxDimension
  );
  const needsResize =
    targetDimensions.width !== source.width ||
    targetDimensions.height !== source.height;

  if (!needsResize && file.type === WEBP_MIME_TYPE) {
    return {
      uploadFile: file,
      uploadFileName: file.name,
      contentType: WEBP_MIME_TYPE,
    };
  }

  for (const mimeType of ENCODE_MIME_TYPE_PREFERENCE) {
    const blob = await deps.encodeImage(source, {
      width: targetDimensions.width,
      height: targetDimensions.height,
      mimeType,
      quality: ENCODE_QUALITY,
    });

    // A browser that cannot encode this type returns null or quietly swaps in
    // another type. Both mean "try the next candidate", not "fail the upload".
    if (!blob || blob.type !== mimeType) {
      continue;
    }

    return {
      uploadFile: new File([blob], file.name, {
        type: mimeType,
        lastModified: Date.now(),
      }),
      uploadFileName: file.name,
      contentType: mimeType,
    };
  }

  // No encoder worked. Upload the original bytes when they are already a
  // format the CDN and browsers can serve directly.
  if (UPLOADABLE_MIME_TYPES.includes(file.type)) {
    return {
      uploadFile: file,
      uploadFileName: file.name,
      contentType: file.type,
    };
  }

  throw new Error("Failed to convert image for upload.");
};
