import {
  useSelectPresignedFilePathByEpisode,
  useSelectStoragePath,
} from "@/app/api/query/author/episode";
import useToastStore from "@/store/toastStore";
import { prepareWebpUpload } from "@/utils/webpUpload";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
import Italic from "@tiptap/extension-italic";
import OrderedList from "@tiptap/extension-ordered-list";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import axios from "axios";
import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import Spinner from "./Spinner";
import AlignCenter from "/public/images/align-center.svg";
import AlignLeft from "/public/images/align-left.svg";
import AlignRight from "/public/images/align-right.svg";
import BoldImage from "/public/images/bold.svg";
import ItalicImage from "/public/images/italic.svg";
import UnderlineImage from "/public/images/underline.svg";

const MAX_CHARACTERS = 20000;

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const Editor = ({ value, onChange }: Props) => {
  const { setToast } = useToastStore();
  const [hasShownLimitWarning, setHasShownLimitWarning] = useState(false);

  /**
   * 붙여넣기 텍스트를 메모장처럼 그대로 반영합니다.
   *
   * - 클립보드에 HTML이 있더라도 text/plain 기준으로만 넣습니다.
   * - `\r\n`/`\n`는 모두 HardBreak로 보존해 메모장과 동일한 줄 구성을 유지합니다.
   */
  const pastePlainTextPreserveNewlines = (rawText: string) => {
    const normalized = rawText.replace(/\r\n/g, "\n");
    const lines = normalized.split("\n");

    // TipTap insertContent에 넣을 노드 배열 구성
    // - 각 줄은 텍스트 노드로 삽입
    // - 줄 구분은 hardBreak로 삽입 (메모장 개행을 그대로 재현)
    const contentToInsert: Array<{ type: string; text?: string }> = [];
    lines.forEach((line, idx) => {
      if (line.length > 0) {
        contentToInsert.push({ type: "text", text: line });
      }
      if (idx < lines.length - 1) {
        contentToInsert.push({ type: "hardBreak" });
      }
    });

    editor?.chain().focus().insertContent(contentToInsert).run();
  };

  const editor = useEditor({
    enableInputRules: false,
    enablePasteRules: false,
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
        bulletList: false,
        orderedList: false,
      }),
      Bold,
      Italic,
      Underline,
      BulletList,
      OrderedList,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({ placeholder: " " }),
      CharacterCount.configure({ limit: MAX_CHARACTERS }),
    ],
    content: value,
    editorProps: {
      handlePaste: (_view, event) => {
        const pastedText = event.clipboardData?.getData("text/plain") || "";
        const currentCharCount = editor?.storage.characterCount.characters() || 0;
        const totalChars = currentCharCount + pastedText.length;

        // Check if pasting would exceed limit
        if (totalChars > MAX_CHARACTERS) {
          event.preventDefault();
          setToast({
            message: `텍스트가 ${MAX_CHARACTERS.toLocaleString()}자를 초과했습니다.`,
            type: "error",
          });
          return true; // Prevent default paste behavior
        }

        // HTML이 함께 있어도 plain text 기준으로만 반영해 입력 결과를 안정화
        if (pastedText) {
          event.preventDefault();
          pastePlainTextPreserveNewlines(pastedText);
          return true;
        }

        return false; // Allow default paste behavior
      },
      handleKeyDown: (_view, event) => {
        if (event.isComposing) return false;

        if (event.key === "Enter") {
          event.preventDefault();
          editor?.chain().focus().setHardBreak().run();
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      const charCount = editor.storage.characterCount.characters();

      // Show warning when at limit (not exceeding because CharacterCount prevents that)
      if (charCount >= MAX_CHARACTERS && !hasShownLimitWarning) {
        setToast({
          message: `텍스트가 ${MAX_CHARACTERS.toLocaleString()}자 제한에 도달했습니다.`,
          type: "error",
        });
        setHasShownLimitWarning(true);
      } else if (charCount < MAX_CHARACTERS) {
        setHasShownLimitWarning(false);
      }

      onChange(content);
    },
  });

  const { mutateAsync: selectStoragePath } = useSelectStoragePath();
  const { mutateAsync } = useSelectPresignedFilePathByEpisode();
  const [isUploading, setIsUploading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files ? event.target.files[0] : null;
    try {
      setIsUploading(true);
      if (file) {
        const { uploadFile, uploadFileName } = await prepareWebpUpload(file);
        const response = await mutateAsync(uploadFileName);

        await handleUpload(
          response.data.episodeImageUploadPath,
          uploadFile,
          response.data.episodeImageFileId
        );
      } else {
        setToast({
          message: "이미지를 선택해주세요.",
          type: "error",
        });
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Image upload error:", error);
      setToast({
        message: "파일을 불러오는데 실패했습니다.",
        type: "error",
      });
      setIsUploading(false);
    } finally {
      // Reset file input to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUpload = async (filePath: string, file: File, fileId: number) => {
    try {
      await axios.put(filePath, file, {
        headers: {
          "Content-Type": "image/webp",
        },
      });
      const response = await selectStoragePath(fileId);
      const imageUrl = response?.data?.episodeImageDownloadPath;

      console.log("Image URL to insert:", imageUrl);

      if (!imageUrl) {
        throw new Error("Image URL is missing from response");
      }

      // Insert image and paragraph after it
      editor
        ?.chain()
        .focus()
        .insertContent([
          {
            type: "image",
            attrs: { src: imageUrl },
          },
          {
            type: "paragraph",
          },
        ])
        .run();

      setToast({
        message: "이미지 업로드에 성공했습니다.",
        type: "success",
      });
    } catch (error) {
      console.error("Upload error:", error);
      setToast({
        message: "이미지 업로드에 실패했습니다.",
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative w-full">
      <div className="w-full h-[36px] flex items-center gap-2 border border-b-0 border-light-gray-500 rounded-t-[6px] bg-light-gray-100 pl-25pxr">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded ${
            editor.isActive("bold") ? "bg-gray-200" : ""
          }`}
        >
          <BoldImage />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded ${
            editor.isActive("italic") ? "bg-gray-200" : ""
          }`}
        >
          <ItalicImage />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded ${
            editor.isActive("underline") ? "bg-gray-200" : ""
          }`}
        >
          <UnderlineImage />
        </button>
        <div className="h-full border-l" />
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className="p-2 rounded"
        >
          <AlignLeft />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className="p-2 rounded"
        >
          <AlignCenter />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className="p-2 rounded"
        >
          <AlignRight />
        </button>
        <div className="h-full border-l" />
        <button
          type="button"
          onClick={() => {
            fileInputRef.current?.click();
          }}
          className="p-2 rounded"
        >
          {isUploading ? (
            <div className="flex justify-center items-center">
              <Spinner size={20} />
            </div>
          ) : (
            <NextImage
              src={"/images/sample-image-logo.svg"}
              alt="이미지"
              width={13}
              height={13}
            />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>
      <div
        className={`editor-container w-full rounded-b-[6px] min-h-[500px] max-h-[880px] md:h-[500px] md:min-h-[100px] md:max-h-none md:resize-y overflow-y-auto pb-[45px] ${
          isFocused
            ? "border-[2px] border-primary-100"
            : "border border-light-gray-500"
        }`}
      >
        <EditorContent
          editor={editor}
          className="max-w-full w-full px-4 py-2 focus:border-primary-100"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </div>
      <div className="absolute bottom-[16px] right-[19px] text-right text-[13px] mt-2 text-gray-500 bg-white px-2 py-1 rounded">
        {editor.storage.characterCount.characters()}
        <span className="text-dark-gray-100">
          &nbsp;/&nbsp;{MAX_CHARACTERS.toLocaleString()}자
        </span>
      </div>
    </div>
  );
};

export default Editor;
