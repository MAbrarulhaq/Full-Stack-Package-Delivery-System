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
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-background/50">
        <Icon className={cn("h-5 w-5 text-muted-foreground", accentClassName)} aria-hidden="true" />
      </div>
      <div>
        {isLoading ? (
          <Skeleton className="mb-1 h-7 w-16" />
        ) : (
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-foreground">{value.toLocaleString()}</p>
          </div>
        )}
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
