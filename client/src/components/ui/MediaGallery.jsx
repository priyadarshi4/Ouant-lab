import { useState, useRef } from "react";
import { Upload, Trash2, FileText } from "lucide-react";
import { useAttachments, useUploadAttachment, useDeleteAttachment } from "../../features/attachments/api.js";
import Lightbox from "./Lightbox.jsx";
import Spinner from "./Spinner.jsx";

export default function MediaGallery({ relatedStrategy, relatedBacktest, categories }) {
  const filters = relatedStrategy ? { relatedStrategy } : { relatedBacktest };
  const { data, isLoading } = useAttachments(filters);
  const uploadMutation = useUploadAttachment();
  const deleteMutation = useDeleteAttachment();
  const fileInputRef = useRef(null);
  const [category, setCategory] = useState(categories?.[0] || "Other");
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const attachments = data?.attachments || [];
  const images = attachments.filter((a) => a.fileType === "image");

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadMutation.mutateAsync({ file, category, relatedStrategy, relatedBacktest });
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm outline-none focus:border-cyan/40"
        >
          {(categories || ["Other"]).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="flex items-center gap-2 px-3 py-2 rounded-md border border-cyan/30 text-cyan text-sm hover:bg-cyan/10 transition-colors"
        >
          <Upload size={14} /> {uploadMutation.isPending ? "Uploading..." : "Upload File"}
        </button>
        <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.webp,.pdf,.csv" onChange={handleFileChange} className="hidden" />
      </div>

      {isLoading ? (
        <Spinner label="Loading media..." />
      ) : !attachments.length ? (
        <p className="text-sm text-ink-secondary">No files uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {attachments.map((a) => (
            <div key={a._id} className="glass-panel rounded-lg overflow-hidden group relative">
              {a.fileType === "image" ? (
                <button onClick={() => setLightboxIndex(images.findIndex((img) => img._id === a._id))} className="block w-full">
                  <img src={a.url} alt={a.originalName} className="w-full h-28 object-cover" />
                </button>
              ) : (
                <a href={a.url} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center h-28 gap-2 text-ink-secondary">
                  <FileText size={24} />
                  <span className="text-[11px]">{a.fileType.toUpperCase()}</span>
                </a>
              )}
              <div className="px-2 py-1.5 flex items-center justify-between">
                <span className="text-[10px] text-ink-secondary truncate">{a.category}</span>
                <button onClick={() => deleteMutation.mutate(a._id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={12} className="text-ink-faint hover:text-signal-loss" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightboxIndex != null && (
        <Lightbox images={images} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
      )}
    </div>
  );
}
