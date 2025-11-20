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

const BlueprintAnimation = () => (
    <motion.svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        initial="hidden"
        animate="visible"
        className="relative"
    >
        {/* Grid */}
        <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#5C564D" strokeWidth="0.5"/>
            </pattern>
        </defs>
        <motion.rect 
            width="200" 
            height="200" 
            fill="url(#grid)" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 0.3 }} 
            transition={{ duration: 1 }}
        />

        {/* House Schematic */}
        <motion.path
            d="M 40 160 V 90 L 100 30 L 160 90 V 160 H 40 Z M 80 160 V 120 H 120 V 160 M 90 90 H 110 V 70 H 90 Z"
            fill="none"
            stroke="url(#gold-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: {
                    pathLength: 1,
                    opacity: 1,
                    transition: { duration: 2, ease: "easeInOut" }
                }
            }}
        />
        <defs>
            <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD04D" />
                <stop offset="100%" stopColor="#FFB800" />
            </linearGradient>
        </defs>
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
          <BlueprintAnimation />
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
