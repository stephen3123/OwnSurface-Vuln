"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
 children: ReactNode;
 fallback?: ReactNode;
}

interface State {
 hasError: boolean;
 error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
 constructor(props: Props) {
 super(props);
 this.state = { hasError: false };
 }

 static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error };
 }

 render() {
 if (this.state.hasError) {
 if (this.props.fallback) return this.props.fallback;
 return (
 <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
 <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
 <AlertTriangle className="w-7 h-7 text-red-400" />
 </div>
 <h3 className="text-lg font-semibold mb-1">Something went wrong</h3>
 <p className="text-muted-foreground text-sm mb-6 max-w-md">
 {this.state.error?.message || "An unexpected error occurred. Please try again."}
 </p>
 <button
 onClick={() => this.setState({ hasError: false, error: undefined })}
 className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium transition-colors"
 >
 <RefreshCcw className="w-4 h-4" />
 Try Again
 </button>
 </div>
 );
 }

 return this.props.children;
 }
}

export function ErrorState({
 message = "Something went wrong",
 onRetry,
}: {
 message?: string;
 onRetry?: () => void;
}) {
 return (
 <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
 <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
 <AlertTriangle className="w-7 h-7 text-red-400" />
 </div>
 <h3 className="text-lg font-semibold mb-1">Error</h3>
 <p className="text-muted-foreground text-sm mb-6 max-w-md">{message}</p>
 {onRetry && (
 <button
 onClick={onRetry}
 className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium transition-colors"
 >
 <RefreshCcw className="w-4 h-4" />
 Retry
 </button>
 )}
 </div>
 );
}
