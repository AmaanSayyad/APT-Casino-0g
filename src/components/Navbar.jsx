"use client";

import React, { useState } from 'react';
import { AppBar, Toolbar, Container, Box, Button, Typography } from '@mui/material';
import { Zap, Bot } from 'lucide-react';
import NetworkSwitcher from './NetworkSwitcher';
import AiModal from './AiModal';
import { useAccount } from 'wagmi';

const Navbar = () => {
  const { address, isConnected } = useAccount();
  const [showVRFModal] = useState(false); // Placeholder retained to avoid layout changes
  const [showAiModal, setShowAiModal] = useState(false);

  return (
    <>
      <AppBar position="fixed" sx={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" component="div" sx={{ color: 'white', fontWeight: 'bold' }}>
                APT Casino
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* AI Assistant Button */}
              <Button
                variant="outlined"
                onClick={() => setShowAiModal(true)}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
                startIcon={<Bot size={18} />}
              >
                AI Assistant
              </Button>
              {/* VRF button temporarily disabled until modal component is available */}
              <NetworkSwitcher />
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* AI Modal */}
      <AiModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />

      {/* VRF Modal placeholder removed */}
    </>
  );
};

export default Navbar; 