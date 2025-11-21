
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProjectPlan } from '../types';
import { getCostSavingSuggestions, getMaterialAlternativeSuggestions, getDesignImprovementSuggestions } from '../services/geminiService';
import { LightbulbIcon, SparklesIcon, SwapIcon, TrendingDownIcon, ChevronDownIcon, ScaleIcon } from './Icons';

type SuggestionType = 'cost' | 'materials' | 'design';

interface SuggestionsProps {
    project: ProjectPlan;
}

const TABS: { id: SuggestionType; label: string; icon: React.FC<React.ComponentProps<'svg'>> }[] = [
    { id: 'cost', label: 'Cost Savings', icon: TrendingDownIcon },
    { id: 'materials', label: 'Material Alternatives', icon: SwapIcon },
    { id: 'design', label: 'Design Improvements', icon: LightbulbIcon },
];

const Accordion: React.FC<React.PropsWithChildren<{ title: React.ReactNode, defaultOpen?: boolean }>> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
      <div className="bg-brand-container rounded-lg border border-brand-border overflow-hidden group">
          <motion.header
              className="p-4 font-bold text-brand-text cursor-pointer flex justify-between items-center bg-brand-dark/50 hover:bg-brand-dark transition-colors"
              onClick={() => setIsOpen(!isOpen)}
          >
              {title}
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                <ChevronDownIcon className="w-5 h-5 text-brand-text-muted transition-transform group-open:rotate-180" />
              </motion.div>
          </motion.header>
          <AnimatePresence initial={false}>
              {isOpen && (
                  <motion.section
                      key="content"
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                          open: { opacity: 1, height: 'auto' },
                          collapsed: { opacity: 0, height: 0 }
                      }}
                      transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden"
                  >
                      <div className="border-t border-brand-border">{children}</div>
                  </motion.section>
              )}
          </AnimatePresence>
      </div>
    );
};

const SuggestionContent: React.FC<{ project: ProjectPlan, type: SuggestionType }> = ({ project, type }) => {
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSuggestion = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            let result;
            if (type === 'cost') {
                result = await getCostSavingSuggestions(project);
            } else if (type === 'materials') {
                result = await getMaterialAlternativeSuggestions(project);
            } else {
                result = await getDesignImprovementSuggestions(project);
            }
            setSuggestion(result);
        } catch (err) {
            setError('Could not load suggestions at this time.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [project, type]);

    useEffect(() => {
        fetchSuggestion();
    }, [fetchSuggestion]);
    
    if (isLoading) {
        return <div className="flex items-center justify-center p-4"><SparklesIcon className="w-5 h-5 animate-pulse text-brand-primary mr-2" /> <span className="text-brand-text-muted">Analyzing your blueprint...</span></div>;
    }

    if (error) {
        return <div className="text-danger text-sm p-4">{error}</div>;
    }
    
    if (!suggestion) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4"
        >
            <div 
                className="prose prose-sm prose-invert max-w-none prose-p:text-brand-text/90 prose-headings:text-brand-primary prose-strong:text-brand-primary prose-strong:font-bold prose-ul:list-disc prose-ul:pl-5 prose-li:text-brand-text-muted prose-li:marker:text-brand-primary"
                dangerouslySetInnerHTML={{ __html: suggestion.replace(/\n/g, '<br />') }}
            />
            
            {type === 'materials' && (
                <div className="mt-6 pt-4 border-t border-brand-border/30">
                    <button 
                        className="w-full flex items-center justify-center gap-2 bg-brand-dark hover:bg-brand-border/50 text-brand-text font-bold py-3 rounded-xl border border-brand-border transition-all"
                        onClick={() => alert("You can discuss comparisons in detail with your dedicated project advisor in the Negotiation Hub above, or access the full Comparison Tool in your Dashboard after booking.")}
                    >
                        <ScaleIcon className="w-4 h-4 text-brand-primary" />
                        <span>Compare with Advisor</span>
                    </button>
                    <p className="text-[10px] text-brand-text-muted text-center mt-2">
                        Full side-by-side comparison tools are available in the Project Dashboard.
                    </p>
                </div>
            )}
        </motion.div>
    );
};

export const Suggestions: React.FC<SuggestionsProps> = ({ project }) => {
    const [activeTab, setActiveTab] = useState<SuggestionType>('cost');
    
    return (
        <Accordion title={
            <div className="flex justify-between w-full items-center">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-brand-primary" />
                    <span className="font-bold text-brand-text">AI-Powered Suggestions</span>
                </div>
                <span className="text-xs font-normal bg-brand-primary/20 text-brand-primary px-2 py-1 rounded-full">INSIGHTS</span>
            </div>
        }>
            <div className="flex flex-col">
                <div className="border-b border-brand-border/50">
                     <nav className="flex space-x-1 sm:space-x-2" aria-label="Tabs">
                        {TABS.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2 px-3 py-2 font-bold transition-colors duration-300 rounded-t-md text-xs sm:text-sm shrink-0 ${isActive ? 'text-brand-primary' : 'text-brand-text-muted hover:bg-brand-border/20 hover:text-brand-text'}`}
                                >
                                    {isActive && <motion.div layoutId="suggestionTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary z-10"></motion.div>}
                                    <tab.icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            )
                        })}
                    </nav>
                </div>
                <div className="min-h-[150px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <SuggestionContent project={project} type={activeTab} />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </Accordion>
    )
};
