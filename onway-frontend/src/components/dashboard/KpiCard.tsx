import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  isLoading: boolean;
  // Optional accent classes for the icon, e.g. status color tokens. Defaults to muted. 
  accentClassName?: string;
}

export function KpiCard({ label, value, icon: Icon, isLoading, accentClassName }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        <Icon className={cn("h-4 w-4 text-muted", accentClassName)} aria-hidden="true" />
      </div>
      <div className="mt-2">
        {isLoading ? (
          <Skeleton className="h-7 w-14" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}
