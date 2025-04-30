import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { SendBitcoinForm } from "@/components/send-bitcoin-form";

export const SendBitcoinModal = ({ 
  isOpen, 
  onClose, 
  walletId,
  onSuccess 
}) => {
  // If modal is not open, don't render anything
  if (!isOpen) return null;
  
  // Handle click outside of modal content to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Handle successful transaction
  const handleTransactionSuccess = (transactionDetails) => {
    // Wait a bit before closing to let user see success message
    setTimeout(() => {
      if (onSuccess) {
        onSuccess(transactionDetails);
      }
    }, 3000);
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg overflow-hidden relative animate-in fade-in zoom-in-95 duration-300">
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute top-2 right-2 z-10" 
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <SendBitcoinForm 
          walletId={walletId}
          onSuccess={handleTransactionSuccess}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};