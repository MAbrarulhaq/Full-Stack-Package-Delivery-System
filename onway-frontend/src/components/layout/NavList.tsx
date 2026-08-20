import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getNavItems } from "./nav-items";
import { useAuth } from "@/hooks/useAuth";

export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const items = getNavItems(user?.role);

  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {items.map((item) => {
        const Icon = item.icon;

        if (item.comingSoon) {
          return (
            <div
              key={item.to}
              className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground"
              aria-disabled="true"
            >
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted">
                Soon
              </span>
            </div>
          );
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-background",
              )
            }
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
