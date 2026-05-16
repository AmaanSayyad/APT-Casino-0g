"use client";
import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function ConnectWalletButton() {
  return (
    <div className="relative min-w-0 max-w-full shrink [&_[data-rk]]:max-w-full [&_button]:max-w-full [&_button]:min-w-0">
      <ConnectButton 
        chainStatus="icon"
        accountStatus={{
          smallScreen: 'address',
          largeScreen: 'full',
        }}
        showBalance={{
          smallScreen: false,
          largeScreen: false,
        }}
        onConnect={() => {
          console.log('🔗 Wallet connect clicked');
        }}
      />
    </div>
  );
}
