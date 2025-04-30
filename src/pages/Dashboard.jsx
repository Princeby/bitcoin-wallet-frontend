import React, { useState, useEffect, useContext } from 'react';
import { 
  Bitcoin, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  RefreshCw, 
  PlusCircle, 
  Copy, 
  QrCode, 
  LineChart, 
  BarChart3, 
  Clock, 
  AlertCircle, 
  Loader2,
  ChevronDown 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AuthContext from '@/context/AuthContext';
import ApiService from '@/services/ApiService';
import { toast } from 'react-toastify';
import { MarketData } from '@/components/Market-data';
import { SendBitcoinModal } from '@/components/send-bitcoin-modal';
import { BitcoinQRCodeModal } from '@/components/BitcoinQRCodeModal';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [balance, setBalance] = useState({ confirmed: 0, unconfirmed: 0, total: 0 });
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
  const [receiveAddress, setReceiveAddress] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [feeEstimates, setFeeEstimates] = useState(null);
  const [transactionDetailsOpen, setTransactionDetailsOpen] = useState({});

  // State for send bitcoin modal
  const [showSendModal, setShowSendModal] = useState(false);

  
  // Simulate or fetch market data - in production you'd get this from an API
  const fetchExternalMarketData = async () => {
    try {
      setLoading(prev => ({ ...prev, market: true }));
      
      // In production, you would call an external API here
      // For now, we'll simulate market data
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
      toast.error('Failed to load market data');
      setLoading(prev => ({ ...prev, market: false }));
    }
  };

  // Fetch wallets on initial load
  useEffect(() => {
    fetchWallets();
    fetchNetworkStatus();
    fetchFeeEstimates();
    fetchExternalMarketData();
  }, []);

  // When selected wallet changes, fetch its details
  useEffect(() => {
    if (selectedWallet) {
      fetchWalletBalance();
      fetchTransactions();
      fetchUtxos();
      fetchNextAddress();
    }
  }, [selectedWallet]);

  const fetchWallets = async () => {
    try {
      setLoading(prev => ({ ...prev, wallets: true }));
      
      // Call the API endpoint to get all wallets
      const response = await ApiService.getAllWallets();
      
      if (response.success && response.wallets) {
        setWallets(response.wallets);
        
        if (response.wallets.length > 0) {
          setSelectedWallet(response.wallets[0]);
        } else {
          // No wallets found
          setSelectedWallet(null);
          setBalance({ confirmed: 0, unconfirmed: 0, total: 0 });
          setTransactions([]);
          setUtxos([]);
        }
      } else {
        toast.error('Failed to load wallets');
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast.error('Failed to load wallets');
    } finally {
      setLoading(prev => ({ ...prev, wallets: false }));
    }
  };

  const fetchWalletBalance = async () => {
    if (!selectedWallet) return;
    
    try {
      // Call the API endpoint to get wallet balance
      const response = await ApiService.getWalletBalance(selectedWallet.id);
      
      if (response.success && response.balance) {
        setBalance({
          confirmed: response.balance.confirmed || 0,
          unconfirmed: response.balance.unconfirmed || 0,
          total: response.balance.total || 0
        });
      } else {
        toast.error('Failed to load balance');
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      toast.error('Failed to load balance');
    }
  };

  const fetchTransactions = async () => {
    if (!selectedWallet) return;
    
    try {
      setLoading(prev => ({ ...prev, transactions: true }));
      
      // Call the API endpoint to get transaction history
      const response = await ApiService.getTransactionHistory(selectedWallet.id, { limit: 10 });
      
      if (response.success && response.transactions) {
        setTransactions(response.transactions);
      } else {
        toast.error('Failed to load transaction history');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  };

  const fetchUtxos = async () => {
    if (!selectedWallet) return;
    
    try {
      setLoading(prev => ({ ...prev, utxos: true }));
      
      // Call the API endpoint to get wallet UTXOs
      const utxosResponse = await ApiService.getWalletUtxos(selectedWallet.id);
      
      if (utxosResponse.success && utxosResponse.utxos) {
        setUtxos(utxosResponse.utxos);
        
        // Get UTXO statistics
        const statsResponse = await ApiService.getUtxoStats(selectedWallet.id);
        
        if (statsResponse.success && statsResponse.stats) {
          setUtxoStats({
            total: statsResponse.stats.total.count || 0,
            avgSize: statsResponse.stats.total.count > 0 
              ? statsResponse.stats.total.balance / statsResponse.stats.total.count / 100000000 
              : 0,
            dust: statsResponse.stats.distribution?.dust?.count || 0
          });
        }
      } else {
        toast.error('Failed to load UTXO data');
      }
    } catch (error) {
      console.error('Error fetching UTXOs:', error);
      toast.error('Failed to load UTXO data');
    } finally {
      setLoading(prev => ({ ...prev, utxos: false }));
    }
  };

  const fetchNetworkStatus = async () => {
    try {
      setLoading(prev => ({ ...prev, network: true }));
      
      // Call the API endpoint to get blockchain status
      const blockchainResponse = await ApiService.getBlockchainStatus();
      
      // Call the API endpoint to get network stats
      const networkResponse = await ApiService.getNetworkStats();
      
      if (blockchainResponse.success && networkResponse.success) {
        setNetworkStatus({
          blockHeight: blockchainResponse.blockchain?.blockHeight || 0,
          hashrate: networkResponse.blockchain?.hashrate || '0',
          mempoolSize: networkResponse.blockchain?.mempool?.txCount || 0,
          fastFeeRate: networkResponse.fees?.high || 0,
          economyFeeRate: networkResponse.fees?.low || 0
        });
      } else {
        toast.error('Failed to load network status');
      }
    } catch (error) {
      console.error('Error fetching network status:', error);
      toast.error('Failed to load network status');
    } finally {
      setLoading(prev => ({ ...prev, network: false }));
    }
  };

  const fetchFeeEstimates = async () => {
    try {
      const response = await ApiService.getFeeEstimates();
      
      if (response.success) {
        setFeeEstimates(response.feeOptions || response.fees);
      }
    } catch (error) {
      console.error('Error fetching fee estimates:', error);
    }
  };

  const fetchNextAddress = async () => {
    if (!selectedWallet) return;
    
    try {
      // Call the API endpoint to get next address
      const response = await ApiService.getNextAddress(selectedWallet.id);
      
      if (response.success && response.address) {
        setReceiveAddress(response.address);
      } else {
        toast.error('Failed to get wallet address');
      }
    } catch (error) {
      console.error('Error fetching wallet address:', error);
      toast.error('Failed to get wallet address');
    }
  };

  const handleSyncWallet = async () => {
    if (!selectedWallet) return;
    
    try {
      setSyncingWallet(true);
      toast.info('Syncing wallet...');
      
      // Call the API endpoint to sync wallet
      const response = await ApiService.syncWallet(selectedWallet.id);
      
      if (response.success) {
        // Refresh data after sync
        await Promise.all([
          fetchWalletBalance(),
          fetchTransactions(),
          fetchUtxos()
        ]);
        
        toast.success('Wallet synced successfully');
      } else {
        toast.error('Failed to sync wallet');
      }
    } catch (error) {
      console.error('Error syncing wallet:', error);
      toast.error(`Failed to sync wallet: ${error.message}`);
    } finally {
      setSyncingWallet(false);
    }
  };

  const handleCopyAddress = () => {
    if (!receiveAddress) {
      toast.error('No address available to copy');
      return;
    }
    
    navigator.clipboard.writeText(receiveAddress)
      .then(() => toast.success('Address copied to clipboard'))
      .catch(err => toast.error('Failed to copy address'));
  };

  const handleCreateWallet = async () => {
    try {
      toast.info('Creating new wallet...');
      
      // Call the API endpoint to create wallet
      const response = await ApiService.createWallet();
      
      if (response.success && response.wallet) {
        // Refresh wallet list
        await fetchWallets();
        
        // Select the newly created wallet
        setSelectedWallet(response.wallet);
        
        toast.success('New wallet created successfully');
      } else {
        toast.error('Failed to create wallet');
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast.error(`Failed to create wallet: ${error.message}`);
    }
  };

  const toggleTransactionDetails = (txId) => {
    setTransactionDetailsOpen(prev => ({
      ...prev,
      [txId]: !prev[txId]
    }));
  };

  // Handle successful transaction from send modal
  const handleTransactionSuccess = (transaction) => {
    // Close the modal
    setShowSendModal(false);
    
    // Refresh wallet data
    fetchWalletBalance();
    fetchTransactions();
    fetchUtxos();
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

  // QR Code Component
  const QRCodeModal = ({ address, onClose }) => {
    if (!address) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Receive Bitcoin</h3>
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg">
            {/* In a real app, you'd use a QR code library like qrcode.react */}
            <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">QR Code for {address.substring(0, 10)}...</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm break-all mb-2">{address}</p>
            <Button variant="outline" size="sm" className="mr-2" onClick={handleCopyAddress}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Address
            </Button>
            <Button size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
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
                  className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring"
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
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground cursor-pointer" onClick={() => logout()}>
                  {user.username?.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* QR Code Modal */}
      {showQrModal && (
        <QRCodeModal address={receiveAddress} onClose={() => setShowQrModal(false)} />
      )}

      {/* Send Bitcoin Modal */}
      <SendBitcoinModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        walletId={selectedWallet?.id}
        onSuccess={handleTransactionSuccess}
      />

      {/* Bitcoin QR Code Modal */}
      <BitcoinQRCodeModal
        isOpen={showQrModal}
        address={receiveAddress}
        walletName={selectedWallet?.name || 'Bitcoin Wallet'}
        onClose={() => setShowQrModal(false)}
      />
      
      <main className="flex-1 p-4 md:p-6">
        <div className="container grid gap-6 md:gap-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Enhanced Balance Card */}
            {/* Balance Card */}
            {/* Balance Card */}
            <Card className="col-span-2 overflow-hidden border-black/5 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 transform rounded-full bg-black opacity-5" />

              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-black p-1.5">
                    <Wallet className="h-3.5 w-3.5 text-white" />
                  </div>
                  <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleSyncWallet}
                  disabled={syncingWallet || !selectedWallet}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", syncingWallet && "animate-spin")} />
                </Button>
              </CardHeader>

              <CardContent>
                {!selectedWallet ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/50 py-8 dark:border-gray-700 dark:bg-gray-800/20">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <PlusCircle className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">No wallet selected</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateWallet}
                      className="mt-4 border-black/80 bg-white text-black hover:bg-black hover:text-white dark:border-white/80 dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Wallet
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Available</span>
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">BTC</span>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <div className="text-3xl font-bold tracking-tighter">{formatUSD(balance.total * 68423.52)}</div>
                        <div className="text-xl font-medium">{formatBTC(balance.total)}</div>
                      </div>

                      {/* Progress bar showing confirmed vs unconfirmed balance */}
                      {balance.total > 0 && (
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className="h-full rounded-full bg-black dark:bg-white"
                            style={{ width: `${(balance.confirmed / balance.total) * 100}%` }}
                          />
                        </div>
                      )}

                      {/* Balance details */}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <div>
                          <span>Confirmed:</span>
                          <span className="ml-1 font-medium">{formatBTC(balance.confirmed)} BTC</span>
                        </div>
                        {balance.unconfirmed > 0 && (
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            <span>Pending:</span>
                            <span className="ml-1 font-medium">{formatBTC(balance.unconfirmed)} BTC</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              {selectedWallet && (
                <CardFooter className="bg-gray-50/50 px-6 py-4 dark:bg-gray-900/10">
                  <div className="grid w-full grid-cols-2 gap-4">
                    <Button
                      size="sm"
                      disabled={!selectedWallet || balance.confirmed <= 0}
                      onClick={() => setShowSendModal(true)}
                      className="flex items-center justify-center gap-2 border border-black bg-black font-medium text-white shadow-sm hover:bg-black/90 hover:shadow-md hover:text-white dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      <span>Send</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!selectedWallet}
                      onClick={() => setShowQrModal(true)}
                      className="flex items-center justify-center gap-2 border border-black bg-white font-medium text-black shadow-sm hover:bg-black/5 hover:shadow-md dark:border-white dark:bg-black dark:text-white dark:hover:bg-white/5"
                    >
                      <ArrowDownLeft className="h-4 w-4" />
                      <span>Receive</span>
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>

            
            {/* Market Info Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Bitcoin Market
                </CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading.market ? (
                  <div className="h-24 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Price with change indicator */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <div className="text-right">
                        <div className="text-xl font-bold">{formatUSD(68423.52)}</div>
                        <div className={cn(
                          "flex items-center justify-end text-xs",
                          2.34 >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {2.34 >= 0 ? "+" : ""}
                          {2.34}%
                          <span className="ml-1 text-muted-foreground">(24h)</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Divider */}
                    <div className="h-px bg-border" />
                    
                    {/* Trading volume with 24h change */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">24h Volume</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">$42.1B</div>
                        <div className="text-xs text-green-500">+8.7%</div>
                      </div>
                    </div>
                    
                    {/* Market dominance */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">BTC Dominance</span>
                      <div className="text-sm font-medium">53.2%</div>
                    </div>
                  </div>
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
                  disabled={!receiveAddress}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Address
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm" 
                  size="sm"
                  disabled={!receiveAddress}
                  onClick={() => setShowQrModal(true)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Show QR Code
                </Button>
              </CardContent>
            </Card>
          </div>

           {/* Market Data */}
           <MarketData />
          
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
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                          <React.Fragment key={tx.id || tx.txid}>
                            <div 
                              className="grid grid-cols-5 gap-4 p-4 text-sm border-t hover:bg-accent/50 transition-colors cursor-pointer"
                              onClick={() => toggleTransactionDetails(tx.id || tx.txid)}
                            >
                              <div className="flex items-center">
                                <div className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-full mr-2",
                                  tx.type === 'receive' || tx.type === 'received'
                                    ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" 
                                    : "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                                )}>
                                  {tx.type === 'receive' || tx.type === 'received'
                                    ? <ArrowDownLeft className="h-4 w-4" /> 
                                    : <ArrowUpRight className="h-4 w-4" />}
                                </div>
                                <div>
                                  <span className="capitalize">{tx.type}</span>
                                  <ChevronDown className={cn(
                                    "ml-1 h-4 w-4 inline-block transition-transform",
                                    transactionDetailsOpen[tx.id || tx.txid] ? "transform rotate-180" : ""
                                  )} />
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span className={cn(
                                  "font-medium",
                                  tx.type === 'receive' || tx.type === 'received' 
                                    ? "text-green-600 dark:text-green-400" 
                                    : "text-amber-600 dark:text-amber-400"
                                )}>
                                  {tx.type === 'receive' || tx.type === 'received' ? '+' : '-'} {formatBTC(tx.amount)} BTC
                                </span>
                              </div>
                              <div className="truncate text-muted-foreground">{tx.toAddress || tx.address}</div>
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
                              <div className="text-muted-foreground">{formatDate(tx.timestamp || tx.createdAt)}</div>
                            </div>
                            {/* Transaction Details Expansion */}
                            {transactionDetailsOpen[tx.id || tx.txid] && (
                              <div className="col-span-5 p-4 bg-accent/20 border-t text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-muted-foreground mb-1">Transaction ID</p>
                                    <p className="font-mono break-all">{tx.txid}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground mb-1">Fee</p>
                                    <p>{tx.fee ? formatBTC(tx.fee) + ' BTC' : 'N/A'}</p>
                                  </div>
                                  {tx.fromAddress && (
                                    <div>
                                      <p className="text-muted-foreground mb-1">From</p>
                                      <p className="font-mono truncate">{tx.fromAddress}</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-muted-foreground mb-1">To</p>
                                    <p className="font-mono truncate">{tx.toAddress || tx.address}</p>
                                  </div>
                                  {tx.blockHeight && (
                                    <div>
                                      <p className="text-muted-foreground mb-1">Block Height</p>
                                      <p>{tx.blockHeight}</p>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-3 flex justify-end">
                                  <Button variant="ghost" size="sm">
                                    View on Explorer
                                  </Button>
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
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
                    <Button variant="outline" size="sm" disabled={!selectedWallet || loading.utxos || utxos.length < 3}>
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
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                                <tr key={utxo.txid + '-' + utxo.vout} className="border-b last:border-0 hover:bg-muted/50">
                                  <td className="p-3 font-mono text-xs truncate max-w-[150px]">
                                    {utxo.txid}
                                  </td>
                                  <td className="p-3 text-right font-medium">
                                    {formatBTC(utxo.value / 100000000 || utxo.valueInBtc)} BTC
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
          
          {/* Fee Estimates and Network Status */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Fee Estimates Card */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Fee Rates</CardTitle>
                <CardDescription>
                  Current Bitcoin network fees
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!feeEstimates ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Fee Categories from API */}
                    {feeEstimates.economy && (
                      <div className="space-y-3">
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">Economy</div>
                            <div className="font-mono text-sm">{feeEstimates.economy.satPerByte || feeEstimates.low} sat/vB</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{feeEstimates.economy.description || "May take several hours"}</div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-400 rounded-full" 
                              style={{ width: '25%' }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">Standard</div>
                            <div className="font-mono text-sm">{feeEstimates.standard.satPerByte || feeEstimates.medium} sat/vB</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{feeEstimates.standard.description || "Usually confirms within 1-2 hours"}</div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: '50%' }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">Priority</div>
                            <div className="font-mono text-sm">{feeEstimates.priority.satPerByte || feeEstimates.high} sat/vB</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{feeEstimates.priority.description || "Usually confirms within 30-60 minutes"}</div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 rounded-full" 
                              style={{ width: '75%' }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">Express</div>
                            <div className="font-mono text-sm">{feeEstimates.express.satPerByte || feeEstimates.urgent} sat/vB</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{feeEstimates.express.description || "Usually confirms within 10-30 minutes"}</div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-700 rounded-full" 
                              style={{ width: '100%' }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Simple fee rates fallback */}
                    {!feeEstimates.economy && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Low Priority</span>
                          <span className="font-mono text-sm">{feeEstimates.low} sat/vB</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Medium Priority</span>
                          <span className="font-mono text-sm">{feeEstimates.medium} sat/vB</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">High Priority</span>
                          <span className="font-mono text-sm">{feeEstimates.high} sat/vB</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Urgent Priority</span>
                          <span className="font-mono text-sm">{feeEstimates.urgent} sat/vB</span>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-4">
                      Fee estimates are provided by the Bitcoin network and may change based on network conditions.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Network Status */}
            <Card>
              <CardHeader>
                <CardTitle>Network Status</CardTitle>
                <CardDescription>
                  Bitcoin network information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading.network ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            
            {/* Wallet Security Status */}
            <Card>
              <CardHeader>
                <CardTitle>Wallet Security</CardTitle>
                <CardDescription>
                  Security status of your Bitcoin wallet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!selectedWallet ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">Select a wallet to view security status</p>
                    </div>
                  ) : (
                    <>
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
                          {selectedWallet.lastSynced ? formatDate(selectedWallet.lastSynced) : 'Never'}
                        </span>
                      </div>
                    
                      <Button variant="outline" className="w-full mt-4" size="sm">
                        Manage Security Settings
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Portfolio Chart - Just a placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Overview</CardTitle>
                <CardDescription>
                  Your Bitcoin holdings over time
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[200px] bg-muted/20 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <LineChart className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p>Portfolio chart will appear here</p>
                    <p className="text-xs">Historical data not available yet</p>
                  </div>
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