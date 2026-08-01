import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Check } from 'lucide-react';
import { useClipboard } from '../../../hooks/useClipboard';

export interface LienQrCodeProps {
  url: string;
  title?: string;
}

export const LienQrCode: React.FC<LienQrCodeProps> = ({ url, title }) => {
  const { copied, copy } = useClipboard();

  const handleDownloadSVG = () => {
    const svg = document.getElementById('civitas-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `civitas-qrcode-${Date.now()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-[#1A1F4D] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md max-w-sm w-full mx-auto text-center">
      <div className="p-4 bg-slate-900 rounded-2xl shadow-inner inline-block">
        <QRCodeSVG
          id="civitas-qr-svg"
          value={url}
          size={200}
          bgColor="#0F172A"
          fgColor="#FFFFFF"
          level="H"
          marginSize={2}
        />
      </div>

      {title && <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{title}</h4>}

      <div className="text-xs text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl max-w-full truncate">
        {url}
      </div>

      <div className="flex items-center gap-2 w-full pt-2">
        <button
          onClick={() => copy(url)}
          className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1.5 transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-[#5B4DFF]" />}
          <span>{copied ? 'Copié !' : 'Copier Lien'}</span>
        </button>

        <button
          onClick={handleDownloadSVG}
          className="flex-1 py-2.5 px-3 rounded-xl bg-[#5B4DFF] hover:bg-[#7B61FF] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#5B4DFF]/20"
        >
          <Download className="w-4 h-4" />
          <span>Telecharger QR</span>
        </button>
      </div>
    </div>
  );
};
