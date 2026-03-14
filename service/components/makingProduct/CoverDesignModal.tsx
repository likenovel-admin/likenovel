"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import ModalContainer from "../common/ModalContainer";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT; // 2:3

const FONTS = [
  { label: "프리텐다드", value: "Pretendard" },
  { label: "나눔명조", value: "NanumMyeongjo" },
  { label: "마루부리", value: "MaruBuri" },
];

// Tab 1: 기본 표지 1장
const BASIC_COVERS = [{ id: 0, src: "/images/default_cover.png" }];

// Tab 2: 배경 이미지
const BG_TEMPLATES = [
  { id: 0, src: "/images/default_black.png" },
  { id: 1, src: "/images/default_navy.png" },
  { id: 2, src: "/images/default_purple.png" },
  { id: 3, src: "/images/default_wine.png" },
  { id: 4, src: "/images/default_slateblue.png" },
  { id: 5, src: "/images/default_green.png" },
  { id: 6, src: "/images/default_gray.png" },
  { id: 7, src: "/images/default_orange.png" },
  { id: 8, src: "/images/default_yellow.png" },
  { id: 9, src: "/images/default_soccer.png" },
  { id: 10, src: "/images/default_soccer2.png" },
  { id: 11, src: "/images/default_soccer3.png" },
  { id: 12, src: "/images/default_baseball.png" },
  { id: 13, src: "/images/default_baseball2.png" },
  { id: 14, src: "/images/default_baseball3.png" },
  { id: 15, src: "/images/default_basketball.png" },
  { id: 16, src: "/images/default_basketball2.png" },
  { id: 17, src: "/images/default_basketball3.png" },
];

type TabType = "basic" | "make" | "upload";
type TextAlign = "left" | "center" | "right";

interface TextBlock {
  id: number;
  text: string;
  font: string;
  color: string;
  align: TextAlign;
}

interface CoverDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (file: File) => void;
}

let nextBlockId = 1;

// --- Canvas text helpers ---

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] => {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (!paragraph) {
      lines.push("");
      continue;
    }
    let currentLine = "";
    for (const char of paragraph) {
      const testLine = currentLine + char;
      if (
        ctx.measureText(testLine).width > maxWidth &&
        currentLine.length > 0
      ) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }
  return lines.length > 0 ? lines : [""];
};

const renderCanvas = (
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  textBlocks: TextBlock[]
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (textBlocks.length === 0) return;

  const padding = 30;
  const maxWidth = CANVAS_WIDTH - padding * 2;
  const fontSize = 36;
  const lineHeight = fontSize * 1.4;
  const blockGap = 20;

  const blockLines: string[][] = [];
  for (const block of textBlocks) {
    ctx.font = `bold ${fontSize}px "${block.font}"`;
    blockLines.push(
      block.text.trim() ? wrapText(ctx, block.text, maxWidth) : []
    );
  }

  const totalLines = blockLines.reduce((sum, l) => sum + l.length, 0);
  const totalHeight =
    totalLines * lineHeight + (textBlocks.length - 1) * blockGap;
  let cursorY = (CANVAS_HEIGHT - totalHeight) / 2 + lineHeight / 2;

  for (let i = 0; i < textBlocks.length; i++) {
    const block = textBlocks[i];
    const lines = blockLines[i];
    if (lines.length === 0) continue;

    ctx.font = `bold ${fontSize}px "${block.font}"`;
    ctx.fillStyle = block.color;
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    const x =
      block.align === "left"
        ? padding
        : block.align === "right"
          ? CANVAS_WIDTH - padding
          : CANVAS_WIDTH / 2;
    ctx.textAlign = block.align === "left" ? "left" : block.align === "right" ? "right" : "center";

    for (const line of lines) {
      ctx.fillText(line, x, cursorY);
      cursorY += lineHeight;
    }
    cursorY += blockGap;
  }

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

// --- Align icon ---

const AlignIcon = ({ type, active }: { type: TextAlign; active: boolean }) => {
  const color = active ? "#3B82F6" : "#9CA3AF";
  const bars =
    type === "left"
      ? [[0, 2, 16, 2], [0, 6, 12, 2], [0, 10, 16, 2], [0, 14, 10, 2]]
      : type === "center"
        ? [[2, 2, 16, 2], [4, 6, 12, 2], [2, 10, 16, 2], [5, 14, 10, 2]]
        : [[4, 2, 16, 2], [8, 6, 12, 2], [4, 10, 16, 2], [10, 14, 10, 2]];
  return (
    <svg width="20" height="18" viewBox="0 0 20 18">
      {bars.map(([bx, by, bw, bh], i) => (
        <rect key={i} x={bx} y={by} width={bw} height={bh} fill={color} rx="1" />
      ))}
    </svg>
  );
};

// --- Crop helper ---

const cropImageToFile = (
  image: HTMLImageElement,
  crop: Crop
): Promise<File | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve(null);

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    canvas.toBlob((blob) => {
      if (!blob) return resolve(null);
      resolve(new File([blob], "cover-crop.png", { type: "image/png" }));
    }, "image/png");
  });
};

// --- Main component ---

const CoverDesignModal = ({
  isOpen,
  onClose,
  onComplete,
}: CoverDesignModalProps) => {
  // Shared
  const [tab, setTab] = useState<TabType>("basic");

  // Tab 1: basic
  const [selectedBasic, setSelectedBasic] = useState(0);

  // Tab 2: make
  const [selectedBg, setSelectedBg] = useState(0);
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // Tab 3: upload
  const [uploadSrc, setUploadSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const cropImgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedBlock =
    textBlocks.find((b) => b.id === selectedBlockId) ?? null;

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTab("basic");
      setSelectedBasic(0);
      setSelectedBg(0);
      setTextBlocks([]);
      setSelectedBlockId(null);
      setFontDropdownOpen(false);
      setUploadSrc(null);
      setCrop(undefined);
    }
  }, [isOpen]);

  // Load background image for Tab 2
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = BG_TEMPLATES[selectedBg].src;
    img.onload = () => {
      bgImageRef.current = img;
      setBgLoaded((n) => n + 1);
    };
  }, [selectedBg]);

  // Redraw canvas when dependencies change
  useEffect(() => {
    if (tab !== "make" || !canvasRef.current || !bgImageRef.current) return;
    document.fonts.ready.then(() => {
      if (canvasRef.current && bgImageRef.current) {
        renderCanvas(canvasRef.current, bgImageRef.current, textBlocks);
      }
    });
  }, [tab, textBlocks, bgLoaded]);

  // --- Tab 2 handlers ---

  const handleAddText = () => {
    const id = nextBlockId++;
    setTextBlocks((prev) => [
      ...prev,
      { id, text: "텍스트를 입력하세요", font: FONTS[0].value, color: "#FFFFFF", align: "center" },
    ]);
    setSelectedBlockId(id);
  };

  const updateBlock = (field: keyof TextBlock, value: string) => {
    if (!selectedBlockId) return;
    setTextBlocks((prev) =>
      prev.map((b) => (b.id === selectedBlockId ? { ...b, [field]: value } : b))
    );
  };

  const handleDeleteBlock = () => {
    if (!selectedBlockId) return;
    setTextBlocks((prev) => prev.filter((b) => b.id !== selectedBlockId));
    setSelectedBlockId(null);
  };

  // --- Save handlers ---

  const saveImageFromSrc = useCallback(
    (src: string) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        canvas.toBlob((blob) => {
          if (!blob) return;
          onComplete(
            new File([blob], "cover-basic.png", { type: "image/png" })
          );
          onClose();
        }, "image/png");
      };
    },
    [onComplete, onClose]
  );

  const handleSaveBasic = () => {
    saveImageFromSrc(BASIC_COVERS[selectedBasic].src);
  };

  const handleSaveMake = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      onComplete(new File([blob], "cover-design.png", { type: "image/png" }));
      onClose();
    }, "image/png");
  };

  const handleSaveCrop = async () => {
    if (!cropImgRef.current || !crop) return;
    const file = await cropImageToFile(cropImgRef.current, crop);
    if (file) {
      onComplete(file);
      onClose();
    }
  };

  // --- Upload handlers ---

  const handleFileSelected = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setUploadSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onCropImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: "px", width: Math.min(width, height * ASPECT_RATIO) }, ASPECT_RATIO, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  };

  // --- Tabs config ---

  const tabs: { key: TabType; label: string }[] = [
    { key: "basic", label: "기본 표지 선택" },
    { key: "make", label: "표지 만들기" },
    { key: "upload", label: "표지 업로드" },
  ];

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      title="작품 표지 등록"
    >
      <div className="md:min-w-[640px] md:h-[620px] flex flex-col">
      {/* Tab navigation */}
      <div className="flex border-b px-4 md:px-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setFontDropdownOpen(false);
            }}
            className={`px-4 py-3 text-14pxr font-semibold border-b-2 transition-colors ${
              tab === t.key
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-dark-gray-400 hover:text-dark-gray-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== Tab 1: 기본 표지 선택 ===== */}
      {tab === "basic" && (
        <div className="p-4 md:p-6 flex-1 overflow-y-auto flex flex-col">
          <p className="text-13pxr text-dark-gray-400 mb-4">
            원하시는 표지를 선택하신 후 저장 버튼을 눌러주세요.
          </p>
          <div className="flex flex-wrap gap-3">
            {BASIC_COVERS.map((cover, idx) => (
              <button
                key={cover.id}
                onClick={() => setSelectedBasic(idx)}
                className={`relative w-[120px] aspect-[2/3] rounded-md overflow-hidden border-2 transition-all ${
                  selectedBasic === idx
                    ? "border-blue-500"
                    : "border-transparent "
                }`}
              >
                <Image
                  src={cover.src}
                  alt="기본 표지"
                  fill
                  className="object-cover"
                />
                {selectedBasic === idx && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-3 justify-center mt-auto pt-6">
            <button onClick={onClose} className="px-8 py-3 rounded-md border border-gray-300 text-14pxr text-dark-gray-500">
              취소
            </button>
            <button onClick={handleSaveBasic} className="px-8 py-3 rounded-md bg-[#333] text-white text-14pxr font-semibold">
              저장
            </button>
          </div>
        </div>
      )}

      {/* ===== Tab 2: 표지 만들기 ===== */}
      {tab === "make" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b flex-wrap">
            <button
              onClick={handleAddText}
              className="px-3 py-1.5 border border-gray-300 rounded text-13pxr text-dark-gray-500 "
            >
              + 글자 추가
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block" />
            {/* Font dropdown */}
            <div className="relative">
              <button
                onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
                className="px-3 py-1.5 border border-gray-300 rounded text-13pxr min-w-[100px] text-left flex items-center justify-between gap-2"
                style={{ fontFamily: selectedBlock?.font || FONTS[0].value }}
              >
                <span>
                  {FONTS.find((f) => f.value === (selectedBlock?.font || FONTS[0].value))?.label || "기본서체"}
                </span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="#666" strokeWidth="1.5">
                  <path d="M1 1L5 5L9 1" />
                </svg>
              </button>
              {fontDropdownOpen && (
                <ul className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 max-h-[200px] overflow-y-auto w-[160px]">
                  {FONTS.map((f) => (
                    <li key={f.value}>
                      <button
                        onClick={() => { updateBlock("font", f.value); setFontDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-13pxr "
                        style={{ fontFamily: f.value }}
                      >
                        {f.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Color picker */}
            <input
              type="color"
              value={selectedBlock?.color || "#FFFFFF"}
              onChange={(e) => updateBlock("color", e.target.value)}
              className="w-8 h-8 border border-gray-300 rounded cursor-pointer p-0"
            />
            {/* Alignment */}
            {(["left", "center", "right"] as TextAlign[]).map((a) => (
              <button
                key={a}
                onClick={() => updateBlock("align", a)}
                className={`p-1.5 rounded border transition-colors ${
                  selectedBlock?.align === a ? "border-blue-500 bg-blue-50" : "border-gray-300 "
                }`}
              >
                <AlignIcon type={a} active={selectedBlock?.align === a} />
              </button>
            ))}
            {/* Delete */}
            <button
              onClick={handleDeleteBlock}
              disabled={!selectedBlockId}
              className="px-3 py-1.5 border border-gray-300 rounded text-13pxr text-dark-gray-500  disabled:opacity-40 disabled:cursor-not-allowed"
            >
              삭제
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-1 min-h-0">
            {/* Left: background thumbnails */}
            <div className="w-[130px] md:w-[150px] flex-shrink-0 border-r overflow-y-auto p-2">
              <p className="text-11pxr text-dark-gray-400 mb-2 px-1">배경 이미지 선택</p>
              <div className="grid grid-cols-2 gap-1.5">
                {BG_TEMPLATES.map((tpl, idx) => (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedBg(idx)}
                    className={`relative aspect-[2/3] rounded overflow-hidden border-2 transition-all ${
                      selectedBg === idx ? "border-blue-500" : "border-transparent "
                    }`}
                  >
                    <Image src={tpl.src} alt={`배경 ${idx + 1}`} fill className="object-cover" />
                    {selectedBg === idx && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: canvas + text inputs */}
            <div className="flex-1 flex flex-col items-center p-4 gap-4 overflow-y-auto">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-[240px] h-[360px] md:w-[300px] md:h-[450px] rounded border border-gray-200"
              />
              {textBlocks.length > 0 && (
                <div className="w-full max-w-[400px] flex flex-col gap-2">
                  {textBlocks.map((block) => (
                    <textarea
                      key={block.id}
                      value={block.text}
                      onFocus={() => setSelectedBlockId(block.id)}
                      onChange={(e) => {
                        setSelectedBlockId(block.id);
                        setTextBlocks((prev) =>
                          prev.map((b) =>
                            b.id === block.id ? { ...b, text: e.target.value } : b
                          )
                        );
                      }}
                      className={`w-full border rounded p-2 text-13pxr resize-none h-[60px] focus:outline-none transition-colors ${
                        selectedBlockId === block.id ? "border-blue-500" : "border-gray-300"
                      }`}
                      style={{ fontFamily: block.font }}
                      placeholder="텍스트를 입력하세요"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom buttons */}
          <div className="flex gap-3 justify-center py-4 border-t">
            <button onClick={onClose} className="px-8 py-3 rounded-md border border-gray-300 text-14pxr text-dark-gray-500 ">
              취소
            </button>
            <button onClick={handleSaveMake} className="px-8 py-3 rounded-md bg-[#333] text-white text-14pxr font-semibold ">
              저장
            </button>
          </div>
        </div>
      )}

      {/* ===== Tab 3: 표지 업로드 ===== */}
      {tab === "upload" && (
        <div className="p-4 md:p-6 flex-1 overflow-y-auto flex flex-col">
          {!uploadSrc ? (
            /* Drop zone */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelected(e.dataTransfer.files[0] ?? null);
              }}
              className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center py-16 px-4 min-h-[300px]  transition-colors"
            >
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" className="mb-4">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <p className="text-14pxr font-semibold text-dark-gray-500 mb-1">
                여기로 이미지를 드래그 해주세요
              </p>
              <p className="text-13pxr text-dark-gray-400 mb-4">또는...</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-gray-300 rounded text-13pxr text-dark-gray-500 "
              >
                업로드할 이미지 선택
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                hidden
                onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
              />
              <p className="text-12pxr text-dark-gray-300 mt-4 text-center">
                JPG, PNG 파일을 등록하세요.
                <br />
                최종 크기는 400 x 600 픽셀로 크롭됩니다.
              </p>
            </div>
          ) : (
            /* Crop view */
            <div className="flex flex-col items-center gap-4">
              <p className="text-13pxr text-dark-gray-400">
                표지 영역을 선택하세요 (2:3 비율)
              </p>
              <div className="max-w-[500px] max-h-[500px]">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  aspect={ASPECT_RATIO}
                  minWidth={80}
                  minHeight={120}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={cropImgRef}
                    src={uploadSrc}
                    alt="업로드 이미지"
                    onLoad={onCropImageLoad}
                    style={{ maxWidth: "100%", maxHeight: "500px" }}
                  />
                </ReactCrop>
              </div>
              <button
                onClick={() => { setUploadSrc(null); setCrop(undefined); }}
                className="text-13pxr text-blue-500 underline"
              >
                다른 이미지 선택
              </button>
            </div>
          )}
          <div className="flex gap-3 justify-center mt-auto pt-6">
            <button onClick={onClose} className="px-8 py-3 rounded-md border border-gray-300 text-14pxr text-dark-gray-500">
              취소
            </button>
            <button
              onClick={handleSaveCrop}
              disabled={!uploadSrc || !crop}
              className="px-8 py-3 rounded-md bg-[#333] text-white text-14pxr font-semibold  disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              저장
            </button>
          </div>
        </div>
      )}
      </div>
    </ModalContainer>
  );
};

export default CoverDesignModal;
