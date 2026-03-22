"use client";
import { Content } from "@tiptap/react";
import { MinimalTiptapEditor } from "@/components/ui/minimal-tiptap";
import {
  useSelectPresignedFilePathByEpisode,
  useSelectStoragePath,
} from "@/api/upload";

interface PropsType {
  value?: string;
  setValue?: (value: string) => void;
  placeholder?: string;
  preservePlainTextNewlines?: boolean;
}

export const Editor = ({
  value,
  setValue,
  placeholder,
  preservePlainTextNewlines = false,
}: PropsType) => {
  const { mutateAsync: selectStoragePath } = useSelectStoragePath();
  const { mutateAsync: getPresignedUrl } = useSelectPresignedFilePathByEpisode();

  const handleSetValue = (value: Content) => {
    setValue?.(value as string);
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      // Get the file name and convert to webp format
      const originalName = file.name;
      const baseName =
        originalName.substring(0, originalName.lastIndexOf(".")) ||
        originalName;
      const newFileName = `${baseName}.webp`;

      // Get presigned URL for upload
      const presignedResponse = await getPresignedUrl(newFileName);
      const { episodeImageUploadPath, episodeImageFileId } = presignedResponse.data;

      // Upload the file to the presigned URL
      const response = await fetch(episodeImageUploadPath, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "image/webp",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      // Get the download URL
      const storageResponse = await selectStoragePath(episodeImageFileId);
      const imageUrl = storageResponse?.data?.episodeImageDownloadPath;

      if (!imageUrl) {
        throw new Error("Image URL is missing from response");
      }

      return imageUrl;
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    }
  };

  return (
    <MinimalTiptapEditor
      value={value || '<p class="text-node"></p>'}
      onChange={handleSetValue}
      className="w-full"
      editorContentClassName="p-5"
      output="html"
      placeholder={placeholder || "Enter your content..."}
      autofocus={false}
      editable={true}
      editorClassName="focus:outline-hidden"
      preservePlainTextNewlines={preservePlainTextNewlines}
      uploader={handleImageUpload}
    />
  );
};
