

import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProjectPlan, BudgetItem, MaterialQuantity } from '../types';
import { SendIcon, ChevronDownIcon, MaterialsIcon, ShieldCheckIcon, HandshakeIcon } from './Icons';
import { Suggestions } from './Suggestions';

interface BudgetReviewProps {
    project: ProjectPlan;
    onSendMessage: (message: string) => void;
    onFinalize: () => void;
    onUpdateMaterialTotalQuantity: (materialName: string, newTotalQuantity: number) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const Accordion: React.FC<React.PropsWithChildren<{ title: React.ReactNode, defaultOpen?: boolean }>> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
      <div className="bg-brand-container rounded-2xl border border-brand-border overflow-hidden group transition-all duration-300 hover:shadow-soft">
          <motion.header
              className="p-4 sm:px-6 font-bold text-brand-text cursor-pointer flex justify-between items-center bg-brand-dark/50 hover:bg-brand-dark transition-colors"
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
                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden"
                  >
                      <div className="p-4 sm:px-6 border-t border-brand-border/50">{children}</div>
                  </motion.section>
              )}
          </AnimatePresence>
      </div>
    );
};

const BudgetItemDisplay: React.FC<{ item: BudgetItem, allMaterials: MaterialQuantity[] }> = ({ item, allMaterials }) => {
    const relevantMaterials = useMemo(() => 
        allMaterials.filter(m => item.item.toLowerCase().includes(m.material.toLowerCase())),
    [allMaterials, item.item]);

    const totalQuantity = useMemo(() => 
        relevantMaterials.reduce((sum, m) => sum + m.quantity, 0),
    [relevantMaterials]);

    const unit = relevantMaterials.length > 0 ? relevantMaterials[0].unit : '';

    return (
        <li className="flex justify-between items-start py-3 border-b border-brand-border/50 last:border-0 px-3">
            <div>
                <p className="text-sm font-medium text-brand-text-muted">{item.item}</p>
                {totalQuantity > 0 && (
                    <p className="text-xs text-brand-primary/80 font-mono mt-1">
                        ~ {totalQuantity.toFixed(2)} {unit}
                    </p>
                )}
            </div>
            <span className="font-mono text-brand-text font-semibold">{formatCurrency(item.cost)}</span>
        </li>
    );
};

const InteractiveMaterials: React.FC<{
  materials: MaterialQuantity[];
  onUpdate: (materialName: string, newTotalQuantity: number) => void;
}> = ({ materials, onUpdate }) => {
  
  const groupedMaterials = useMemo(() => {
    const initialValue: Record<string, { unit: string; totalQuantity: number }> = {};
    return materials.reduce((acc, curr) => {
        if (!acc[curr.material]) {
            acc[curr.material] = { unit: curr.unit, totalQuantity: 0 };
        }
        acc[curr.material].totalQuantity += curr.quantity;
        return acc;
    }, initialValue);
  }, [materials]);

  const MaterialRow = ({ name, data }: { name: string; data: { unit: string; totalQuantity: number }}) => {
    const [quantity, setQuantity] = useState(data.totalQuantity);
    const debouncedQuantity = useDebounce(quantity, 500);

    // Sync local state with parent props when they change (e.g., from undo/redo)
    useEffect(() => {
        // Only update if the debounced value is not currently trying to be sent,
        // and if the prop value is significantly different.
        if (debouncedQuantity === quantity && data.totalQuantity !== quantity) {
           setQuantity(data.totalQuantity);
        }
    }, [data.totalQuantity, debouncedQuantity, quantity]);

    useEffect(() => {
        // Trigger update only if the debounced value is different from the original prop value
        if (debouncedQuantity !== data.totalQuantity) {
            onUpdate(name, debouncedQuantity);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQuantity, name, onUpdate]);

    const handleStep = (amount: number) => {
        const isBags = data.unit.toLowerCase().includes('bag');
        const newQuantity = Math.max(0, quantity + amount);
        setQuantity(isBags ? Math.round(newQuantity) : newQuantity);
    };

    return (
      <div className="grid grid-cols-2 gap-4 items-center py-2 px-3 hover:bg-brand-dark/50 rounded-md">
        <span className="text-sm font-medium text-brand-text">{name}</span>
        <div className="flex items-center justify-end gap-2">
            <div className="flex items-center gap-1 bg-brand-dark p-1 rounded-lg border border-brand-border/50">
                <motion.button type="button" whileTap={{scale:0.9}} onClick={() => handleStep(-1)} className="w-8 h-8 flex items-center justify-center font-bold text-xl text-brand-text-muted hover:text-brand-dark hover:bg-brand-primary rounded-md transition-colors shadow-sm">-</motion.button>
                <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className="w-20 text-center bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-mono text-brand-text"
                />
                <motion.button type="button" whileTap={{scale:0.9}} onClick={() => handleStep(1)} className="w-8 h-8 flex items-center justify-center font-bold text-xl text-brand-text-muted hover:text-brand-dark hover:bg-brand-primary rounded-md transition-colors shadow-sm">+</motion.button>
            </div>
            <span className="text-xs text-brand-text-muted w-12 text-left">{data.unit}</span>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-2">
      {Object.entries(groupedMaterials).map(([name, data]) => (
        <MaterialRow key={name} name={name} data={data} />
      ))}
    </div>
  );
};

const BargainingPoint: React.FC<{ icon: React.FC<any>, text: string, onClick: () => void }> = ({ icon: Icon, text, onClick }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ y: -2, backgroundColor: '#5C564D' }}
        className="text-left w-full p-3 bg-brand-dark rounded-xl border border-brand-border flex items-center gap-3 text-xs font-bold text-brand-text-muted hover:text-brand-text transition-all"
    >
        <Icon className="w-5 h-5 text-brand-primary flex-shrink-0" />
        <span>{text}</span>
    </motion.button>
);


function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

export const BudgetReview: React.FC<BudgetReviewProps> = memo(({ project, onSendMessage, onFinalize, onUpdateMaterialTotalQuantity }) => {
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const totalCostRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [project.chatHistory]);

    useEffect(() => {
        if(totalCostRef.current) {
            totalCostRef.current.animate([
                { color: '#FFB800', transform: 'scale(1.05)' },
                { color: '', transform: '' }
            ], { duration: 600, easing: 'ease-out' });
        }
    }, [project.totalCost]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    const handleBargainClick = (message: string) => {
        onSendMessage(message);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Budget Breakdown */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-brand-container p-6 sm:p-8 rounded-2xl shadow-soft border border-brand-border">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-brand-text uppercase tracking-tight">Budget Review</h2>
                            <p className="text-brand-text-muted text-sm mt-1">Analyze costs and negotiate directly with your advisor.</p>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-br from-brand-primary to-amber-600 rounded-2xl shadow-glow text-brand-dark grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 relative overflow-hidden">
                         <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-20 rounded-full blur-2xl"></div>
                         <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-brand-dark opacity-10 rounded-full blur-2xl"></div>
                        <div className="relative">
                            <p className="text-xs font-bold text-brand-dark/70 uppercase tracking-widest mb-1">Total Estimated Cost</p>
                            <p ref={totalCostRef} className="text-4xl font-extrabold tracking-tight text-brand-dark">{formatCurrency(project.totalCost)}</p>
                        </div>
                        <div className="md:text-right relative">
                             <p className="text-xs font-bold text-brand-dark/70 uppercase tracking-widest mb-1">Avg. Cost / sq.ft.</p>
                             <p className="text-3xl font-bold tracking-tight opacity-90 text-brand-dark">{formatCurrency(project.costPerSqFt)}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {project.budgetBreakdown.map(section => (
                             <Accordion key={section.sectionName} title={
                                <div className="flex justify-between w-full items-center">
                                    <span className="text-lg font-medium">{section.sectionName}</span>
                                    <span className="font-mono font-bold text-brand-primary">{formatCurrency(section.totalCost)}</span>
                                </div>
                             } defaultOpen={section.sectionName === 'Structure'}>
                                <ul className="space-y-1">
                                    {section.items.map(item => (
                                        <BudgetItemDisplay key={item.item} item={item} allMaterials={project.materialQuantities} />
                                    ))}
                                </ul>
                            </Accordion>
                        ))}
                    </div>
                </div>
                 <Accordion title={
                    <div className="flex items-center gap-2">
                        <MaterialsIcon className="w-5 h-5 text-brand-primary" />
                        <span className="font-bold text-brand-text">Interactive Material Estimator</span>
                    </div>
                 }>
                    <InteractiveMaterials materials={project.materialQuantities} onUpdate={onUpdateMaterialTotalQuantity} />
                 </Accordion>
                <Suggestions project={project} />
            </div>

            {/* Negotiation Hub */}
            <div className="flex flex-col h-[80vh] lg:h-auto bg-brand-container rounded-2xl shadow-soft border border-brand-border overflow-hidden sticky top-24">
                <div className="p-4 bg-brand-container border-b border-brand-border flex items-center gap-3 z-10 shadow-sm">
                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-amber-600 flex items-center justify-center text-brand-dark font-bold shadow-md border-2 border-brand-border">PA</div>
                     <div>
                         <h3 className="font-bold text-brand-text text-sm">Project Advisor</h3>
                         <div className="flex items-center gap-1.5">
                             <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                             <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wide">Online</span>
                         </div>
                     </div>
                </div>
                
                <div className="flex-grow bg-brand-dark p-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-brand-border">
                    <div className="text-center text-xs text-brand-text-muted my-4 opacity-60 font-medium uppercase tracking-wider">Today</div>
                    <AnimatePresence initial={false}>
                    {project.chatHistory.map((msg, index) => {
                         const isUser = msg.sender === 'user';
                         return (
                            <motion.div 
                              key={index} 
                              layout
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed relative ${
                                    isUser 
                                    ? 'bg-brand-primary text-brand-dark rounded-tr-sm' 
                                    : 'bg-brand-container border border-brand-border text-brand-text rounded-tl-sm'
                                }`}>
                                    <p dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}></p>
                                    <p className={`text-[10px] mt-1 text-right opacity-75 font-medium ${isUser ? 'text-brand-dark/70' : 'text-brand-text-muted'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </motion.div>
                        )
                    })}
                    {project.chatHistory[project.chatHistory.length - 1]?.sender === 'user' && (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex justify-start">
                             <div className="bg-brand-container border border-brand-border px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 shadow-sm">
                                 <span className="w-1.5 h-1.5 bg-brand-text-muted rounded-full animate-bounce"></span>
                                 <span className="w-1.f5 h-1.5 bg-brand-text-muted rounded-full animate-bounce delay-100"></span>
                                 <span className="w-1.5 h-1.5 bg-brand-text-muted rounded-full animate-bounce delay-200"></span>
                             </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                    <div ref={chatEndRef} />
                </div>

                <div className="p-4 bg-brand-container border-t border-brand-border space-y-4">
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-brand-text-muted uppercase tracking-wider text-center mb-2">Negotiation Hub</h4>
                        <BargainingPoint 
                            icon={HandshakeIcon} 
                            text="Discuss overall project discount" 
                            onClick={() => handleBargainClick("Could we discuss a possible discount on the overall project cost?")}
                        />
                        <BargainingPoint 
                            icon={MaterialsIcon} 
                            text="Explore material alternatives" 
                            onClick={() => handleBargainClick("I'm interested in exploring some alternative materials to see if we can optimize the cost. What would you recommend?")}
                        />
                        <BargainingPoint 
                            icon={ShieldCheckIcon} 
                            text="Inquire about payment schedule" 
                            onClick={() => handleBargainClick("Is there any flexibility in the payment schedule milestones?")}
                        />
                    </div>
                    <form onSubmit={handleSend} className="flex gap-2 pt-4 border-t border-brand-border/50">
                         <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-grow bg-brand-dark border border-brand-border rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm text-brand-text placeholder-brand-text-muted transition-all" />
                         <motion.button whileTap={{scale:0.9}} type="submit" className="p-2.5 bg-brand-primary text-brand-dark rounded-full hover:bg-brand-primary-hover transition-colors shadow-md"><SendIcon className="w-5 h-5"/></motion.button>
                    </form>

                    <motion.button 
                        onClick={onFinalize} 
                        className="w-full bg-gradient-to-r from-brand-primary to-amber-500 text-brand-dark font-bold py-3.5 px-4 rounded-xl transition-all duration-300 uppercase tracking-widest shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 flex items-center justify-center gap-2 text-sm"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <ShieldCheckIcon className="w-5 h-5" />
                        Finalize Estimate & Proceed
                    </motion.button>
                </div>
            </div>
        </div>
    );
});