import { useEffect, useState } from "react";
import { 
  useGetDashboardSummary, 
  getGetDashboardSummaryQueryKey,
  useGetRecentActivity,
  getGetRecentActivityQueryKey,
  useGetSpendingBreakdown,
  getGetSpendingBreakdownQueryKey
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Activity, CreditCard, Wallet, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: recentActivity, isLoading: isLoadingActivity } = useGetRecentActivity({ limit: 5 });
  const { data: spending, isLoading: isLoadingSpending } = useGetSpendingBreakdown();

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Your financial overview</p>
            </div>
            
            {summary?.kycStatus !== "approved" && summary?.kycStatus !== undefined && (
              <Alert variant="destructive" className="sm:w-auto w-full border-destructive/50 bg-destructive/10 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Verification required</AlertTitle>
                <AlertDescription>
                  Please <Link href="/kyc" className="underline font-medium">complete KYC</Link> to unlock all features.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
                <Wallet className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingSummary ? "..." : formatCurrency(summary?.totalBalance || 0, summary?.totalBalanceCurrency)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Spend</CardTitle>
                <ArrowDownRight className="w-4 h-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingSummary ? "..." : formatCurrency(summary?.monthlySpend || 0, summary?.totalBalanceCurrency)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Income</CardTitle>
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingSummary ? "..." : formatCurrency(summary?.monthlyIncome || 0, summary?.totalBalanceCurrency)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Cards</CardTitle>
                <CreditCard className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingSummary ? "..." : summary?.cardCount || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingActivity ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-secondary rounded-full"></div>
                          <div className="space-y-2">
                            <div className="h-4 w-24 bg-secondary rounded"></div>
                            <div className="h-3 w-32 bg-secondary rounded"></div>
                          </div>
                        </div>
                        <div className="h-4 w-16 bg-secondary rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : !recentActivity || recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent activity
                  </div>
                ) : (
                  <div className="space-y-6">
                    {recentActivity.map((item) => (
                      <div key={item.activityId} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            item.direction === "in" ? "bg-green-500/10 text-green-500" :
                            item.direction === "out" ? "bg-destructive/10 text-destructive" :
                            "bg-secondary text-foreground"
                          }`}>
                            {item.iconType === "transfer" ? <ArrowLeftRight className="w-5 h-5" /> :
                             item.iconType === "card" ? <CreditCard className="w-5 h-5" /> :
                             <Activity className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium text-sm ${
                            item.direction === "in" ? "text-green-500" :
                            item.direction === "out" ? "text-foreground" :
                            "text-foreground"
                          }`}>
                            {item.direction === "in" ? "+" : item.direction === "out" ? "-" : ""}
                            {item.amount ? formatCurrency(item.amount, item.currency) : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">{format(new Date(item.createdAt), "MMM d, h:mm a")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Spending Breakdown</CardTitle>
                <CardDescription>Current month</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                {isLoadingSpending ? (
                  <div className="h-[200px] w-full animate-pulse bg-secondary/50 rounded-full"></div>
                ) : !spending || spending.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No spending data
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={spending}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="amount"
                          >
                            {spending.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number, name: string, props: any) => [
                              formatCurrency(value, props.payload.currency), 
                              props.payload.category
                            ]} 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {spending.map((item) => (
                        <div key={item.category} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-muted-foreground">{item.category}</span>
                          </div>
                          <span className="font-medium">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}