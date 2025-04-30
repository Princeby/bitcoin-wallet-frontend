import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';

/**
 * A modal component that displays a Bitcoin address as a QR code
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {string} props.address - The Bitcoin address to display
 * @param {string} props.walletName - Optional wallet name to display
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {string} props.label - Optional label to display above the address
 */
export const BitcoinQRCodeModal = ({ 
  isOpen, 
  address, 
  walletName = 'Bitcoin Wallet', 
  onClose,
  label = 'Receive Bitcoin'
}) => {
  if (!isOpen) return null;
  
  // Handle backdrop click to close the modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Copy address to clipboard
  const handleCopyAddress = () => {
    if (!address) return;
    
    navigator.clipboard.writeText(address)
      .then(() => toast.success('Address copied to clipboard'))
      .catch(() => toast.error('Failed to copy address'));
  };
  
  // Format address for display (first 8 characters, last 8 characters)
  const formatDisplayAddress = (addr) => {
    if (!addr || addr.length < 16) return addr;
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 8)}`;
  };
  
  // Generate bitcoin: URI for QR code
  const bitcoinUri = `bitcoin:${address}`;
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-300">
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute top-2 right-2 z-10 rounded-full" 
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <CardHeader className="pb-0">
          <CardTitle className="text-xl font-medium">{label}</CardTitle>
          <p className="text-sm text-muted-foreground">{walletName}</p>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center justify-center p-6">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-lg mb-4">
            <QRCodeSVG 
              value={bitcoinUri}
              size={200}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="L"
              includeMargin={false}
            />
          </div>
          
          {/* Address display */}
          <div className="w-full px-4 py-3 bg-gray-50 rounded-lg dark:bg-gray-800 mb-2 relative">
            <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
            <p className="text-sm font-mono break-all">{address}</p>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full" 
              onClick={handleCopyAddress}
              title="Copy address to clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground text-center mt-4">
            Scan this QR code with a Bitcoin wallet app to send funds to this address
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t border-gray-100 bg-gray-50/50 py-3 dark:border-gray-800 dark:bg-gray-900/20">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleCopyAddress}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Address
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};