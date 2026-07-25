import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

// Extends the base Image node with layout controls (float/align + width) so
// editors can place images beside or across text instead of always full-width
// stacked. Layout is written as an inline style so it survives round-tripping
// through dangerouslySetInnerHTML on the public site with no extra CSS import.
export const ImageLayout = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'none',
        parseHTML: (element: HTMLElement) => {
          const style = element.getAttribute('style') || '';
          if (style.includes('float: left') || element.getAttribute('align') === 'left') return 'left';
          if (style.includes('float: right') || element.getAttribute('align') === 'right') return 'right';
          if (style.includes('margin: 12px auto') || element.getAttribute('align') === 'center') return 'center';
          return 'none';
        },
      },
      width: {
        default: 100,
        parseHTML: (element: HTMLElement) => {
          const style = element.getAttribute('style') || '';
          const match = style.match(/width:\s*(\d+)%/);
          return match ? Number(match[1]) : 100;
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { align, width, ...rest } = HTMLAttributes;
    const styles: string[] = [`width: ${width || 100}%`, 'height: auto'];
    if (align === 'left') {
      styles.push('float: left', 'margin: 4px 20px 12px 0');
    } else if (align === 'right') {
      styles.push('float: right', 'margin: 4px 0 12px 20px');
    } else if (align === 'center') {
      styles.push('display: block', 'margin: 12px auto');
    } else {
      styles.push('display: block', 'margin: 12px 0');
    }
    return ['img', mergeAttributes(rest, { style: styles.join('; ') })];
  },
});
