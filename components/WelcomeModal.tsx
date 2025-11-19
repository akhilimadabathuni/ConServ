

import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, BudgetIcon, ShieldCheckIcon, ProgressIcon, ArrowRightIcon } from './Icons';

interface WelcomeModalProps {
    onStart: () => void;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const JourneyStep: React.FC<{ icon: React.FC<any>, title: string, description: string }> = ({ icon: Icon, title, description }) => (
    <motion.div variants={itemVariants} className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-brand-container rounded-xl flex items-center justify-center border border-brand-border shadow-sm">
            <Icon className="w-6 h-6 text-brand-primary" />
        </div>
        <div>
            <h3 className="font-bold text-brand-text">{title}</h3>
            <p className="text-sm text-brand-text-muted leading-relaxed">{description}</p>
        </div>
    </motion.div>
);

const InfoCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <motion.div variants={itemVariants} className="bg-brand-container/80 backdrop-blur-sm border border-brand-border p-6 rounded-2xl shadow-soft">
        <h4 className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-3">{title}</h4>
        <div className="text-sm text-brand-text-muted space-y-2">{children}</div>
    </motion.div>
);


export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onStart }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="bg-brand-dark/80 backdrop-blur-xl border border-brand-border rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto my-8 shadow-glass"
        >
            <div className="text-center">
                <motion.h1 
                    variants={itemVariants}
                    className="text-4xl sm:text-5xl font-extrabold text-brand-text tracking-tight mb-6"
                >
                    Welcome to <span>CON<span className="text-brand-primary">SERV</span></span>
                </motion.h1>
                <motion.p 
                    variants={itemVariants}
                    className="mt-4 text-lg text-brand-text-muted max-w-2xl mx-auto"
                >
                    A clickable prototype demonstrating an AI-powered platform to radically simplify home construction.
                </motion.p>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8"
            >
                {/* Left side: The User Journey */}
                <div className="space-y-6">
                    <motion.h3 variants={itemVariants} className="font-bold text-brand-text text-xl border-b-2 border-brand-border pb-3">The User Journey</motion.h3>
                    <div className="space-y-6">
                        <JourneyStep icon={SparklesIcon} title="1. Define" description="Use the Blueprint Wizard to describe your dream home. Our AI gets to work instantly."/>
                        <JourneyStep icon={BudgetIcon} title="2. Review" description="Analyze a transparent, itemized budget. Negotiate and adjust materials in real-time."/>
                        <JourneyStep icon={ShieldCheckIcon} title="3. Finalize" description="Lock in your estimate, review the agreement, and make a secure booking payment."/>
                        <JourneyStep icon={ProgressIcon} title="4. Track" description="Monitor your project from foundation to finish on a comprehensive, live dashboard."/>
                    </div>
                </div>

                {/* Right side: Product & Business Thinking */}
                <div className="space-y-6">
                    <InfoCard title="Core UX & Vision">
                       <p><strong className="text-brand-text">Radical but Practical:</strong> We bring instant, AI-driven transparency to the opaque construction industry, prioritizing clarity over polish to empower the user.</p>
                    </InfoCard>
                    <InfoCard title="Monetisation & Retention">
                        <p><strong className="text-brand-text">Monetisation:</strong> We act as your digital contractor, charging a transparent fee on the total project cost.</p>
                        <p><strong className="text-brand-text">Retention:</strong> The Project Dashboard becomes an indispensable tool for months, fostering loyalty and creating future opportunities.</p>
                    </InfoCard>
                    <InfoCard title="Key Metric to Track">
                        <p><strong className="text-brand-text">Wizard-to-Dashboard Conversion Rate.</strong> This single metric measures how effectively we turn a user's initial idea into a committed, managed project.</p>
                    </InfoCard>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-12 text-center">
                <motion.button
                    onClick={onStart}
                    className="bg-brand-primary text-brand-dark font-bold py-4 px-12 rounded-xl text-lg flex items-center gap-3 mx-auto shadow-glow"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Start Building
                    <ArrowRightIcon className="w-5 h-5" />
                </motion.button>
            </motion.div>
        </motion.div>
    );
};