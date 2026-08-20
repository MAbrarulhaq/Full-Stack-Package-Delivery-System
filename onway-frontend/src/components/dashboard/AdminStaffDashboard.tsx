import { Link } from "react-router-dom";
import { Package, Clock, Truck, CheckCircle2, ArrowRight, UsersRound } from "lucide-react";
import { useOrderStatusCounts, useRecentOrders, useUserCounts } from "@/hooks/useDashboardStats";
import { useAuth } from "@/hooks/useAuth";
import { KpiCard } from "./KpiCard";
import { StatusOverview } from "./StatusOverview";
import { RecentOrders } from "./RecentOrders";

export function AdminStaffDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { total, counts, isLoading: statsLoading, isError: statsError, refetch: refetchStats } =
    useOrderStatusCounts();
  const recentOrdersQuery = useRecentOrders(8);

  return (
    <div className="space-y-6">
      {statsError ? (
        <div className="rounded-lg border border-status-cancelled/30 bg-status-cancelled-bg px-4 py-3 text-sm text-status-cancelled">
          Some dashboard data couldn't be loaded.{" "}
          <button onClick={refetchStats} className="font-medium underline underline-offset-2">
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Orders" value={total} icon={Package} isLoading={statsLoading} />
        <KpiCard
          label="Pending"
          value={counts.pending}
          icon={Clock}
          isLoading={statsLoading}
          accentClassName="text-status-pending"
        />
        <KpiCard
          label="In Transit"
          value={counts.in_transit}
          icon={Truck}
          isLoading={statsLoading}
          accentClassName="text-status-in-transit"
        />
        <KpiCard
          label="Delivered"
          value={counts.delivered}
          icon={CheckCircle2}
          isLoading={statsLoading}
          accentClassName="text-status-delivered"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentOrders
            orders={recentOrdersQuery.data?.data}
            isLoading={recentOrdersQuery.isLoading}
            isError={recentOrdersQuery.isError}
            onRetry={() => recentOrdersQuery.refetch()}
            canCreate
          />
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-6 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Status Overview</h2>
          <StatusOverview counts={counts} total={total} isLoading={statsLoading} />
        </div>
      </div>

      {isAdmin ? <UsersSection /> : null}
    </div>
  );
}

/** Admin-only real-data users summary -- GET /users is admin-only, so this section never renders for staff. */
function UsersSection() {
  const { total, counts, isLoading } = useUserCounts();

  return (
    <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Users</h2>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Manage Users
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Total Users" value={total} icon={UsersRound} isLoading={isLoading} />
        <KpiCard label="Admins" value={counts.admin} icon={UsersRound} isLoading={isLoading} accentClassName="text-primary" />
        <KpiCard label="Staff" value={counts.staff} icon={UsersRound} isLoading={isLoading} />
        <KpiCard
          label="Couriers"
          value={counts.courier}
          icon={UsersRound}
          isLoading={isLoading}
          accentClassName="text-status-in-transit"
        />
      </div>
    </div>
  );
}
