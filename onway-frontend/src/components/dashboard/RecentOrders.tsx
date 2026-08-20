import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PackageX, TriangleAlert, RotateCw, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import type { Order, OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";

interface RecentOrdersProps {
  orders: Order[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  canCreate: boolean;
}

type TabValue = "all" | OrderStatus;

export function RecentOrders({ orders, isLoading, isError, onRetry, canCreate }: RecentOrdersProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("all");

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (activeTab === "all") return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Shipments Activities</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Keep track of recent shipping activity</p>
        </div>

        {/* Tabs - client side filtering */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")}>
            All Shipments
          </TabButton>
          <TabButton active={activeTab === "delivered"} onClick={() => setActiveTab("delivered")}>
            Delivered
          </TabButton>
          <TabButton active={activeTab === "in_transit"} onClick={() => setActiveTab("in_transit")}>
            In Transit
          </TabButton>
          <TabButton active={activeTab === "pending"} onClick={() => setActiveTab("pending")}>
            Pending
          </TabButton>

          <Button asChild variant="outline" size="sm" className="ml-auto shrink-0 sm:ml-2">
            <Link to="/orders">
              <Filter className="mr-2 h-3.5 w-3.5" />
              View all
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        {isLoading ? (
          <div className="divide-y divide-border min-w-[600px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <TriangleAlert className="h-8 w-8 text-status-cancelled" />
            <p className="text-sm font-medium text-foreground">Couldn't load recent orders</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <PackageX className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No orders yet</p>
            {canCreate ? (
              <>
                <p className="max-w-xs text-sm text-muted-foreground">Create your first order to get started.</p>
                <Button asChild size="sm" className="mt-2">
                  <Link to="/orders/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create order
                  </Link>
                </Button>
              </>
            ) : null}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <PackageX className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No {activeTab} orders found</p>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab("all")}>
              Clear filter
            </Button>
          </div>
        ) : (
          <table className="w-full min-w-[600px] text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-slate-50/50 text-xs font-semibold text-muted-foreground">
                <th scope="col" className="px-5 py-3 font-medium">Order ID</th>
                <th scope="col" className="px-5 py-3 font-medium">Customer</th>
                <th scope="col" className="px-5 py-3 font-medium">Route</th>
                <th scope="col" className="px-5 py-3 font-medium">Status</th>
                <th scope="col" className="px-5 py-3 font-medium text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <Link to={`/orders/${order.id}`} className="font-mono text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
                      #{order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-foreground">{order.customerName}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="max-w-[12rem] truncate text-xs text-foreground">{order.pickupAddress}</span>
                      <span className="text-[10px] text-muted-foreground">to {order.dropoffAddress}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TabButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        active
          ? "bg-slate-800 text-white"
          : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
