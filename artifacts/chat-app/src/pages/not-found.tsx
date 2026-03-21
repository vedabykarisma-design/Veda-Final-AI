import { Link } from "wouter";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="w-24 h-24 rounded-3xl bg-muted/50 flex items-center justify-center mb-6 shadow-inner border border-border/50">
        <FileQuestion className="w-12 h-12 text-muted-foreground" />
      </div>
      <h1 className="font-display text-5xl font-extrabold text-foreground mb-4 tracking-tight">404</h1>
      <p className="text-muted-foreground mb-10 text-lg max-w-sm font-medium">
        Oops! We couldn't find the page you're looking for.
      </p>
      
      <Link 
        href="/" 
        className="inline-flex items-center justify-center whitespace-nowrap rounded-2xl font-semibold transition-all bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 h-14 px-10 text-lg"
      >
        Back to Chat
      </Link>
    </div>
  );
}
