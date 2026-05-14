"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X } from "lucide-react";

interface CsvUploaderProps {
 onUrls: (urls: string[]) => void;
}

export function CsvUploader({ onUrls }: CsvUploaderProps) {
 const [dragActive, setDragActive] = useState(false);
 const [fileName, setFileName] = useState<string | null>(null);
 const inputRef = useRef<HTMLInputElement>(null);

 function parseFile(file: File) {
 const reader = new FileReader();
 reader.onload = (e) => {
 const text = e.target?.result as string;
 const urls = text
 .split(/[\n,]/)
 .map((u) => u.trim().replace(/^["']|["']$/g, ""))
 .filter((u) => u && (u.startsWith("http") || u.includes(".")));
 setFileName(file.name);
 onUrls(urls);
 };
 reader.readAsText(file);
 }

 function handleDrop(e: React.DragEvent) {
 e.preventDefault();
 setDragActive(false);
 if (e.dataTransfer.files.length > 0) {
 parseFile(e.dataTransfer.files[0]);
 }
 }

 function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
 if (e.target.files && e.target.files.length > 0) {
 parseFile(e.target.files[0]);
 }
 }

 function clearFile() {
 setFileName(null);
 onUrls([]);
 if (inputRef.current) inputRef.current.value = "";
 }

 return (
 <div
 onDragOver={(e) => {
 e.preventDefault();
 setDragActive(true);
 }}
 onDragLeave={() => setDragActive(false)}
 onDrop={handleDrop}
 className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
 dragActive
 ? "border-teal-500 bg-teal-500/5"
 : "border-border hover:border-muted-foreground/30"
 }`}
 >
 <input
 ref={inputRef}
 type="file"
 accept=".csv,.txt"
 onChange={handleChange}
 className="absolute inset-0 opacity-0 cursor-pointer"
 />
 {fileName ? (
 <div className="flex items-center justify-center gap-3">
 <FileText className="w-6 h-6 text-teal-700" />
 <span className="font-medium">{fileName}</span>
 <button
 onClick={(e) => {
 e.stopPropagation();
 clearFile();
 }}
 className="p-1 hover:bg-accent rounded"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 ) : (
 <>
 <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
 <p className="font-medium mb-1">Drop a CSV file here</p>
 <p className="text-sm text-muted-foreground">or click to browse. One URL per line or comma-separated.</p>
 </>
 )}
 </div>
 );
}
