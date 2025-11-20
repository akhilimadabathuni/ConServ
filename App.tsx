

import React, { useState, useCallback, memo, Suspense, lazy } from 'react';
import { produce } from 'immer';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import type { WizardData, ProjectPlan, ChatMessage, SupportTicket } from './types';
import { createProjectPlan } from './services/geminiService';
import { SparklesIcon, SpinnerIcon } from './components/Icons';

// Lazy-loaded components
const Wizard = lazy(() => import('./components/QuestionnaireForm').then(module => ({ default: module.Wizard })));
const BudgetReview = lazy(() => import('./components/BudgetReview').then(module => ({ default: module.BudgetReview })));
const DealClosure = lazy(() => import('./components/DealClosure').then(module => ({ default: module.DealClosure })));
const ProjectDashboard = lazy(() => import('./components/EstimationResult').then(module => ({ default: module.ProjectDashboard })));
const WelcomeModal = lazy(() => import('./components/WelcomeModal').then(module => ({ default: module.WelcomeModal })));


export type ViewMode = 'wizard' | 'budget_review' | 'deal_closure' | 'dashboard';

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { type: 'spring', stiffness: 200, damping: 25 } // Softened spring physics
};

const AmbientBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-900/20 blur-[120px] animate-float"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-900/20 blur-[120px] animate-float-reverse"></div>
    <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-yellow-700/10 blur-[100px] animate-pulse-slow"></div>
  </div>
);

const SuspenseFallback = () => (
    <div className="flex items-center justify-center min-h-[70vh]">
        <SpinnerIcon className="w-8 h-8 text-brand-primary animate-spin" />
    </div>
);


const App: React.FC = () => {
  const [projectPlan, setProjectPlan] = useState<ProjectPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('wizard');
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  // --- History Management for Undo/Redo ---
  const [history, setHistory] = useState<ProjectPlan[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const updateProjectPlanWithHistory = useCallback((updater: (draft: ProjectPlan) => void, fromHistory: boolean = false) => {
    setProjectPlan(currentPlan => {
      if (!currentPlan) return null;
      const nextState = produce(currentPlan, updater);

      if (!fromHistory) {
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(nextState);
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
      }
      return nextState;
    });
  }, [history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setProjectPlan(history[newIndex]);
    }
  }, [canUndo, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setProjectPlan(history[newIndex]);
    }
  }, [canRedo, history, historyIndex]);


  const handleGenerateEstimate = useCallback(async (data: WizardData) => {
    setIsLoading(true);
    setError(null);
    setProjectPlan(null);
    setHistory([]);
    setHistoryIndex(-1);
    try {
      const result = await createProjectPlan(data);
      
      if (result.materialQuantities) {
          result.materialQuantities.forEach(mq => {
              mq.originalQuantity = mq.quantity;
          });
      }

      setProjectPlan(result);
      setHistory([result]);
      setHistoryIndex(0);
      setViewMode('budget_review');
    } catch (err) {
      console.error("Blueprint generation failed:", err);
      if (err instanceof Error) {
          switch (err.message) {
              case "Invalid response structure from the service.":
                  setError("The AI returned an incomplete blueprint. This can be a temporary issue. Please try adjusting your inputs or try again in a moment.");
                  break;
              case "Failed to get a valid project plan from the service.":
                  setError("The AI service seems to be unavailable or overloaded. Please check your internet connection and try again shortly.");
                  break;
              default:
                  setError('An unexpected error occurred while generating the blueprint. Our team has been notified. Please try again.');
                  break;
          }
      } else {
          setError('An unknown error occurred. Please try again.');
      }
      setViewMode('wizard');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleSendMessage = useCallback((messageText: string) => {
    updateProjectPlanWithHistory(draft => {
        const userMessage: ChatMessage = {
          sender: 'user',
          text: messageText,
          timestamp: new Date().toISOString(),
        };
        const advisorResponse: ChatMessage = {
            sender: 'advisor',
            text: "Thank you for your message. Let me review your request and I will get back to you shortly with a revised proposal based on our discussion.",
            timestamp: new Date(new Date().getTime() + 1000).toISOString(),
        };
        draft.chatHistory.push(userMessage);
        draft.chatHistory.push(advisorResponse);
    });
  }, [updateProjectPlanWithHistory]);

  const handleAddAdvisorMessage = useCallback((messageText: string) => {
      updateProjectPlanWithHistory(draft => {
          const advisorMessage: ChatMessage = {
              sender: 'advisor',
              text: messageText,
              timestamp: new Date().toISOString(),
          };
          draft.chatHistory.push(advisorMessage);
      });
  }, [updateProjectPlanWithHistory]);


  const recalculateCosts = (draft: ProjectPlan) => {
      const originalTotalCost = history[0]?.totalCost || draft.totalCost;
      const originalCostPerSqFt = history[0]?.costPerSqFt || draft.costPerSqFt;
      
      // Update Materials section total
      const materialsSection = draft.budgetBreakdown.find(s => s.sectionName === 'Materials');
      if (materialsSection) {
          materialsSection.totalCost = materialsSection.items.reduce((sum, item) => sum + item.cost, 0);
      }

      // Update grand total
      draft.totalCost = draft.budgetBreakdown.reduce((sum, section) => sum + section.totalCost, 0);

      // Update cost per sq ft proportionally
      if (originalTotalCost > 0) {
           const costRatio = draft.totalCost / originalTotalCost;
           draft.costPerSqFt = originalCostPerSqFt * costRatio;
      }
  };

  const handleUpdateMaterialFloorEntry = useCallback((materialName: string, floor: number, newQuantity?: number, newUnitPrice?: number) => {
      updateProjectPlanWithHistory(draft => {
          const entry = draft.materialQuantities.find(m => m.material === materialName && m.floor === floor);
          if (entry) {
              if (newQuantity !== undefined && newQuantity >= 0) {
                  if (entry.unit.toLowerCase().includes('bag')) {
                      entry.quantity = Math.round(newQuantity);
                  } else {
                      entry.quantity = newQuantity;
                  }
              }
              if (newUnitPrice !== undefined && newUnitPrice >= 0) entry.unitPrice = newUnitPrice;
          }

          const newTotalMaterialCost = draft.materialQuantities
              .filter(m => m.material === materialName)
              .reduce((sum, m) => sum + (m.quantity * m.unitPrice), 0);
          
          const materialsSection = draft.budgetBreakdown.find(s => s.sectionName === 'Materials');
          if (materialsSection) {
              const materialItem = materialsSection.items.find(i => i.item.toLowerCase().includes(materialName.toLowerCase()));
              if (materialItem) materialItem.cost = newTotalMaterialCost;
          }
          recalculateCosts(draft);
      });
  }, [updateProjectPlanWithHistory]);

  const handleUpdateMaterialTotalQuantity = useCallback((materialName: string, newTotalQuantity: number) => {
      updateProjectPlanWithHistory(draft => {
          const entriesForMaterial = draft.materialQuantities.filter(m => m.material === materialName);
          const unit = entriesForMaterial.length > 0 ? entriesForMaterial[0].unit : '';
          
          if (unit.toLowerCase().includes('bag')) {
              const targetTotal = Math.round(newTotalQuantity);
              const currentTotal = entriesForMaterial.reduce((sum, e) => sum + e.quantity, 0);
              
              if (currentTotal > 0) {
                  const floors = entriesForMaterial.map(entry => {
                      const proportionalQty = (entry.quantity / currentTotal) * targetTotal;
                      return {
                          entry: entry,
                          proportionalQty: proportionalQty,
                          floorQty: Math.floor(proportionalQty),
                          fractionalPart: proportionalQty - Math.floor(proportionalQty)
                      };
                  });

                  let remainder = targetTotal - floors.reduce((sum, f) => sum + f.floorQty, 0);
                  floors.sort((a, b) => b.fractionalPart - a.fractionalPart);

                  for (let i = 0; i < remainder; i++) {
                      floors[i].floorQty += 1;
                  }

                  floors.forEach(floor => {
                      floor.entry.quantity = floor.floorQty;
                  });
              }
          } else {
              const currentTotalQuantity = entriesForMaterial.reduce((sum, m) => sum + m.quantity, 0);
              if (entriesForMaterial.length > 0 && currentTotalQuantity > 0) {
                  const ratio = newTotalQuantity / currentTotalQuantity;
                  entriesForMaterial.forEach(entry => {
                      entry.quantity *= ratio;
                  });
              }
          }
          
          const newTotalMaterialCost = draft.materialQuantities
              .filter(m => m.material === materialName)
              .reduce((sum, m) => sum + (m.quantity * m.unitPrice), 0);
              
          const materialsSection = draft.budgetBreakdown.find(s => s.sectionName === 'Materials');
          if (materialsSection) {
              const materialItem = materialsSection.items.find(i => i.item.toLowerCase().includes(materialName.toLowerCase()));
              if (materialItem) materialItem.cost = newTotalMaterialCost;
          }
          recalculateCosts(draft);
      });
  }, [updateProjectPlanWithHistory]);


  const handleFinalizeEstimate = useCallback(() => {
    setViewMode('deal_closure');
  }, []);

  const handlePayment = useCallback(() => {
    updateProjectPlanWithHistory(draft => {
        draft.paymentStatus = 'Booking Paid';
        const bookingMilestone = draft.paymentSchedule.find(p => p.status === 'Due');
        if (bookingMilestone) bookingMilestone.status = 'Completed';
        
        const nextMilestone = draft.paymentSchedule.find(p => p.status === 'Pending');
        if (nextMilestone) nextMilestone.status = 'Due';
    });
    setViewMode('dashboard');
  }, [updateProjectPlanWithHistory]);
  
  const handleRaiseTicket = useCallback((newTicket: Omit<SupportTicket, 'id' | 'assignedTo' | 'expectedResolution' | 'activity'> & { description: string }) => {
    updateProjectPlanWithHistory(draft => {
        const ticket: SupportTicket = {
            subject: newTicket.subject,
            category: newTicket.category,
            status: newTicket.status,
            id: `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            assignedTo: 'Project Manager',
            expectedResolution: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
            activity: [{ update: `Ticket created. User reported: "${newTicket.description}"`, timestamp: new Date().toISOString() }]
        };
        draft.supportTickets.unshift(ticket);
    });
  }, [updateProjectPlanWithHistory]);


  const handleAddUserNote = useCallback((updateDate: string, note: string) => {
    updateProjectPlanWithHistory(draft => {
      const update = draft.weeklyUpdates.find(u => u.date === updateDate);
      if (update) {
        update.userNotes = note;
      }
    });
  }, [updateProjectPlanWithHistory]);

  const handleBulkUpdateMaterials = useCallback((selectedMaterials: string[], action: 'increase' | 'decrease', type: 'quantity' | 'price', percentage: number) => {
    updateProjectPlanWithHistory(draft => {
        const factor = action === 'increase' ? (1 + percentage / 100) : (1 - percentage / 100);
        
        draft.materialQuantities.forEach(entry => {
            if (selectedMaterials.includes(entry.material)) {
                if (type === 'quantity') {
                    const newQuantity = entry.quantity * factor;
                    if (entry.unit.toLowerCase().includes('bag')) {
                        entry.quantity = Math.round(newQuantity);
                    } else {
                        entry.quantity = newQuantity;
                    }
                } else if (type === 'price') {
                    entry.unitPrice *= factor;
                }
            }
        });

        // After updating all entries, recalculate the total cost for each affected material item in the budget
        selectedMaterials.forEach(materialName => {
             const newTotalMaterialCost = draft.materialQuantities
              .filter(m => m.material === materialName)
              .reduce((sum, m) => sum + (m.quantity * m.unitPrice), 0);
              
            const materialsSection = draft.budgetBreakdown.find(s => s.sectionName === 'Materials');
            if (materialsSection) {
                const materialItem = materialsSection.items.find(i => i.item.toLowerCase().includes(materialName.toLowerCase()));
                if (materialItem) materialItem.cost = newTotalMaterialCost;
            }
        });

        recalculateCosts(draft);
    });
  }, [updateProjectPlanWithHistory]);

  const handleMarkMilestonePaid = useCallback((milestoneName: string) => {
      updateProjectPlanWithHistory(draft => {
          const milestone = draft.paymentSchedule.find(p => p.milestone === milestoneName);
          if (milestone && milestone.status === 'Due') {
              milestone.status = 'Completed';
              const nextPendingIndex = draft.paymentSchedule.findIndex(p => p.status === 'Pending');
              if (nextPendingIndex !== -1) {
                  draft.paymentSchedule[nextPendingIndex].status = 'Due';
              }
          }
      });
  }, [updateProjectPlanWithHistory]);


  const handleReset = useCallback(() => {
    setProjectPlan(null);
    setError(null);
    setHistory([]);
    setHistoryIndex(-1);
    setViewMode('wizard');
    setShowWelcome(true);
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <Loader />;
    }
    if (error) {
       return (
         <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 bg-brand-container backdrop-blur-md rounded-3xl shadow-glass border border-brand-border max-w-lg mx-auto mt-12">
           <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-danger/20">
             <SparklesIcon className="w-8 h-8 text-danger" />
           </div>
           <h2 className="text-xl font-bold text-brand-text mb-4">Blueprint Generation Failed</h2>
           <p className="text-brand-text-muted mb-8 leading-relaxed">{error}</p>
           <motion.button
             onClick={handleReset}
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className="bg-brand-primary text-brand-dark font-bold py-3 px-8 rounded-xl hover:bg-brand-primary-hover transition-all duration-300 shadow-lg shadow-brand-primary/10 flex items-center gap-2 mx-auto"
           >
            <SparklesIcon className="w-5 h-5" />
             Try Again
           </motion.button>
         </motion.div>
       );
    }
    
    if (showWelcome && viewMode === 'wizard' && !projectPlan) {
        return <WelcomeModal onStart={() => setShowWelcome(false)} />;
    }

    switch (viewMode) {
      case 'wizard':
        return <Wizard onSubmit={handleGenerateEstimate} />;
      case 'budget_review':
        return projectPlan && <BudgetReview project={projectPlan} onSendMessage={handleSendMessage} onFinalize={handleFinalizeEstimate} onUpdateMaterialTotalQuantity={handleUpdateMaterialTotalQuantity} onAddAdvisorMessage={handleAddAdvisorMessage} />;
      case 'deal_closure':
        return projectPlan && <DealClosure project={projectPlan} onPayment={handlePayment} onBack={() => setViewMode('budget_review')} />;
      case 'dashboard':
        return projectPlan && <ProjectDashboard project={projectPlan} onReset={handleReset} onRaiseTicket={handleRaiseTicket} onAddUserNote={handleAddUserNote} onUpdateMaterialFloorEntry={handleUpdateMaterialFloorEntry} onUndo={handleUndo} onRedo={handleRedo} canUndo={canUndo} canRedo={canRedo} onBulkUpdateMaterials={handleBulkUpdateMaterials} onMarkMilestonePaid={handleMarkMilestonePaid} />;
      default:
        return <Wizard onSubmit={handleGenerateEstimate} />;
    }
  }

  return (
    <div className="min-h-screen font-sans text-brand-text selection:bg-brand-primary selection:text-brand-dark relative bg-grain">
      <AmbientBackground />
      <Header onLogoClick={handleReset} />
      <main className="p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode + (showWelcome ? '_welcome' : '')}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransition}
            >
              <Suspense fallback={<SuspenseFallback />}>
                {renderContent()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default memo(App);