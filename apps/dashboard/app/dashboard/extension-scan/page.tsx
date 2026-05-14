"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { Loader2, Puzzle, Play, Clock, Shield, Upload } from "lucide-react";

interface ExtensionScan {
 id: string;
 extension_name: string;
 status: string;
 severity_critical: number;
 severity_high: number;
 severity_medium: number;
 severity_low: number;
 created_at: string;
}

export default function ExtensionScanPage() {
 const { isAuthenticated, isLoading: authLoading } = useAuth();
 const router = useRouter();
 const [scans, setScans] = useState<ExtensionScan[]>([]);
 const [loading, setLoading] = useState(true);
 const [starting, setStarting] = useState(false);
 const [selectedFile, setSelectedFile] = useState<File | null>(null);
 const [uploadProgress, setUploadProgress] = useState(0);
 const [dragActive, setDragActive] = useState(false);

 const formatFileSize = (bytes: number) => {
 const kb = bytes / 1024;
 if (kb < 1024) return `${kb.toFixed(1)} KB`;
 return `${(kb / 1024).toFixed(2)} MB`;
 };

 useEffect(() => {
 if (authLoading) return;
 if (!isAuthenticated) {
 setLoading(false);
 return;
 }

 api.request<{ scans: ExtensionScan[] }>("/extension-scan")
 .then((res) => setScans(res.data?.scans || []))
 .finally(() => setLoading(false));
 }, [isAuthenticated, authLoading]);

 const handleDrop = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 setDragActive(false);
 const file = e.dataTransfer.files[0];
 if (file && (file.name.endsWith(".crx") || file.name.endsWith(".zip"))) {
 setSelectedFile(file);
 }
 }, []);

 const handleDragOver = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 setDragActive(true);
 }, []);

 const handleDragLeave = useCallback(() => {
 setDragActive(false);
 }, []);

 const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) setSelectedFile(file);
 }, []);

 const startScan = async () => {
 if (!selectedFile || !isAuthenticated) return;
 setStarting(true);
 setUploadProgress(0);

 try {
 const formData = new FormData();
 formData.append("file", selectedFile);

 const xhr = new XMLHttpRequest();
 xhr.withCredentials = true; // Essential for session cookies with raw XHR
 xhr.upload.addEventListener("progress", (e) => {
 if (e.lengthComputable) {
 setUploadProgress(Math.round((e.loaded / e.total) * 100));
 }
 });

 const response = await new Promise<any>((resolve, reject) => {
 xhr.onload = () => {
 try {
 resolve(JSON.parse(xhr.responseText));
 } catch {
 reject(new Error("Invalid response"));
 }
 };
 xhr.onerror = () => reject(new Error("Upload failed"));
 const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
 const apiUrl = publicApiUrl ? `${publicApiUrl}/api/v1` : "/api/v1";
 xhr.open("POST", `${apiUrl}/extension-scan`);
 xhr.send(formData);
 });

 if (response.scan?.id) {
 router.push(`/dashboard/extension-scan/${response.scan.id}`);
 }
 } catch (error) {
 console.error("Failed to start scan:", error);
 } finally {
 setStarting(false);
 setUploadProgress(0);
 }
 };

 if (loading) {
 return (
 <div className="flex justify-center py-20">
 <Loader2 className="h-8 w-8 animate-spin text-teal-300" />
 </div>
 );
 }

 return (
 <div className="dashboard-page mx-auto max-w-5xl space-y-8">
 <div>
 <p className="text-sm text-muted-foreground">
 Upload a browser extension (.crx or .zip) to scan for permission abuse, data exfiltration, and security issues
 </p>
 </div>

 {/* New scan launcher */}
 <div className="rounded-xl border border-border bg-card p-6">
 <h2 className="mb-4 text-lg font-semibold text-foreground">Start New Scan</h2>

 {/* Drag-and-drop upload */}
 <div className="mb-5">
 <label className="mb-2 block text-sm font-medium text-muted-foreground">
 Extension File
 </label>
 <div
 onDrop={handleDrop}
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
 dragActive
 ? "border-teal-400 bg-teal-50"
 : selectedFile
 ? "border-teal-500/30 bg-teal-50"
 : "border-border bg-card hover:border-border/80"
 }`}
 >
 {selectedFile ? (
 <div className="text-center">
 <Puzzle className="mx-auto h-8 w-8 text-teal-600" />
 <div className="mt-2 text-sm font-medium text-foreground">{selectedFile.name}</div>
 <div className="text-xs text-muted-foreground">
 {formatFileSize(selectedFile.size)}
 </div>
 <button
 onClick={() => setSelectedFile(null)}
 className="mt-2 text-xs text-muted-foreground hover:text-foreground"
 >
 Remove
 </button>
 </div>
 ) : (
 <div className="text-center">
 <Upload className="mx-auto h-8 w-8 text-muted-foreground/40" />
 <div className="mt-2 text-sm text-muted-foreground">
 Drop a .crx or .zip file here, or{" "}
 <label className="cursor-pointer text-teal-600 hover:text-teal-500">
 browse
 <input
 type="file"
 accept=".crx,.zip"
 onChange={handleFileSelect}
 className="hidden"
 />
 </label>
 </div>
 </div>
 )}

 {starting && uploadProgress > 0 && (
 <div className="absolute bottom-0 left-0 h-1 rounded-b-xl bg-teal-500 transition-all" style={{ width: `${uploadProgress}%` }} />
 )}
 </div>
 </div>

 <button
 onClick={startScan}
 disabled={starting || !selectedFile}
 className="mt-2 flex items-center gap-2 rounded-xl bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-all hover:bg-foreground/90 hover:scale-[1.01] disabled:opacity-50"
 >
 {starting ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 <Play className="h-4 w-4" />
 )}
 {starting ? "Uploading..." : "Start Extension Scan"}
 </button>
 </div>

 {/* Previous scans */}
 {scans.length > 0 && (
 <div>
 <h2 className="mb-3 text-lg font-semibold text-foreground">Previous Scans</h2>
 <div className="space-y-2">
 {scans.map((scan) => (
 <button
 key={scan.id}
 onClick={() => router.push(`/dashboard/extension-scan/${scan.id}`)}
 className="flex w-full items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 text-left transition-all hover:border-teal-500/30"
 >
 <Puzzle className="h-5 w-5 text-teal-600" />
 <div className="min-w-0 flex-1">
 <div className="truncate text-sm font-medium text-foreground">
 {scan.extension_name || "Unknown Extension"}
 </div>
 <div className="flex items-center gap-2 text-xs text-muted-foreground">
 <Clock className="h-3 w-3" />
 {new Date(scan.created_at).toLocaleDateString()}
 </div>
 </div>
 <div className="flex items-center gap-3 text-xs">
 {scan.severity_critical > 0 && (
 <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-red-400">
 {scan.severity_critical} critical
 </span>
 )}
 {scan.severity_high > 0 && (
 <span className="rounded-md bg-orange-500/10 px-2 py-0.5 text-orange-400">
 {scan.severity_high} high
 </span>
 )}
 <span
 className={`rounded-md px-2 py-0.5 border ${
 scan.status === "complete"
 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
 : scan.status === "running"
 ? "bg-blue-50 text-blue-700 border-blue-200"
 : "bg-slate-50 text-slate-700 border-slate-200"
 }`}
 >
 {scan.status}
 </span>
 </div>
 </button>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
