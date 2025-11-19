
import React from 'react';
import { motion } from 'framer-motion';
import { ConserveLogo } from './Icons';

interface HeaderProps { 
    onLogoClick: () => void; 
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <motion.header
      initial={{ y: -100 }} animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="bg-brand-dark/80 backdrop-blur-xl sticky top-0 z-50 border-b border-brand-border shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
        <button onClick={onLogoClick} className="flex items-center gap-4 group" aria-label="ConServ home">
           <ConserveLogo className="h-12 sm:h-14 w-auto transition-transform duration-300 group-hover:scale-105 drop-shadow-sm" />
        </button>
      </div>
    </motion.header>
  );
};
