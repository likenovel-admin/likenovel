import { useSelectPresignedFilePath } from "@/app/api/query/author/product";
import useToastStore from "@/store/toastStore";
import axios from "axios";
import Image from "next/image";
import { useEffect, useState } from "react";
import Spinner from "../common/Spinner";
import SampleImageLogo from "/public/images/sample-image-logo.svg";
import SampleImage from "/public/images/sample-image.svg";

interface Props {
  onFileId: (fileId: number) => void;
  imagePath?: string;
}

const PhotoArea = ({ onFileId, imagePath }: Props) => {
  const { mutateAsync } = useSelectPresignedFilePath();
  const { setToast } = useToastStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Create preview URL when file changes and cleanup on unmount
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);

      // Cleanup function to revoke the object URL
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files ? event.target.files[0] : null;
    try {
      setIsUploading(true);
      if (file) {
        const originalName = file.name;
        const baseName =
          originalName.substring(0, originalName.lastIndexOf(".")) ||
          originalName;
        const newFileName = `${baseName}.webp`;
        const response = await mutateAsync(newFileName);
        handleUpload(
          response.data.coverImageUploadPath,
          file,
          response.data.coverImageFileId
        );
      } else {
        setSelectedFile(null);
        setToast({
          message: "이미지를 선택해주세요.",
          type: "error",
        });
      }
    } catch (error) {
      setToast({
        message: "파일을 불러오는데 실패했습니다.",
        type: "error",
      });
    }
  };

  const handleUpload = async (filePath: string, file: File, fileId: number) => {
    try {
      await axios.put(filePath, file, {
        headers: {
          "Content-Type": "image/webp",
        },
      });
      setSelectedFile(file);
      onFileId(fileId);
      setToast({
        message: "이미지 업로드에 성공했습니다.",
        type: "success",
      });
    } catch (error) {
      setSelectedFile(null);
      setToast({
        message: "이미지 업로드에 실패했습니다.",
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="flex w-full md:w-auto h-full bg-white rounded-[10px] py-22pxr px-16pxr md:pt-40pxr md:pr-30pxr md:pl-45pxr">
      <div className="flex flex-col">
        <span className="text-13pxr md:text-16pxr text-dark-gray-500 font-semibold after:content-['*'] after:text-red-100">
          표지 이미지
        </span>
        <div className="md:flex-col flex gap-[23px] md:gap-[8px]">
          <div className="md:flex-auto flex justify-center items-center w-[112px] h-[172px]  md:w-[250px] md:h-[380px] bg-[#F9FAFB] rounded-[6px] mt-12pxr">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="작품 표지"
                width={52}
                height={113}
                className="w-full h-full object-cover rounded-[6px]"
              />
            ) : imagePath ? (
              <Image
                src={imagePath}
                alt="작품 표지"
                width={52}
                height={113}
                className="w-full h-full object-cover rounded-[6px]"
                unoptimized
              />
            ) : (
              <SampleImage className="w-[52px] md:w-[113px] md:h-[83px] text-[#EAEBED]" />
            )}
          </div>
          <div className={"flex flex-col justify-center h-full md:h-auto"}>
            <label className="w-[114px] h-[36px] md:w-full md:h-[50px] flex justify-center items-center gap-8pxr border border-light-gray-500 rounded-[6px] mt-8pxr hover:bg-light-gray-100 cursor-pointer">
              {isUploading ? (
                <Spinner size={30} />
              ) : (
                <>
                  <SampleImageLogo className="w-[20px] h-[20px] text-dark-gray-500 rounded-[6px]" />{" "}
                  <span className="text-13pxr md:text-14pxr text-dark-gray-500">
                    이미지 업로드
                  </span>
                </>
              )}

              <input
                type={"file"}
                accept={"image/*"}
                hidden
                onChange={handleFileChange}
              />
            </label>
            <span className="text-11pxr md:text-13pxr text-dark-gray-300 mt-13pxr text-left break-keep md:text-center">
              대표이미지 권장 사이즈는 400 x 600px입니다.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhotoArea;
