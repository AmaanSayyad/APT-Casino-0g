import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, Menu, MenuItem, Alert } from '@mui/material';
import { FaExchangeAlt } from 'react-icons/fa';

const APP_CHAIN_ID = (process.env.NEXT_PUBLIC_0G_GALILEO_CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN_ID || '0x40da').toLowerCase();

const SUPPORTED_NETWORKS = {
  PRIMARY: {
    chainId: APP_CHAIN_ID,
    chainName: '0G',
    nativeCurrency: {
      name: 'OG',
      symbol: 'OG',
      decimals: 18,
    },
    rpcUrls: [
      process.env.NEXT_PUBLIC_0G_GALILEO_RPC ||
        process.env.NEXT_PUBLIC_0G_GALILEO_RPC_FALLBACK ||
        'https://evmrpc-testnet.0g.ai',
    ],
    blockExplorerUrls: [
      process.env.NEXT_PUBLIC_0G_GALILEO_EXPLORER || 'https://chainscan-galileo.0g.ai',
    ],
  },
};

const NetworkSwitcher = () => {
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const checkCurrentNetwork = async () => {
    if (typeof window === 'undefined') return;
    if (!window.ethereum) {
      setError('Please install MetaMask or another Web3 wallet');
      return;
    }
    try {
      const chainId = (await window.ethereum.request({ method: 'eth_chainId' })).toLowerCase();
      const expected = SUPPORTED_NETWORKS.PRIMARY.chainId.toLowerCase();
      setCurrentNetwork(chainId === expected ? 'PRIMARY' : null);
    } catch (err) {
      console.error('Error checking network:', err);
      setError('Failed to detect network');
    }
  };

  const switchNetwork = async (networkKey) => {
    setLoading(true);
    setError(null);
    handleClose();
    if (!window.ethereum) {
      setError('Please install MetaMask or another Web3 wallet');
      setLoading(false);
      return;
    }
    const network = SUPPORTED_NETWORKS[networkKey];
    try {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: network.chainId }],
        });
        setCurrentNetwork(networkKey);
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [network],
          });
          setCurrentNetwork(networkKey);
        } else {
          throw switchError;
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to switch network');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkCurrentNetwork();
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('chainChanged', () => checkCurrentNetwork());
      window.ethereum.on('connect', () => checkCurrentNetwork());
      return () => {
        window.ethereum.removeListener('chainChanged', checkCurrentNetwork);
        window.ethereum.removeListener('connect', checkCurrentNetwork);
      };
    }
  }, []);

  if (typeof window === 'undefined') return null;

  return (
    <Box sx={{ position: 'relative' }}>
      <Button
        onClick={handleClick}
        disabled={loading}
        startIcon={<FaExchangeAlt />}
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          borderRadius: 2,
          px: 2,
          py: 1,
          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
        }}
      >
        {loading
          ? 'Switching...'
          : currentNetwork
            ? SUPPORTED_NETWORKS[currentNetwork].chainName
            : 'Switch Network'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            mt: 1,
          },
        }}
      >
        {Object.entries(SUPPORTED_NETWORKS).map(([key, network]) => (
          <MenuItem
            key={key}
            onClick={() => switchNetwork(key)}
            selected={currentNetwork === key}
            sx={{
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              '&.Mui-selected': {
                backgroundColor: 'rgba(104, 29, 219, 0.2)',
                '&:hover': { backgroundColor: 'rgba(104, 29, 219, 0.3)' },
              },
            }}
          >
            <Typography variant="body2">{network.chainName}</Typography>
          </MenuItem>
        ))}
      </Menu>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            backgroundColor: 'rgba(211, 47, 47, 0.1)',
            color: 'white',
            '& .MuiAlert-icon': { color: '#ff4444' },
          }}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default NetworkSwitcher;
