"use client";
import useConfirmStore from "@/store/confirmStore";
import { useRef } from "react";

const Confirm = () => {
  const {
    isOpen,
    content,
    confirmText,
    onConfirm,
    buttonCount = 2,
    closeConfirm,
  } = useConfirmStore();
  const modalRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 flex inset-0 bg-black/50 justify-center items-center`}
    >
      <div
        className={`rounded-[20px] border border-light-gray-400 m-[15px] shadow-xl min-w-[300px] max-h-[500px] md:min-w-[402px] md:max-h-[600px] bg-white`}
      >
        <div
          className="overflow-y-auto h-fit md:max-h-[calc(100vh-70px)]"
          ref={modalRef}
        >
          <div className="flex flex-col items-center justify-center pt-[40px]">
            <div className="flex flex-col text-15pxr md:text-18pxr font-bold text-center">
              {content}
            </div>
            <div className="w-full border border-t-light-gray-500 border-b-0 border-l-0 border-r-0 mt-30pxr" />
            {buttonCount === 1 ? (
              <div className="w-full h-[60px] flex justify-center items-center">
                <button
                  className="w-full hover:text-primary-100"
                  onClick={() => {
                    onConfirm && onConfirm();
                    closeConfirm();
                  }}
                >
                  {confirmText}
                </button>
              </div>
            ) : (
              <div className="w-full h-[60px] flex justify-center items-center">
                <button
                  className="w-full hover:text-dark-gray-100"
                  onClick={() => closeConfirm()}
                >
                  취소
                </button>
                <div className="h-full border border-l-light-gray-500 border-r-0 border-t-0 border-b-0" />
                <button
                  className="w-full hover:text-primary-100"
                  onClick={() => {
                    onConfirm && onConfirm();
                    closeConfirm();
                  }}
                >
                  {confirmText}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirm;
