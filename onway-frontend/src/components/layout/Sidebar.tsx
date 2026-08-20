import { NavList } from "./NavList";
import { UserMenu } from "./UserMenu";

// Desktop-only (hidden below md breakpoint; mobile uses MobileNav's Sheet instead). 
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <span className="text-lg font-semibold tracking-tight text-foreground">Onway</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <NavList />
      </div>
      <div className="border-t border-border p-3">
        <UserMenu />
      </div>
    </aside>
  );
}
