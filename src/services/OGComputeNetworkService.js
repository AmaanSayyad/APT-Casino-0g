/**
 * 0G Compute Network Service
 * Service for interacting with 0G Compute Network AI services
 */

/**
 * NOTE: This service is not used in the current implementation.
 * All 0G Compute Network operations are handled via the API route.
 * This file is kept for reference but client-side code uses the API route directly.
 */

// Client-side service uses API route instead of direct broker access
// This avoids browser compatibility issues with Node.js modules
import { 
  getCurrentNetworkConfig, 
  DEFAULT_PROVIDER,
  OG_COMPUTE_SERVICE_CONFIG 
} from '../config/ogComputeNetwork.js';

class OGComputeNetworkService {
  constructor() {
    this.broker = null;
    this.provider = null;
    this.wallet = null;
    this.isInitialized = false;
    this.currentProviderAddress = null;
    this.openaiClient = null;
  }

  /**
   * Initialize the 0G Compute Network broker
   * @param {Object} wallet - Ethers wallet instance or private key
   * @returns {Promise<boolean>} Success status
   */
  async initialize(wallet) {
    try {
      const networkConfig = getCurrentNetworkConfig();
      
      // If wallet is a private key string, create wallet
      if (typeof wallet === 'string') {
        this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
        this.wallet = new ethers.Wallet(wallet, this.provider);
      } else if (wallet instanceof ethers.Wallet) {
        this.wallet = wallet;
        this.provider = wallet.provider;
      } else if (wallet && wallet.getAddress) {
        // Browser wallet (signer)
        this.wallet = wallet;
        this.provider = wallet.provider;
      } else {
        throw new Error('Invalid wallet provided. Must be private key, Wallet, or Signer.');
      }

      // Create broker
      this.broker = await createZGComputeNetworkBroker(this.wallet);
      
      // Set default provider
      this.currentProviderAddress = DEFAULT_PROVIDER.address;
      
      this.isInitialized = true;
      console.log('✅ 0G Compute Network broker initialized');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize 0G Compute Network broker:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * List available AI services
   * @returns {Promise<Array>} List of available services
   */
  async listServices() {
    if (!this.isInitialized) {
      throw new Error('Broker not initialized. Call initialize() first.');
    }

    try {
      const services = await this.broker.inference.listService();
      return services.map(service => ({
        provider: service.provider,
        serviceType: service.serviceType,
        url: service.url,
        inputPrice: service.inputPrice.toString(),
        outputPrice: service.outputPrice.toString(),
        updatedAt: Number(service.updatedAt),
        model: service.model,
        verifiability: service.verifiability,
      }));
    } catch (error) {
      console.error('❌ Failed to list services:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   * @returns {Promise<Object>} Account balance information
   */
  async getAccountBalance() {
    if (!this.isInitialized) {
      throw new Error('Broker not initialized. Call initialize() first.');
    }

    try {
      const account = await this.broker.ledger.getLedger();
      return {
        totalBalance: ethers.formatEther(account.totalBalance),
        balance: account.totalBalance,
        raw: account,
      };
    } catch (error) {
      console.error('❌ Failed to get account balance:', error);
      throw error;
    }
  }

  /**
   * Add funds to account
   * @param {number|string} amount - Amount in OG tokens
   * @returns {Promise<Object>} Transaction result
   */
  async addFunds(amount) {
    if (!this.isInitialized) {
      throw new Error('Broker not initialized. Call initialize() first.');
    }

    try {
      const tx = await this.broker.ledger.addLedger(amount);
      console.log('✅ Funds added to account:', amount, 'OG');
      return {
        success: true,
        transaction: tx,
        amount,
      };
    } catch (error) {
      console.error('❌ Failed to add funds:', error);
      throw error;
    }
  }

  /**
   * Acknowledge provider (required before using service)
   * @param {string} providerAddress - Provider address
   * @returns {Promise<Object>} Transaction result
   */
  async acknowledgeProvider(providerAddress) {
    if (!this.isInitialized) {
      throw new Error('Broker not initialized. Call initialize() first.');
    }

    try {
      const tx = await this.broker.inference.acknowledgeProviderSigner(providerAddress);
      console.log('✅ Provider acknowledged:', providerAddress);
      return {
        success: true,
        transaction: tx,
        providerAddress,
      };
    } catch (error) {
      console.error('❌ Failed to acknowledge provider:', error);
      throw error;
    }
  }

  /**
   * Get service metadata
   * @param {string} providerAddress - Provider address
   * @returns {Promise<Object>} Service metadata (endpoint, model)
   */
  async getServiceMetadata(providerAddress) {
    if (!this.isInitialized) {
      throw new Error('Broker not initialized. Call initialize() first.');
    }

    try {
      const metadata = await this.broker.inference.getServiceMetadata(providerAddress);
      return {
        endpoint: metadata.endpoint,
        model: metadata.model,
      };
    } catch (error) {
      console.error('❌ Failed to get service metadata:', error);
      throw error;
    }
  }

  /**
   * Get request headers for API call
   * @param {string} providerAddress - Provider address
   * @param {string} messages - JSON stringified messages array
   * @returns {Promise<Object>} Request headers
   */
  async getRequestHeaders(providerAddress, messages) {
    if (!this.isInitialized) {
      throw new Error('Broker not initialized. Call initialize() first.');
    }

    try {
      const headers = await this.broker.inference.getRequestHeaders(
        providerAddress,
        messages
      );
      return headers;
    } catch (error) {
      console.error('❌ Failed to get request headers:', error);
      throw error;
    }
  }

  /**
   * Send AI inference request
   * @param {string} providerAddress - Provider address
   * @param {Array} messages - Chat messages array
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} AI response
   */
  async sendInferenceRequest(providerAddress, messages, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Broker not initialized. Call initialize() first.');
    }

    try {
      // Get service metadata
      const { endpoint, model } = await this.getServiceMetadata(providerAddress);
      
      // Get request headers
      const headers = await this.getRequestHeaders(
        providerAddress,
        JSON.stringify(messages)
      );

      // Create OpenAI client with 0G endpoint
      const openai = new OpenAI({
        baseURL: endpoint,
        apiKey: '', // Empty string as per docs
        defaultHeaders: headers,
      });

      // Send request
      const completion = await openai.chat.completions.create(
        {
          messages: messages,
          model: model,
          ...options,
        },
      );

      const response = {
        content: completion.choices[0].message.content,
        chatID: completion.id,
        model: completion.model,
        usage: completion.usage,
        raw: completion,
      };

      // Verify response if enabled
      if (OG_COMPUTE_SERVICE_CONFIG.enableVerification) {
        try {
          const isValid = await this.verifyResponse(
            providerAddress,
            response.content,
            response.chatID
          );
          response.verified = isValid;
        } catch (verifyError) {
          console.warn('⚠️ Response verification failed:', verifyError);
          response.verified = false;
        }
      }

      return response;
    } catch (error) {
      console.error('❌ Failed to send inference request:', error);
      throw error;
    }
  }

  /**
   * Verify AI response
   * @param {string} providerAddress - Provider address
   * @param {string} content - Response content
   * @param {string} chatID - Chat ID from response
   * @returns {Promise<boolean>} Verification result
   */
  async verifyResponse(providerAddress, content, chatID) {
    if (!this.isInitialized) {
      throw new Error('Broker not initialized. Call initialize() first.');
    }

    try {
      const isValid = await this.broker.inference.processResponse(
        providerAddress,
        content,
        chatID
      );
      return isValid;
    } catch (error) {
      console.error('❌ Failed to verify response:', error);
      throw error;
    }
  }

  /**
   * Request refund from account
   * @param {string} serviceType - Service type ('inference' or 'fine-tuning')
   * @returns {Promise<Object>} Transaction result
   */
  async requestRefund(serviceType = 'inference') {
    if (!this.isInitialized) {
      throw new Error('Broker not initialized. Call initialize() first.');
    }

    try {
      const tx = await this.broker.ledger.retrieveFund(serviceType);
      console.log('✅ Refund requested for:', serviceType);
      return {
        success: true,
        transaction: tx,
        serviceType,
      };
    } catch (error) {
      console.error('❌ Failed to request refund:', error);
      throw error;
    }
  }

  /**
   * Check if service is ready to use
   * @returns {boolean} Ready status
   */
  isReady() {
    return this.isInitialized && this.broker !== null;
  }
}

// Export singleton instance
export default new OGComputeNetworkService();

