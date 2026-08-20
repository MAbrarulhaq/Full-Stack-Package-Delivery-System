import { LayoutDashboard, Package, UsersRound } from "lucide-react";
import type { UserRole } from "@/types/auth";

export interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  // True for pages not built yet -- rendered as inert placeholders.
  comingSoon?: boolean;
}

export function getNavItems(role: UserRole | undefined): NavItem[] {
  if (role === "courier") {
    return [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { label: "My Deliveries", to: "/orders", icon: Package },
    ];
  }

  if (role === "admin") {
    return [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { label: "Orders", to: "/orders", icon: Package },
      { label: "Users", to: "/admin/users", icon: UsersRound },
    ];
  }

  return [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Orders", to: "/orders", icon: Package },
  ];
}
