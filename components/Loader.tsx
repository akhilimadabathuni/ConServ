

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const loadingTexts = [
    "Analyzing plot dimensions...",
    "Calculating steel requirements...",
    "Estimating concrete mixture...",
    "Consulting local material vendors...",
    "Drafting initial schematics...",
    "Generating cost-benefit analysis..."
];

const AnimatedLogo = () => (
    <motion.svg 
        width="200" 
        height="200" 
        viewBox="0 0 200 200"
        initial="hidden"
        animate="visible"
    >
        {/* House */}
        <motion.path
            d="M 50 150 L 50 90 L 100 40 L 150 90 L 150 150 L 50 150 Z"
            fill="none"
            stroke="#FFB800"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: { pathLength: 1, opacity: 1, transition: { duration: 1.5, ease: "easeInOut" } }
            }}
        />
        {/* Crane */}
        <motion.path
            d="M 120 150 L 120 60 L 180 60 L 180 80"
            fill="none"
            stroke="#A8A29E"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
             variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: { pathLength: 1, opacity: 1, transition: { delay: 0.5, duration: 1.5, ease: "easeInOut" } }
            }}
        />
    </motion.svg>
);


export const Loader: React.FC = () => {
    const [text, setText] = useState(loadingTexts[0]);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setText(prevText => {
                const currentIndex = loadingTexts.indexOf(prevText);
                const nextIndex = (currentIndex + 1) % loadingTexts.length;
                return loadingTexts[nextIndex];
            });
        }, 2000); 
        
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if(prev >= 100) return 100;
                const increment = prev > 80 ? Math.random() * 1.5 : Math.random() * 4;
                return Math.min(100, prev + increment);
            })
        }, 300);

        return () => {
            clearInterval(intervalId);
            clearInterval(progressInterval);
        }
    }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full relative p-8">
      
      <motion.div 
        className="relative mb-12"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "backOut" }}
      >
          <AnimatedLogo />
          <motion.div 
             className="absolute inset-0 bg-brand-primary/20 blur-3xl rounded-full -z-10"
             animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
      </motion.div>
      
      <div className="text-center space-y-1 mb-12">
          <motion.h2 
            className="text-3xl sm:text-4xl font-extrabold text-brand-text uppercase tracking-widest"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Constructing
          </motion.h2>
           <motion.h2 
            className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-amber-500 uppercase tracking-widest"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Your Estimate
          </motion.h2>
      </div>
      
      <div className="w-full max-w-lg">
          <div className="h-3 bg-brand-dark rounded-full overflow-hidden border border-brand-border shadow-inner relative">
              <motion.div 
                className="h-full bg-gradient-to-r from-brand-primary to-amber-500 relative overflow-hidden origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: Math.min(100, progress) / 100 }}
                transition={{ ease: "linear" }}
              >
                  <motion.div
                    className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
              </motion.div>
          </div>
          <div className="h-8 mt-5 relative flex justify-center items-center">
             <AnimatePresence mode="wait">
                <motion.p 
                    key={text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-brand-text-muted text-sm font-bold tracking-widest uppercase absolute"
                >
                    {text}
                </motion.p>
             </AnimatePresence>
          </div>
      </div>
    </div>
  );
};