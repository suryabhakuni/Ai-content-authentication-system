/**
 * Testnet Helper Utilities
 * Provides information about testnets and faucets
 */

export const TESTNETS = {
  sepolia: {
    name: "Sepolia",
    chainId: "0xaa36a7",
    faucets: [
      {
        name: "Sepolia Faucet",
        url: "https://sepoliafaucet.com/",
        description: "Get free Sepolia ETH for testing",
      },
      {
        name: "Alchemy Sepolia Faucet",
        url: "https://sepoliafaucet.com/",
        description: "Alternative Sepolia faucet",
      },
    ],
  },
  hardhat: {
    name: "Hardhat Local",
    chainId: "0x7a69",
    faucets: [],
  },
};

/**
 * Get recommended faucet for a network
 * @param {string} networkKey - Network key (sepolia, hardhat, etc.)
 * @returns {Object|null} Faucet information or null
 */
export const getRecommendedFaucet = (networkKey) => {
  const network = TESTNETS[networkKey];
  if (!network || !network.faucets || network.faucets.length === 0) {
    return null;
  }
  return network.faucets[0];
};

/**
 * Get all faucets for a network
 * @param {string} networkKey - Network key
 * @returns {Array} Array of faucet objects
 */
export const getAllFaucets = (networkKey) => {
  const network = TESTNETS[networkKey];
  return network?.faucets || [];
};

/**
 * Check if network is a testnet
 * @param {string} networkKey - Network key
 * @returns {boolean} True if testnet
 */
export const isTestnet = (networkKey) => {
  return networkKey !== "mainnet";
};
