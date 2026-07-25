import { Node, mergeAttributes } from '@tiptap/core';

// TipTap's default schema has no <video> node, so without this extension the
// tag would be silently stripped on load/paste. Renders a plain HTML5 <video>
// — the same tag the public site's dangerouslySetInnerHTML will output.
export const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
    };
  },

  parseHTML() {
    return [{ tag: 'video' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: 'controls' }), ['source', { src: HTMLAttributes.src }]];
  },

  addCommands() {
    return {
      setVideo:
        (src: string) =>
        ({ commands }: { commands: { insertContent: (content: unknown) => boolean } }) =>
          commands.insertContent({ type: this.name, attrs: { src } }),
    } as Record<string, (...args: unknown[]) => (...args: unknown[]) => boolean>;
  },
});
