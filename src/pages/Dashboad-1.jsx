import React, { useState, useEffect, useContext } from 'react';
import { Bitcoin, ArrowUpRight, ArrowDownLeft, Wallet, RefreshCw, PlusCircle, Copy, QrCode, LineChart, BarChart3, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AuthContext from '@/context/AuthContext';
import ApiService from '@/services/ApiService';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [balance, setBalance] = useState({ confirmed: 0, unconfirmed: 0 });
  const [transactions, setTransactions] = useState([]);
  const [utxos, setUtxos] = useState([]);
  const [utxoStats, setUtxoStats] = useState({ total: 0, avgSize: 0, dust: 0 });
  const [marketData, setMarketData] = useState({
    currentPrice: 0,
    priceChange24h: 0,
    marketCap: '0',
    volume24h: '0',
    athPrice: 0,
    athDate: new Date().toISOString()
  });
  const [networkStatus, setNetworkStatus] = useState({
    blockHeight: 0,
    hashrate: '0',
    mempoolSize: 0,
    fastFeeRate: 0,
    economyFeeRate: 0
  });
  const [loading, setLoading] = useState({
    wallets: true,
    transactions: true,
    utxos: true,
    market: true,
    network: true
  });
  const [syncingWallet, setSyncingWallet] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  
  // Simulate a notification toast (in production you'd use react-toastify)
  const showNotification = (message, type = 'info') => {
    setNotificationMsg({ message, type });
    setTimeout(() => setNotificationMsg(null), 3000);
  };
  
  // Fetch wallets on initial load
  useEffect(() => {
    fetchWallets();
    fetchNetworkStatus();
    // Since market data is external to your wallet, we'll fetch it separately
    fetchMarketData();
  }, []);
  
  // When selected wallet changes, fetch its details
  useEffect(() => {
    if (selectedWallet) {
      fetchWalletBalance();
      fetchTransactions();
      fetchUtxos();
      fetchWalletAddress();
    }
  }, [selectedWallet]);
  
  const fetchWallets = async () => {
    try {
      setLoading(prev => ({ ...prev, wallets: true }));
      const response = await ApiService.getAllWallets();
      setWallets(response);
      
      if (response.length > 0) {
        setSelectedWallet(response[0]);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      showNotification('Failed to load wallets', 'error');
    } finally {
      setLoading(prev => ({ ...prev, wallets: false }));
    }
  };
  
  const fetchWalletBalance = async () => {
    if (!selectedWallet) return;
    
    try {
      const balanceData = await ApiService.getWalletBalance(selectedWallet.id);
      setBalance({
        confirmed: balanceData.confirmed || 0,
        unconfirmed: balanceData.unconfirmed || 0
      });
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      showNotification('Failed to load balance', 'error');
    }
  };
  
  const fetchTransactions = async () => {
    if (!selectedWallet) return;
    
    try {
      setLoading(prev => ({ ...prev, transactions: true }));
      const txData = await ApiService.getTransactionHistory(selectedWallet.id, { limit: 10 });
      setTransactions(txData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showNotification('Failed to load transaction history', 'error');
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  };
  
  const fetchUtxos = async () => {
    if (!selectedWallet) return;
    
    try {
      setLoading(prev => ({ ...prev, utxos: true }));
      const utxosData = await ApiService.getWalletUtxos(selectedWallet.id);
      setUtxos(utxosData);
      
      // Get UTXO statistics
      const statsData = await ApiService.getUtxoStats(selectedWallet.id);
      setUtxoStats({
        total: statsData.total || 0,
        avgSize: statsData.averageSize || 0,
        dust: statsData.dustCount || 0
      });
    } catch (error) {
      console.error('Error fetching UTXOs:', error);
      showNotification('Failed to load UTXO data', 'error');
    } finally {
      setLoading(prev => ({ ...prev, utxos: false }));
    }
  };
  
  const fetchNetworkStatus = async () => {
    try {
      setLoading(prev => ({ ...prev, network: true }));
      const [blockchainStatus, networkStats, feeEstimates] = await Promise.all([
        ApiService.getBlockchainStatus(),
        ApiService.getNetworkStats(),
        ApiService.getFeeEstimates()
      ]);
      
      setNetworkStatus({
        blockHeight: blockchainStatus.height || 0,
        hashrate: networkStats.hashrate || '0',
        mempoolSize: networkStats.mempoolSize || 0,
        fastFeeRate: feeEstimates.fastestFee || 0,
        economyFeeRate: feeEstimates.economyFee || 0
      });
    } catch (error) {
      console.error('Error fetching network status:', error);
      showNotification('Failed to load network status', 'error');
    } finally {
      setLoading(prev => ({ ...prev, network: false }));
    }
  };
  
  const fetchMarketData = async () => {
    try {
      setLoading(prev => ({ ...prev, market: true }));
      // This endpoint might not exist in your API service
      // You might need to create it or use a third-party API
      // For now, we'll use a simulated response
      
      // const marketInfo = await ApiService.getMarketData();
      // setMarketData(marketInfo);
      
      // Simulated market data - replace with actual API call
      setTimeout(() => {
        setMarketData({
          currentPrice: 68423.52,
          priceChange24h: 2.34,
          marketCap: '1.34T',
          volume24h: '42.1B',
          athPrice: 73750.00,
          athDate: '2024-03-14'
        });
        setLoading(prev => ({ ...prev, market: false }));
      }, 1000);
    } catch (error) {
      console.error('Error fetching market data:', error);
      showNotification('Failed to load market data', 'error');
      setLoading(prev => ({ ...prev, market: false }));
    }
  };
  
  const fetchWalletAddress = async () => {
    if (!selectedWallet) return;
    
    try {
      const addressData = await ApiService.getNextAddress(selectedWallet.id);
      setWalletAddress(addressData.address || '');
    } catch (error) {
      console.error('Error fetching wallet address:', error);
      showNotification('Failed to load wallet address', 'error');
    }
  };
  
  const handleSyncWallet = async () => {
    if (!selectedWallet) return;
    
    try {
      setSyncingWallet(true);
      showNotification('Syncing wallet...', 'info');
      
      await ApiService.syncWallet(selectedWallet.id);
      
      // Refresh data after sync
      await Promise.all([
        fetchWalletBalance(),
        fetchTransactions(),
        fetchUtxos()
      ]);
      
      showNotification('Wallet synced successfully', 'success');
    } catch (error) {
      console.error('Error syncing wallet:', error);
      showNotification('Failed to sync wallet: ' + error.message, 'error');
    } finally {
      setSyncingWallet(false);
    }
  };
  
  const handleCopyAddress = () => {
    if (!walletAddress) {
      showNotification('No address available to copy', 'error');
      return;
    }
    
    navigator.clipboard.writeText(walletAddress)
      .then(() => showNotification('Address copied to clipboard', 'success'))
      .catch(err => showNotification('Failed to copy address', 'error'));
  };
  
  const handleCreateWallet = async () => {
    try {
      showNotification('Creating new wallet...', 'info');
      
      // Default to p2wpkh (SegWit) address type
      const newWallet = await ApiService.createWallet();
      
      // Refresh wallet list
      await fetchWallets();
      
      // Select the newly created wallet
      setSelectedWallet(newWallet);
      
      showNotification('New wallet created successfully', 'success');
    } catch (error) {
      console.error('Error creating wallet:', error);
      showNotification('Failed to create wallet: ' + error.message, 'error');
    }
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
            {wallets.length > 0 && (
              <div className="w-[200px] mr-4">
                <select 
                  value={selectedWallet?.id || ''}
                  onChange={(e) => {
                    const wallet = wallets.find(w => w.id === e.target.value);
                    setSelectedWallet(wallet);
                  }}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  disabled={loading.wallets}
                >
                  {loading.wallets ? (
                    <option>Loading wallets...</option>
                  ) : (
                    wallets.map(wallet => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name || `Wallet ${wallet.id.slice(0, 6)}`}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
            {user && (
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground mr-2">
                  {user.username}
                </span>
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
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
                  disabled={syncingWallet || !selectedWallet}
                >
                  <RefreshCw className={cn("h-4 w-4", syncingWallet && "animate-spin")} />
                </Button>
              </CardHeader>
              <CardContent>
                {!selectedWallet ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">No wallet selected</p>
                    <Button onClick={handleCreateWallet}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Wallet
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatBTC(balance.confirmed)} BTC
                    </div>
                    <div className="text-base text-muted-foreground">
                      {formatUSD(balance.confirmed * marketData.currentPrice)}
                    </div>
                    {balance.unconfirmed > 0 && (
                      <div className="mt-2 flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-4 w-4" />
                        <span>Pending: {formatBTC(balance.unconfirmed)} BTC</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
              {selectedWallet && (
                <CardFooter className="px-8">
                  <div className="flex space-x-4">
                    <Button className="flex-1" size="sm" disabled={!selectedWallet}>
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Send
                    </Button>
                    <Button className="flex-1" size="sm" variant="outline" disabled={!selectedWallet}>
                      <ArrowDownLeft className="mr-2 h-4 w-4" />
                      Receive
                    </Button>
                  </div>
                </CardFooter>
              )}
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
                {loading.market ? (
                  <div className="h-14 flex items-center justify-center">
                    <div className="animate-pulse h-5 w-24 bg-muted rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatUSD(marketData.currentPrice)}</div>
                    <div className={cn(
                      "flex items-center text-xs",
                      marketData.priceChange24h >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {marketData.priceChange24h >= 0 ? "+" : ""}
                      {marketData.priceChange24h}%
                      <span className="ml-1 text-muted-foreground">(24h)</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Quick Actions Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm" 
                  size="sm"
                  onClick={handleCreateWallet}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Wallet
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm" 
                  size="sm" 
                  onClick={handleCopyAddress}
                  disabled={!walletAddress}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Address
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm" 
                  size="sm"
                  disabled={!walletAddress}
                >
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
                  <Button variant="ghost" size="sm" disabled={!selectedWallet}>
                    View All
                  </Button>
                </div>
                <CardDescription>
                  Your latest Bitcoin transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading.transactions ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!selectedWallet ? (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">Select a wallet to view transactions</p>
                      </div>
                    ) : transactions.length === 0 ? (
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
                )}
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
          
          {/* UTXO Overview */}
          {selectedWallet && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="col-span-3">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>UTXO Overview</CardTitle>
                    <Button variant="outline" size="sm" disabled={!selectedWallet || loading.utxos}>
                      Consolidate UTXOs
                    </Button>
                  </div>
                  <CardDescription>
                    Unspent transaction outputs in your wallet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading.utxos ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <div>
                          <span className="text-muted-foreground">Total UTXOs:</span>
                          <span className="ml-2 font-medium">{utxoStats.total}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Average UTXO size:</span>
                          <span className="ml-2 font-medium">{formatBTC(utxoStats.avgSize)} BTC</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dust UTXOs:</span>
                          <span className="ml-2 font-medium">{utxoStats.dust}</span>
                        </div>
                      </div>
                      
                      {utxos.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-muted-foreground">No UTXOs found in this wallet</p>
                        </div>
                      ) : (
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
                              {utxos.map(utxo => (
                                <tr key={utxo.id || `${utxo.txid}-${utxo.vout}`} className="border-b last:border-0 hover:bg-muted/50">
                                  <td className="p-3 font-mono text-xs truncate max-w-[150px]">
                                    {utxo.txid}
                                  </td>
                                  <td className="p-3 text-right font-medium">
                                    {formatBTC(utxo.value || utxo.amount)} BTC
                                  </td>
                                  <td className="p-3 text-right">
                                    {utxo.confirmations}
                                  </td>
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
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Network Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Network Status</CardTitle>
                <CardDescription>
                  Bitcoin network information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading.network ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="animate-pulse h-4 w-32 bg-muted rounded"></div>
                        <div className="animate-pulse h-4 w-16 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current Block Height</span>
                      <span className="text-sm">{networkStatus.blockHeight.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Network Hashrate</span>
                      <span className="text-sm">{networkStatus.hashrate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Mempool Size</span>
                      <span className="text-sm">{networkStatus.mempoolSize.toLocaleString()} transactions</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current Fee Rate (Fast)</span>
                      <span className="text-sm">{networkStatus.fastFeeRate} sat/vB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current Fee Rate (Economy)</span>
                      <span className="text-sm">{networkStatus.economyFeeRate} sat/vB</span>
                    </div>
                    
                    <Button variant="outline" className="w-full mt-4" size="sm">
                      View Network Details
                    </Button>
                  </div>
                )}
                  </CardContent>
                  </Card>
                </div>
              </div>
            </main>
            </div>
  );
};

export default Dashboard;