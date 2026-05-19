"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface Props {
  src?: string | null;
  label: string;
  alt: string;
  className?: string;
}

export default function BannerThumbnailPreview({
  src,
  label,
  alt,
  className = "h-10 w-20",
}: Props) {
  const [broken, setBroken] = useState(false);
  const [open, setOpen] = useState(false);
  const visibleSrc = src && !broken ? src : "";

  if (!visibleSrc) {
    return (
      <div
        className={`${className} flex shrink-0 items-center justify-center rounded border bg-muted text-[11px] text-muted-foreground`}
      >
        {label}
      </div>
    );
  }

  return (
    <div className="inline-flex shrink-0">
      <button
        type="button"
        className={`${className} overflow-hidden rounded border bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
        aria-label={`${label} 배너 이미지 미리보기`}
        onClick={() => setOpen(true)}
      >
        <img
          src={visibleSrc}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[760px] p-4">
          <DialogTitle className="sr-only">{label} 배너 이미지</DialogTitle>
          <DialogDescription className="sr-only">
            선택한 배너 이미지를 크게 확인합니다.
          </DialogDescription>
          <div className="pt-2">
            <img
              src={visibleSrc}
              alt={alt}
              className="max-h-[560px] w-full rounded-sm object-contain"
            />
            <div className="mt-2 text-xs text-muted-foreground">{label}</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
