import { LayoutDashboard, Package, Users } from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  /** True for pages not built yet (Orders, Couriers) -- rendered as inert placeholders, per Step 7.2/7.3 scope. */
  comingSoon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", to: "/orders", icon: Package, comingSoon: true },
  { label: "Couriers", to: "/couriers", icon: Users, comingSoon: true },
];
