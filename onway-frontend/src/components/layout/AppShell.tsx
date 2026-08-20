import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header, PageContent } from "./Header";

interface AppShellProps {
  title: string;
  description?: string;
  //Optional page-level actions (e.g. a "Create Order" button) rendered on the right side of the header. 
  actions?: ReactNode;
  children: ReactNode;
}


 //Desktop: persistent left sidebar + top header + content.
 //Mobile: sidebar collapses into a Sheet drawer opened from the header's
 // hamburger button (see MobileNav) -- the desktop sidebar never renders
 //below the md breakpoint, so there's no shrinking/squashing of it.
export function AppShell({ title, description, actions, children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} description={description} actions={actions} />
        <PageContent>{children}</PageContent>
      </div>
    </div>
  );
}
