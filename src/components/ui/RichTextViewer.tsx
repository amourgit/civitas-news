import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Copy, Check, ExternalLink } from 'lucide-react';

export interface RichTextViewerProps {
  content: string;
  className?: string;
  compact?: boolean;
}

const CodeBlock: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, '');
  const language = className ? className.replace('language-', '') : '';

  const handleCopy = () => {
    navigator.clipboard?.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If inline code (no className / language)
  if (!className) {
    return (
      <code className="bg-gray-100 dark:bg-gray-800 text-[#5B4DFF] dark:text-sky-300 px-1.5 py-0.5 rounded text-xs font-mono border border-gray-200/80 dark:border-gray-700/80 font-bold">
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-lg">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-950 text-slate-400 text-[11px] font-mono border-b border-slate-800">
        <span>{language ? language.toUpperCase() : 'TEXT'}</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 hover:text-white transition-colors"
          title="Copier le code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copié</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copier</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs sm:text-sm font-mono text-slate-100 overflow-x-auto leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
};

export const RichTextViewer: React.FC<RichTextViewerProps> = ({
  content,
  className = '',
  compact = false,
}) => {
  if (!content || !content.trim()) return null;

  return (
    <div className={`markdown-body text-gray-800 dark:text-gray-200 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => (
            <h1
              className={`${
                compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'
              } font-black text-gray-900 dark:text-white font-display border-b border-gray-200 dark:border-gray-800 pb-2 mt-5 mb-3 leading-tight`}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className={`${
                compact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'
              } font-extrabold text-gray-900 dark:text-white font-display border-b border-gray-100 dark:border-gray-800/80 pb-1.5 mt-5 mb-2.5 leading-snug`}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className={`${
                compact ? 'text-xs sm:text-sm' : 'text-base sm:text-lg'
              } font-bold text-[#5B4DFF] dark:text-sky-400 font-display mt-4 mb-2 leading-snug`}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide mt-3 mb-1.5">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p
              className={`${
                compact ? 'text-xs' : 'text-xs sm:text-sm'
              } leading-relaxed text-gray-700 dark:text-gray-300 mb-3 break-words`}
            >
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-extrabold text-gray-950 dark:text-white bg-amber-100/50 dark:bg-amber-400/10 px-1 py-0.5 rounded font-semibold">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-800 dark:text-gray-200 font-serif">{children}</em>
          ),
          ul: ({ children }) => (
            <ul
              className={`list-disc pl-5 sm:pl-6 space-y-1.5 my-3 text-gray-700 dark:text-gray-300 ${
                compact ? 'text-xs' : 'text-xs sm:text-sm'
              }`}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className={`list-decimal pl-5 sm:pl-6 space-y-1.5 my-3 text-gray-700 dark:text-gray-300 font-medium ${
                compact ? 'text-xs' : 'text-xs sm:text-sm'
              }`}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#5B4DFF] bg-[#5B4DFF]/5 dark:bg-[#5B4DFF]/10 px-4 py-3 rounded-r-lg italic text-gray-700 dark:text-gray-300 my-4 shadow-sm">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-bold text-[#0079D3] dark:text-sky-400 hover:underline"
            >
              <span>{children}</span>
              <ExternalLink className="w-3 h-3 inline-block ml-0.5" />
            </a>
          ),
          hr: () => <hr className="my-6 border-t-2 border-gray-200 dark:border-gray-800" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-100 dark:bg-gray-800/80 text-gray-900 dark:text-white font-bold border-b border-gray-200 dark:border-gray-700">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="p-3 uppercase tracking-wider text-[11px] font-extrabold text-gray-700 dark:text-gray-300">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-3 border-b border-gray-100 dark:border-gray-800/60">{children}</td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
              {children}
            </tr>
          ),
          code: ({ className, children }) => (
            <CodeBlock className={className}>{children}</CodeBlock>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
