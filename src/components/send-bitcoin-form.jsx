import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { ArrowUpRight, RefreshCw, AlertCircle, Check, Info } from 'lucide-react';
import AuthContext from '@/context/AuthContext';
import ApiService from '@/services/ApiService';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SendBitcoinForm({ walletId, onSuccess, onCancel }) {
  const { token } = useContext(AuthContext);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [btcUsdPrice, setBtcUsdPrice] = useState(0);
  const [feeOptions, setFeeOptions] = useState([]);
  const [selectedFeeOption, setSelectedFeeOption] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isValidAddress, setIsValidAddress] = useState(null);
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [isEstimatingFee, setIsEstimatingFee] = useState(false);
  const [transactionFee, setTransactionFee] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  
  // Formats a BTC value to 8 decimal places
  const formatBTC = (value) => {
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    }).format(value);
  };
  
  // Formats a USD value
  const formatUSD = (value) => {
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Fetch fee options and wallet balance on component mount
  useEffect(() => {
    if (walletId && token) {
      fetchFeeOptions();
      fetchWalletBalance();
      // Simulating BTC price from market data
      setBtcUsdPrice(68423.52);
    }
  }, [walletId, token]);
  
  // Fetch fee options from API
  const fetchFeeOptions = async () => {
    try {
      setIsLoadingFees(true);
      const response = await ApiService.getFeeEstimates();
      
      // Transform API response to array for easier rendering
      const options = [
        { 
          id: 'economy', 
          name: 'Economy', 
          rate: response.low, 
          description: 'May take several hours',
          estimatedTime: '6+ hours'
        },
        { 
          id: 'standard', 
          name: 'Standard', 
          rate: response.medium, 
          description: 'Usually confirms within 1-2 hours',
          estimatedTime: '1-2 hours'
        },
        { 
          id: 'priority', 
          name: 'Priority', 
          rate: response.high, 
          description: 'Usually confirms within an hour',
          estimatedTime: '30-60 minutes'
        },
        { 
          id: 'express', 
          name: 'Express', 
          rate: response.urgent, 
          description: 'Usually confirms in the next few blocks',
          estimatedTime: '10-30 minutes'
        }
      ];
      
      setFeeOptions(options);
      // Set default fee option to standard
      setSelectedFeeOption(options[1]);
    } catch (error) {
      console.error('Error fetching fee options:', error);
      toast.error('Failed to load fee options');
    } finally {
      setIsLoadingFees(false);
    }
  };
  
  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    try {
      const response = await ApiService.getWalletBalance(walletId);
      setWalletBalance(response.confirmed || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      toast.error('Failed to load wallet balance');
    }
  };
  
  // Validate Bitcoin address
  const validateAddress = async () => {
    if (!recipient) return;
    
    try {
      setIsValidating(true);
      const response = await ApiService.validateAddress(recipient);
      
      setIsValidAddress(response.isValid);
      
      if (!response.isValid) {
        toast.error('Invalid Bitcoin address');
      }
      
      if (response.warning) {
        toast.warning(response.warning);
      }
    } catch (error) {
      console.error('Error validating address:', error);
      setIsValidAddress(false);
      toast.error('Failed to validate address');
    } finally {
      setIsValidating(false);
    }
  };
  
  // Estimate transaction fee
  const estimateTransactionFee = async () => {
    if (!recipient || !amount || !isValidAddress || !selectedFeeOption) return;
    
    try {
      setIsEstimatingFee(true);
      
      const response = await ApiService.estimateTransactionFee(walletId, recipient, parseFloat(amount));
      
      // Find the matching fee rate estimate
      const feeEstimate = response.estimations.find(
        est => est.feeRate === selectedFeeOption.rate
      );
      
      setTransactionFee(feeEstimate);
    } catch (error) {
      console.error('Error estimating fee:', error);
      toast.error('Failed to estimate transaction fee');
    } finally {
      setIsEstimatingFee(false);
    }
  };
  
  // Update fee estimate when amount, recipient or fee option changes
  useEffect(() => {
    if (isValidAddress && amount && parseFloat(amount) > 0 && selectedFeeOption) {
      estimateTransactionFee();
    } else {
      setTransactionFee(null);
    }
  }, [amount, recipient, selectedFeeOption, isValidAddress]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!recipient || !amount || !isValidAddress || !selectedFeeOption) {
      toast.error('Please fill in all fields correctly');
      return;
    }
    
    const amountValue = parseFloat(amount);
    
    // Validate amount
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    // Check if balance is sufficient
    if (amountValue > walletBalance) {
      toast.error('Insufficient balance');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create and broadcast transaction
      const transaction = await ApiService.createTransaction(
        walletId,
        recipient,
        amountValue,
        selectedFeeOption.rate
      );
      
      setTransactionDetails(transaction);
      setIsSuccess(true);
      toast.success('Transaction sent successfully!');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(transaction);
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      toast.error(`Transaction failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle "Send Max" button click
  const handleSendMax = () => {
    if (walletBalance > 0 && transactionFee) {
      // Subtract estimated fee from balance to avoid insufficient funds
      const maxAmount = Math.max(0, walletBalance - transactionFee.estimatedFeeBtc);
      setAmount(maxAmount.toFixed(8));
    } else {
      setAmount(walletBalance.toFixed(8));
    }
  };
  
  // Reset form to initial state
  const resetForm = () => {
    setRecipient('');
    setAmount('');
    setIsValidAddress(null);
    setTransactionFee(null);
    setIsSuccess(false);
    setTransactionDetails(null);
  };
  
  // If transaction was successful, show success message
  if (isSuccess && transactionDetails) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Check className="h-6 w-6 text-green-500" />
            <CardTitle>Transaction Sent</CardTitle>
          </div>
          <CardDescription>
            Your Bitcoin transaction has been broadcast to the network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="grid gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Transaction ID:</span>
                <span className="font-mono text-sm truncate max-w-[200px]">{transactionDetails.txid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="font-medium">{formatBTC(transactionDetails.amountBtc)} BTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Recipient:</span>
                <span className="font-mono text-sm truncate max-w-[200px]">{transactionDetails.toAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Fee:</span>
                <span className="text-sm">{formatBTC(transactionDetails.fee)} BTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                  Pending Confirmation
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
            <Info className="mr-2 h-4 w-4" />
            <p>Transaction confirmations typically take 10-30 minutes depending on network congestion.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
          <Button onClick={resetForm}>
            Send Another Transaction
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Main transaction form
  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Bitcoin</CardTitle>
        <CardDescription>
          Transfer Bitcoin from your wallet to another address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Wallet Balance */}
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Available Balance:</span>
                <span className="font-medium">
                  {formatBTC(walletBalance)} BTC
                  <span className="text-sm text-muted-foreground ml-1">
                    ({formatUSD(walletBalance * btcUsdPrice)})
                  </span>
                </span>
              </div>
            </div>
            
            {/* Recipient Address */}
            <div className="space-y-1.5">
              <Label htmlFor="recipient">Recipient Address</Label>
              <div className="relative">
                <Input 
                  id="recipient"
                  placeholder="Enter Bitcoin address"
                  value={recipient}
                  onChange={(e) => {
                    setRecipient(e.target.value);
                    setIsValidAddress(null);
                  }}
                  onBlur={validateAddress}
                  className={cn(
                    isValidAddress === true && "border-green-500 pr-10",
                    isValidAddress === false && "border-red-500 pr-10"
                  )}
                />
                {isValidating && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {isValidAddress === true && !isValidating && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                )}
                {isValidAddress === false && !isValidating && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                )}
              </div>
              {isValidAddress === false && (
                <p className="text-xs text-red-500 mt-1">
                  Invalid Bitcoin address. Please check and try again.
                </p>
              )}
            </div>
            
            {/* Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Amount</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="h-auto px-2 py-1 text-xs"
                  onClick={handleSendMax}
                >
                  Send Max
                </Button>
              </div>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input 
                    id="amount"
                    placeholder="0.00000000"
                    value={amount}
                    onChange={(e) => {
                      // Only allow numbers and one decimal point
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      // Ensure only one decimal point
                      const parts = value.split('.');
                      const formattedValue = parts.length > 2 
                        ? parts[0] + '.' + parts.slice(1).join('') 
                        : value;
                      setAmount(formattedValue);
                    }}
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <span className="text-sm text-muted-foreground">BTC</span>
                  </div>
                </div>
              </div>
              {amount && !isNaN(parseFloat(amount)) && (
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {formatUSD(parseFloat(amount) * btcUsdPrice)}
                </p>
              )}
            </div>
            
            {/* Transaction Fee */}
            <div className="space-y-1.5">
              <Label>Transaction Fee</Label>
              <div className="grid grid-cols-2 gap-3">
                {isLoadingFees ? (
                  <div className="col-span-2 flex justify-center py-4">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  feeOptions.map((option) => (
                    <div
                      key={option.id}
                      className={cn(
                        "flex flex-col p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedFeeOption?.id === option.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setSelectedFeeOption(option)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option.name}</span>
                        <span className="text-sm">{option.rate} sat/vB</span>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {option.estimatedTime}
                      </span>
                    </div>
                  ))
                )}
              </div>
              
              {/* Fee Estimate */}
              {isEstimatingFee && (
                <div className="flex items-center justify-center py-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground">Estimating fee...</span>
                </div>
              )}
              
              {transactionFee && !isEstimatingFee && (
                <div className="rounded-lg bg-muted p-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Fee:</span>
                    <span className="font-medium">
                      {formatBTC(transactionFee.estimatedFeeBtc)} BTC
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatUSD(transactionFee.estimatedFeeBtc * btcUsdPrice)})
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">
                      {formatBTC(parseFloat(amount) + transactionFee.estimatedFeeBtc)} BTC
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Warning for low balance */}
          {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > walletBalance && (
            <div className="flex items-center rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              <AlertCircle className="mr-2 h-4 w-4" />
              <p>Insufficient balance for this transaction.</p>
            </div>
          )}
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={
              isSubmitting || 
              !recipient || 
              !amount || 
              !selectedFeeOption || 
              !isValidAddress ||
              isNaN(parseFloat(amount)) || 
              parseFloat(amount) <= 0 ||
              parseFloat(amount) > walletBalance
            }
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending Transaction...
              </>
            ) : (
              <>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Send Bitcoin
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}