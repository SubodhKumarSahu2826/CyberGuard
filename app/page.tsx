import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsOverview } from "@/components/dashboard/stats-overview"
import { AttackTypesChart } from "@/components/dashboard/attack-types-chart"
import { RiskLevelChart } from "@/components/dashboard/risk-level-chart"
import { RecentDetections } from "@/components/dashboard/recent-detections"
import { TopAttackingIPs } from "@/components/dashboard/top-attacking-ips"
import { LiveCapture } from "@/components/dashboard/live-capture"
import { PCAPUpload } from "@/components/dashboard/pcap-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px]" />
              <Skeleton className="h-3 w-[120px] mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">Cyber Attack Detection Dashboard</h1>
            <p className="text-muted-foreground text-pretty">
              Monitor and analyze cyber threats in real-time with advanced ML detection
            </p>
          </div>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          {/* Stats Overview */}
          <StatsOverview />

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Attack Types Distribution</CardTitle>
                <CardDescription>Breakdown of detected attack types over the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <AttackTypesChart />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Risk Level Analysis</CardTitle>
                <CardDescription>Distribution of threats by risk severity</CardDescription>
              </CardHeader>
              <CardContent>
                <RiskLevelChart />
              </CardContent>
            </Card>
          </div>

          {/* Data Ingestion Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <LiveCapture />
            <PCAPUpload />
          </div>

          {/* Recent Activity Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Detections</CardTitle>
                <CardDescription>Latest cyber attack detections and their details</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentDetections />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Attacking IPs</CardTitle>
                <CardDescription>Most active source IPs in the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <TopAttackingIPs />
              </CardContent>
            </Card>
          </div>
        </Suspense>
      </main>
    </div>
  )
}
