
import React from 'react';
// FIX: Import 'Variants' to provide explicit typing for motion variants.
import { motion, Variants } from 'framer-motion';
import type { ProjectPlan, PaymentMilestone } from '../types';
import { ArrowLeftIcon, DocumentIcon, CreditCardIcon, ShieldCheckIcon, CheckCircleIcon } from './Icons';

interface DealClosureProps {
    project: ProjectPlan;
    onPayment: () => void;
    onBack: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const PaymentTimeline: React.FC<{ schedule: PaymentMilestone[] }> = ({ schedule }) => {
    const listVariants: Variants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.15,
        },
      },
    };
    
    // FIX: Explicitly type 'itemVariants' with 'Variants' to resolve the transition type error.
    const itemVariants: Variants = {
      hidden: { x: -20, opacity: 0 },
      visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
    };

    let isDueFound = false;

    return (
        <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="relative pl-8"
        >
            {/* Vertical Connector Line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-brand-border/50 -z-10"></div>

            {schedule.map((p, index) => {
                const isCompleted = p.status === 'Completed';
                const isDue = p.status === 'Due';
                
                // The connector line should be colored up to the point *before* the next pending item.
                const isLineActive = isCompleted || isDue || (!isDueFound && p.status === 'Pending');
                if (isDue) isDueFound = true;
                
                return (
                    <motion.div variants={itemVariants} key={p.milestone} className="relative pb-8 last:pb-0">
                        {isLineActive && <div className="absolute left-[15px] top-2 h-full w-0.5 bg-brand-primary -z-10"></div>}
                        
                        <div className="absolute -left-[2px] top-1 flex items-center justify-center">
                            {isCompleted ? (
                                <CheckCircleIcon className="w-8 h-8 text-brand-primary bg-brand-dark" />
                            ) : isDue ? (
                                <div className="w-8 h-8 rounded-full bg-brand-primary border-4 border-brand-dark flex items-center justify-center relative shadow-glow">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75 animate-ping"></span>
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-brand-dark border-2 border-brand-border"></div>
                            )}
                        </div>
                        
                        <div className="ml-8 p-4 bg-brand-container rounded-2xl border border-brand-border/80 shadow-sm hover:shadow-md transition-shadow">
                             <div className="flex justify-between items-start">
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
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
};


export const DealClosure: React.FC<DealClosureProps> = ({ project, onPayment, onBack }) => {
    const bookingMilestone = project.paymentSchedule.find(p => p.status === 'Due');
    const bookingAmount = bookingMilestone ? bookingMilestone.amount : project.totalCost * 0.10;

    return (
        <div className="bg-brand-container p-6 sm:p-10 rounded-3xl shadow-2xl border border-brand-border max-w-4xl mx-auto my-8">
            <h2 className="text-3xl font-extrabold text-brand-text mb-2 uppercase tracking-tight">Finalize Your Project</h2>
            <p className="text-brand-text-muted mb-8 text-lg">Review the final agreement and proceed with the booking amount to start construction.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Agreement Details & Timeline */}
                <div className="bg-brand-dark p-8 rounded-2xl border border-brand-border space-y-8">
                    <div>
                        <h3 className="text-xl font-bold text-brand-primary mb-5 flex items-center gap-2"><DocumentIcon className="w-6 h-6" /><span>Agreement Overview</span></h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-baseline"><span className="text-brand-text-muted font-medium">Project ID</span><span className="font-mono text-brand-text bg-brand-container px-2 py-1 rounded border border-brand-border">{project.id}</span></div>
                            <div className="flex justify-between"><span className="text-brand-text-muted font-medium">Location</span><span className="font-semibold text-brand-text">{project.wizardData.location}</span></div>
                            <div className="flex justify-between"><span className="text-brand-text-muted font-medium">Plot Area</span><span className="font-semibold text-brand-text">{project.wizardData.plotArea?.toLocaleString('en-IN')} sq. ft.</span></div>
                             <div className="flex justify-between"><span className="text-brand-text-muted font-medium">Material Quality</span><span className="font-semibold text-brand-text">{project.wizardData.constructionQuality} Grade</span></div>
                            <div className="flex justify-between"><span className="text-brand-text-muted font-medium">Timeline</span><span className="font-semibold text-brand-text text-right">{project.timeline[0]?.expectedDate} - {project.timeline[project.timeline.length - 1]?.expectedDate}</span></div>
                            <div className="flex justify-between border-t border-brand-border/60 pt-4 mt-2"><span className="text-brand-text-muted font-bold">Final Cost</span><span className="font-bold text-brand-primary text-xl">{formatCurrency(project.totalCost)}</span></div>
                        </div>
                         <button className="w-full mt-6 text-center text-xs font-bold text-brand-primary hover:text-brand-primary-hover uppercase tracking-wider transition-colors">Download Full Agreement (PDF)</button>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-brand-primary mb-6">Payment Schedule</h3>
                        <PaymentTimeline schedule={project.paymentSchedule} />
                    </div>
                </div>

                {/* Payment Section */}
                <div className="bg-brand-container p-8 rounded-2xl border border-brand-border flex flex-col shadow-soft relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-bl-full"></div>
                    <h3 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-2"><CreditCardIcon className="w-6 h-6 text-brand-primary" /><span>Booking Payment</span></h3>
                    <p className="text-brand-text-muted text-sm mb-8 leading-relaxed">A <span className="font-bold text-brand-text">{bookingMilestone?.percentage || 10}% booking amount</span> is required to lock in material prices and initiate the initial groundwork.</p>
                    
                    <div className="bg-brand-dark border border-brand-border p-6 rounded-2xl text-center mb-8">
                        <p className="text-brand-text-muted uppercase text-xs font-bold tracking-widest mb-2">Total Payable Now</p>
                        <p className="text-4xl font-extrabold text-brand-text tracking-tight">{formatCurrency(bookingAmount)}</p>
                    </div>
                    
                    <motion.button 
                        onClick={onPayment}
                        className="w-full mt-auto bg-brand-primary text-brand-dark font-bold py-4 px-6 rounded-xl transition-all duration-300 uppercase tracking-widest shadow-lg shadow-brand-primary/30 flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02, boxShadow: '0 20px 25px -5px rgba(255, 184, 0, 0.3)' }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <ShieldCheckIcon className="w-5 h-5" />
                        Pay & Start Construction
                    </motion.button>
                     <p className="text-center text-[10px] text-brand-text-muted mt-4 flex items-center justify-center gap-1">
                        <ShieldCheckIcon className="w-3 h-3" /> Secure Payment via Razorpay
                    </p>
                </div>
            </div>

            <div className="mt-10 text-center">
                <button onClick={onBack} className="group flex items-center gap-2 text-brand-text-muted hover:text-brand-primary transition-colors mx-auto text-sm font-bold">
                    <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span>Back to Budget Review</span>
                </button>
            </div>
        </div>
    );
};
