import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  useGetFxRates, 
  useGetFxHistory,
  useConvertCurrency,
  useListAccounts,
  getGetFxRatesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownUp, RefreshCw, LineChart as LineChartIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD"];

export default function FX() {
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [amount, setAmount] = useState<string>("1000");
  const [fromAccountId, setFromAccountId] = useState<string>("");

  const { data: accounts } = useListAccounts();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rates, isLoading: isLoadingRates } = useGetFxRates({
    base: fromCurrency,
    targets: toCurrency
  });

  const { data: history, isLoading: isLoadingHistory } = useGetFxHistory({
    from: fromCurrency,
    to: toCurrency,
    days: 30
  });

  const convertMutation = useConvertCurrency();

  // Auto-select first account that matches fromCurrency
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const matchingAccount = accounts.find(a => a.currency === fromCurrency);
      if (matchingAccount) {
        setFromAccountId(matchingAccount.accountId);
      } else {
        setFromAccountId("");
      }
    }
  }, [accounts, fromCurrency]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleExchange = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    if (!fromAccountId) {
      toast({ title: "Please select a source account", variant: "destructive" });
      return;
    }

    convertMutation.mutate(
      { 
        data: {
          fromCurrency,
          toCurrency,
          amount: numAmount,
          fromAccountId,
          execute: true
        }
      },
      {
        onSuccess: (result) => {
          toast({ 
            title: "Exchange successful", 
            description: `Converted ${result.fromAmount} ${result.fromCurrency} to ${result.toAmount} ${result.toCurrency}` 
          });
          setAmount("");
        },
        onError: (error: any) => {
          toast({ 
            title: "Exchange failed", 
            description: error?.message || "An error occurred", 
            variant: "destructive" 
          });
        }
      }
    );
  };

  const rate = rates?.rates?.[toCurrency] || 0;
  const estimatedOutput = rate ? (parseFloat(amount || "0") * rate).toFixed(2) : "0.00";

  const chartData = useMemo(() => {
    if (!history) return [];
    return history.map(point => ({
      date: format(new Date(point.date), "MMM d"),
      rate: point.rate
    }));
  }, [history]);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Currency Exchange</h1>
            <p className="text-muted-foreground">Real-time interbank rates with zero hidden markups</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Exchange</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-secondary/30 p-4 rounded-xl border border-border space-y-4">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-muted-foreground">You send</label>
                      <span className="text-sm text-muted-foreground">
                        Balance: {accounts?.find(a => a.accountId === fromAccountId)?.balance.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Select value={fromCurrency} onValueChange={setFromCurrency}>
                        <SelectTrigger className="w-[120px] bg-background border-none shadow-none text-lg font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input 
                        type="number" 
                        className="text-right text-3xl font-bold border-none shadow-none bg-transparent px-0 focus-visible:ring-0" 
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    {accounts && accounts.length > 0 && (
                      <Select value={fromAccountId} onValueChange={setFromAccountId}>
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue placeholder="Select pocket to pay from" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.filter(a => a.currency === fromCurrency).map(a => (
                            <SelectItem key={a.accountId} value={a.accountId}>
                              {a.label || `${a.currency} Pocket`}
                            </SelectItem>
                          ))}
                          {accounts.filter(a => a.currency === fromCurrency).length === 0 && (
                            <SelectItem value="none" disabled>No {fromCurrency} pocket available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="relative flex justify-center -my-6 z-10">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full bg-card hover:bg-secondary w-10 h-10 shadow-sm border-border"
                      onClick={handleSwap}
                    >
                      <ArrowDownUp className="w-4 h-4 text-primary" />
                    </Button>
                  </div>

                  <div className="bg-secondary/30 p-4 rounded-xl border border-border space-y-4">
                    <label className="text-sm font-medium text-muted-foreground">You receive</label>
                    <div className="flex items-center gap-4">
                      <Select value={toCurrency} onValueChange={setToCurrency}>
                        <SelectTrigger className="w-[120px] bg-background border-none shadow-none text-lg font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input 
                        readOnly
                        className="text-right text-3xl font-bold border-none shadow-none bg-transparent px-0 focus-visible:ring-0 text-primary" 
                        value={isLoadingRates ? "..." : estimatedOutput}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm py-2">
                  <span className="text-muted-foreground">Exchange Rate</span>
                  <span className="font-medium flex items-center gap-2">
                    1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
                    <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => queryClient.invalidateQueries({ queryKey: getGetFxRatesQueryKey() })}>
                      <RefreshCw className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </span>
                </div>

                <Button 
                  className="w-full py-6 text-lg bg-primary hover:bg-primary/90" 
                  onClick={handleExchange}
                  disabled={convertMutation.isPending || !amount || !fromAccountId}
                >
                  {convertMutation.isPending ? "Processing..." : `Convert ${fromCurrency} to ${toCurrency}`}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="w-5 h-5" /> 
                  {fromCurrency}/{toCurrency} Chart
                </CardTitle>
                <CardDescription>30 day historical rates</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="w-full h-[300px] bg-secondary/50 animate-pulse rounded-lg"></div>
                ) : chartData.length === 0 ? (
                  <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">
                    No historical data available
                  </div>
                ) : (
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis 
                          dataKey="date" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          minTickGap={30}
                        />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          width={60}
                          tickFormatter={(val) => val.toFixed(4)}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                          labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="rate" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
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