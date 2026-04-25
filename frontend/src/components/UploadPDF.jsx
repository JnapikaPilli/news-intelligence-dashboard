import React, { useCallback, useState } from 'react';
import { UploadCloud, CheckCircle, FileText, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ragService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadPDF() {
  const { isUploading, setIsUploading, currentDocumentId, setCurrentDocumentId, setChatHistory } = useStore();
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0] || e.target.files[0];
    
    if (file && file.type === 'application/pdf') {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const res = await ragService.uploadPdf(file, (progress) => {
          setUploadProgress(progress);
        });
        setCurrentDocumentId(res.documentId || file.name);
        if (setChatHistory) setChatHistory([]); // Clear chat history on new document
      } catch (err) {
        console.error("Upload failed", err);
        alert("Upload failed. Please check the backend connection.");
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    } else {
      alert("Please upload a PDF file.");
    }
  }, [setIsUploading, setCurrentDocumentId, setChatHistory]);

  const removeDocument = (e) => {
    e.stopPropagation();
    setCurrentDocumentId(null);
    if (setChatHistory) setChatHistory([]);
  };

  return (
    <div 
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="glass-panel p-6 flex flex-col items-center justify-center border-dashed border-2 border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 transition-all relative group h-48 rounded-2xl cursor-pointer overflow-hidden"
    >
      <input 
        type="file" 
        accept=".pdf" 
        onChange={handleDrop} 
        disabled={isUploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
      />
      
      <AnimatePresence mode="wait">
        {isUploading ? (
          <motion.div 
            key="uploading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center w-full px-8"
          >
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4 shadow-lg shadow-primary/20"></div>
            <p className="font-semibold text-primary mb-2">Processing Document...</p>
            <div className="w-full bg-foreground/10 rounded-full h-2 mb-1 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-primary to-indigo-500 h-2 rounded-full" 
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <p className="text-xs text-foreground/50">{uploadProgress}% Complete</p>
          </motion.div>
        ) : currentDocumentId ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center w-full"
          >
            <div className="relative">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-3 shadow-lg shadow-green-500/20">
                <FileText size={32} />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                <CheckCircle size={20} className="text-green-500" />
              </div>
            </div>
            
            <p className="font-semibold text-center truncate w-48 text-foreground" title={currentDocumentId}>
              {currentDocumentId}
            </p>
            <p className="text-xs text-green-500 font-medium mt-1">Ready for analysis</p>
            
            <button 
              onClick={removeDocument}
              className="absolute top-3 right-3 p-1.5 bg-foreground/10 hover:bg-red-500/20 hover:text-red-500 rounded-full transition-colors z-20"
            >
              <X size={16} />
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-indigo-500/20 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
              <UploadCloud size={28} />
            </div>
            <p className="font-bold text-base mb-1 text-foreground">Drag & Drop PDF</p>
            <p className="text-xs text-foreground/50 px-2 max-w-[200px]">
              Upload financial reports, news articles, or legal docs
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
