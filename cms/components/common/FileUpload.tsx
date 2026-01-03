// FileUpload.tsx
import React, { useRef } from "react";

type FileUploadProps = {
  fileName?: string;
  onFileChange: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  buttonText?: string;
  id?: string;
  className?: string;
};

export const FileUpload: React.FC<FileUploadProps> = ({
  fileName = "",
  onFileChange,
  accept = ".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif",
  disabled,
  buttonText = "파일 선택",
  id,
  className = "",
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const triggerPick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] ?? null;
    onFileChange(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const clearFile = () => onFileChange(null);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        width: "100%",
        maxWidth: 420,
      }}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: "none" }}
        disabled={disabled}
      />
      <div style={{ position: "relative", flex: 1 }}>
        <input
          type="text"
          readOnly
          value={fileName}
          placeholder=""
          style={{
            width: "100%",
            height: 36,
            padding: "0 36px 0 10px",
            border: "1px solid #c9d2e2",
            borderRadius: 4,
            outline: "none",
          }}
        />
        {/* {!!fileName && (
          <button
            type="button"
            onClick={clearFile}
            title="DeleteFile"
            style={{
              position: "absolute",
              right: 6,
              top: 6,
              width: 24,
              height: 24,
              border: "none",
              borderRadius: 4,
              background: "#f2f3f5",
              cursor: "pointer",
            }}
            disabled={disabled}
          >
            ×
          </button>
        )} */}
      </div>
      <button
        type="button"
        onClick={triggerPick}
        disabled={disabled}
        style={{
          height: 36,
          padding: "0 14px",
          border: "none",
          borderRadius: 4,
          background: "#6b7280",
          color: "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {buttonText}
      </button>
    </div>
  );
};
