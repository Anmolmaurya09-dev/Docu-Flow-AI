import { useRef, useState } from 'react';
import { Activity, FileArchive, LoaderCircle } from 'lucide-react';
import { analyzeZip, type AnalyzeProgress } from '../lib/analyzeZip';
import type { ProjectMeta } from '../lib/docu';

type ProjectZipUploadProps = {
  onAnalyzed: (meta: ProjectMeta) => void;
  testIdPrefix: string;
  title?: string;
  description?: string;
};

export function ProjectZipUpload({
  onAnalyzed,
  testIdPrefix,
  title = 'Recommended: upload a project ZIP',
  description = 'We inspect supported files locally. Your project code is never executed or uploaded.',
}: ProjectZipUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<AnalyzeProgress | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function selectFile(next: File | undefined) {
    if (!next) return;
    setFile(next);
    setError('');
    setSuccess('');
    setProgress(null);
  }

  async function analyze() {
    if (!file) {
      setError('Choose a ZIP file first.');
      return;
    }
    setBusy(true);
    setError('');
    setSuccess('');
    setProgress({ phase: 'opening', completedFiles: 0, totalFiles: 0 });
    try {
      const meta = await analyzeZip(file, setProgress);
      onAnalyzed(meta);
      setSuccess(`Project details detected locally. ${meta.readmeFiles.length ? `${meta.readmeFiles.length} README file${meta.readmeFiles.length === 1 ? '' : 's'} found.` : 'No existing README file was found; a template draft is ready.'}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not analyze this ZIP. Choose a valid, unencrypted ZIP and try again.');
    } finally {
      setBusy(false);
    }
  }

  const percent = progress?.phase === 'reading' && progress.totalFiles > 0
    ? Math.round((progress.completedFiles / progress.totalFiles) * 100)
    : 0;

  return (
    <section className="panel" style={{ padding: 20 }} aria-label="Upload a project ZIP">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 7 }}>
        <FileArchive size={17} color="#67d9e9" />
        <strong style={{ fontSize: 13 }}>{title}</strong>
        <span className="source-pill">Recommended</span>
      </div>
      <p style={{ color: '#9dacbb', fontSize: 12, lineHeight: 1.6, margin: '0 0 13px' }}>{description}</p>
      <div
        className={`dropzone upload-dropzone${dragging ? ' upload-dropzone-active' : ''}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          selectFile(event.dataTransfer.files?.[0]);
        }}
        data-testid={`${testIdPrefix}-dropzone`}
      >
        <FileArchive size={25} color="#61d9e9" />
        <strong style={{ marginTop: 9 }}>Drop a ZIP here or browse files</strong>
        <span style={{ color: '#93a5b7', fontSize: 12, marginTop: 5 }}>Maximum 5 MB · up to 100 supported files · text files up to 256 KB</span>
        <input
          ref={inputRef}
          className="zip-file-input"
          type="file"
          accept=".zip,application/zip"
          aria-label="Choose project ZIP"
          tabIndex={-1}
          onChange={(event) => {
            selectFile(event.currentTarget.files?.[0]);
            event.currentTarget.value = '';
          }}
          data-testid={`${testIdPrefix}-file`}
        />
        <button
          type="button"
          className="btn btn-quiet"
          style={{ marginTop: 12 }}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          data-testid={`${testIdPrefix}-browse`}
        >
          Browse files
        </button>
        {file && <span style={{ marginTop: 9, fontSize: 12, color: '#c9d6e1', overflowWrap: 'anywhere' }} data-testid={`${testIdPrefix}-selected`}>{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</span>}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 13, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" onClick={() => void analyze()} disabled={busy || !file} data-testid={`${testIdPrefix}-analyze`}>
          {busy ? <><LoaderCircle className="spin" size={15} /> Analyzing locally…</> : <><Activity size={15} /> Analyze ZIP locally</>}
        </button>
        {error && <div className="status error" role="alert" data-testid={`${testIdPrefix}-error`}>{error}</div>}
        {success && <div className="status" role="status" data-testid={`${testIdPrefix}-success`}>{success}</div>}
      </div>
      {busy && progress && (
        <div style={{ marginTop: 12 }} aria-live="polite" data-testid={`${testIdPrefix}-progress`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 11, color: '#a7dce3', marginBottom: 6 }}>
            <span>{progress.phase === 'opening' ? 'Opening the archive in your browser…' : progress.totalFiles ? `Reading supported files: ${progress.completedFiles} of ${progress.totalFiles}` : 'Finishing local inspection…'}</span>
            {progress.phase === 'reading' && progress.totalFiles > 0 && <span>{percent}%</span>}
          </div>
          <div className="zip-progress-track" role="progressbar" aria-label="Local ZIP analysis progress" aria-valuemin={0} aria-valuemax={progress.totalFiles || 1} aria-valuenow={progress.completedFiles} aria-valuetext={progress.phase === 'opening' ? 'Opening archive' : `${progress.completedFiles} of ${progress.totalFiles} supported files read`}>
            <span className={progress.phase === 'opening' || progress.totalFiles === 0 ? 'zip-progress-fill zip-progress-indeterminate' : 'zip-progress-fill'} style={progress.phase === 'reading' && progress.totalFiles ? { width: `${percent}%` } : undefined} />
          </div>
        </div>
      )}
    </section>
  );
}
