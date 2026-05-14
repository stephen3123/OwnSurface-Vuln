"use client";

import { useState } from "react";
import { Check, Copy, Linkedin, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonsProps {
 title: string;
 path: string;
}

function XIcon({ className }: { className?: string }) {
 return (
 <svg viewBox="0 0 24 24" className={className} fill="currentColor">
 <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
 </svg>
 );
}

export function ShareButtons({ title, path }: ShareButtonsProps) {
 const [copied, setCopied] = useState(false);
 const url = `https://ownsurface.com${path}`;
 const encodedUrl = encodeURIComponent(url);
 const encodedTitle = encodeURIComponent(title);

 function copyLink() {
 navigator.clipboard.writeText(url);
 setCopied(true);
 toast.success("Link copied to clipboard");
 setTimeout(() => setCopied(false), 2000);
 }

 return (
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mr-1">Share</span>
 <a
 href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card/60 hover:bg-foreground hover:text-background hover:border-foreground transition-all"
 aria-label="Share on X"
 >
 <XIcon className="h-3.5 w-3.5" />
 </a>
 <a
 href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card/60 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all"
 aria-label="Share on LinkedIn"
 >
 <Linkedin className="h-3.5 w-3.5" />
 </a>
 <a
 href={`https://news.ycombinator.com/submitlink?u=${encodedUrl}&t=${encodedTitle}`}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card/60 hover:bg-[#FF6600] hover:text-white hover:border-[#FF6600] transition-all text-xs font-bold"
 aria-label="Share on Hacker News"
 >
 Y
 </a>
 <a
 href={`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card/60 hover:bg-[#FF4500] hover:text-white hover:border-[#FF4500] transition-all"
 aria-label="Share on Reddit"
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
 <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.066 13.66c.069.332.104.67.104 1.013 0 3.19-3.694 5.776-8.17 5.776-4.477 0-8.17-2.586-8.17-5.776 0-.344.035-.682.104-1.013a1.78 1.78 0 01-.728-1.434c0-.98.796-1.776 1.776-1.776.474 0 .904.186 1.222.49 1.194-.832 2.818-1.364 4.618-1.426l.924-4.152a.383.383 0 01.458-.3l2.97.656a1.27 1.27 0 011.143-.706c.7 0 1.27.57 1.27 1.27s-.57 1.27-1.27 1.27-1.27-.57-1.27-1.27l-2.656-.588-.822 3.692c1.77.074 3.367.6 4.543 1.42a1.77 1.77 0 011.222-.49c.98 0 1.776.796 1.776 1.776 0 .58-.28 1.096-.728 1.434zM9.2 13.808c-.7 0-1.27.57-1.27 1.27s.57 1.27 1.27 1.27 1.27-.57 1.27-1.27-.57-1.27-1.27-1.27zm5.6 0c-.7 0-1.27.57-1.27 1.27s.57 1.27 1.27 1.27 1.27-.57 1.27-1.27-.57-1.27-1.27-1.27zm-4.446 3.987a.383.383 0 01.54-.035c.746.648 1.762 1.005 2.862 1.005h.088c1.1 0 2.116-.357 2.862-1.005a.383.383 0 01.505.575c-.888.772-2.07 1.196-3.367 1.196h-.088c-1.297 0-2.479-.424-3.367-1.196a.383.383 0 01-.035-.54z" />
 </svg>
 </a>
 <button
 onClick={copyLink}
 className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card/60 hover:bg-secondary transition-all"
 aria-label="Copy link"
 >
 {copied ? <Check className="h-3.5 w-3.5 text-teal-600" /> : <Copy className="h-3.5 w-3.5" />}
 </button>
 </div>
 );
}
