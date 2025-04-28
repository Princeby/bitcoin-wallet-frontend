class ApiService {
    constructor() {
      this.baseUrl = '/api';
    }
  
    // Get authentication token from localStorage
    getToken() {
      return localStorage.getItem('token');
    }
  
    // Helper method for making authenticated requests
    async fetchWithAuth(endpoint, options = {}) {
      const token = this.getToken();
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });
      
      // Handle 401 Unauthorized globally
      if (response.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication failed. Please log in again.');
      }
      
      // Parse JSON response
      const data = await response.json();
      
      // Throw error if request failed
      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }
      
      return data;
    }
  
    // Authentication
    // Updated login method for ApiService.js
    async login(username, password) {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        // Check if response is not ok
        if (!response.ok) {
        // Handle error response
        throw new Error(data.message || 'Login failed');
        }
        
        // At this point, data should be valid
        // Store token in localStorage for subsequent requests
        if (data.token) {
        localStorage.setItem('token', data.token);
        }
        
        return data;
    }
  
    async register(username, email, password) {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      return data;
    }
  
    // Wallets
    async getAllWallets() {
      return this.fetchWithAuth('/wallets');
    }
  
    async createWallet(addressType = 'p2wpkh') {
      return this.fetchWithAuth('/wallets/create', {
        method: 'POST',
        body: JSON.stringify({ addressType })
      });
    }
  
    async importWallet(importData) {
      return this.fetchWithAuth('/wallets/import', {
        method: 'POST',
        body: JSON.stringify(importData)
      });
    }
  
    async getWalletDetails(walletId) {
      return this.fetchWithAuth(`/wallets/${walletId}`);
    }
  
    async syncWallet(walletId) {
      return this.fetchWithAuth(`/wallets/${walletId}/sync`);
    }
  
    async getWalletBalance(walletId) {
      return this.fetchWithAuth(`/wallets/${walletId}/balance`);
    }
  
    // Addresses
    async getNextAddress(walletId) {
      return this.fetchWithAuth(`/address/${walletId}/next`);
    }
  
    async validateAddress(address) {
      return this.fetchWithAuth(`/address/validate`, {
        method: 'POST',
        body: JSON.stringify({ address })
      });
    }
  
    async getAddressActivity(address) {
      return this.fetchWithAuth(`/address/${address}/activity`);
    }
  
    // Transactions
    async createTransaction(walletId, toAddress, amount, feeRate) {
      return this.fetchWithAuth(`/transactions/create`, {
        method: 'POST',
        body: JSON.stringify({
          walletId,
          toAddress,
          amount,
          feeRate
        })
      });
    }
  
    async broadcastTransaction(txid, txHex) {
      return this.fetchWithAuth(`/transactions/broadcast`, {
        method: 'POST',
        body: JSON.stringify({ txid, txHex })
      });
    }
  
    async getTransactionHistory(walletId, options = {}) {
      const queryParams = new URLSearchParams();
      
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.offset) queryParams.append('offset', options.offset);
      if (options.type) queryParams.append('type', options.type);
      if (options.status) queryParams.append('status', options.status);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      return this.fetchWithAuth(`/transactions/history/${walletId}${queryString}`);
    }
  
    async getTransactionDetails(txid) {
      return this.fetchWithAuth(`/transactions/${txid}`);
    }
  
    async getTransactionStatus(txid) {
      return this.fetchWithAuth(`/transactions/${txid}/status`);
    }
  
    async getFeeEstimates() {
      return this.fetchWithAuth(`/transactions/fees`);
    }
  
    async estimateTransactionFee(walletId, toAddress, amount) {
      return this.fetchWithAuth(`/transactions/estimate?walletId=${walletId}&toAddress=${toAddress}&amount=${amount}`);
    }
  
    // UTXOs
    async getWalletUtxos(walletId) {
      return this.fetchWithAuth(`/utxos/${walletId}`);
    }
  
    async getUtxoStats(walletId) {
      return this.fetchWithAuth(`/utxos/stats/${walletId}`);
    }
  
    // Blockchain
    async getBlockchainStatus() {
      return this.fetchWithAuth(`/blockchain/status`);
    }
  
    async getNetworkStats() {
      return this.fetchWithAuth(`/blockchain/network/stats`);
    }
  }
  
  export default new ApiService();