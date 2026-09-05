// ============================================================
// src/components/editor/extensions/Callout.tsx
// Encadré éditorial (info / succès / avertissement / danger) --
// contrairement aux nœuds média, son contenu reste éditable (du texte
// riche normal), seul le variant change le style de la boîte.
// ============================================================

import React from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react';
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { CalloutNodeAttrs, CalloutVariant } from '../types';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (variant: CalloutVariant) => ReturnType;
      unsetCallout: () => ReturnType;
    };
  }
}

const VARIANT_STYLES: Record<CalloutVariant, { icon: React.ElementType; classes: string }> = {
  info: { icon: Info, classes: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100' },
  success: { icon: CheckCircle2, classes: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-100' },
  warning: { icon: AlertTriangle, classes: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-100' },
  danger: { icon: XCircle, classes: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100' },
};

const CalloutView: React.FC<NodeViewProps> = ({ node, updateAttributes, editor }) => {
  const attrs = node.attrs as CalloutNodeAttrs;
  const { icon: Icon, classes } = VARIANT_STYLES[attrs.variant] || VARIANT_STYLES.info;
  const editable = editor.isEditable;

  return (
    <NodeViewWrapper className={`civitas-callout my-4 rounded-xl border-l-4 p-4 flex gap-3 ${classes}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        {editable && (
          <div contentEditable={false} className="flex gap-1 mb-2">
            {(Object.keys(VARIANT_STYLES) as CalloutVariant[]).map((variant) => (
              <button
                key={variant}
                type="button"
                onClick={() => updateAttributes({ variant })}
                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${attrs.variant === variant ? 'bg-black/10 dark:bg-white/10' : 'opacity-40 hover:opacity-70'}`}
              >
                {variant}
              </button>
            ))}
          </div>
        )}
        <NodeViewContent className="prose-sm max-w-none [&_p]:my-0" />
      </div>
    </NodeViewWrapper>
  );
};

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      variant: { default: 'info' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout', class: 'civitas-callout' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },

  addCommands() {
    return {
      setCallout:
        (variant) =>
        ({ commands }) =>
          commands.wrapIn(this.name, { variant }),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },
});
