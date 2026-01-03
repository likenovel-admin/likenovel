import Image from "next/image";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

const DocumentAddArea = () => {
  const labelClassName =
    "text-13pxr md:text-16pxr text-dark-gray-500 font-semibold";
  const requiredLabelClassName = `${labelClassName} after:content-['*'] after:text-red-100`;

  const { setValue, watch } = useFormContext();
  const [error, setError] = useState<string>("");

  const watchedRequestType = watch("requestType");
  const files = watch("files") || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setError("");

    // Validate max 2 files
    if (files.length + selectedFiles.length > 2) {
      setError("최대 2개의 파일만 첨부할 수 있습니다.");
      e.target.value = ""; // Reset input
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    const invalidFiles = selectedFiles.filter((file) => file.size > maxSize);
    if (invalidFiles.length > 0) {
      setError("파일 크기는 10MB 이내로 제한됩니다.");
      e.target.value = ""; // Reset input
      return;
    }

    // Check for duplicate file names
    const existingFileNames = files.map((file: File) => file.name);
    const duplicateFiles = selectedFiles.filter((file) =>
      existingFileNames.includes(file.name)
    );
    if (duplicateFiles.length > 0) {
      setError(`이미 추가된 파일입니다: ${duplicateFiles[0].name}`);
      e.target.value = ""; // Reset input
      return;
    }

    const newFiles = [...files, ...selectedFiles];
    setValue("files", newFiles);

    // Set individual file values for form submission
    if (newFiles[0]) setValue("attachment_file_1st", newFiles[0]);
    if (newFiles[1]) setValue("attachment_file_2nd", newFiles[1]);

    // Reset input to allow re-selecting the same file after removal
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_: File, i: number) => i !== index);
    setValue("files", newFiles);
    setError("");

    // Update form values
    setValue("attachment_file_1st", newFiles[0] || undefined);
    setValue("attachment_file_2nd", newFiles[1] || undefined);
  };

  const getRequirementText = () => {
    if (watchedRequestType === "editor") {
      return "편집자는 성함과 회사명이 보이도록 명함을 첨부해주세요";
    } else if (watchedRequestType === "CP") {
      return "CP사는 사업자 번호가 있는 사업자 등록증을 첨부해주세요";
    }
    return "편집자는 성함과 회사명이 보이도록 명함을 첨부해주세요";
  };

  return (
    <div className={`flex flex-col gap-2 w-full`}>
      <label className={`${requiredLabelClassName}`}>확인할 서류 첨부</label>
      <ul className="list-inside list-disc text-13pxr text-gray-500">
        <li>{getRequirementText()}</li>
        <li>10M이내 파일을 최대 2개 첨부하실 수 있습니다</li>
      </ul>

      {error && (
        <div className="text-red-100 text-12pxr flex items-center gap-1">
          <Image
            src="/images/triangle-warn-red.svg"
            alt="경고"
            width={12}
            height={11}
          />
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((file: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between px-3 py-2 border border-light-gray-500 rounded-[6px] bg-white"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Image
                  src="/images/document-add.svg"
                  alt="file"
                  width={16}
                  height={16}
                />
                <span className="text-13pxr text-dark-gray-500 truncate">
                  {file.name}
                </span>
                <span className="text-11pxr text-dark-gray-300 whitespace-nowrap">
                  ({(file.size / (1024 * 1024)).toFixed(2)}MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-2 text-dark-gray-300 hover:text-dark-gray-500"
              >
                <Image
                  src="/images/close.svg"
                  alt="삭제"
                  width={16}
                  height={16}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length < 2 && (
        <label className="h-[110px] border rounded-[6px] border-light-gray-500 bg-gray-100 flex items-center justify-center flex-col cursor-pointer hover:bg-gray-200 transition-colors">
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          <div className="w-11 h-11 border rounded-full border-light-gray-500 flex items-center justify-center">
            <Image
              src="/images/document-add.svg"
              alt="plus"
              width={20}
              height={20}
            />
          </div>
          <span className="text-dark-gray-300 text-13pxr font-normal mt-1">
            파일첨부하기
          </span>
        </label>
      )}
    </div>
  );
};

export default DocumentAddArea;
