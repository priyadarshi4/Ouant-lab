import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

export default function Lightbox({ images, index, onClose, onNavigate }) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setZoomed(false);
  }, [index]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((index + 1) % images.length);
      if (e.key === "ArrowLeft") onNavigate((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [index, images.length, onClose, onNavigate]);

  if (index == null || !images[index]) return null;
  const current = images[index];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="text-sm text-ink-secondary">
          {current.category} · {index + 1} / {images.length}
        </div>
        <button onClick={onClose} className="text-ink-secondary hover:text-cyan">
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-auto px-4 sm:px-12">
        {images.length > 1 && (
          <button
            onClick={() => onNavigate((index - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/5 hover:bg-white/10 text-ink-primary"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <img
          src={current.url}
          alt={current.originalName || current.category}
          onClick={() => setZoomed((z) => !z)}
          className={`transition-transform duration-200 cursor-zoom-in rounded-md ${
            zoomed ? "scale-[1.8] cursor-zoom-out" : "max-h-[75vh] max-w-full"
          }`}
        />
        {images.length > 1 && (
          <button
            onClick={() => onNavigate((index + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/5 hover:bg-white/10 text-ink-primary"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 py-4 text-xs text-ink-secondary">
        <ZoomIn size={14} /> Click image to zoom · Arrow keys to navigate · Esc to close
      </div>
    </div>
  );
}
