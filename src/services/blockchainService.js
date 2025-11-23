import { ethers } from "ethers";

/**
 * BlockchainService - Handles all blockchain interactions for the AI Content Authentication system
 * Manages wallet connections, smart contract interactions, and network operations
 */
class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.currentAccount = null;
    this.currentNetwork = null;
    this.isConnected = false;
    this.mockMode = false;
    this.mockData = {};

    // Network configurations
    this.NETWORKS = {
      hardhat: {
        chainId: "0x7a69", // 31337 in hex
        chainName: "Hardhat Local",
        rpcUrl: "http://127.0.0.1:8545",
        blockExplorer: null,
        isTestnet: true,
      },
      sepolia: {
        chainId: "0xaa36a7", // 11155111 in hex
        chainName: "Sepolia Testnet",
        rpcUrl: "https://rpc.sepolia.org",
        blockExplorer: "https://sepolia.etherscan.io",
        isTestnet: true,
      },
      mainnet: {
        chainId: "0x1", // 1 in hex
        chainName: "Ethereum Mainnet",
        rpcUrl: "https://eth.llamarpc.com",
        blockExplorer: "https://etherscan.io",
        isTestnet: false,
      },
    };
  }

  /**
   * Connect to MetaMask wallet
   * @returns {Promise<Object>} Connection result with address and network
   */
  async connectWallet() {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error(
          "MetaMask is not installed. Please install MetaMask to use blockchain features."
        );
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please unlock MetaMask.");
      }

      // Set up provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.currentAccount = accounts[0];
      this.isConnected = true;

      // Get network information
      const network = await this.provider.getNetwork();
      this.currentNetwork = {
        chainId: "0x" + network.chainId.toString(16),
        name: network.name,
      };

      // Set up event listeners
      this._setupEventListeners();

      return {
        success: true,
        address: this.currentAccount,
        network: this.currentNetwork,
      };
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnectWallet() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.currentAccount = null;
    this.currentNetwork = null;
    this.isConnected = false;

    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeAllListeners("accountsChanged");
      window.ethereum.removeAllListeners("chainChanged");
    }
  }

  /**
   * Get current connection status
   * @returns {Object} Connection status information
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      account: this.currentAccount,
      network: this.currentNetwork,
    };
  }

  /**
   * Set up event listeners for wallet and network changes
   * @private
   */
  _setupEventListeners() {
    if (!window.ethereum) return;

    // Handle account changes
    window.ethereum.on("accountsChanged", async (accounts) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        this.disconnectWallet();
        window.dispatchEvent(new CustomEvent("walletDisconnected"));
      } else {
        // User switched accounts - need to update signer and contract
        this.currentAccount = accounts[0];

        // Re-obtain the signer for the new account
        try {
          this.signer = await this.provider.getSigner();

          // If contract was initialized, re-initialize with new signer
          if (this.contract) {
            const contractAddress =
              this.contract.target || this.contract.address;
            const contractInterface = this.contract.interface;
            this.contract = new ethers.Contract(
              contractAddress,
              contractInterface,
              this.signer
            );
            console.log(
              "✅ Contract re-initialized with new account:",
              accounts[0]
            );
          }
        } catch (error) {
          console.error("Error updating signer after account change:", error);
        }

        window.dispatchEvent(
          new CustomEvent("accountChanged", {
            detail: { account: accounts[0] },
          })
        );
      }
    });

    // Handle network changes
    window.ethereum.on("chainChanged", (chainId) => {
      // Reload the page on network change (recommended by MetaMask)
      window.location.reload();
    });
  }

  /**
   * Get network information for a given chain ID
   * @param {string} chainId - Chain ID in hex format
   * @returns {Object|null} Network configuration or null if not found
   */
  getNetworkInfo(chainId) {
    for (const [key, network] of Object.entries(this.NETWORKS)) {
      if (network.chainId === chainId) {
        return { ...network, key };
      }
    }
    return null;
  }

  /**
   * Check if current network is a testnet
   * @returns {boolean} True if on testnet, false otherwise
   */
  isTestnet() {
    if (!this.currentNetwork) return false;
    const networkInfo = this.getNetworkInfo(this.currentNetwork.chainId);
    return networkInfo ? networkInfo.isTestnet : false;
  }

  /**
   * Switch to a different network
   * @param {string} networkKey - Network key (hardhat, sepolia, mainnet)
   * @returns {Promise<boolean>} True if switch was successful
   */
  async switchNetwork(networkKey) {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    const network = this.NETWORKS[networkKey];
    if (!network) {
      throw new Error(`Unknown network: ${networkKey}`);
    }

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      });
      return true;
    } catch (error) {
      // If network doesn't exist in MetaMask, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: network.chainId,
                chainName: network.chainName,
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: network.blockExplorer
                  ? [network.blockExplorer]
                  : null,
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Error adding network:", addError);
          throw addError;
        }
      }
      console.error("Error switching network:", error);
      throw error;
    }
  }

  /**
   * Initialize contract instance with ABI and address
   * @param {Array} contractABI - Contract ABI
   * @param {string} contractAddress - Deployed contract address
   */
  initializeContract(contractABI, contractAddress) {
    if (!this.signer) {
      throw new Error("Wallet not connected. Please connect wallet first.");
    }

    this.contract = new ethers.Contract(
      contractAddress,
      contractABI,
      this.signer
    );
  }

  /**
   * Store a verification record on the blockchain
   * @param {string} contentHash - SHA-256 hash of the content
   * @param {boolean} isAuthentic - Whether content is authentic
   * @param {number} confidence - Confidence score (0-100)
   * @returns {Promise<Object>} Transaction result
   */
  async storeVerificationRecord(contentHash, isAuthentic, confidence) {
    if (!this.contract) {
      throw new Error(
        "Contract not initialized. Please initialize contract first."
      );
    }

    try {
      // Content hash is already in hex format (0x...), just ensure it's bytes32
      // If it's a full SHA-256 hash (64 hex chars), it's already 32 bytes
      const hashBytes32 = contentHash.startsWith("0x")
        ? contentHash
        : "0x" + contentHash;

      console.log("📝 Storing record on blockchain...");
      console.log("   Hash:", hashBytes32);
      console.log("   Authentic:", isAuthentic);
      console.log("   Confidence:", confidence);

      // Send transaction
      const tx = await this.contract.storeRecord(
        hashBytes32,
        isAuthentic,
        Math.round(confidence)
      );

      console.log("⏳ Transaction sent, waiting for confirmation...");
      console.log("   TX Hash:", tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      console.log("✅ Transaction confirmed!");
      console.log("   Block:", receipt.blockNumber);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        from: receipt.from,
        contentHash: hashBytes32, // Return the hash for easy verification
      };
    } catch (error) {
      console.error("Error storing verification record:", error);
      throw error;
    }
  }

  /**
   * Get a verification record from the blockchain
   * @param {string} contentHash - SHA-256 hash of the content
   * @returns {Promise<Object|null>} Verification record or null if not found
   */
  async getVerificationRecord(contentHash) {
    if (!this.contract) {
      throw new Error(
        "Contract not initialized. Please initialize contract first."
      );
    }

    try {
      // Content hash is already in hex format (0x...), just ensure it's bytes32
      const hashBytes32 = contentHash.startsWith("0x")
        ? contentHash
        : "0x" + contentHash;

      // Call contract method - returns tuple: [contentHash, isAuthentic, confidence, timestamp, verifier, exists]
      const result = await this.contract.getRecord(hashBytes32);

      console.log("📋 Raw contract result:", result);

      // Check if record exists (last element in the tuple)
      const exists = result[5] || result.exists;

      if (!exists) {
        console.log("❌ Record does not exist for hash:", hashBytes32);
        return null;
      }

      // Parse the tuple result
      const record = {
        contentHash: result[0] || result.contentHash,
        isAuthentic: result[1] !== undefined ? result[1] : result.isAuthentic,
        confidence: Number(
          result[2] !== undefined ? result[2] : result.confidence
        ),
        timestamp: Number(
          result[3] !== undefined ? result[3] : result.timestamp
        ),
        verifier: result[4] || result.verifier,
        exists: true,
      };

      console.log("✅ Record found:", record);
      return record;
    } catch (error) {
      console.error("Error getting verification record:", error);
      throw error;
    }
  }

  /**
   * Get all verification records for a specific address
   * @param {string} address - Wallet address
   * @returns {Promise<Array>} Array of content hashes
   */
  async getRecordsByAddress(address) {
    if (!this.contract) {
      throw new Error(
        "Contract not initialized. Please initialize contract first."
      );
    }

    try {
      const records = await this.contract.getUserRecords(address);
      return records.map((hash) => hash.toString());
    } catch (error) {
      console.error("Error getting records by address:", error);
      throw error;
    }
  }

  /**
   * Estimate gas cost for storing a verification record
   * @param {string} contentHash - SHA-256 hash of the content
   * @param {boolean} isAuthentic - Whether content is authentic
   * @param {number} confidence - Confidence score (0-100)
   * @returns {Promise<Object>} Gas estimation details
   */
  async estimateGasCost(contentHash, isAuthentic, confidence) {
    if (!this.contract) {
      throw new Error(
        "Contract not initialized. Please initialize contract first."
      );
    }

    try {
      // Content hash is already in hex format (0x...), just ensure it's bytes32
      const hashBytes32 = contentHash.startsWith("0x")
        ? contentHash
        : "0x" + contentHash;

      // Estimate gas
      const gasEstimate = await this.contract.storeRecord.estimateGas(
        hashBytes32,
        isAuthentic,
        Math.round(confidence)
      );

      // Get current gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;

      // Calculate total cost
      const totalCost = gasEstimate * gasPrice;

      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: ethers.formatUnits(gasPrice, "gwei"),
        totalCostWei: totalCost.toString(),
        totalCostEth: ethers.formatEther(totalCost),
      };
    } catch (error) {
      console.error("Error estimating gas cost:", error);
      throw error;
    }
  }

  /**
   * Get detailed current network information
   * @returns {Promise<Object>} Network details
   */
  async getCurrentNetworkInfo() {
    if (!this.provider) {
      throw new Error("Provider not initialized. Please connect wallet first.");
    }

    try {
      const network = await this.provider.getNetwork();
      const chainIdHex = "0x" + network.chainId.toString(16);
      const networkConfig = this.getNetworkInfo(chainIdHex);

      return {
        chainId: chainIdHex,
        chainIdDecimal: Number(network.chainId),
        name: network.name,
        isTestnet: networkConfig ? networkConfig.isTestnet : false,
        blockExplorer: networkConfig ? networkConfig.blockExplorer : null,
      };
    } catch (error) {
      console.error("Error getting network info:", error);
      throw error;
    }
  }

  /**
   * Enable mock mode for testing without blockchain
   * @param {Object} options - Mock configuration options
   */
  enableMockMode(options = {}) {
    this.mockMode = true;
    this.mockData = {
      account: options.account || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      network: options.network || {
        chainId: "0xaa36a7",
        name: "sepolia",
      },
      records: options.records || {},
      ...options,
    };

    // Simulate connection
    this.isConnected = true;
    this.currentAccount = this.mockData.account;
    this.currentNetwork = this.mockData.network;

    // Dispatch event to notify components
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("accountChanged", {
          detail: { account: this.mockData.account },
        })
      );
    }

    // Create a mock contract for testing
    const mockStoreRecord = async () => {
      await this._mockDelay(2000);
      return {
        wait: async () => ({
          hash: "0x" + Math.random().toString(16).substr(2, 64),
          blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
          gasUsed: "21000",
          from: this.mockData.account,
        }),
      };
    };

    // Add estimateGas as a property of the function
    mockStoreRecord.estimateGas = async () => {
      await this._mockDelay(500);
      return BigInt(21000); // Mock gas estimate
    };

    this.contract = {
      storeRecord: mockStoreRecord,
      getRecord: async () => {
        await this._mockDelay(1000);
        return {
          exists: false,
          contentHash:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          isAuthentic: false,
          confidence: 0,
          timestamp: 0,
          verifier: "0x0000000000000000000000000000000000000000",
        };
      },
      getUserRecords: async () => {
        await this._mockDelay(1000);
        return [];
      },
    };

    // Create a mock provider for gas price
    this.provider = {
      getFeeData: async () => ({
        gasPrice: BigInt(20000000000), // 20 gwei
      }),
    };

    console.log("✅ Mock mode enabled - Wallet:", this.mockData.account);
    console.log("📡 Network:", this.mockData.network.name);
    console.log("🔧 Mock contract initialized for testing");
  }

  /**
   * Disable mock mode
   */
  disableMockMode() {
    this.mockMode = false;
    this.mockData = {};
    this.isConnected = false;
    this.currentAccount = null;
    this.currentNetwork = null;
    console.log("Mock mode disabled");
  }

  /**
   * Generate mock transaction response
   * @private
   */
  _generateMockTransaction() {
    return {
      success: true,
      transactionHash: "0x" + Math.random().toString(16).substr(2, 64),
      blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
      gasUsed: "21000",
      from: this.mockData.account,
    };
  }

  /**
   * Simulate delay for mock operations
   * @private
   */
  _mockDelay(ms = 1000) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get mock data for testing
   * @returns {Object} Mock data
   */
  getMockData() {
    return {
      ...this.mockData,
      isMockMode: this.mockMode,
    };
  }
}

// Export singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;
