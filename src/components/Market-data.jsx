// src/components/market-data.jsx
import React, { useState, useEffect } from 'react';
import { RefreshCw, BarChart3, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ApiService from '@/services/ApiService';
import { toast } from 'react-toastify';

export function MarketData() {
  // State variables
  const [marketData, setMarketData] = useState({
    currentPrice: 0,
    priceChange24h: 0,
    marketCap: '0',
    volume24h: '0',
    athPrice: 0,
    athDate: new Date().toISOString(),
  });
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState({
    market: true,
    priceHistory: true,
  });
  const [chartTimeframe, setChartTimeframe] = useState(7); // days

  // Fetch market data on component mount
  useEffect(() => {
    fetchMarketData();
    fetchPriceHistory(chartTimeframe);
  }, []);

  // Fetch Bitcoin market data using the ApiService
  const fetchMarketData = async () => {
    try {
      setLoading(prev => ({ ...prev, market: true }));
      
      // Use our ApiService method
      const marketInfo = await ApiService.getMarketData();
      setMarketData(marketInfo);
    } catch (error) {
      console.error('Error fetching market data:', error);
      toast.error('Failed to load market data');
    } finally {
      setLoading(prev => ({ ...prev, market: false }));
    }
  };

  // Fetch price history for the chart
  const fetchPriceHistory = async (days) => {
    try {
      setLoading(prev => ({ ...prev, priceHistory: true }));
      
      // Use our ApiService method
      const historyData = await ApiService.getBitcoinPriceHistory(days);
      
      // Filter data points to reduce x-axis density
      // More sparse for longer timeframes, less sparse for shorter
      const sparseData = historyData.filter((_, index) => {
        if (days === 1) return index % 6 === 0; // Every 6th point for 1D
        if (days === 7) return index % 12 === 0; // Every 12th point for 1W
        if (days === 30) return index % 24 === 0; // Every 24th point for 1M
        return index % 48 === 0; // Every 48th point for 3M+
      });
      
      setPriceHistory(sparseData);
      setChartTimeframe(days);
    } catch (error) {
      console.error('Error fetching price history:', error);
      toast.error('Failed to load price history');
    } finally {
      setLoading(prev => ({ ...prev, priceHistory: false }));
    }
  };

  // Format helpers
  const formatUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Function to format X-axis tick labels based on timeframe
  const formatXAxisTick = (tick) => {
    const date = new Date(tick);
    
    if (chartTimeframe === 1) {
      // For 1 day, show hours
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (chartTimeframe <= 7) {
      // For week, show day and month
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      // For longer periods, show month only
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="grid gap-6">
      {/* Bitcoin Price Card with Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-bold">Bitcoin Price</CardTitle>
            <CardDescription>
              Current price and historical trend
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchPriceHistory(1)}
              className={cn(chartTimeframe === 1 && "bg-primary text-primary-foreground")}
            >
              1D
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchPriceHistory(7)}
              className={cn(chartTimeframe === 7 && "bg-primary text-primary-foreground")}
            >
              1W
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchPriceHistory(30)}
              className={cn(chartTimeframe === 30 && "bg-primary text-primary-foreground")}
            >
              1M
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchPriceHistory(90)}
              className={cn(chartTimeframe === 90 && "bg-primary text-primary-foreground")}
            >
              3M
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <div className="text-3xl font-bold">
                {loading.market ? (
                  <div className="animate-pulse h-8 w-32 bg-muted rounded"></div>
                ) : (
                  formatUSD(marketData.currentPrice)
                )}
              </div>
              {!loading.market && (
                <div className={cn(
                  "flex items-center text-sm",
                  marketData.priceChange24h >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {marketData.priceChange24h >= 0 ? "+" : ""}
                  {marketData.priceChange24h.toFixed(2)}%
                  <span className="ml-1 text-muted-foreground">(24h)</span>
                </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchMarketData}
              disabled={loading.market}
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", loading.market && "animate-spin")} />
              Refresh
            </Button>
          </div>
          
          {/* Price Chart */}
          <div className="h-52">
            {loading.priceHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  {/* Removed CartesianGrid entirely */}
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatXAxisTick} 
                    stroke="#6b7280" 
                    fontSize={10}
                    tick={{ fill: "#6b7280" }}
                    axisLine={{ stroke: "#374151", strokeWidth: 1 }}
                    tickLine={{ stroke: "#374151" }}
                    minTickGap={30} // Increased minimum gap between ticks
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    tickFormatter={(tick) => `$${Math.round(tick).toLocaleString()}`} 
                    stroke="#6b7280"
                    fontSize={10} 
                    width={60}
                    axisLine={{ stroke: "#374151", strokeWidth: 1 }}
                    tickLine={{ stroke: "#374151" }}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Price']}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '0.375rem' }}
                    itemStyle={{ color: '#e5e7eb' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#000000" // Changed to black
                    strokeWidth={2} 
                    dot={false} 
                    activeDot={{ r: 4, fill: "#000000", stroke: "#fff" }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Market Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading.market ? (
              <div className="animate-pulse h-6 w-20 bg-muted rounded"></div>
            ) : (
              <div className="text-2xl font-bold">${marketData.marketCap}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading.market ? (
              <div className="animate-pulse h-6 w-20 bg-muted rounded"></div>
            ) : (
              <div className="text-2xl font-bold">${marketData.volume24h}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All Time High</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading.market ? (
              <div className="animate-pulse h-6 w-20 bg-muted rounded"></div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatUSD(marketData.athPrice)}</div>
                <p className="text-xs text-muted-foreground">
                  on {new Date(marketData.athDate).toLocaleDateString()}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}