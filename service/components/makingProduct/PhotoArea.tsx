import { useSelectPresignedFilePath } from "@/app/api/query/author/product";
import useToastStore from "@/store/toastStore";
import { prepareWebpUpload } from "@/utils/webpUpload";
import axios from "axios";
import Image from "next/image";
import { useEffect, useState } from "react";
import Spinner from "../common/Spinner";
import SampleImageLogo from "/public/images/sample-image-logo.svg";
import CoverDesignModal from "./CoverDesignModal";

interface Props {
  onFileId: (fileId: number) => void;
  imagePath?: string;
  onUploadingChange?: (isUploading: boolean) => void;
}

const PhotoArea = ({ onFileId, imagePath, onUploadingChange }: Props) => {
  const { mutateAsync } = useSelectPresignedFilePath();
  const { setToast } = useToastStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCoverDesignOpen, setIsCoverDesignOpen] = useState(false);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }

    setPreviewUrl(null);
    return undefined;
  }, [selectedFile]);

  const setUploadingState = (nextIsUploading: boolean) => {
    setIsUploading(nextIsUploading);
    onUploadingChange?.(nextIsUploading);
  };

  const processAndUploadFile = async (file: File): Promise<boolean> => {
    setUploadingState(true);
    try {
      const { uploadFile, uploadFileName } = await prepareWebpUpload(file);
      const response = await mutateAsync(uploadFileName);
      return await handleUpload(
        response.data.coverImageUploadPath,
        uploadFile,
        response.data.coverImageFileId
      );
    } catch (error) {
      setToast({
        message: "파일을 불러오는데 실패했습니다.",
        type: "error",
      });
      return false;
    } finally {
      setUploadingState(false);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) {
      setSelectedFile(null);
      setToast({
        message: "이미지를 선택해주세요.",
        type: "error",
      });
      return;
    }
    await processAndUploadFile(file);
  };

  const handleUpload = async (
    filePath: string,
    file: File,
    fileId: number
  ): Promise<boolean> => {
    try {
      await axios.put(filePath, file, {
        headers: {
          "Content-Type": "image/webp",
        },
      });

      setSelectedFile(file);
      onFileId(fileId);
      setToast({
        message: "\uc774\ubbf8\uc9c0 \uc5c5\ub85c\ub4dc\uc5d0 \uc131\uacf5\ud588\uc2b5\ub2c8\ub2e4.",
        type: "success",
      });
      return true;
    } catch (error) {
      setSelectedFile(null);
      setToast({
        message: "\uc774\ubbf8\uc9c0 \uc5c5\ub85c\ub4dc\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
        type: "error",
      });
      return false;
    }
  };

  return (
    <section className="flex w-full md:w-auto h-full bg-white rounded-[10px] py-22pxr px-16pxr md:pt-40pxr md:pr-30pxr md:pl-45pxr">
      <div className="flex flex-col">
        <span className="text-13pxr md:text-16pxr text-dark-gray-500 font-semibold after:content-['*'] after:text-red-100">
          {"\ud45c\uc9c0 \uc774\ubbf8\uc9c0"}
        </span>
        <div className="md:flex-col flex gap-[23px] md:gap-[8px]">
          <div className="relative md:flex-auto w-[112px] h-[172px] md:w-[250px] md:h-[380px] bg-[#F9FAFB] rounded-[6px] mt-12pxr overflow-hidden">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt={"\uc791\ud488 \ud45c\uc9c0"}
                fill
                className="object-cover"
              />
            ) : imagePath ? (
              <Image
                src={imagePath}
                alt={"\uc791\ud488 \ud45c\uc9c0"}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <Image
                src="/images/default_cover.png"
                alt="기본 표지"
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="flex flex-col justify-center h-full md:h-auto">
            <label className="w-[114px] h-[36px] md:w-full md:h-[50px] flex justify-center items-center gap-8pxr border border-light-gray-500 rounded-[6px] mt-8pxr hover:bg-light-gray-100 cursor-pointer">
              {isUploading ? (
                <Spinner size={30} />
              ) : (
                <>
                  <SampleImageLogo className="w-[20px] h-[20px] text-dark-gray-500 rounded-[6px]" />
                  <span className="text-13pxr md:text-14pxr text-dark-gray-500">
                    {"\uc774\ubbf8\uc9c0 \uc5c5\ub85c\ub4dc"}
                  </span>
                </>
              )}

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </label>
            <button
              type="button"
              onClick={() => setIsCoverDesignOpen(true)}
              className="w-[114px] h-[36px] md:w-full md:h-[50px] flex justify-center items-center gap-8pxr rounded-[6px] mt-8pxr bg-blue-600 text-white cursor-pointer"
            >
              <span className="text-13pxr md:text-14pxr">표지 디자인</span>
            </button>
            <span className="text-11pxr md:text-13pxr text-dark-gray-300 mt-13pxr text-left break-keep md:text-center">
              {"대표이미지 권장 사이즈는 400 x 600px입니다."}
            </span>
          </div>
        </div>
      </div>
      <CoverDesignModal
        isOpen={isCoverDesignOpen}
        onClose={() => setIsCoverDesignOpen(false)}
        onComplete={processAndUploadFile}
      />
    </section>
  );
};

export default PhotoArea;
