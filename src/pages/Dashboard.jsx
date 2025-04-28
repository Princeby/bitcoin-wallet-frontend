import React, { useState, useEffect } from 'react';
import { Bitcoin, ArrowUpRight, ArrowDownLeft, Wallet, RefreshCw, PlusCircle, Copy, QrCode, LineChart, BarChart3, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Sample transaction data (would be fetched from API in production)
const sampleTransactions = [
  { 
    id: 'tx1', 
    type: 'received', 
    amount: 0.012, 
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    address: '3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5',
    status: 'confirmed',
    confirmations: 6
  },
  { 
    id: 'tx2', 
    type: 'sent', 
    amount: 0.005, 
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    status: 'confirmed',
    confirmations: 24
  },
  { 
    id: 'tx3', 
    type: 'received', 
    amount: 0.0321, 
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    status: 'confirmed',
    confirmations: 48
  },
];

// Sample market data (would be fetched from API in production)
const marketData = {
  currentPrice: 68423.52,
  priceChange24h: 2.34,
  marketCap: '1.34T',
  volume24h: '42.1B',
  athPrice: 73750.00,
  athDate: '2024-03-14'
};

// Sample user and wallet data
const userData = {
  username: 'satoshi',
  id: 'user123'
};

const sampleWallets = [
  { id: 'wallet1', name: 'Main Wallet', type: 'p2wpkh', balance: 0.0443 },
  { id: 'wallet2', name: 'Savings', type: 'p2wpkh', balance: 0.2103 }
];

const Dashboard = () => {
  const [wallets, setWallets] = useState(sampleWallets);
  const [selectedWallet, setSelectedWallet] = useState(sampleWallets[0]);
  const [balance, setBalance] = useState({ confirmed: sampleWallets[0].balance, unconfirmed: 0.0021 });
  const [transactions, setTransactions] = useState(sampleTransactions);
  const [syncingWallet, setSyncingWallet] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState(null);
  
  // Price in USD
  const btcPrice = marketData.currentPrice;
  
  // Simulate a notification toast
  const showNotification = (message, type = 'info') => {
    setNotificationMsg({ message, type });
    setTimeout(() => setNotificationMsg(null), 3000);
  };
  
  const handleSyncWallet = async () => {
    if (!selectedWallet) return;
    
    try {
      setSyncingWallet(true);
      showNotification('Syncing wallet...', 'info');
      
      // Mock a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showNotification('Wallet synced successfully', 'success');
    } catch (error) {
      showNotification('Failed to sync wallet', 'error');
    } finally {
      setSyncingWallet(false);
    }
  };
  
  const handleCopyAddress = () => {
    const address = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
    navigator.clipboard.writeText(address)
      .then(() => showNotification('Address copied to clipboard', 'success'))
      .catch(err => showNotification('Failed to copy address', 'error'));
  };
  
  const formatBTC = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    }).format(amount);
  };
  
  const formatUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* Notification toast (simple implementation) */}
      {notificationMsg && (
        <div className={cn(
          "fixed top-4 right-4 z-50 rounded-md p-4 shadow-md transition-opacity",
          notificationMsg.type === 'success' ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
          notificationMsg.type === 'error' ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" :
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
        )}>
          {notificationMsg.message}
        </div>
      )}
      
      {/* Header with wallet selector */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Bitcoin className="mr-2 h-6 w-6" />
            <span className="font-bold">Bitcoin Wallet</span>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            {selectedWallet && (
              <div className="w-[200px] mr-4">
                <select 
                  value={selectedWallet.id}
                  onChange={(e) => {
                    const wallet = wallets.find(w => w.id === e.target.value);
                    setSelectedWallet(wallet);
                    setBalance({ confirmed: wallet.balance, unconfirmed: 0.0021 });
                  }}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {wallets.map(wallet => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-2">
                {userData.username}
              </span>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                {userData.username?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-4 md:p-6">
        <div className="container grid gap-6 md:gap-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Balance Card */}
            <Card className="col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSyncWallet}
                  disabled={syncingWallet}
                >
                  <RefreshCw className={cn("h-4 w-4", syncingWallet && "animate-spin")} />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBTC(balance.confirmed)} BTC
                </div>
                <div className="text-base text-muted-foreground">
                  {formatUSD(balance.confirmed * btcPrice)}
                </div>
                {balance.unconfirmed > 0 && (
                  <div className="mt-2 flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>Pending: {formatBTC(balance.unconfirmed)} BTC</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="px-8">
                <div className="flex space-x-4">
                  <Button className="flex-1" size="sm">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Send
                  </Button>
                  <Button className="flex-1" size="sm" variant="outline">
                    <ArrowDownLeft className="mr-2 h-4 w-4" />
                    Receive
                  </Button>
                </div>
              </CardFooter>
            </Card>
            
            {/* Market Info Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Bitcoin Price
                </CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatUSD(btcPrice)}</div>
                <div className={cn(
                  "flex items-center text-xs",
                  marketData.priceChange24h >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {marketData.priceChange24h >= 0 ? "+" : ""}
                  {marketData.priceChange24h}%
                  <span className="ml-1 text-muted-foreground">(24h)</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Wallet
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" size="sm" onClick={handleCopyAddress}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Address
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                  <QrCode className="mr-2 h-4 w-4" />
                  Show QR Code
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Transaction History */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Transactions</CardTitle>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
                <CardDescription>
                  Your latest Bitcoin transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                        <BarChart3 className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold">No transactions yet</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Start using your wallet by sending or receiving Bitcoin.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <div className="grid grid-cols-5 gap-4 p-4 text-sm font-medium text-muted-foreground">
                        <div>Type</div>
                        <div>Amount</div>
                        <div>Address</div>
                        <div>Status</div>
                        <div>Date</div>
                      </div>
                      {transactions.map((tx) => (
                        <div 
                          key={tx.id} 
                          className="grid grid-cols-5 gap-4 p-4 text-sm border-t hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full mr-2",
                              tx.type === 'received' 
                                ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" 
                                : "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                            )}>
                              {tx.type === 'received' 
                                ? <ArrowDownLeft className="h-4 w-4" /> 
                                : <ArrowUpRight className="h-4 w-4" />}
                            </div>
                            <span className="capitalize">{tx.type}</span>
                          </div>
                          <div className="flex items-center">
                            <span className={cn(
                              "font-medium",
                              tx.type === 'received' ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                            )}>
                              {tx.type === 'received' ? '+' : '-'} {formatBTC(tx.amount)} BTC
                            </span>
                          </div>
                          <div className="truncate text-muted-foreground">{tx.address}</div>
                          <div className="flex items-center">
                            {tx.status === 'confirmed' ? (
                              <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                {tx.confirmations} confirmations
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                                <Clock className="mr-1 h-3 w-3" />
                                Pending
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground">{formatDate(tx.timestamp)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Market Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${marketData.marketCap}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${marketData.volume24h}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">All Time High</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatUSD(marketData.athPrice)}</div>
                <p className="text-xs text-muted-foreground">
                  on {new Date(marketData.athDate).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* UTXO Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>UTXO Overview</CardTitle>
                  <Button variant="outline" size="sm">
                    Consolidate UTXOs
                  </Button>
                </div>
                <CardDescription>
                  Unspent transaction outputs in your wallet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">Total UTXOs:</span>
                      <span className="ml-2 font-medium">12</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Average UTXO size:</span>
                      <span className="ml-2 font-medium">0.0037 BTC</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dust UTXOs:</span>
                      <span className="ml-2 font-medium">3</span>
                    </div>
                  </div>
                  
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left font-medium">TXID</th>
                          <th className="p-3 text-right font-medium">Amount</th>
                          <th className="p-3 text-right font-medium">Confirmations</th>
                          <th className="p-3 text-center font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: 'utxo1', txid: '452af...3bc7', amount: 0.0132, confirmations: 134 },
                          { id: 'utxo2', txid: '827fe...a21e', amount: 0.0075, confirmations: 89 },
                          { id: 'utxo3', txid: '91c3d...45f2', amount: 0.0198, confirmations: 67 },
                          { id: 'utxo4', txid: '64ae7...12d4', amount: 0.0038, confirmations: 24 }
                        ].map(utxo => (
                          <tr key={utxo.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="p-3 font-mono text-xs truncate max-w-[150px]">{utxo.txid}</td>
                            <td className="p-3 text-right font-medium">{formatBTC(utxo.amount)} BTC</td>
                            <td className="p-3 text-right">{utxo.confirmations}</td>
                            <td className="p-3 text-center">
                              <Button variant="ghost" size="sm" className="h-7 px-2">
                                <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                                Spend
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Security Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Security</CardTitle>
                <CardDescription>
                  Security status of your Bitcoin wallet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Backup Status</span>
                    <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      Backed Up
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Recovery Phrase</span>
                    <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">2FA Authentication</span>
                    <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                      Not Enabled
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Activity</span>
                    <span className="text-sm text-muted-foreground">
                      Today, 10:32 AM
                    </span>
                  </div>
                  
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    Manage Security Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Network Status</CardTitle>
                <CardDescription>
                  Bitcoin network information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Block Height</span>
                    <span className="text-sm">830,471</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Network Hashrate</span>
                    <span className="text-sm">612 EH/s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Mempool Size</span>
                    <span className="text-sm">23,158 transactions</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Fee Rate (Fast)</span>
                    <span className="text-sm">42 sat/vB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Fee Rate (Economy)</span>
                    <span className="text-sm">18 sat/vB</span>
                  </div>
                  
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    View Network Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;