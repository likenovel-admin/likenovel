"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CHARACTER_IMAGE_HEIGHT,
  CHARACTER_IMAGE_WIDTH,
  CharacterImageCropRect,
  calculateTopCropSourceRect,
  cropCharacterImageForUpload,
} from "@/lib/imageOptimize";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type ImageSize = { width: number; height: number };

type Props = {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (file: File) => void;
};

const clampCropPosition = (
  crop: CharacterImageCropRect,
  imageSize: ImageSize,
): CharacterImageCropRect => ({
  ...crop,
  x: Math.max(0, Math.min(crop.x, imageSize.width - crop.width)),
  y: Math.max(0, Math.min(crop.y, imageSize.height - crop.height)),
});

export default function CharacterImageCropDialog({
  file,
  open,
  onOpenChange,
  onConfirm,
}: Props) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{
    clientX: number;
    clientY: number;
    crop: CharacterImageCropRect;
  } | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);
  const [maximumCrop, setMaximumCrop] =
    useState<CharacterImageCropRect | null>(null);
  const [crop, setCrop] = useState<CharacterImageCropRect | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isCropping, setIsCropping] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open || !file) {
      setImageUrl("");
      setImageSize(null);
      setMaximumCrop(null);
      setCrop(null);
      setZoom(1);
      setErrorMessage("");
      return;
    }

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, open]);

  const initializeCrop = (width: number, height: number) => {
    const nextMaximumCrop = calculateTopCropSourceRect(
      width,
      height,
      CHARACTER_IMAGE_WIDTH,
      CHARACTER_IMAGE_HEIGHT,
    );
    setImageSize({ width, height });
    setMaximumCrop(nextMaximumCrop);
    setCrop(nextMaximumCrop);
    setZoom(1);
    setErrorMessage("");
  };

  const updateZoom = (nextZoom: number) => {
    if (!maximumCrop || !imageSize || !crop) return;
    const width = maximumCrop.width / nextZoom;
    const height = maximumCrop.height / nextZoom;
    const centeredCrop = {
      x: crop.x + crop.width / 2 - width / 2,
      y: crop.y + crop.height / 2 - height / 2,
      width,
      height,
    };
    setZoom(nextZoom);
    setCrop(clampCropPosition(centeredCrop, imageSize));
  };

  const moveCrop = (deltaX: number, deltaY: number) => {
    if (!imageSize) return;
    setCrop((current) =>
      current
        ? clampCropPosition(
            { ...current, x: current.x + deltaX, y: current.y + deltaY },
            imageSize,
          )
        : current,
    );
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragRef.current;
    const image = imageRef.current;
    if (!start || !image || !imageSize) return;
    const rendered = image.getBoundingClientRect();
    if (!rendered.width || !rendered.height) return;
    setCrop(
      clampCropPosition(
        {
          ...start.crop,
          x:
            start.crop.x +
            ((event.clientX - start.clientX) * imageSize.width) / rendered.width,
          y:
            start.crop.y +
            ((event.clientY - start.clientY) * imageSize.height) / rendered.height,
        },
        imageSize,
      ),
    );
  };

  const handleConfirm = async () => {
    if (!file || !crop || isCropping) return;
    setIsCropping(true);
    setErrorMessage("");
    try {
      onConfirm(await cropCharacterImageForUpload(file, crop));
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "이미지를 크롭하지 못했습니다.",
      );
    } finally {
      setIsCropping(false);
    }
  };

  const cropStyle =
    crop && imageSize
      ? {
          left: `${(crop.x / imageSize.width) * 100}%`,
          top: `${(crop.y / imageSize.height) * 100}%`,
          width: `${(crop.width / imageSize.width) * 100}%`,
          height: `${(crop.height / imageSize.height) * 100}%`,
        }
      : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isCropping || nextOpen) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>캐릭터 이미지 크롭</DialogTitle>
          <DialogDescription>
            사각형을 끌어 위치를 맞추고 확대 비율을 조정해 주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-md bg-slate-950 p-3">
          {imageUrl ? (
            <div className="relative inline-block max-h-[60vh] max-w-full overflow-hidden">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="크롭할 캐릭터 이미지"
                draggable={false}
                className="block max-h-[60vh] max-w-full select-none"
                onLoad={(event) =>
                  initializeCrop(
                    event.currentTarget.naturalWidth,
                    event.currentTarget.naturalHeight,
                  )
                }
                onError={() => setErrorMessage("이미지를 불러오지 못했습니다.")}
              />
              {cropStyle ? (
                <div
                  role="application"
                  aria-label="캐릭터 이미지 크롭 영역"
                  tabIndex={0}
                  className="absolute cursor-move touch-none border-2 border-white outline-none ring-blue-500 focus:ring-2"
                  style={{
                    ...cropStyle,
                    boxShadow: "0 0 0 9999px rgb(0 0 0 / 55%)",
                  }}
                  onPointerDown={(event) => {
                    if (!crop) return;
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    dragRef.current = {
                      clientX: event.clientX,
                      clientY: event.clientY,
                      crop,
                    };
                  }}
                  onPointerMove={handlePointerMove}
                  onPointerUp={(event) => {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                    dragRef.current = null;
                  }}
                  onPointerCancel={() => {
                    dragRef.current = null;
                  }}
                  onKeyDown={(event) => {
                    if (!imageSize) return;
                    const step = Math.max(1, Math.round(imageSize.width / 100));
                    const delta = {
                      ArrowLeft: [-step, 0],
                      ArrowRight: [step, 0],
                      ArrowUp: [0, -step],
                      ArrowDown: [0, step],
                    }[event.key];
                    if (!delta) return;
                    event.preventDefault();
                    moveCrop(delta[0], delta[1]);
                  }}
                >
                  <span className="absolute left-1/3 top-0 h-full border-l border-white/60" />
                  <span className="absolute left-2/3 top-0 h-full border-l border-white/60" />
                  <span className="absolute left-0 top-1/3 w-full border-t border-white/60" />
                  <span className="absolute left-0 top-2/3 w-full border-t border-white/60" />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <label htmlFor="character-crop-zoom">확대</label>
            <span>{zoom.toFixed(1)}배</span>
          </div>
          <input
            id="character-crop-zoom"
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(event) => updateZoom(Number(event.target.value))}
            disabled={!crop}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            저장 결과: {CHARACTER_IMAGE_WIDTH} × {CHARACTER_IMAGE_HEIGHT}px · WebP
          </p>
          {errorMessage ? (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCropping}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!crop || isCropping}
          >
            {isCropping ? "처리 중" : "확인"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
