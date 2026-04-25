// ─────────────────────────────────────────────────────────────────
// AlignCV — ResumeUploadPanel
// Drag-and-drop zone using standard HTML5 to upload a PDF.
// Handles loading states for extracting and AI parsing.
// ─────────────────────────────────────────────────────────────────

import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { profileApi } from '../../api/profileApi';
import { useProfileStore } from '../../store/profileStore';
import toast from 'react-hot-toast';

export default function ResumeUploadPanel({ onComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('IDLE'); // IDLE, UPLOADING, SUCCESS, ERROR
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);
  const refreshProfile = useProfileStore((s) => s.refreshProfile);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setStatus('IDLE');
    setErrorMsg('');
    if (selectedFile.type !== 'application/pdf') {
      setErrorMsg('Only PDF files are supported format.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMsg('File exceeds 5MB maximum limit.');
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('UPLOADING');
    const formData = new FormData();
    formData.append('resume', file);

    try {
      await profileApi.uploadResume(formData);
      setStatus('SUCCESS');
      toast.success('Resume parsed successfully!');
      await refreshProfile();
      if (onComplete) onComplete();
    } catch (error) {
      setStatus('ERROR');
      setErrorMsg(error.response?.data?.error || 'Failed to parse resume');
      toast.error('AI parsing failed.');
    }
  };

  return (
    <div className="w-full glass rounded-2xl overflow-hidden mb-6">
      <div
        className={`relative p-8 border-2 border-dashed transition-all duration-200 text-center flex flex-col items-center justify-center min-h-[200px]
          ${dragActive ? 'border-primary bg-primary/5' : 'border-border-dark hover:border-text-dim'}
          ${status === 'UPLOADING' ? 'pointer-events-none opacity-80' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleChange} />

        {status === 'IDLE' && !file && (
          <>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <UploadCloud className="w-6 h-6 text-primary-light" />
            </div>
            <h3 className="text-base font-semibold text-text-white mb-2">Upload your existing resume</h3>
            <p className="text-sm text-text-dim mb-6 max-w-sm">
              We'll use AI to extract your history and autofill everything instantly.
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="px-5 py-2.5 bg-white/5 border border-border-dark hover:bg-white/10 text-sm font-medium rounded-xl text-text-white transition-colors cursor-pointer"
            >
              Select PDF File
            </button>
          </>
        )}

        {status === 'IDLE' && file && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-success" />
            </div>
            <p className="text-sm font-medium text-text-white mb-1">{file.name}</p>
            <p className="text-xs text-text-dim mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setFile(null)}
                className="px-5 py-2.5 bg-white/5 border border-border-dark hover:bg-white/10 text-sm font-medium rounded-xl text-text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-primary/20 cursor-pointer"
              >
                Extract Data
              </button>
            </div>
          </div>
        )}

        {status === 'UPLOADING' && (
          <div className="flex flex-col items-center animate-fade-in space-y-4">
            <Loader2 className="w-8 h-8 text-primary-light animate-spin" />
            <div className="text-center">
              <p className="text-sm font-semibold text-text-white">Analyzing profile with AI...</p>
              <p className="text-xs text-text-dim mt-1">This usually takes about 5 to 15 seconds.</p>
            </div>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <p className="text-sm font-semibold text-success">Extraction Complete!</p>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-danger" />
            </div>
            <p className="text-sm font-semibold text-danger mb-1">Extraction Failed</p>
            <p className="text-xs text-text-dim mb-6">{errorMsg}</p>
            <button
              onClick={() => setStatus('IDLE')}
              className="px-5 py-2.5 bg-white/5 border border-border-dark hover:bg-white/10 text-sm font-medium rounded-xl text-text-white transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
