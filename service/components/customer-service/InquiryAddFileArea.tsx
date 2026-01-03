import Image from "next/image";
import { useState } from "react";

const InquiryAddFileArea = () => {
  const [fileList, setFileList] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFileList([...fileList, ...files]);
    }
  };

  const handleFileRemove = (index: number) => {
    const newFileList = [...fileList];
    newFileList.splice(index, 1);
    setFileList(newFileList);
  };

  return (
    <div className="flex md:gap-25pxr flex-col md:flex-row">
      <div className="text-13pxr md:text-16pxr text-dark-gray-500 font-semibold mb-10pxr min-w-[70px] md:mt-4">
        파일첨부
      </div>
      <div className="flex flex-col">
        <div className="flex gap-3 items-center">
          <label className="cursor-pointer rounded-full border-black-100 justify-center items-center border py-2 px-4 text-14pxr md:py-4 md:px-8 w-fit">
            <input
              type="file"
              className="hidden"
              multiple
              onChange={handleFileChange}
            />
            파일찾기
          </label>
          <span className="text-12pxr text-gray-600 mt-2">
            첨부파일은 최대 3개, 10MB까지 가능합니다.
          </span>
        </div>
        <div className="mt-3 flex gap-1 flex-wrap">
          {fileList.map((file, index) => (
            <div
              key={index}
              className="flex gap-3 md:gap-8 w-fit rounded-full bg-gray-100 px-2 md:px-3 h-[24px] md:h-[34px] items-center justify-center text-11pxr md:text-13pxr text-gray-500"
            >
              <span>{file.name}</span>
              <button onClick={() => handleFileRemove(index)}>
                <Image
                  src="/images/close.svg"
                  alt="close"
                  width={8}
                  height={8}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InquiryAddFileArea;
