import { Color as TiptapColor } from "@tiptap/extension-color";
import { Plugin } from "@tiptap/pm/state";
import { isConfirmedEnter } from "@/lib/keyboard";

export const Color = TiptapColor.extend({
  addProseMirrorPlugins() {
    return [
      ...(super.addProseMirrorPlugins?.() || []),
      new Plugin({
        props: {
          handleKeyDown: (_, event) => {
            if (isConfirmedEnter(event)) {
              this.editor.commands.unsetColor();
            }
            return false;
          },
        },
      }),
    ];
  },
});
