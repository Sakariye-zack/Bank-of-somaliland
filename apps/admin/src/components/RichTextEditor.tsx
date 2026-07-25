import { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Video as VideoIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Code2,
  Smile,
  Columns,
  Rows,
  Trash2,
  Palette,
} from 'lucide-react';
import { Video } from '../lib/tiptapVideo';
import { ImageLayout } from '../lib/tiptapImageLayout';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';

const ICONS = [
  '✓', '✗', '★', '➜', '📄', '📅', '📍', '📞', '✉️', '🏦', '🔒', '⚠️', '📈', '📊', 'ℹ️', '➤',
];

const TEXT_COLORS = [
  '#0b4a2a', '#1e7a45', '#b67a12', '#a9791d', '#ce1126', '#b23a3a',
  '#1a1a1a', '#5a5a5a', '#0e5aa8', '#5b2a86',
];

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rte-btn${active ? ' is-active' : ''}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<'image' | 'video' | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [sourceDraft, setSourceDraft] = useState('');

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL (https://…)', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  }, [editor]);

  async function handleImagePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading('image');
    try {
      const uploaded = await api.uploadMedia([file], null);
      const url = uploaded.images[0];
      if (url) editor.chain().focus().setImage({ src: mediaUrl(url) }).run();
    } catch {
      alert('Image upload failed.');
    } finally {
      setUploading(null);
    }
  }

  async function handleVideoPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading('video');
    try {
      const uploaded = await api.uploadMedia([], file);
      if (uploaded.video) {
        (editor.chain().focus() as unknown as { setVideo: (src: string) => { run: () => void } })
          .setVideo(mediaUrl(uploaded.video))
          .run();
      }
    } catch {
      alert('Video upload failed.');
    } finally {
      setUploading(null);
    }
  }

  const inTable = editor.isActive('table');
  const imageActive = editor.isActive('image');
  const imageAttrs = editor.getAttributes('image');

  function toggleSource() {
    if (!showSource) {
      setSourceDraft(editor.getHTML());
    } else {
      editor.commands.setContent(sourceDraft, { emitUpdate: true });
    }
    setShowSource((v) => !v);
  }

  return (
    <div className="rte-toolbar">
      <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 size={16} />
      </ToolbarButton>
      <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo2 size={16} />
      </ToolbarButton>
      <span className="rte-sep" />
      <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 size={16} />
      </ToolbarButton>
      <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 size={16} />
      </ToolbarButton>
      <span className="rte-sep" />
      <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon size={16} />
      </ToolbarButton>
      <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough size={16} />
      </ToolbarButton>
      <div style={{ position: 'relative' }}>
        <ToolbarButton
          title="Text color"
          active={showColorPicker || !!editor.getAttributes('textStyle').color}
          onClick={() => setShowColorPicker((v) => !v)}
        >
          <Palette size={16} color={(editor.getAttributes('textStyle').color as string) || undefined} />
        </ToolbarButton>
        {showColorPicker && (
          <div className="rte-color-picker">
            <div className="rte-color-swatches">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  className="rte-color-swatch"
                  style={{ background: c }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().setColor(c).run();
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </div>
            <div className="rte-color-custom">
              <input
                type="color"
                title="Custom color"
                defaultValue={(editor.getAttributes('textStyle').color as string) || '#1a1a1a'}
                onMouseDown={(e) => e.preventDefault()}
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              />
              <button
                type="button"
                className="btn"
                style={{ fontSize: 11, padding: '4px 8px' }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setShowColorPicker(false);
                }}
              >
                Clear color
              </button>
            </div>
          </div>
        )}
      </div>
      <span className="rte-sep" />
      <ToolbarButton title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        <AlignLeft size={16} />
      </ToolbarButton>
      <ToolbarButton title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        <AlignCenter size={16} />
      </ToolbarButton>
      <ToolbarButton title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
        <AlignRight size={16} />
      </ToolbarButton>
      <span className="rte-sep" />
      <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={16} />
      </ToolbarButton>
      <ToolbarButton title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={16} />
      </ToolbarButton>
      <ToolbarButton title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus size={16} />
      </ToolbarButton>
      <span className="rte-sep" />
      <ToolbarButton title="Add link" active={editor.isActive('link')} onClick={setLink}>
        <LinkIcon size={16} />
      </ToolbarButton>
      <ToolbarButton title="Remove link" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')}>
        <Unlink size={16} />
      </ToolbarButton>
      <span className="rte-sep" />
      <ToolbarButton title="Insert image" onClick={() => imageInputRef.current?.click()} disabled={uploading === 'image'}>
        <ImageIcon size={16} />
      </ToolbarButton>
      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePicked} />
      <ToolbarButton title="Insert video" onClick={() => videoInputRef.current?.click()} disabled={uploading === 'video'}>
        <VideoIcon size={16} />
      </ToolbarButton>
      <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoPicked} />
      <ToolbarButton
        title="Insert table"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <TableIcon size={16} />
      </ToolbarButton>
      {inTable && (
        <>
          <ToolbarButton title="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <Columns size={16} />
          </ToolbarButton>
          <ToolbarButton title="Add row" onClick={() => editor.chain().focus().addRowAfter().run()}>
            <Rows size={16} />
          </ToolbarButton>
          <ToolbarButton title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
            <Trash2 size={16} />
          </ToolbarButton>
        </>
      )}
      {imageActive && (
        <>
          <span className="rte-sep" />
          <ToolbarButton
            title="Wrap text to the right (image floats left)"
            active={imageAttrs.align === 'left'}
            onClick={() => editor.chain().focus().updateAttributes('image', { align: 'left' }).run()}
          >
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Center image, no text wrap"
            active={imageAttrs.align === 'center'}
            onClick={() => editor.chain().focus().updateAttributes('image', { align: 'center' }).run()}
          >
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Wrap text to the left (image floats right)"
            active={imageAttrs.align === 'right'}
            onClick={() => editor.chain().focus().updateAttributes('image', { align: 'right' }).run()}
          >
            <AlignRight size={16} />
          </ToolbarButton>
          <select
            title="Image width"
            value={imageAttrs.width || 100}
            onChange={(e) => editor.chain().focus().updateAttributes('image', { width: Number(e.target.value) }).run()}
            className="rte-img-width"
          >
            <option value={25}>25% width</option>
            <option value={33}>33% width</option>
            <option value={50}>50% width</option>
            <option value={75}>75% width</option>
            <option value={100}>100% width</option>
          </select>
        </>
      )}
      <span className="rte-sep" />
      <div style={{ position: 'relative' }}>
        <ToolbarButton title="Insert icon" onClick={() => setShowIconPicker((v) => !v)}>
          <Smile size={16} />
        </ToolbarButton>
        {showIconPicker && (
          <div className="rte-icon-picker">
            {ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().insertContent(icon + ' ').run();
                  setShowIconPicker(false);
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        )}
      </div>
      <ToolbarButton title="Toggle HTML source" active={showSource} onClick={toggleSource}>
        <Code2 size={16} />
      </ToolbarButton>
      {showSource && (
        <textarea
          className="rte-source"
          value={sourceDraft}
          onChange={(e) => setSourceDraft(e.target.value)}
          spellCheck={false}
        />
      )}
      {uploading && <span className="rte-uploading">Uploading {uploading}…</span>}
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  dir = 'ltr',
  placeholder = 'Write the page content…',
}: {
  value: string;
  onChange: (html: string) => void;
  dir?: 'ltr' | 'rtl';
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TextStyle,
      Color,
      ImageLayout,
      Video,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: { dir, class: 'rte-content' },
    },
  });

  if (!editor) return null;

  return (
    <div className="rte-wrapper" dir={dir}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
