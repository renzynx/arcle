"use client";

import { useSessionQuery } from "@arcle/auth-client";
import { Badge } from "@arcle/ui/components/badge";
import { Button } from "@arcle/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@arcle/ui/components/card";
import { Skeleton } from "@arcle/ui/components/skeleton";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Cpu,
  Eye,
  Lightning,
  TrendUp,
  Users,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import type { ComponentType } from "react";
import { useStatsQuery, useSystemHealthQuery } from "@/lib/queries";

type IconWeight = "bold" | "duotone" | "fill" | "light" | "regular" | "thin";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string; weight?: IconWeight }>;
  change?: string;
  isPending?: boolean;
  trend?: "up" | "down" | "neutral";
  description?: string;
};

function StatCard({
  label,
  value,
  icon: Icon,
  change,
  isPending,
  trend = "neutral",
}: StatCardProps) {
  return (
    <Card className="overflow-hidden border-border/50 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" weight="bold" />
        </div>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight">
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            {change && (
              <p className="flex items-center text-xs text-muted-foreground">
                <span
                  className={`flex items-center font-medium ${
                    trend === "up"
                      ? "text-green-500"
                      : trend === "down"
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {trend === "up" && <TrendUp className="mr-1 h-3 w-3" />}
                  {change}
                </span>
                <span className="ml-1 opacity-70">from last month</span>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusDot({
  status,
}: {
  status: "ok" | "error" | "warning" | "down";
}) {
  const color =
    status === "ok"
      ? "bg-emerald-500"
      : status === "warning"
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <span className="relative flex h-2.5 w-2.5 mr-2">
      {status === "ok" && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-75`}
        />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`}
      />
    </span>
  );
}

export default function DashboardPage() {
  const { data: session, isPending: isSessionPending } = useSessionQuery();
  const { data: stats, isPending: isStatsPending } = useStatsQuery();
  const { data: health, isPending: isHealthPending } = useSystemHealthQuery();

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Overview
          </h1>
          <p className="text-muted-foreground">
            Welcome back,{" "}
            <span className="font-medium text-foreground">
              {isSessionPending ? (
                <Skeleton className="inline-block h-4 w-24 align-middle" />
              ) : (
                session?.user?.name || "Admin"
              )}
            </span>
            . Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-md border bg-card px-3 py-1.5 shadow-sm md:flex">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {currentDate}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          isPending={isStatsPending}
          change="+12%"
          trend="up"
        />
        <StatCard
          label="Total Series"
          value={stats?.totalSeries ?? 0}
          icon={BookOpen}
          isPending={isStatsPending}
          change="+4"
          trend="up"
        />
        <StatCard
          label="Page Views"
          value={stats?.totalViews ?? 0}
          icon={Eye}
          isPending={isStatsPending}
          change="+8.2%"
          trend="up"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4 border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest content updates across the platform.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {isStatsPending ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : stats?.recentActivity?.length ? (
                stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="group flex items-start gap-4"
                  >
                    <div
                      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-sm ${
                        activity.type === "chapter"
                          ? "bg-blue-500/10 text-blue-600 border-blue-200"
                          : "bg-orange-500/10 text-orange-600 border-orange-200"
                      }`}
                    >
                      {activity.type === "chapter" ? (
                        <BookOpen className="h-4 w-4" weight="fill" />
                      ) : (
                        <Users className="h-4 w-4" weight="fill" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">
                        {activity.type === "chapter"
                          ? "New Chapter Uploaded"
                          : "New Series Created"}
                      </p>
                      <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        <span className="font-medium text-foreground/80">
                          {activity.title}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <div className="rounded-full bg-muted p-3 mb-2">
                    <Clock className="h-6 w-6 opacity-50" />
                  </div>
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-3 border-border/50 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightning className="h-5 w-5 text-amber-500" weight="fill" />
              System Health
            </CardTitle>
            <CardDescription>
              Real-time performance metrics and status.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {isHealthPending ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Cpu className="h-4 w-4" />
                        <span>Memory Usage</span>
                      </div>
                      <span className="font-mono font-medium text-foreground">
                        {health?.memory.used ?? "—"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Combined RSS across all services
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Lightning className="h-4 w-4" />
                        <span>API Latency</span>
                      </div>
                      <span
                        className={`font-mono font-medium ${
                          (health?.avgLatency ?? 0) < 100
                            ? "text-emerald-500"
                            : (health?.avgLatency ?? 0) < 300
                              ? "text-amber-500"
                              : "text-red-500"
                        }`}
                      >
                        {health?.avgLatency ?? "—"}ms
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/50">
                      <div
                        className={`h-full transition-all duration-500 ease-in-out ${
                          (health?.avgLatency ?? 0) < 100
                            ? "bg-emerald-500"
                            : (health?.avgLatency ?? 0) < 300
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            ((health?.avgLatency ?? 0) / 500) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-muted/30 p-4 border border-border/50">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Service Status
                  </h4>
                  <div className="grid gap-3">
                    {health?.services &&
                      Object.entries(health.services).map(([name, info]) => (
                        <div
                          key={name}
                          className="flex items-center justify-between rounded-lg bg-background p-2.5 shadow-sm border border-border/50"
                        >
                          <div className="flex items-center gap-2.5">
                            <StatusDot status={info.status} />
                            <span className="text-sm font-medium capitalize">
                              {name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {info.status === "error" && (
                              <Badge
                                variant="destructive"
                                className="h-5 px-1.5 text-[10px]"
                              >
                                Error
                              </Badge>
                            )}
                            {info.latency !== null && (
                              <span className="font-mono text-xs text-muted-foreground">
                                {info.latency}ms
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    <div className="mt-2 flex items-center justify-between border-t pt-3">
                      <span className="text-xs text-muted-foreground">
                        System Uptime
                      </span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {health?.uptime ?? "—"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
