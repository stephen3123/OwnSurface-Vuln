"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload, File, X, AlertCircle } from "lucide-react";

interface FileUploaderProps {
 onFileSelect: (file: File) => void;
 selectedFile: File | null;
 maxSizeMB?: number;
 accept?: string;
 uploadProgress?: number;
}

const ACCEPTED_EXTENSIONS = [".apk", ".ipa"];

function formatFileSize(bytes: number): string {
 if (bytes < 1024) return `${bytes} B`;
 if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
 return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploader({
 onFileSelect,
 selectedFile,
 maxSizeMB = 200,
 accept = ".apk,.ipa",
 uploadProgress,
}: FileUploaderProps) {
 const [dragOver, setDragOver] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const inputRef = useRef<HTMLInputElement>(null);

 const validateFile = useCallback(
 (file: File): boolean => {
 setError(null);

 const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
 if (!ACCEPTED_EXTENSIONS.includes(ext)) {
 setError(`Invalid file type "${ext}". Only .apk and .ipa files are accepted.`);
 return false;
 }

 const maxBytes = maxSizeMB * 1024 * 1024;
 if (file.size > maxBytes) {
 setError(`File too large (${formatFileSize(file.size)}). Maximum size is ${maxSizeMB}MB.`);
 return false;
 }

 return true;
 },
 [maxSizeMB]
 );

 const handleFile = useCallback(
 (file: File) => {
 if (validateFile(file)) {
 onFileSelect(file);
 }
 },
 [validateFile, onFileSelect]
 );

 const handleDrop = useCallback(
 (e: React.DragEvent) => {
 e.preventDefault();
 setDragOver(false);
 const file = e.dataTransfer.files[0];
 if (file) handleFile(file);
 },
 [handleFile]
 );

 const handleDragOver = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 setDragOver(true);
 }, []);

 const handleDragLeave = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 setDragOver(false);
 }, []);

 const handleInputChange = useCallback(
 (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) handleFile(file);
 },
 [handleFile]
 );

 const clearFile = () => {
 setError(null);
 if (inputRef.current) inputRef.current.value = "";
 onFileSelect(null as unknown as File);
 };

 return (
 <div className="space-y-2">
 {!selectedFile ? (
 <div
 onDrop={handleDrop}
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onClick={() => inputRef.current?.click()}
 className={cn(
 "flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed p-10 transition-all",
 dragOver
 ? "border-teal-500 bg-teal-50"
 : "border-border bg-muted/20 hover:border-teal-500/50 hover:bg-muted/30"
 )}
 >
 <Upload
 className={cn(
 "mb-4 h-10 w-10",
 dragOver ? "text-teal-600" : "text-slate-900 opacity-20"
 )}
 />
 <p className="text-[0.95rem] font-black text-foreground uppercase tracking-tight">
 DROP MOBILE APP BINARY HERE
 </p>
 <p className="mt-2 text-[0.7rem] text-muted-foreground font-black uppercase tracking-widest opacity-60">
 .APK OR .IPA FILES UP TO {maxSizeMB}MB
 </p>
 <input
 ref={inputRef}
 type="file"
 accept={accept}
 onChange={handleInputChange}
 className="hidden"
 />
 </div>
 ) : (
 <div className="rounded-[1.5rem] border border-border bg-muted/10 p-5">
 <div className="flex items-center gap-4">
 <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card border border-border ">
 <File className="h-6 w-6 text-teal-600" />
 </div>
 <div className="min-w-0 flex-1">
 <div className="truncate text-[1rem] font-black text-foreground uppercase tracking-tight">
 {selectedFile.name}
 </div>
 <div className="text-[0.7rem] text-muted-foreground font-black uppercase tracking-widest opacity-60 mt-1">
 {formatFileSize(selectedFile.size)}
 </div>
 </div>
 <button
 onClick={clearFile}
 className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border text-slate-900/40 hover:text-red-600 transition-colors "
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 {uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100 && (
 <div className="mt-5">
 <div className="mb-2 flex justify-between text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">
 <span>INTEL UPLOAD IN PROGRESS...</span>
 <span>{uploadProgress}%</span>
 </div>
 <div className="h-2 overflow-hidden rounded-full bg-muted border border-border/50">
 <div
 className="h-full rounded-full bg-zinc-900 transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
 style={{ width: `${uploadProgress}%` }}
 />
 </div>
 </div>
 )}
 </div>
 )}

 {error && (
 <div className="flex items-center gap-2 rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2">
 <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
 <span className="text-xs text-red-400">{error}</span>
 </div>
 )}
 </div>
 );
}
