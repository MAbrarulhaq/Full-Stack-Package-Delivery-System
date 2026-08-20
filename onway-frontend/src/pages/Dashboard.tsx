import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AdminStaffDashboard } from "@/components/dashboard/AdminStaffDashboard";
import { CourierDashboard } from "@/components/dashboard/CourierDashboard";


export function Dashboard() {
  const { user } = useAuth();
  const isCourier = user?.role === "courier";
  const canManage = user?.role === "admin" || user?.role === "staff";

  return (
    <AppShell
      title="Dashboard"
      actions={
        canManage ? (
          <Button asChild size="sm" className="hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link to="/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Link>
          </Button>
        ) : undefined
      }
    >
      {isCourier ? <CourierDashboard /> : <AdminStaffDashboard />}
    </AppShell>
  );
}
