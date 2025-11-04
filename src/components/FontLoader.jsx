'use client';

import { useEffect } from 'react';

export default function FontLoader() {
  useEffect(() => {
    // Check if fonts are loaded
    if ('fonts' in document) {
      Promise.all([
        document.fonts.load('1rem ClashDisplay-Variable'),
        document.fonts.load('1rem PlusJakartaSans-Variable'),
      ]).then(() => {
        console.log('Custom fonts loaded successfully');
        document.documentElement.classList.add('fonts-loaded');
      }).catch((error) => {
        console.error('Error loading fonts:', error);
        // Add fallback class if fonts fail to load
        document.documentElement.classList.add('fonts-fallback');
      });
    }
  }, []);

  return null;
}
