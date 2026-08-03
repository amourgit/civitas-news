import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { RichTextViewer } from './RichTextViewer';

interface ExpandableDescriptionProps {
  content: string;
  maxChars?: number;
  className?: string;
}

export const ExpandableDescription: React.FC<ExpandableDescriptionProps> = ({
  content,
  maxChars = 180,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!content) return null;

  useEffect(() => {
    if (contentRef.current) {
      const el = contentRef.current;
      const overflows = el.scrollHeight > el.clientHeight + 2;
      const plainText = content.replace(/<[^>]*>/g, '').trim();
      const textExceeds = plainText.length > maxChars;
      setHasOverflow(overflows || textExceeds);
    }
  }, [content, maxChars]);

  if (!hasOverflow) {
    return (
      <div className={`text-xs text-gray-600 dark:text-gray-300 leading-snug ${className}`}>
        <RichTextViewer content={content} compact />
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <motion.div
        layout
        initial={false}
        animate={{ height: isExpanded ? 'auto' : '3.6rem' }}
        transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
        className="relative overflow-hidden"
      >
        <div
          ref={contentRef}
          className={`text-xs text-gray-600 dark:text-gray-300 leading-snug ${!isExpanded ? 'line-clamp-3' : ''}`}
        >
          <RichTextViewer content={content} compact />
        </div>

        {/* Fade gradient when collapsed */}
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-white dark:from-[#1A1F4D] to-transparent pointer-events-none" />
        )}
      </motion.div>

      {hasOverflow && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }}
          className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#5B4DFF] hover:text-[#4a3ecc] dark:text-sky-400 dark:hover:text-sky-300 transition-colors cursor-pointer pt-0.5 group"
        >
          <span>{isExpanded ? '...moins' : '...plus'}</span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 transition-transform group-hover:-translate-y-0.5" />
          ) : (
            <ChevronDown className="w-3 h-3 transition-transform group-hover:translate-y-0.5" />
          )}
        </button>
      )}
    </div>
  );
};
