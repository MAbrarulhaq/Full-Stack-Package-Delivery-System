import type { ReactNode } from "react";
import { MobileNav } from "./MobileNav";

export function Header({ title, description }: { title: string; description?: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 md:px-6">
      <MobileNav />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
        {description ? (
          <p className="truncate text-xs text-muted">{description}</p>
        ) : null}
      </div>
    </header>
  );
}

export function PageContent({ children }: { children: ReactNode }) {
  return <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>;
}
