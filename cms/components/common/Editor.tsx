"use client";
import {
  useSelectPresignedFilePathByEpisode,
  useSelectStoragePath,
} from "@/api/upload";
import { showAlert } from "@/lib/utils";
import { Image as TiptapImage } from "@tiptap/extension-image";
import { Placeholder, CharacterCount, TextAlign } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BoldIcon,
  ImageIcon,
  ItalicIcon,
  Loader2,
  UnderlineIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAX_CHARACTERS = 20000;

interface PropsType {
  value?: string;
  setValue?: (value: string) => void;
  placeholder?: string;
  preservePlainTextNewlines?: boolean;
  maxCharacters?: number;
}

export const Editor = ({
  value,
  setValue,
  placeholder,
  preservePlainTextNewlines = false,
  maxCharacters = MAX_CHARACTERS,
}: PropsType) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { mutateAsync: selectStoragePath } = useSelectStoragePath();
  const { mutateAsync: getPresignedUrl } = useSelectPresignedFilePathByEpisode();

  const pastePlainTextPreserveNewlines = (rawText: string) => {
    const normalized = rawText.replace(/\r\n/g, "\n");
    const lines = normalized.split("\n");
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
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TiptapImage.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: () => placeholder || "내용을 입력해주세요..." }),
      CharacterCount.configure({ limit: maxCharacters }),
    ],
    content: value || "",
    editorProps: {
      handlePaste: (_view, event) => {
        const pastedText = event.clipboardData?.getData("text/plain") || "";
        const pastedHtml = event.clipboardData?.getData("text/html") || "";

        if (preservePlainTextNewlines && pastedText && !pastedHtml) {
          event.preventDefault();
          pastePlainTextPreserveNewlines(pastedText);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      setValue?.(e.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const baseName =
        file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      const presignedResponse = await getPresignedUrl(`${baseName}.webp`);
      const { episodeImageUploadPath, episodeImageFileId } =
        presignedResponse.data;

      await fetch(episodeImageUploadPath, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "image/webp" },
      });

      const storageResponse = await selectStoragePath(episodeImageFileId);
      const imageUrl = storageResponse?.data?.episodeImageDownloadPath;
      if (!imageUrl) throw new Error("Image URL missing");

      editor
        ?.chain()
        .focus()
        .insertContent([
          { type: "image", attrs: { src: imageUrl } },
          { type: "paragraph" },
        ])
        .run();
    } catch (error) {
      console.error("Image upload error:", error);
      showAlert("오류", "이미지 업로드에 실패했습니다.", "확인");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-[#E5E8EF] ${active ? "bg-[#E5E8EF]" : ""}`}
    >
      {children}
    </button>
  );

  const iconSize = 15;

  return (
    <div className="relative w-full">
      {/* 툴바 - 유저웹 회차 에디터와 동일 구조 */}
      <div className="w-full h-9 flex items-center gap-1 border border-b-0 border-[#E7E9EE] rounded-t-[6px] bg-[#F5F5F5] px-3">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <BoldIcon size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <ItalicIcon size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        >
          <UnderlineIcon size={iconSize} />
        </ToolbarButton>

        <div className="w-px h-4 bg-[#D9DDE4] mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
        >
          <AlignLeft size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
        >
          <AlignCenter size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
        >
          <AlignRight size={iconSize} />
        </ToolbarButton>

        <div className="w-px h-4 bg-[#D9DDE4] mx-1" />

        <ToolbarButton onClick={() => fileInputRef.current?.click()}>
          {isUploading ? (
            <Loader2 size={iconSize} className="animate-spin" />
          ) : (
            <ImageIcon size={iconSize} />
          )}
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* 에디터 본문 */}
      <div
        className={`w-full rounded-b-[6px] min-h-[300px] max-h-[600px] resize-y overflow-y-auto pb-10 ${
          isFocused
            ? "border-2 border-[#337EFB]"
            : "border border-[#E7E9EE]"
        }`}
      >
        <EditorContent
          editor={editor}
          className="prose max-w-full w-full px-4 py-2"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </div>

      {/* 글자수 표시 */}
      <div className="absolute bottom-3 right-4 text-xs text-[#4A4F58] bg-white px-2 py-0.5 rounded">
        {editor.storage.characterCount.characters().toLocaleString()}
        <span className="text-[#9EA4AF]">
          &nbsp;/&nbsp;{maxCharacters.toLocaleString()}자
        </span>
      </div>
    </div>
  );
};

export default Editor;
