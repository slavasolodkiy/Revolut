import { ReactNode } from "react";
import { Link } from "wouter";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode, title: string, subtitle?: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">N</span>
            </div>
            <span className="text-foreground font-bold text-2xl tracking-tight">NovaPay</span>
          </Link>
        </div>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-xl border border-border sm:rounded-xl sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}