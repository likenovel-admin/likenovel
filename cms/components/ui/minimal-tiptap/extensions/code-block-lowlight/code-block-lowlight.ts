import { CodeBlockLowlight as TiptapCodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

export const CodeBlockLowlight = TiptapCodeBlockLowlight.extend({
  addOptions() {
    const baseOptions = TiptapCodeBlockLowlight.options;
    return {
      ...baseOptions,
      lowlight: createLowlight(common),
      defaultLanguage: null,
      HTMLAttributes: {
        class: "block-node",
      },
    };
  },
});

export default CodeBlockLowlight;
