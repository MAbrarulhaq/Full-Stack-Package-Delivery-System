import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { NavList } from "./NavList";
import { UserMenu } from "./UserMenu";

/** Mobile-only (hidden at md+ where the persistent Sidebar takes over). Closes automatically after navigating. */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <SheetContent className="flex flex-col">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">Application navigation menu</SheetDescription>
        <div className="flex h-16 items-center border-b border-border px-6">
          <span className="text-lg font-semibold tracking-tight text-foreground">Onway</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <NavList onNavigate={() => setOpen(false)} />
        </div>
        <div className="border-t border-border p-3">
          <UserMenu />
        </div>
      </SheetContent>
    </Sheet>
  );
}
