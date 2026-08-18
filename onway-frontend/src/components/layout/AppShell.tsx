import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header, PageContent } from "./Header";

interface AppShellProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Desktop: persistent left sidebar + top header + content.
 * Mobile: sidebar collapses into a Sheet drawer opened from the header's
 * hamburger button (see MobileNav) -- the desktop sidebar never renders
 * below the md breakpoint, so there's no shrinking/squashing of it.
 */
export function AppShell({ title, description, children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} description={description} />
        <PageContent>{children}</PageContent>
      </div>
    </div>
  );
}
