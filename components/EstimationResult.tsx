import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import type { ProjectPlan, SupportTicket, SnagListItem, WeeklyUpdate, TimelineEvent, BudgetSection, MaterialQuantity, BudgetItem, PaymentMilestone } from '../types';
import { BudgetIcon, ProgressIcon, SupportIcon, HandoverIcon, SendIcon, PlusCircleIcon, BuildingIcon, MaterialsIcon, ChevronDownIcon, SparklesIcon, WarningIcon, ZoomInIcon, ZoomOutIcon, RefreshIcon, MoveIcon, Rotate3dIcon, UndoIcon, RedoIcon, CheckboxIcon, CheckboxCheckedIcon, SearchIcon, ScaleIcon, XIcon, PaymentsIcon, CheckCircleIcon, CreditCardIcon } from './Icons';
import { analyzeSupportTicket } from '../services/geminiService';

type DashboardTab = 'Progress' | 'Budget' | 'Support' | 'Handover' | '3D View' | 'Materials' | 'Payments';

interface ProjectDashboardProps {
  project: ProjectPlan;
  onReset: () => void;
  onRaiseTicket: (ticket: Omit<SupportTicket, 'id' | 'assignedTo' | 'expectedResolution' | 'activity'> & { description: string }) => void;
  onAddUserNote: (updateDate: string, note: string) => void;
  onUpdateMaterialFloorEntry: (materialName: string, floor: number, newQuantity?: number, newUnitPrice?: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onBulkUpdateMaterials: (selectedMaterials: string[], action: 'increase' | 'decrease', type: 'quantity' | 'price', percentage: number) => void;
  onMarkMilestonePaid: (milestoneName: string) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const StatusBadge: React.FC<{ status: SupportTicket['status'] | TimelineEvent['status'] | SnagListItem['status'] }> = ({ status }) => {
  const baseClasses = "px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border backdrop-blur-sm";
  let colorClasses = 'bg-gray-100/10 text-gray-400 border-gray-600';
  switch (status) {
    case 'Completed': case 'Resolved': case 'Verified':
      colorClasses = 'bg-success/10 text-success border-success/20'; break;
    case 'In Progress': case 'Assigned':
      colorClasses = 'bg-info/10 text-info border-info/20'; break;
    case 'Pending': case 'Open': case 'Reported':
      colorClasses = 'bg-warning/10 text-warning border-warning/20'; break; 
    case 'Delayed':
      colorClasses = 'bg-danger/10 text-danger border-danger/20'; break;
    case 'Fixed': 
      colorClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/20'; break;
  }
  return <span className={`${baseClasses} ${colorClasses}`}>{status}</span>;
};

// Controlled Accordion Component
const Accordion: React.FC<React.PropsWithChildren<{ title: React.ReactNode, isOpen: boolean, onToggle: () => void, className?: string }>> = ({ title, children, isOpen, onToggle, className = '' }) => {
    return (
        <div className={`bg-brand-container/60 backdrop-blur-sm rounded-xl border transition-all duration-300 overflow-hidden ${isOpen ? 'border-brand-primary/50 shadow-md bg-brand-container/90' : 'border-brand-border hover:border-brand-border/80 hover:bg-brand-container/80'} ${className}`}>
            <motion.header
                className="p-4 font-bold text-brand-text cursor-pointer flex justify-between items-center"
                onClick={onToggle}
            >
                {title}
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                  <ChevronDownIcon className={`w-5 h-5 transition-colors ${isOpen ? 'text-brand-primary' : 'text-brand-text-muted'}`} />
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
                        <div className="p-4 border-t border-brand-border/50 bg-brand-dark/20">{children}</div>
                    </motion.section>
                )}
            </AnimatePresence>
        </div>
    );
};

const UserNoteTaker: React.FC<{ initialNote?: string, onSave: (note: string) => void }> = ({ initialNote = '', onSave }) => {
    const [note, setNote] = useState(initialNote);
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = () => {
        onSave(note);
        setIsEditing(false);
    };

    if (!isEditing && !initialNote) {
        return (
            <div className="text-center mt-3">
                <button onClick={() => setIsEditing(true)} className="text-xs text-brand-primary font-bold hover:underline">
                    + Add Personal Note
                </button>
            </div>
        )
    }
    
    if (isEditing) {
        return (
            <div className="mt-3 border-t border-brand-border pt-3">
                <textarea 
                    value={note} 
                    onChange={e => setNote(e.target.value)}
                    rows={3} 
                    className="w-full text-sm bg-brand-dark border border-brand-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-shadow backdrop-blur-sm text-brand-text"
                    placeholder="Type your observations or questions..."
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setIsEditing(false)} className="text-xs text-brand-text-muted hover:text-brand-text">Cancel</button>
                    <button onClick={handleSave} className="text-xs bg-brand-primary text-brand-dark font-bold px-3 py-1.5 rounded-lg shadow-sm">Save Note</button>
                </div>
            </div>
        )
    }
    
    return (
        <div className="mt-3 border-t border-brand-border pt-3 bg-brand-dark/30 p-3 rounded-lg">
            <p className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1">My Notes</p>
            <p className="text-sm text-brand-text whitespace-pre-wrap italic">{initialNote}</p>
            <button onClick={() => setIsEditing(true)} className="text-xs text-brand-primary hover:underline mt-2 font-medium">Edit</button>
        </div>
    )
};

const ProgressView: React.FC<{ timeline: TimelineEvent[], updates: WeeklyUpdate[], onAddUserNote: (date: string, note: string) => void }> = memo(({ timeline, updates, onAddUserNote }) => {
    const timelineContainerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1,
            }
        }
    };

    const timelineItemVariants: Variants = {
        hidden: { opacity: 0, x: -30 },
        visible: { 
            opacity: 1, 
            x: 0,
            transition: { type: "spring", stiffness: 50, damping: 20 }
        },
    };
    
    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h3 className="text-lg font-bold text-brand-text mb-6 uppercase tracking-wide flex items-center gap-2"><ProgressIcon className="w-5 h-5 text-brand-primary"/> Project Timeline</h3>
                <motion.div 
                    variants={timelineContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative pl-8 border-l-2 border-brand-border ml-3">
                    {timeline.map((event, index) => (
                        <motion.div variants={timelineItemVariants} key={event.stage} className="relative mb-8 last:mb-0 group">
                             <motion.div 
                               initial={{ scale: 0 }}
                               animate={{ scale: 1 }}
                               transition={{ delay: 0.2 + (index * 0.05) }}
                               className={`absolute -left-[39px] top-1 w-5 h-5 rounded-full ${event.status === 'Completed' ? 'bg-success' : event.status === 'In Progress' ? 'bg-info' : 'bg-brand-dark border-2 border-brand-text-muted'} ring-4 ring-brand-container z-10 shadow-md`}></motion.div>
                            <div className="bg-brand-container/70 backdrop-blur-sm p-4 rounded-xl border border-brand-border group-hover:border-brand-primary/30 group-hover:shadow-md transition-all duration-300">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-bold text-brand-text text-lg">{event.stage}</p>
                                    <StatusBadge status={event.status} />
                                </div>
                                <p className="text-xs font-mono text-brand-text-muted flex items-center gap-1">
                                    <span className="text-brand-primary font-bold">Target:</span> {event.expectedDate}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
            <div>
                <h3 className="text-lg font-bold text-brand-text mb-6 uppercase tracking-wide flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-brand-primary"/> Site Updates</h3>
                {updates.length > 0 ? (
                    <motion.div
                        variants={timelineContainerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                        {updates.map(update => (
                            <motion.div variants={timelineItemVariants} key={update.date} className="p-5 bg-brand-container/70 backdrop-blur-sm rounded-xl border border-brand-border shadow-soft hover:bg-brand-container/90 transition-colors">
                                <div className="flex justify-between items-center mb-3 border-b border-brand-border/50 pb-2">
                                    <p className="font-bold text-brand-primary text-sm">{new Date(update.date).toDateString()}</p>
                                    <span className="text-[10px] font-bold bg-brand-dark/50 px-2 py-1 rounded text-brand-text-muted uppercase tracking-wider">Engineer Log</span>
                                </div>
                                <p className="text-sm text-brand-text leading-relaxed mb-4">{update.engineerNotes}</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {update.photos.map((p, i) => <motion.a whileHover={{scale: 1.05}} key={i} href={p} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-brand-border shadow-sm"><img src={p} className="aspect-square object-cover hover:opacity-90 transition-opacity" alt="update"/></motion.a>)}
                                </div>
                                <UserNoteTaker initialNote={update.userNotes} onSave={(note) => onAddUserNote(update.date, note)} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8 bg-brand-container/50 rounded-xl border border-brand-border border-dashed">
                        <ProgressIcon className="w-12 h-12 text-brand-text-muted mb-4" />
                        <h4 className="font-bold text-brand-text">No Updates Yet</h4>
                        <p className="text-sm text-brand-text-muted mt-2 max-w-xs">Your first weekly update will appear here once groundwork begins.</p>
                    </div>
                )}
            </div>
        </div>
    );
});

const BudgetItemRow: React.FC<{ item: BudgetItem, onClick: () => void, isOpen: boolean }> = memo(({ item, onClick, isOpen }) => {
    const hasFloorBreakdown = item.floorBreakdown && item.floorBreakdown.length > 0;
    
    // Calculate chart data for bar chart
    const barChartData = useMemo(() => {
        if (!hasFloorBreakdown) return [];
        const maxCost = Math.max(...item.floorBreakdown.map(fb => fb.cost));
        return item.floorBreakdown.map(fb => ({
            ...fb,
            width: maxCost > 0 ? (fb.cost / maxCost) * 100 : 0
        }));
    }, [item.floorBreakdown, hasFloorBreakdown]);

    return (
        <div className="border-b border-brand-border/30 last:border-0">
            <div
                className={`flex justify-between items-center py-3 px-3 transition-colors ${hasFloorBreakdown ? 'cursor-pointer hover:bg-brand-dark/30' : ''}`}
                onClick={onClick}
            >
                <span className="text-sm text-brand-text-muted flex items-center gap-2">
                    {item.item}
                    {hasFloorBreakdown && (
                        <motion.div animate={{ rotate: isOpen ? 90 : 0 }}>
                            <ChevronDownIcon className="w-3 h-3 text-brand-text-muted/50 transform -rotate-90" />
                        </motion.div>
                    )}
                </span>
                <span className="font-mono text-brand-text text-sm">{formatCurrency(item.cost)}</span>
            </div>
            <AnimatePresence>
                {isOpen && hasFloorBreakdown && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pl-6 pr-2 py-4 bg-brand-dark/20 border-l-2 border-brand-primary/50">
                            <h4 className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-3">Cost per Floor</h4>
                            <ul className="space-y-3">
                                {barChartData.map((floor, idx) => (
                                    <li key={idx}>
                                        <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="text-brand-text-muted/80">{floor.floor}</span>
                                            <span className="font-mono text-brand-text/90">{formatCurrency(floor.cost)}</span>
                                        </div>
                                        <div className="h-2 bg-brand-border/30 rounded-full">
                                            <motion.div
                                                className="h-2 bg-brand-primary rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${floor.width}%` }}
                                                transition={{ duration: 0.5, ease: 'easeOut', delay: idx * 0.05 }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});


const BudgetView: React.FC<{ budgetBreakdown: BudgetSection[], totalCost: number }> = memo(({ budgetBreakdown, totalCost }) => {
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [openBudgetItems, setOpenBudgetItems] = useState<Record<string, boolean>>({});
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);
    const accordionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const handleSectionSelect = (sectionName: string) => {
        const newActiveSection = activeSection === sectionName ? null : sectionName;
        setActiveSection(newActiveSection);

        if (newActiveSection && accordionRefs.current[newActiveSection]) {
            setTimeout(() => {
                accordionRefs.current[newActiveSection]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }, 300); // Allow time for accordion animation
        }
    };
    
    const toggleBudgetItem = (sectionName: string, itemName: string) => {
        const key = `${sectionName}-${itemName}`;
        setOpenBudgetItems(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const chartData = useMemo(() => {
        let currentAngle = 0;
        return budgetBreakdown.map((section, index) => {
            const percentage = (section.totalCost / totalCost) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            currentAngle += angle;
            
            const x1 = 50 + 50 * Math.cos(Math.PI * startAngle / 180);
            const y1 = 50 + 50 * Math.sin(Math.PI * startAngle / 180);
            const x2 = 50 + 50 * Math.cos(Math.PI * (startAngle + angle) / 180);
            const y2 = 50 + 50 * Math.sin(Math.PI * (startAngle + angle) / 180);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
            
            const hue = 40 + (index * 5);
            const lightness = 50 - (index * 5);
            const color = `hsl(${hue}, 100%, ${lightness}%)`;

            return { ...section, pathData, color, percentage };
        });
    }, [budgetBreakdown, totalCost]);

    const callbackRef = useCallback((node: HTMLDivElement | null) => {
      // This callback ref is used to fix a TypeScript error.
      // It ensures the function passed to the ref prop returns void.
      if (node) {
        // You can perform actions with the node here if needed
      }
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="bg-brand-container/80 backdrop-blur-sm rounded-2xl p-6 border border-brand-border shadow-soft flex flex-col items-center md:sticky top-28" ref={callbackRef}>
                <h3 className="text-lg font-bold text-brand-text mb-4 uppercase tracking-wide">Cost Distribution</h3>
                <div className="relative w-64 h-64">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {chartData.map((slice) => (
                            <motion.path
                                key={slice.sectionName}
                                d={slice.pathData}
                                fill={slice.color}
                                stroke="#2D2A26"
                                strokeWidth="1"
                                onClick={() => handleSectionSelect(slice.sectionName)}
                                onMouseEnter={() => setHoveredSection(slice.sectionName)}
                                onMouseLeave={() => setHoveredSection(null)}
                                animate={{
                                    scale: activeSection === slice.sectionName || hoveredSection === slice.sectionName ? 1.05 : 1,
                                    transformOrigin: '50% 50%',
                                }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className="cursor-pointer opacity-90 hover:opacity-100"
                            />
                        ))}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center bg-brand-dark/80 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center border border-brand-border">
                            <span className="text-[10px] font-bold text-brand-text-muted">Total<br/>Budget</span>
                        </div>
                    </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2 w-full">
                    {chartData.map((slice) => (
                        <div 
                            key={slice.sectionName} 
                            className={`flex items-center gap-2 text-xs p-2 rounded-lg cursor-pointer transition-all duration-200 ${activeSection === slice.sectionName ? 'bg-brand-dark shadow-inner' : 'hover:bg-brand-dark/50'} ${hoveredSection === slice.sectionName && activeSection !== slice.sectionName ? 'bg-brand-dark/30' : ''}`}
                            onClick={() => handleSectionSelect(slice.sectionName)}
                            onMouseEnter={() => setHoveredSection(slice.sectionName)}
                            onMouseLeave={() => setHoveredSection(null)}
                        >
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }}></div>
                            <span className="text-brand-text flex-grow">{slice.sectionName}</span>
                            <span className="font-mono text-brand-text-muted">{Math.round(slice.percentage)}%</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {budgetBreakdown.map((section) => (
                    <div 
                        key={section.sectionName}
                        ref={(el) => { accordionRefs.current[section.sectionName] = el; }}
                        className={`rounded-xl transition-all duration-300 ${hoveredSection === section.sectionName && activeSection !== section.sectionName ? 'ring-2 ring-brand-primary/50' : ''} ${activeSection === section.sectionName ? 'ring-2 ring-brand-primary' : ''}`}
                    >
                        <Accordion 
                            title={
                                <div className="flex justify-between w-full items-center">
                                    <span className="text-brand-text">{section.sectionName}</span>
                                    <span className="font-mono text-brand-primary font-bold">{formatCurrency(section.totalCost)}</span>
                                </div>
                            }
                            isOpen={activeSection === section.sectionName}
                            onToggle={() => handleSectionSelect(section.sectionName)}
                        >
                             <ul className="space-y-1">
                                {section.items.map((item, idx) => (
                                    <BudgetItemRow key={idx} item={item} isOpen={!!openBudgetItems[`${section.sectionName}-${item.item}`]} onClick={() => toggleBudgetItem(section.sectionName, item.item)} />
                                ))}
                            </ul>
                        </Accordion>
                    </div>
                ))}
            </div>
        </div>
    );
});

const SupportView: React.FC<{ tickets: SupportTicket[], onRaiseTicket: (ticket: any) => void }> = memo(({ tickets, onRaiseTicket }) => {
    const [newTicket, setNewTicket] = useState({ description: '' });
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newTicket.description.trim()) return;

        analyzeSupportTicket(newTicket.description).then(analysis => {
            onRaiseTicket({ ...analysis, description: newTicket.description, status: 'Open' });
            setNewTicket({ description: '' });
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1">
                 <div className="bg-brand-container p-6 rounded-2xl border border-brand-border shadow-soft sticky top-24">
                     <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2"><PlusCircleIcon className="w-5 h-5 text-brand-primary"/> New Request</h3>
                     <form onSubmit={handleSubmit} className="space-y-4">
                         <div>
                             <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wide mb-1 block">Issue Description</label>
                             <textarea 
                                value={newTicket.description}
                                onChange={e => setNewTicket({description: e.target.value})}
                                className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow min-h-[120px]"
                                placeholder="Describe the issue or request in detail..."
                             />
                         </div>
                         <button type="submit" className="w-full bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary-hover transition-colors shadow-md">Submit Ticket</button>
                     </form>
                 </div>
             </div>
             <div className="lg:col-span-2 space-y-4">
                 {tickets.length > 0 ? (
                     tickets.map(ticket => (
                         <div key={ticket.id} className="bg-brand-container/80 backdrop-blur-sm p-5 rounded-xl border border-brand-border hover:shadow-md transition-all">
                             <div className="flex justify-between items-start mb-3">
                                 <div>
                                     <h4 className="font-bold text-brand-text text-lg">{ticket.subject}</h4>
                                     <span className="text-xs font-mono text-brand-text-muted bg-brand-dark px-2 py-0.5 rounded border border-brand-border">{ticket.id}</span>
                                 </div>
                                 <StatusBadge status={ticket.status} />
                             </div>
                             <div className="flex gap-4 text-sm text-brand-text-muted mb-4">
                                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-primary"></span> {ticket.category}</span>
                                 <span>Assigned to: <span className="text-brand-text font-medium">{ticket.assignedTo}</span></span>
                                 <span>ETA: <span className="text-brand-text font-medium">{ticket.expectedResolution}</span></span>
                             </div>
                             <div className="bg-brand-dark/50 rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
                                 {ticket.activity.map((act, i) => (
                                     <div key={i} className="text-xs border-l-2 border-brand-border pl-3">
                                         <p className="text-brand-text">{act.update}</p>
                                         <p className="text-[10px] text-brand-text-muted opacity-70">{new Date(act.timestamp).toLocaleString()}</p>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     ))
                 ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8 bg-brand-container/50 rounded-xl border border-brand-border border-dashed">
                        <SupportIcon className="w-12 h-12 text-brand-text-muted mb-4" />
                        <h4 className="font-bold text-brand-text">No Support Tickets</h4>
                        <p className="text-sm text-brand-text-muted mt-2 max-w-xs">All clear! Use the form on the left to raise a new request if you need assistance.</p>
                    </div>
                 )}
             </div>
        </div>
    );
});

const HandoverView: React.FC<{ snagList: SnagListItem[] }> = memo(({ snagList }) => {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-brand-text mb-2">Quality Check & Handover</h3>
                <p className="text-brand-text-muted">Track final touch-ups and readiness for move-in.</p>
            </div>
            <div className="bg-brand-container/80 backdrop-blur-sm rounded-2xl border border-brand-border shadow-soft overflow-hidden">
                <div className="grid grid-cols-1 divide-y divide-brand-border/50">
                    {snagList.map((item, i) => (
                        <div key={i} className="p-5 flex items-center justify-between hover:bg-brand-dark/30 transition-colors">
                            <span className="font-medium text-brand-text">{item.description}</span>
                            <StatusBadge status={item.status} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

const ThreeDModelView: React.FC<{ floors: number }> = memo(({ floors }) => {
    const [rotation, setRotation] = useState(45);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [constructionProgress, setConstructionProgress] = useState(100);
    const [interactionMode, setInteractionMode] = useState<'rotate' | 'pan'>('rotate');

    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;
        
        if (interactionMode === 'rotate') {
            setRotation(prev => prev + deltaX * 0.5);
        } else {
            setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        }
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };
    
    const handleReset = () => {
        setRotation(45);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setConstructionProgress(100);
    };

    const Floor = memo(({ level, progress }: { level: number, progress: number }) => {
        const isVisible = progress >= (level * 20); // Simple staggering
        if (!isVisible) return null;
        
        const yOffset = level * -60; // 60px height per floor
        
        return (
            <div className="absolute top-1/2 left-1/2 w-40 h-40 preserve-3d transition-opacity duration-500" style={{ transform: `translate(-50%, -50%) translateY(${yOffset}px)` }}>
                 <div className="absolute inset-0 bg-brand-border/80 border border-brand-text/20 transform rotateX(90deg) translateZ(20px) shadow-lg" />
                <div className="absolute w-full h-[60px] bg-brand-container/90 border border-brand-text/10 transform translateZ(80px) -translateY-[30px] flex items-center justify-center overflow-hidden">
                    <div className="w-12 h-24 bg-blue-300/20 border border-brand-text/30 rounded-t-full translate-y-4"></div>
                </div>
                <div className="absolute w-full h-[60px] bg-brand-container/90 border border-brand-text/10 transform rotateY(180deg) translateZ(80px) -translateY-[30px]" />
                <div className="absolute w-[160px] h-[60px] bg-brand-dark/90 border border-brand-text/10 transform rotateY(-90deg) translateZ(80px) -translateY-[30px] flex justify-around items-center">
                     <div className="w-10 h-10 bg-blue-300/20 border border-brand-text/30"></div>
                     <div className="w-10 h-10 bg-blue-300/20 border border-brand-text/30"></div>
                </div>
                <div className="absolute w-[160px] h-[60px] bg-brand-dark/90 border border-brand-text/10 transform rotateY(90deg) translateZ(80px) -translateY-[30px] flex justify-center items-center">
                     <div className="w-20 h-10 bg-blue-300/20 border border-brand-text/30"></div>
                </div>
                
                {level === floors && (
                     <div className="absolute top-0 left-0 w-full h-full transform -translateY-[60px]">
                         <div className="absolute w-full h-[40px] bg-brand-primary/80 transform rotateX(-30deg) translateZ(40px) origin-bottom border border-brand-dark/20" />
                         <div className="absolute w-full h-[40px] bg-brand-primary/80 transform rotateX(30deg) translateZ(-40px) origin-bottom border border-brand-dark/20" />
                     </div>
                )}
            </div>
        );
    });

    return (
        <div className="relative w-full h-[600px] bg-brand-dark/50 rounded-3xl overflow-hidden border border-brand-border shadow-inner group select-none">
             {/* Controls Overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                <div className="bg-brand-container/90 backdrop-blur-md rounded-lg p-1 border border-brand-border shadow-lg flex flex-col">
                     <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="p-2 hover:bg-brand-dark rounded text-brand-text-muted hover:text-brand-primary transition-colors"><ZoomInIcon className="w-5 h-5"/></button>
                     <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-2 hover:bg-brand-dark rounded text-brand-text-muted hover:text-brand-primary transition-colors"><ZoomOutIcon className="w-5 h-5"/></button>
                     <div className="h-px bg-brand-border my-1"></div>
                     <button onClick={handleReset} className="p-2 hover:bg-brand-dark rounded text-brand-text-muted hover:text-brand-primary transition-colors"><RefreshIcon className="w-5 h-5"/></button>
                </div>
                
                <div className="bg-brand-container/90 backdrop-blur-md rounded-lg p-1 border border-brand-border shadow-lg flex flex-col mt-2">
                    <button onClick={() => setInteractionMode('rotate')} className={`p-2 rounded transition-colors ${interactionMode === 'rotate' ? 'bg-brand-primary text-brand-dark' : 'text-brand-text-muted hover:bg-brand-dark'}`}><Rotate3dIcon className="w-5 h-5"/></button>
                    <button onClick={() => setInteractionMode('pan')} className={`p-2 rounded transition-colors ${interactionMode === 'pan' ? 'bg-brand-primary text-brand-dark' : 'text-brand-text-muted hover:bg-brand-dark'}`}><MoveIcon className="w-5 h-5"/></button>
                </div>
            </div>

            {/* Progress Slider */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/4 max-w-md z-20 bg-brand-container/90 backdrop-blur-md p-4 rounded-2xl border border-brand-border shadow-lg">
                <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2 block">Construction Progress</label>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={constructionProgress} 
                    onChange={(e) => setConstructionProgress(parseInt(e.target.value))}
                    className="w-full accent-brand-primary cursor-pointer"
                />
            </div>

            {/* 3D Scene */}
            <div 
                ref={containerRef}
                className={`w-full h-full flex items-center justify-center perspective-1000 cursor-${interactionMode === 'pan' ? 'move' : 'grab'} active:cursor-grabbing`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                 <motion.div 
                    className="relative w-0 h-0 preserve-3d"
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px) rotateX(-20deg) rotateY(${rotation}deg) scale(${zoom})` }}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                 >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-dark/20 rounded-full transform rotateX(90deg) border border-brand-border/30" 
                           style={{ backgroundImage: 'radial-gradient(circle, #5C564D 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                      
                      {Array.from({ length: floors + 1 }).map((_, i) => (
                          <Floor key={i} level={i} progress={constructionProgress} />
                      ))}
                 </motion.div>
            </div>
            <style>{`.preserve-3d { transform-style: preserve-3d; } .perspective-1000 { perspective: 1000px; }`}</style>
        </div>
    );
});

// useDebounce hook for optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// A reusable stepper control for numeric inputs, providing a more intuitive and tactile editing experience.
const NumericStepper = memo(({ value, onChange, error, step = 1, min = 0 }: { value: string, onChange: (v: string) => void, error: string | null, step?: number, min?: number }) => {
    const handleStep = (amount: number) => {
        const currentNum = parseFloat(value) || 0;
        // Use precision to handle floating point issues
        const precision = Math.pow(10, String(step).includes('.') ? String(step).split('.')[1].length : 0);
        const newValue = Math.max(min, (Math.round((currentNum + amount) * precision) / precision));
        onChange(String(newValue));
    };

    return (
        <div className="flex flex-col items-end">
            <div className={`flex items-center gap-1 bg-brand-dark p-1 rounded-lg border transition-colors ${error ? 'border-danger' : 'border-brand-border/50'}`}>
                <motion.button type="button" whileTap={{scale:0.9}} onClick={() => handleStep(-step)} className="w-7 h-7 flex items-center justify-center font-bold text-lg text-brand-text-muted hover:text-brand-dark hover:bg-brand-primary rounded-md transition-colors shadow-sm">-</motion.button>
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-20 text-center bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-mono text-brand-text [appearance:textfield]"
                />
                <motion.button type="button" whileTap={{scale:0.9}} onClick={() => handleStep(step)} className="w-7 h-7 flex items-center justify-center font-bold text-lg text-brand-text-muted hover:text-brand-dark hover:bg-brand-primary rounded-md transition-colors shadow-sm">+</motion.button>
            </div>
            {error && <span className="text-danger text-xs mt-1 text-right pr-2">{error}</span>}
        </div>
    );
});

// Refactored component to use the new NumericStepper for a more intuitive and tactile editing experience.
const MaterialFloorRow = memo(({ entry, onUpdate }: { entry: MaterialQuantity, onUpdate: (floor: number, qty: number, price: number) => void }) => {
    const [localQuantity, setLocalQuantity] = useState(String(entry.quantity));
    const [localPrice, setLocalPrice] = useState(String(entry.unitPrice));
    const [quantityError, setQuantityError] = useState<string|null>(null);
    const [priceError, setPriceError] = useState<string|null>(null);

    const debouncedQuantity = useDebounce(localQuantity, 500);
    const debouncedPrice = useDebounce(localPrice, 500);

    // Sync local state with parent props for undo/redo
    useEffect(() => {
        setLocalQuantity(String(entry.quantity));
        setLocalPrice(String(entry.unitPrice));
    }, [entry.quantity, entry.unitPrice]);

    useEffect(() => {
        const numQty = parseFloat(debouncedQuantity);
        const numPrice = parseFloat(debouncedPrice);

        const isQtyValid = !isNaN(numQty) && numQty >= 0;
        const isPriceValid = !isNaN(numPrice) && numPrice >= 0;

        if (isQtyValid && isPriceValid) {
            // Only update if the debounced value is different from the prop value to avoid loops
            if (numQty !== entry.quantity || numPrice !== entry.unitPrice) {
                onUpdate(entry.floor, numQty, numPrice);
            }
        }
    }, [debouncedQuantity, debouncedPrice, entry, onUpdate]);
    
    const handleQuantityChange = (value: string) => {
        setLocalQuantity(value);
        const num = parseFloat(value);
        if (value === '' || isNaN(num)) setQuantityError('Invalid');
        else if (num < 0) setQuantityError('>= 0');
        else setQuantityError(null);
    };

    const handlePriceChange = (value: string) => {
        setLocalPrice(value);
        const num = parseFloat(value);
        if (value === '' || isNaN(num)) setPriceError('Invalid');
        else if (num < 0) setPriceError('>= 0');
        else setPriceError(null);
    };

    const getFloorName = (floor: number) => {
        if (floor === 0) return 'Foundation';
        return `Floor ${floor}`;
    };
    
    const isBags = entry.unit.toLowerCase().includes('bag');

    return (
        <div className="grid grid-cols-11 gap-4 items-start py-2 px-3 hover:bg-brand-dark/50 rounded-md">
            <span className="col-span-3 text-sm text-brand-text-muted pt-4">{getFloorName(entry.floor)}</span>
            <div className="col-span-3">
                <NumericStepper
                    value={localQuantity}
                    onChange={handleQuantityChange}
                    error={quantityError}
                    step={isBags ? 1 : 0.5}
                />
            </div>
             <div className="col-span-3">
                <NumericStepper
                    value={localPrice}
                    onChange={handlePriceChange}
                    error={priceError}
                    step={100}
                />
            </div>
            <span className="col-span-2 text-right text-sm font-mono text-brand-text-muted pt-4">{formatCurrency(parseFloat(localQuantity) * parseFloat(localPrice) || 0)}</span>
        </div>
    );
});

const MaterialComparisonModal: React.FC<{
    materialA: any;
    materialB: any | null;
    allMaterials: any;
    onSelectB: (name: string) => void;
    onClose: () => void;
}> = ({ materialA, materialB, allMaterials, onSelectB, onClose }) => {
    const materialDescriptions: Record<string, string> = {
        'Cement': 'A binding agent that sets, hardens, and adheres to other materials to bind them together. Crucial for concrete and mortar.',
        'Steel': 'Used as reinforcement in concrete (rebar) to provide tensile strength, preventing structures from cracking under tension.',
        'Bricks': 'A primary walling material, known for its durability, fire resistance, and thermal insulation properties.',
        'Sand': 'A key component of concrete, mortar, and plaster. Fine sand is used for plaster, while coarse sand is used for concrete.',
        'Aggregate': 'Coarse particulate material (gravel, crushed stone) used in construction to provide bulk and strength to concrete and asphalt.',
        'Plaster': 'A protective or decorative coating for walls and ceilings, providing a smooth, durable finish.'
    };
    
    const getDesc = (name: string) => materialDescriptions[name] || 'No description available for this material.';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-brand-container p-6 rounded-2xl border border-brand-border shadow-soft w-full max-w-3xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-muted hover:text-brand-text"><XIcon className="w-6 h-6"/></button>
                <h3 className="font-bold text-lg text-brand-text mb-6 text-center">Compare Materials</h3>

                <div className="grid grid-cols-2 gap-6">
                    {/* Material A */}
                    <div className="bg-brand-dark/50 p-4 rounded-xl border border-brand-border">
                         <h4 className="font-bold text-brand-primary text-xl mb-4">{materialA.name}</h4>
                         <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-brand-text-muted">Avg. Unit Price:</span>
                                <span className="font-mono font-bold text-brand-text">{formatCurrency(materialA.avgPrice)} / {materialA.unit}</span>
                            </div>
                            <p className="text-brand-text-muted leading-relaxed pt-2 border-t border-brand-border/50">{getDesc(materialA.name)}</p>
                         </div>
                    </div>
                    {/* Material B */}
                    <div className="p-4 rounded-xl border border-brand-border/50">
                        <select
                            value={materialB?.name || ''}
                            onChange={(e) => onSelectB(e.target.value)}
                            className="w-full bg-brand-dark border border-brand-border p-3 rounded-lg text-brand-text font-bold mb-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        >
                            <option value="" disabled>Select material to compare</option>
                            {Object.keys(allMaterials)
                                .filter(name => name !== materialA.name)
                                .map(name => <option key={name} value={name}>{name}</option>)
                            }
                        </select>
                        {materialB && (
                            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-brand-text-muted">Avg. Unit Price:</span>
                                    <span className="font-mono font-bold text-brand-text">{formatCurrency(materialB.avgPrice)} / {materialB.unit}</span>
                                </div>
                                <p className="text-brand-text-muted leading-relaxed pt-2 border-t border-brand-border/50">{getDesc(materialB.name)}</p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};


const MaterialsView: React.FC<{ materials: MaterialQuantity[], onUpdateMaterialFloorEntry: ProjectDashboardProps['onUpdateMaterialFloorEntry'], onUndo: () => void, onRedo: () => void, canUndo: boolean, canRedo: boolean, onBulkUpdateMaterials: ProjectDashboardProps['onBulkUpdateMaterials'] }> = memo(({ materials, onUpdateMaterialFloorEntry, onUndo, onRedo, canUndo, canRedo, onBulkUpdateMaterials }) => {
    const [openMaterial, setOpenMaterial] = useState<string | null>(null);
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
    const [bulkAction, setBulkAction] = useState<{ action: 'increase' | 'decrease', type: 'quantity' | 'price' } | null>(null);
    const [bulkPercentage, setBulkPercentage] = useState<number>(10);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Comparison Modal State
    const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
    const [materialToCompareA, setMaterialToCompareA] = useState<any>(null);
    const [materialToCompareB, setMaterialToCompareB] = useState<any>(null);


    const handleSelectMaterial = (materialName: string) => {
        setSelectedMaterials(prev => 
            prev.includes(materialName) 
            ? prev.filter(m => m !== materialName) 
            : [...prev, materialName]
        );
    };

    const handleConfirmBulkAction = () => {
        if (bulkAction) {
            onBulkUpdateMaterials(selectedMaterials, bulkAction.action, bulkAction.type, bulkPercentage);
            setBulkAction(null);
            setSelectedMaterials([]);
        }
    };
    
    const groupedMaterials = useMemo(() => {
        const initialValue: Record<string, { unit: string; totalQuantity: number; totalCost: number; originalTotalCost: number; entries: MaterialQuantity[] }> = {};
        return materials.reduce((acc, curr) => {
            if (!acc[curr.material]) {
                acc[curr.material] = {
                    unit: curr.unit,
                    totalQuantity: 0,
                    totalCost: 0,
                    originalTotalCost: 0,
                    entries: []
                };
            }
            acc[curr.material].totalQuantity += curr.quantity;
            acc[curr.material].totalCost += curr.quantity * curr.unitPrice;
            acc[curr.material].originalTotalCost += (curr.originalQuantity || curr.quantity) * curr.unitPrice;
            acc[curr.material].entries.push(curr);
            return acc;
        }, initialValue);
    }, [materials]);

    const filteredMaterials = useMemo(() => {
        if (!searchTerm) return Object.entries(groupedMaterials);
        return Object.entries(groupedMaterials).filter(([name]) => 
            name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [groupedMaterials, searchTerm]);
    
    const handleOpenCompare = (materialName: string, data: any) => {
        setMaterialToCompareA({
            name: materialName,
            unit: data.unit,
            avgPrice: data.totalCost / data.totalQuantity
        });
        setMaterialToCompareB(null);
        setComparisonModalOpen(true);
    };

    const handleSelectCompareB = (materialName: string) => {
        const data = groupedMaterials[materialName];
        if(data){
            setMaterialToCompareB({
                name: materialName,
                unit: data.unit,
                avgPrice: data.totalCost / data.totalQuantity
            });
        }
    };


    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                 <div className="relative w-full sm:w-auto">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted pointer-events-none"/>
                    <input 
                        type="text"
                        placeholder="Search materials..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 bg-brand-container border-2 border-brand-border rounded-full pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-text transition-all"
                    />
                 </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mr-2">Edit History</span>
                    <button onClick={onUndo} disabled={!canUndo} className="p-2 bg-brand-container rounded-lg border border-brand-border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-dark transition-colors"><UndoIcon className="w-5 h-5 text-brand-text-muted"/></button>
                    <button onClick={onRedo} disabled={!canRedo} className="p-2 bg-brand-container rounded-lg border border-brand-border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-dark transition-colors"><RedoIcon className="w-5 h-5 text-brand-text-muted"/></button>
                </div>
            </div>
            <div className="space-y-3">
                {filteredMaterials.length > 0 ? filteredMaterials.map(([name, data]) => {
                    const isOverBudget = data.totalCost > data.originalTotalCost;
                    const isOpen = openMaterial === name;
                    
                    const handleUpdate = useCallback((floor: number, qty: number, price: number) => {
                        onUpdateMaterialFloorEntry(name, floor, qty, price);
                    }, [name, onUpdateMaterialFloorEntry]);

                    return (
                        <div className="group relative" key={name}>
                             <Accordion
                                isOpen={isOpen}
                                onToggle={() => setOpenMaterial(isOpen ? null : name)}
                                title={
                                    <div className="grid grid-cols-12 gap-4 items-center w-full">
                                        <button onClick={(e) => {e.stopPropagation(); handleSelectMaterial(name)}} className="col-span-1">
                                            {selectedMaterials.includes(name) ? <CheckboxCheckedIcon className="w-6 h-6 text-brand-primary" /> : <CheckboxIcon className="w-6 h-6 text-brand-text-muted" />}
                                        </button>
                                        <div className="col-span-5 font-bold text-brand-text flex items-center gap-2">
                                            {name}
                                            {isOverBudget && (
                                                <WarningIcon className="w-5 h-5 text-warning animate-pulse" />
                                            )}
                                        </div>
                                        <div className="col-span-3 text-right font-mono text-brand-text-muted">
                                            {data.totalQuantity.toFixed(2)} {data.unit}
                                        </div>
                                        <div className={`col-span-3 text-right font-bold font-mono ${isOverBudget ? 'text-warning' : 'text-brand-primary'}`}>
                                            {formatCurrency(data.totalCost)}
                                        </div>
                                    </div>
                                }
                            >
                                <div className="space-y-2">
                                    <div className="grid grid-cols-11 gap-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider mt-4 pt-4 border-t border-brand-border/50 px-3">
                                        <span className="col-span-3">Floor / Level</span>
                                        <span className="col-span-3 text-right">Quantity ({data.unit})</span>
                                        <span className="col-span-3 text-right">Unit Price</span>
                                        <span className="col-span-2 text-right">Cost</span>
                                    </div>
                                    <AnimatePresence>
                                        {data.entries.sort((a,b) => a.floor - b.floor).map((entry, index) => (
                                            <motion.div
                                                key={entry.floor}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                                                exit={{ opacity: 0, y: -10 }}
                                            >
                                                <MaterialFloorRow entry={entry} onUpdate={handleUpdate} />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </Accordion>
                             <div className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleOpenCompare(name, data)}
                                  className="p-1.5 bg-brand-dark rounded-full border border-brand-border text-brand-text-muted hover:text-brand-primary hover:border-brand-primary transition-all"
                                >
                                  <ScaleIcon className="w-4 h-4" />
                                </button>
                              </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-12 bg-brand-container/50 rounded-xl border border-brand-border border-dashed">
                        <SearchIcon className="w-10 h-10 text-brand-text-muted mx-auto mb-4" />
                        <h4 className="font-bold text-brand-text">No Materials Found</h4>
                        <p className="text-sm text-brand-text-muted mt-1">Your search for "{searchTerm}" did not match any materials.</p>
                    </div>
                )}
            </div>
            <AnimatePresence>
                {comparisonModalOpen && materialToCompareA && (
                    <MaterialComparisonModal
                        materialA={materialToCompareA}
                        materialB={materialToCompareB}
                        allMaterials={groupedMaterials}
                        onSelectB={handleSelectCompareB}
                        onClose={() => setComparisonModalOpen(false)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {selectedMaterials.length > 0 && (
                     <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl z-40"
                     >
                        <div className="bg-brand-container/90 backdrop-blur-xl p-4 rounded-2xl shadow-glass border border-brand-border mx-4 flex items-center justify-between gap-4">
                            <span className="text-sm font-bold text-brand-text">{selectedMaterials.length} item(s) selected</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setBulkAction({ action: 'increase', type: 'quantity' })} className="text-xs font-bold bg-brand-dark hover:bg-brand-border/50 text-brand-text px-3 py-2 rounded-lg">Qty +%</button>
                                <button onClick={() => setBulkAction({ action: 'decrease', type: 'quantity' })} className="text-xs font-bold bg-brand-dark hover:bg-brand-border/50 text-brand-text px-3 py-2 rounded-lg">Qty -%</button>
                                <button onClick={() => setBulkAction({ action: 'increase', type: 'price' })} className="text-xs font-bold bg-brand-dark hover:bg-brand-border/50 text-brand-text px-3 py-2 rounded-lg">Price +%</button>
                                <button onClick={() => setBulkAction({ action: 'decrease', type: 'price' })} className="text-xs font-bold bg-brand-dark hover:bg-brand-border/50 text-brand-text px-3 py-2 rounded-lg">Price -%</button>
                            </div>
                            <button onClick={() => setSelectedMaterials([])} className="text-xs font-bold text-brand-text-muted hover:text-brand-text">Clear</button>
                        </div>
                     </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {bulkAction && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                         <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-brand-container p-6 rounded-2xl border border-brand-border shadow-soft w-full max-w-md text-center"
                         >
                            <h3 className="font-bold text-lg text-brand-text mb-2">Confirm Bulk Edit</h3>
                            <p className="text-sm text-brand-text-muted mb-6">
                                You are about to <span className="text-brand-primary font-bold">{bulkAction.action}</span> the <span className="text-brand-primary font-bold">{bulkAction.type}</span> of {selectedMaterials.length} item(s) by:
                            </p>
                            <div className="mb-6">
                                 <input 
                                    type="range" 
                                    min="1" max="50" step="1" 
                                    value={bulkPercentage} 
                                    onChange={(e) => setBulkPercentage(parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <div className="text-center font-bold text-brand-primary text-2xl mt-2">{bulkPercentage}%</div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setBulkAction(null)} className="flex-1 bg-brand-dark hover:bg-brand-border/50 text-brand-text font-bold py-3 rounded-xl">Cancel</button>
                                <button onClick={handleConfirmBulkAction} className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-brand-dark font-bold py-3 rounded-xl">Apply Change</button>
                            </div>
                         </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

const PaymentsView: React.FC<{ schedule: PaymentMilestone[], onMarkPaid: (milestone: string) => void }> = memo(({ schedule, onMarkPaid }) => {
    const listVariants: Variants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
      },
    };
    
    const itemVariants: Variants = {
      hidden: { x: -20, opacity: 0 },
      visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
    };

    let isDueFound = false;
    
    return (
        <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-brand-text mb-6 uppercase tracking-wide flex items-center gap-2">
                <PaymentsIcon className="w-5 h-5 text-brand-primary"/> Payment Timeline
            </h3>
            <motion.div
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="relative pl-8"
            >
                 <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-brand-border/50 -z-10"></div>

                {schedule.map((p, index) => {
                    const isCompleted = p.status === 'Completed';
                    const isDue = p.status === 'Due';
                    
                    const isLineActive = isCompleted || isDue || (!isDueFound && p.status === 'Pending');
                    if (isDue) isDueFound = true;
                    
                    // FIX: Add explicit `Variants` type to resolve Framer Motion transition type error.
                    const checkmarkVariants: Variants = {
                        hidden: { pathLength: 0 },
                        visible: { pathLength: 1, transition: { duration: 0.5, ease: 'easeInOut' } }
                    };

                    return (
                        <motion.div variants={itemVariants} key={p.milestone} className="relative pb-8 last:pb-0">
                            <AnimatePresence>
                                {isLineActive && 
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: '100%' }}
                                        transition={{ duration: 0.5, delay: 0.1 }}
                                        className="absolute left-[15px] top-2 w-0.5 bg-brand-primary -z-10"
                                    />
                                }
                            </AnimatePresence>
                            
                            <div className="absolute -left-[2px] top-1 flex items-center justify-center">
                                {isCompleted ? (
                                    <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
                                         <svg className="w-5 h-5 text-brand-dark" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <motion.path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" variants={checkmarkVariants} initial="hidden" animate="visible" />
                                        </svg>
                                    </div>
                                ) : isDue ? (
                                    <div className="w-8 h-8 rounded-full bg-brand-primary border-4 border-brand-dark flex items-center justify-center relative shadow-glow">
                                        <span className="absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75 animate-ping"></span>
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-brand-dark border-2 border-brand-border"></div>
                                )}
                            </div>
                            
                            <div className="ml-8 p-4 bg-brand-container rounded-2xl border border-brand-border/80 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="font-bold text-brand-text">{p.milestone} <span className="text-xs text-brand-text-muted font-medium ml-1">({p.percentage}%)</span></p>
                                        <p className="text-sm text-brand-text-muted mt-1 font-mono">{formatCurrency(p.amount)}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border ${
                                        isCompleted ? 'bg-success/10 text-success border-success/20' :
                                        isDue ? 'bg-warning/10 text-warning border-warning/20' :
                                        'bg-brand-dark/50 text-brand-text-muted border-brand-border'
                                    }`}>
                                        {p.status}
                                    </span>
                                </div>
                                {isDue && (
                                    <motion.button 
                                        onClick={() => onMarkPaid(p.milestone)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full bg-brand-primary text-brand-dark font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-glow transition-shadow"
                                    >
                                        <CreditCardIcon className="w-4 h-4"/>
                                        Pay Now
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
});


export const ProjectDashboard: React.FC<ProjectDashboardProps> = memo(({ project, onReset, onRaiseTicket, onAddUserNote, onUpdateMaterialFloorEntry, onUndo, onRedo, canUndo, canRedo, onBulkUpdateMaterials, onMarkMilestonePaid }) => {
    const [activeTab, setActiveTab] = useState<DashboardTab>('Progress');
    
    const tabs: { id: DashboardTab; icon: React.FC<any> }[] = [
        { id: 'Progress', icon: ProgressIcon },
        { id: 'Budget', icon: BudgetIcon },
        { id: '3D View', icon: BuildingIcon },
        { id: 'Materials', icon: MaterialsIcon },
        { id: 'Payments', icon: PaymentsIcon },
        { id: 'Support', icon: SupportIcon },
        { id: 'Handover', icon: HandoverIcon },
    ];

    return (
        <div className="space-y-6">
             <div className="sticky top-24 z-30 bg-brand-dark/80 backdrop-blur-xl pt-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2 sm:pb-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-colors whitespace-nowrap border ${
                                activeTab === tab.id 
                                ? 'text-brand-dark border-transparent' 
                                : 'bg-transparent text-brand-text-muted border-transparent hover:text-brand-text'
                            }`}
                        >
                            {activeTab === tab.id && (
                                <motion.div 
                                    layoutId="activeTabIndicator" 
                                    className="absolute inset-0 bg-brand-primary rounded-full"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <tab.icon className="w-4 h-4" />
                                {tab.id}
                            </span>
                        </button>
                    ))}
                </div>
             </div>

             <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'Progress' && <ProgressView timeline={project.timeline} updates={project.weeklyUpdates} onAddUserNote={onAddUserNote} />}
                        {activeTab === 'Budget' && <BudgetView budgetBreakdown={project.budgetBreakdown} totalCost={project.totalCost} />}
                        {activeTab === '3D View' && <ThreeDModelView floors={project.wizardData.floors || 1} />}
                        {activeTab === 'Materials' && <MaterialsView materials={project.materialQuantities} onUpdateMaterialFloorEntry={onUpdateMaterialFloorEntry} onUndo={onUndo} onRedo={onRedo} canUndo={canUndo} canRedo={canRedo} onBulkUpdateMaterials={onBulkUpdateMaterials} />}
                        {activeTab === 'Payments' && <PaymentsView schedule={project.paymentSchedule} onMarkPaid={onMarkMilestonePaid} />}
                        {activeTab === 'Support' && <SupportView tickets={project.supportTickets} onRaiseTicket={onRaiseTicket} />}
                        {activeTab === 'Handover' && <HandoverView snagList={project.snagList} />}
                    </motion.div>
                </AnimatePresence>
             </div>
        </div>
    );
});