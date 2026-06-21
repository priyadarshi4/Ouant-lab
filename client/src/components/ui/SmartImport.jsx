import { useState, useRef } from "react";
import { Sparkles, Upload, CheckCircle, AlertCircle, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { useExtractFromScreenshot, useImportEquityCsv } from "../../features/extract/api.js";

function MetricPreview({ metrics, meta }) {
  const [showAll, setShowAll] = useState(false);
  const allEntries = [
    ...Object.entries(meta || {}).filter(([, v]) => v != null),
    ...Object.entries(metrics || {}).filter(([, v]) => v != null),
  ];
  const visible = showAll ? allEntries : allEntries.slice(0, 12);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {visible.map(([key, value]) => (
          <div key={key} className="bg-black/20 rounded-md px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-ink-secondary mb-0.5">
              {key.replace(/([A-Z])/g, " $1")}
            </div>
            <div className="font-mono text-xs text-cyan truncate">{String(value)}</div>
          </div>
        ))}
      </div>
      {allEntries.length > 12 && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="flex items-center gap-1 text-xs text-ink-secondary hover:text-cyan"
        >
          {showAll ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showAll ? "Show less" : `Show ${allEntries.length - 12} more fields`}
        </button>
      )}
    </div>
  );
}

export default function SmartImport({ backtestId, onComplete }) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const screenshotRef = useRef(null);
  const csvRef = useRef(null);
  const extractMutation = useExtractFromScreenshot();
  const csvMutation = useImportEquityCsv();

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setResult(null);
    setPreview(URL.createObjectURL(file));
    try {
      const data = await extractMutation.mutateAsync({ file, backtestId });
      setResult(data);
      if (data.saved && onComplete) onComplete();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Extraction failed");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const handleCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await csvMutation.mutateAsync({ file, backtestId });
      if (onComplete) onComplete();
      alert(`✓ ${data.message}`);
    } catch (err) {
      alert(`CSV import failed: ${err?.response?.data?.message || err.message}`);
    }
    e.target.value = "";
  };

  const loading = extractMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-cyan" />
        <h3 className="font-display font-semibold text-cyan">AI Smart Import</h3>
        <span className="text-xs text-ink-secondary">— drop a TradingView screenshot, Claude reads every number</span>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !loading && screenshotRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors ${
          dragOver ? "border-cyan bg-cyan/10" : "border-white/20 hover:border-cyan/50 hover:bg-white/5"
        }`}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Screenshot preview" className="w-full max-h-64 object-contain rounded-lg" />
            {loading && (
              <div className="absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" />
                <p className="text-sm text-cyan font-mono">Claude is reading your metrics...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-cyan/10 border border-cyan/30 flex items-center justify-center">
              <Upload size={24} className="text-cyan" />
            </div>
            <div>
              <p className="font-display font-semibold">Drop a TradingView screenshot here</p>
              <p className="text-sm text-ink-secondary mt-1">Or click to select — Performance Summary, Trade Statistics, or both</p>
            </div>
            <p className="text-xs text-ink-faint">PNG · JPG · WEBP · up to 10 MB</p>
          </div>
        )}
        <input
          ref={screenshotRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-signal-loss/10 border border-signal-loss/30 text-signal-loss text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Extraction failed</p>
            <p className="text-xs mt-0.5 opacity-80">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-signal-profit text-sm">
            <CheckCircle size={16} />
            <span>
              {result.saved
                ? `Extracted and saved ${Object.keys(result.metrics).length} metrics automatically.`
                : `Extracted ${Object.keys(result.metrics).length} metrics — review below, then save.`}
            </span>
          </div>
          <MetricPreview metrics={result.metrics} meta={result.meta} />

          {preview && (
            <button
              onClick={() => { setPreview(null); setResult(null); setError(null); }}
              className="text-xs text-ink-secondary hover:text-cyan"
            >
              Upload another screenshot
            </button>
          )}
        </div>
      )}

      <div className="border-t border-white/10 pt-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-ink-secondary">
          <FileText size={14} />
          <span>Have equity curve data?</span>
        </div>
        <button
          onClick={() => csvRef.current?.click()}
          disabled={csvMutation.isPending}
          className="text-xs px-3 py-1.5 rounded-md border border-white/10 text-ink-secondary hover:border-cyan/40 hover:text-cyan transition-colors"
        >
          {csvMutation.isPending ? "Importing..." : "Import CSV (Date, Equity[, Benchmark])"}
        </button>
        <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsv} />
      </div>
    </div>
  );
}
