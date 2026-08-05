import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageViewerModalProps {
  imageSrc: string;
  title: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  imageSrc,
  title,
  onClose
}) => {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center"
      >
        <div className="w-full bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-200 truncate max-w-xs sm:max-w-md">
            {title}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex items-center justify-center max-h-[80vh] overflow-hidden">
          <img
            src={imageSrc}
            alt={title}
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl border border-slate-800"
          />
        </div>
      </div>
    </div>
  );
};
