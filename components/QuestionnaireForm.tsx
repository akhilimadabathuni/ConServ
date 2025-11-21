
// FIX: Corrected import for React hooks to resolve multiple 'Cannot find name' errors.
import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import type { WizardData } from '../types';
import { ArrowRightIcon, ArrowLeftIcon, SparklesIcon, QualityBasicIcon, QualityStandardIcon, QualityPremiumIcon, CheckCircleIcon, BedIcon, BathIcon, FoundationIcon, BricksIcon, TilesIcon, KitchenIcon, ChevronDownIcon, InfoCircleIcon, QualityEcoIcon, QualityLuxuryIcon } from './Icons';

interface WizardProps {
  onSubmit: (data: WizardData) => void;
}

const WIZARD_STEPS = [
    { name: 'Project Basics', description: "Location and size." },
    { name: 'Configuration', description: "Layout and rooms." },
    { name: 'Structure', description: "Quality and materials." },
    { name: 'Finishing', description: "Floors, kitchen, etc." },
    { name: 'Utilities', description: "Power, water, add-ons." },
    { name: 'Final Notes', description: "Unique requirements." }
];

const INDIAN_CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur",
    "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad",
    "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad",
    "Amritsar", "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai",
    "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur", "Hubli-Dharwad", "Mysore", "Tiruchirappalli", "Bareilly",
    "Aligarh", "Tiruppur", "Gurgaon", "Moradabad", "Jalandhar", "Bhubaneswar", "Salem", "Warangal", "Guntur", "Noida"
];

const Accordion: React.FC<React.PropsWithChildren<{ title: React.ReactNode, defaultOpen?: boolean }>> = memo(({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-brand-container backdrop-blur-sm rounded-2xl border border-brand-border overflow-hidden shadow-sm">
            <motion.header
                className="p-4 font-bold text-brand-text cursor-pointer flex justify-between items-center hover:bg-brand-border/30 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                {title}
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                  <ChevronDownIcon className="w-5 h-5 text-brand-text-muted" />
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
                        <div className="p-4">{children}</div>
                    </motion.section>
                )}
            </AnimatePresence>
        </div>
    );
});

const Tooltip: React.FC<{ text: string }> = memo(({ text }) => (
    <div className="group relative inline-block ml-2 align-middle" onClick={(e) => e.stopPropagation()}>
        <InfoCircleIcon className="w-4 h-4 text-brand-text-muted/70 cursor-help hover:text-brand-primary transition-colors" />
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 px-3 py-2 bg-brand-text text-brand-dark rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 text-xs text-center font-medium">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-brand-text"></div>
        </div>
    </div>
));


const OptionCard: React.FC<{ icon: React.ReactNode, title: string, description: string, isSelected: boolean, onClick: () => void }> = memo(({ icon, title, description, isSelected, onClick }) => (
    <motion.button
        type="button"
        onClick={onClick}
        aria-pressed={isSelected}
        whileHover={{ scale: 1.02, y: -2, boxShadow: '0 10px 30px -10px rgba(255, 184, 0, 0.3)' }}
        whileTap={{ scale: 0.98 }}
        animate={{
            borderColor: isSelected ? '#FFB800' : '#5C564D',
            backgroundColor: isSelected ? '#FFB800' : '#403C36',
            boxShadow: isSelected ? '0 0 25px rgba(255, 184, 0, 0.2)' : 'none',
            y: isSelected ? -4 : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`relative text-left w-full p-5 rounded-2xl border-2 focus:outline-none backdrop-blur-sm hover:bg-brand-container/90`}
    >
        {isSelected && <motion.div initial={{scale:0}} animate={{scale:1}}><CheckCircleIcon className="absolute top-3 right-3 w-6 h-6 text-brand-dark" /></motion.div>}
        <div className="flex items-start gap-5">
            <motion.div 
              animate={{ backgroundColor: isSelected ? '#2D2A26' : '#2D2A26', color: isSelected ? '#FFB800' : '#A8A29E' }}
              className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 shadow-sm`}>
                <div className={`w-7 h-7`}>{icon}</div>
            </motion.div>
            <div className="flex-1 min-w-0">
                <p className={`font-bold text-lg transition-colors ${isSelected ? 'text-brand-dark' : 'text-brand-text'}`}>{title}</p>
                <p className={`text-sm font-medium leading-relaxed mt-0.5 break-words ${isSelected ? 'text-brand-dark/80' : 'text-brand-text-muted/80'}`}>{description}</p>
            </div>
        </div>
    </motion.button>
));

const StepperInput: React.FC<{ label: string, value: number, onUpdate: (value: number) => void, icon: React.ReactNode }> = memo(({ label, value, onUpdate, icon }) => (
    <div className="bg-brand-container p-5 rounded-2xl border border-brand-border flex items-center justify-between shadow-sm">
        <label className="text-sm font-bold text-brand-text flex items-center gap-3">{icon} {label}</label>
        <div className="flex items-center gap-3 bg-brand-dark p-1 rounded-xl border border-brand-border/50">
            <motion.button type="button" whileTap={{scale:0.9}} onClick={() => onUpdate(Math.max(1, value - 1))} className="w-9 h-9 flex items-center justify-center font-bold text-xl text-brand-text-muted hover:text-brand-dark hover:bg-brand-primary rounded-lg transition-colors shadow-sm">-</motion.button>
            <span className="w-8 text-center font-bold text-xl text-brand-text tabular-nums">{value}</span>
            <motion.button type="button" whileTap={{scale:0.9}} onClick={() => onUpdate(value + 1)} className="w-9 h-9 flex items-center justify-center font-bold text-xl text-brand-text-muted hover:text-brand-dark hover:bg-brand-primary rounded-lg transition-colors shadow-sm">+</motion.button>
        </div>
    </div>
));

const ToggleSwitch: React.FC<{ label: string, description: string, checked: boolean, onChange: (checked: boolean) => void }> = memo(({ label, description, checked, onChange }) => (
    <div 
        className="flex items-start justify-between p-5 bg-brand-container backdrop-blur-sm rounded-2xl border border-brand-border transition-all duration-300 hover:shadow-sm hover:bg-brand-container/80 cursor-pointer select-none group"
        onClick={(e) => {
            // Prevent toggling if the click is on the tooltip itself
            if ((e.target as HTMLElement).closest('.group')) {
                onChange(!checked);
            }
        }}
    >
        <div className="flex-1 pr-4">
            <div className="font-bold text-brand-text flex items-center text-lg">{label} <Tooltip text={description} /></div>
            <p className="text-sm text-brand-text-muted mt-1">{description}</p>
        </div>
        <motion.div 
          className={`relative inline-flex flex-shrink-0 h-8 w-14 items-center rounded-full transition-colors focus:outline-none mt-1`}
          animate={{ backgroundColor: checked ? '#FFB800' : '#5C564D' }}
        >
            <motion.span 
              layout 
              transition={{ type: "spring", stiffness: 700, damping: 30 }}
              className={`inline-block h-6 w-6 rounded-full bg-brand-text shadow-md`}
              animate={{ x: checked ? 26 : 4 }}
            />
        </motion.div>
    </div>
));

export const Wizard: React.FC<WizardProps> = ({ onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [formData, setFormData] = useState<Partial<WizardData>>({
    location: 'Bangalore',
    plotArea: 1200,
    floors: 1,
    isDuplex: false,
    bedrooms: 3,
    bathrooms: 3,
    additionalRooms: ['Pooja Room', 'Store Room'],
    constructionQuality: 'Standard',
    foundationType: 'Standard Raft',
    wallType: 'Red Bricks',
    flooringType: 'Vitrified Tiles',
    hasFalseCeiling: true,
    kitchenType: 'Modular',
    doorWindowMaterial: 'Teak Wood Frame',
    electricalSpec: 'Standard (ISI Brands)',
    hasSump: true,
    hasSolar: false,
    hasCompoundWall: true,
    additionalNotes: 'Looking for a modern design with good natural light and an open kitchen concept.',
  });
  
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, location: value }));
    if (value) {
        const filteredCities = INDIAN_CITIES.filter(city => city.toLowerCase().startsWith(value.toLowerCase())).slice(0, 5);
        setLocationSuggestions(filteredCities);
    } else {
        setLocationSuggestions([]);
    }
  };

  const selectLocation = (location: string) => {
    setFormData(prev => ({ ...prev, location }));
    setLocationSuggestions([]);
  };

  const validateStep = (): boolean => {
    const newErrors: { [key:string]: string } = {};
    if (currentStep === 0) {
        if (!formData.location?.trim()) newErrors.location = 'Location is required.';
        else if (!INDIAN_CITIES.some(c => c.toLowerCase() === formData.location?.toLowerCase())) newErrors.location = 'Please select a valid city from the list.';
        if (!formData.plotArea || formData.plotArea < 500) newErrors.plotArea = 'Plot area must be at least 500 sq ft.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setDirection(1);
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep()) {
      onSubmit(formData as WizardData);
    }
  };
  
  const summaryItems = useMemo(() => [
    { label: 'Location', value: formData.location },
    { label: 'Plot Area', value: `${formData.plotArea} sq ft` },
    { label: 'Floors', value: `G + ${(formData.floors ?? 1) - 1}` },
    { label: 'Quality', value: formData.constructionQuality },
    { label: 'Rooms', value: `${formData.bedrooms} Bed, ${formData.bathrooms} Bath` },
  ], [formData]);

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };
  
  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  
  const renderStepContent = () => {
      const stepContentVariants: Variants = {
          initial: (direction: number) => ({ opacity: 0, x: direction > 0 ? 50 : -50 }),
          animate: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200, damping: 25, staggerChildren: 0.05 } },
          exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -50 : 50 }),
      };
      
      const formItemVariants: Variants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 250, damping: 25 } },
      };

      return (
        <AnimatePresence mode="wait" custom={direction}>
            <motion.div
                key={currentStep}
                custom={direction}
                variants={stepContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="pt-2"
            >
              {(() => {
                switch(currentStep) {
                    case 0:
                      return (
                          <motion.div variants={stepContentVariants} className="space-y-8">
                              <motion.div variants={formItemVariants} className="relative">
                                  <label htmlFor="location" className="block text-sm font-bold text-brand-text-muted mb-2 uppercase tracking-wider">Job Site Location (City)</label>
                                  <input type="text" id="location" value={formData.location} onChange={handleLocationChange} autoComplete="off" className="w-full px-6 py-4 bg-brand-dark border-2 border-brand-border rounded-2xl text-lg font-semibold focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all duration-300 placeholder-brand-text-muted/30 shadow-sm text-brand-text" placeholder="e.g. Bangalore" />
                                  {locationSuggestions.length > 0 && <ul className="absolute z-50 w-full mt-2 bg-brand-container border border-brand-border rounded-xl shadow-glass overflow-hidden">{locationSuggestions.map(city => <li key={city} onClick={() => selectLocation(city)} className="px-6 py-3 cursor-pointer hover:bg-brand-dark hover:text-brand-primary border-b border-brand-border/30 last:border-0 transition-colors">{city}</li>)}</ul>}
                                  {errors.location && <p className="text-danger text-xs mt-2 font-semibold pl-2">{errors.location}</p>}
                              </motion.div>
                              
                              <motion.div variants={formItemVariants} className="p-6 bg-brand-container backdrop-blur-sm rounded-2xl border border-brand-border shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-center mb-6">
                                      <label htmlFor="plotArea" className="text-sm font-bold text-brand-text-muted uppercase tracking-wider">Plot Area <Tooltip text="Total area of the land in square feet."/></label>
                                      <motion.span key={formData.plotArea} initial={{scale:1.2, color:'#FFB800'}} animate={{scale:1, color:'#F5F5F5'}} className="px-4 py-1 text-lg font-bold bg-brand-dark rounded-lg shadow-sm">{formData.plotArea?.toLocaleString('en-IN')} sq. ft.</motion.span>
                                  </div>
                                  <input type="range" id="plotArea" min="500" max="5000" step="100" value={formData.plotArea} onChange={(e) => setFormData({ ...formData, plotArea: parseInt(e.target.value, 10) })} className="w-full" />
                                  <div className="flex justify-between text-xs text-brand-text-muted mt-3 font-medium"><span>500</span><span>5000+</span></div>
                                  {errors.plotArea && <p className="text-danger text-xs mt-2 font-semibold">{errors.plotArea}</p>}
                              </motion.div>

                               <motion.div variants={formItemVariants} className="p-6 bg-brand-container backdrop-blur-sm rounded-2xl border border-brand-border shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-center mb-6">
                                      <label htmlFor="floors" className="text-sm font-bold text-brand-text-muted uppercase tracking-wider">Number of Floors</label>
                                      <motion.span key={formData.floors} initial={{scale:1.2, color:'#FFB800'}} animate={{scale:1, color:'#F5F5F5'}} className="px-4 py-1 text-lg font-bold bg-brand-dark rounded-lg shadow-sm">G + {(formData.floors ?? 1) - 1}</motion.span>
                                  </div>
                                  <input type="range" id="floors" min="1" max="6" step="1" value={formData.floors} onChange={(e) => setFormData({ ...formData, floors: parseInt(e.target.value, 10) })} className="w-full" />
                                   <div className="flex justify-between text-xs text-brand-text-muted mt-3 font-medium"><span>G (1)</span><span>G+5 (6)</span></div>
                              </motion.div>
                          </motion.div>
                      );
                  case 1:
                      return (
                           <motion.div variants={stepContentVariants} className="space-y-8">
                              <motion.div variants={formItemVariants} className="grid sm:grid-cols-2 gap-6">
                                 <StepperInput label="Bedrooms" value={formData.bedrooms || 1} onUpdate={val => setFormData({...formData, bedrooms: val})} icon={<BedIcon className="w-5 h-5 text-brand-primary" />} />
                                 <StepperInput label="Bathrooms" value={formData.bathrooms || 1} onUpdate={val => setFormData({...formData, bathrooms: val})} icon={<BathIcon className="w-5 h-5 text-brand-primary" />} />
                              </motion.div>
                              <motion.fieldset variants={formItemVariants}>
                                   <legend className="block text-sm font-bold text-brand-text-muted mb-4 uppercase tracking-wider">Additional Rooms</legend>
                                   <div className="grid sm:grid-cols-2 gap-3">
                                      {['Pooja Room', 'Store Room', 'Office', 'Gym', 'Home Theatre'].map(room => (
                                          <motion.button type="button" key={room} aria-pressed={formData.additionalRooms?.includes(room)} onClick={() => {
                                              const currentRooms = formData.additionalRooms || [];
                                              const newRooms = currentRooms.includes(room) ? currentRooms.filter(r => r !== room) : [...currentRooms, room];
                                              setFormData({...formData, additionalRooms: newRooms});
                                          }}
                                          whileHover={{ y: -2, borderColor: '#FFB800' }}
                                          whileTap={{ scale: 0.98 }}
                                          className={`w-full text-left p-4 rounded-xl font-bold transition-all duration-200 flex items-center gap-4 border-2 shadow-sm backdrop-blur-sm ${formData.additionalRooms?.includes(room) ? 'bg-brand-primary border-brand-primary text-brand-dark shadow-glow' : 'bg-brand-container border-brand-border text-brand-text hover:bg-brand-container/80'}`}>
                                              <span className={`w-6 h-6 rounded-full flex-shrink-0 border-2 flex items-center justify-center transition-all duration-200 ${formData.additionalRooms?.includes(room) ? 'bg-brand-dark border-brand-dark' : 'border-brand-border bg-brand-dark'}`}>
                                                  {formData.additionalRooms?.includes(room) && <motion.span initial={{scale:0}} animate={{scale:1}} className="w-2.5 h-2.5 rounded-full bg-brand-primary"></motion.span>}
                                              </span>
                                              {room}
                                          </motion.button>
                                      ))}
                                   </div>
                              </motion.fieldset>
                          </motion.div>
                      );
                  case 2:
                      return (
                          <motion.div variants={stepContentVariants} className="space-y-8">
                              <motion.fieldset variants={formItemVariants}>
                                  <legend className="text-base font-bold text-brand-text-muted mb-4">Construction Quality</legend>
                                  <div className="grid gap-4">
                                      <OptionCard 
                                          icon={<QualityBasicIcon />} 
                                          title="Basic" 
                                          description="Cost-effective materials for functional spaces." 
                                          isSelected={formData.constructionQuality === 'Basic'} 
                                          onClick={() => setFormData({...formData, constructionQuality: 'Basic', foundationType: 'Isolated Footing', wallType: 'Concrete Blocks'})} 
                                      />
                                      <OptionCard 
                                          icon={<QualityStandardIcon />} 
                                          title="Standard" 
                                          description="High-quality branded materials for durability." 
                                          isSelected={formData.constructionQuality === 'Standard'} 
                                          onClick={() => setFormData({...formData, constructionQuality: 'Standard', foundationType: 'Standard Raft', wallType: 'Red Bricks'})} 
                                      />
                                      <OptionCard 
                                          icon={<QualityPremiumIcon />} 
                                          title="Premium" 
                                          description="Luxury finishes and top-of-the-line fixtures." 
                                          isSelected={formData.constructionQuality === 'Premium'} 
                                          onClick={() => setFormData({...formData, constructionQuality: 'Premium', foundationType: 'Standard Raft', wallType: 'Red Bricks'})} 
                                      />
                                       <OptionCard 
                                          icon={<QualityEcoIcon />} 
                                          title="Eco-Friendly" 
                                          description="Sustainable materials and green building practices." 
                                          isSelected={formData.constructionQuality === 'Eco-Friendly'} 
                                          onClick={() => setFormData({...formData, constructionQuality: 'Eco-Friendly', foundationType: 'Standard Raft', wallType: 'AAC Blocks', hasSolar: true })} 
                                      />
                                       <OptionCard 
                                          icon={<QualityLuxuryIcon />} 
                                          title="Luxury" 
                                          description="The finest materials, custom details, and smart features." 
                                          isSelected={formData.constructionQuality === 'Luxury'} 
                                          onClick={() => setFormData({...formData, constructionQuality: 'Luxury', foundationType: 'Standard Raft', wallType: 'Red Bricks', flooringType: 'Marble'})} 
                                      />
                                  </div>
                              </motion.fieldset>

                              <AnimatePresence>
                                {(formData.constructionQuality === 'Standard' || formData.constructionQuality === 'Premium' || formData.constructionQuality === 'Eco-Friendly' || formData.constructionQuality === 'Luxury') && (
                                   <motion.fieldset 
                                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                      animate={{ opacity: 1, height: 'auto', marginTop: '2rem' }}
                                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                                      className="p-6 border border-brand-border/50 rounded-2xl overflow-hidden bg-brand-container/50 backdrop-blur-sm">
                                      <legend className="text-xs font-bold text-brand-primary mb-4 px-3 py-1 bg-brand-primary/10 rounded-full uppercase tracking-wider">Structure Configuration</legend>
                                      <div className="grid md:grid-cols-2 gap-x-6 gap-y-8">
                                          <div className="space-y-4">
                                              <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider block">Foundation Type</label>
                                              <OptionCard 
                                                  icon={<FoundationIcon/>} 
                                                  title="Isolated Footing" 
                                                  description="Economical, for firm soil." 
                                                  isSelected={formData.foundationType === 'Isolated Footing'} 
                                                  onClick={() => setFormData({...formData, foundationType: 'Isolated Footing'})} 
                                              />
                                              <OptionCard 
                                                  icon={<FoundationIcon/>} 
                                                  title="Standard Raft" 
                                                  description="Superior stability for all soil." 
                                                  isSelected={formData.foundationType === 'Standard Raft'} 
                                                  onClick={() => setFormData({...formData, foundationType: 'Standard Raft'})} 
                                              />
                                          </div>
                                          <div className="space-y-4">
                                              <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider block">Wall Material</label>
                                               <OptionCard 
                                                  icon={<BricksIcon/>} 
                                                  title="Concrete Blocks" 
                                                  description="Faster construction, cost-effective." 
                                                  isSelected={formData.wallType === 'Concrete Blocks'} 
                                                  onClick={() => setFormData({...formData, wallType: 'Concrete Blocks'})} 
                                              />
                                               <OptionCard 
                                                  icon={<BricksIcon/>} 
                                                  title="Red Bricks" 
                                                  description="Traditional, robust, thermal comfort." 
                                                  isSelected={formData.wallType === 'Red Bricks'} 
                                                  onClick={() => setFormData({...formData, wallType: 'Red Bricks'})} 
                                              />
                                              <OptionCard 
                                                  icon={<BricksIcon/>} 
                                                  title="AAC Blocks" 
                                                  description="Lightweight, eco-friendly, insulating." 
                                                  isSelected={formData.wallType === 'AAC Blocks'} 
                                                  onClick={() => setFormData({...formData, wallType: 'AAC Blocks'})} 
                                              />
                                          </div>
                                      </div>
                                   </motion.fieldset>
                                )}
                              </AnimatePresence>
                          </motion.div>
                      )
                  case 3:
                      return (
                          <motion.div variants={stepContentVariants} className="space-y-8">
                              <motion.fieldset variants={formItemVariants}>
                                  <legend className="text-base font-bold text-brand-text-muted mb-4">Flooring Type</legend>
                                  <div className="grid sm:grid-cols-2 gap-4">
                                      <OptionCard icon={<TilesIcon/>} title="Vitrified Tiles" description="Durable, low-maintenance." isSelected={formData.flooringType === 'Vitrified Tiles'} onClick={() => setFormData({...formData, flooringType: 'Vitrified Tiles'})} />
                                       <OptionCard icon={<TilesIcon/>} title="Marble" description="Elegant, natural stone." isSelected={formData.flooringType === 'Marble'} onClick={() => setFormData({...formData, flooringType: 'Marble'})} />
                                  </div>
                              </motion.fieldset>
                               <motion.fieldset variants={formItemVariants}>
                                  <legend className="text-base font-bold text-brand-text-muted mb-4">Kitchen & Ceiling</legend>
                                  <div className="space-y-4">
                                      <OptionCard icon={<KitchenIcon/>} title="Modular Kitchen" description="Modern, efficient, with pre-made cabinets." isSelected={formData.kitchenType === 'Modular'} onClick={() => setFormData({...formData, kitchenType: 'Modular'})} />
                                      <ToggleSwitch label="False Ceiling" description="Adds a modern touch and hides wiring." checked={!!formData.hasFalseCeiling} onChange={val => setFormData({...formData, hasFalseCeiling: val})} />
                                  </div>
                              </motion.fieldset>
                          </motion.div>
                      );
                  case 4:
                      return (
                          <motion.div variants={stepContentVariants} className="space-y-4">
                              <motion.div variants={formItemVariants}><ToggleSwitch label="Water Sump" description="Underground water storage tank for reliable supply." checked={!!formData.hasSump} onChange={val => setFormData({...formData, hasSump: val})} /></motion.div>
                              <motion.div variants={formItemVariants}><ToggleSwitch label="Solar Panels" description="Renewable energy system to reduce electricity bills." checked={!!formData.hasSolar} onChange={val => setFormData({...formData, hasSolar: val})} /></motion.div>
                              <motion.div variants={formItemVariants}><ToggleSwitch label="Compound Wall" description="Boundary wall for security and privacy." checked={!!formData.hasCompoundWall} onChange={val => setFormData({...formData, hasCompoundWall: val})} /></motion.div>
                          </motion.div>
                      );
                  default:
                       return (
                           <motion.div variants={stepContentVariants} className="space-y-4">
                              <motion.label variants={formItemVariants} htmlFor="notes" className="text-base font-bold text-brand-text-muted">Additional Notes</motion.label>
                              <motion.div variants={formItemVariants} className="relative">
                                  <textarea id="notes" value={formData.additionalNotes} onChange={e => setFormData({...formData, additionalNotes: e.target.value})} rows={8} className="w-full px-6 py-4 bg-brand-dark border-2 border-brand-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all duration-300 text-brand-text text-base shadow-sm" placeholder="Tell us more about your dream project..."></textarea>
                                  <div className="absolute bottom-4 right-4 text-xs text-brand-text-muted font-bold bg-brand-container px-2 py-1 rounded">Optional</div>
                              </motion.div>
                              <motion.p variants={formItemVariants} className="text-brand-text-muted text-xs italic pl-2">Example: "I need a dedicated EV charging point in the car park," or "The master bathroom should have a bathtub."</motion.p>
                           </motion.div>
                       )
                }
              })()}
            </motion.div>
        </AnimatePresence>
      );
  }

  return (
    <motion.div 
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-10 gap-6 lg:gap-12 mt-6">
      {/* Left Panel: Summary */}
      <motion.div variants={itemVariants} className="lg:col-span-3 hidden lg:block">
        <div className="sticky top-28 space-y-8">
             <div className="p-6 bg-brand-container/80 backdrop-blur-md rounded-3xl border border-brand-border shadow-soft">
                 <h3 className="font-bold text-brand-text uppercase tracking-widest text-xs mb-6 flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-brand-primary"/> Blueprint Summary</h3>
                 <motion.div
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4">
                    {summaryItems.map(item => (
                        <motion.div variants={itemVariants} key={item.label} className="flex justify-between items-center text-sm border-b border-brand-border/50 pb-3 last:border-0">
                            <span className="text-brand-text-muted font-medium">{item.label}</span>
                            <span className="font-bold text-brand-text text-right">{item.value}</span>
                        </motion.div>
                    ))}
                 </motion.div>
             </div>
        </div>
      </motion.div>
      
      {/* Right Panel: Form Steps */}
      <motion.div variants={itemVariants} className="lg:col-span-7 bg-brand-container/80 backdrop-blur-xl p-6 sm:p-10 rounded-3xl shadow-glass border border-brand-border flex flex-col min-h-[600px]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 flex-grow">
            {/* Vertical Stepper */}
            <div className="md:col-span-4 border-r border-brand-border/50 pr-6 hidden md:block">
                <h2 className="text-2xl font-extrabold text-brand-text mb-8 uppercase tracking-widest leading-tight">Blueprint<br/><span className="text-brand-primary">Wizard</span></h2>
                <nav aria-label="Wizard steps">
                    <ol className="space-y-8 relative">
                         <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-brand-border/60 -z-10"></div>
                        {WIZARD_STEPS.map((step, index) => (
                            <li key={step.name}>
                                <button onClick={() => setCurrentStep(index)} disabled={index > currentStep} className="flex items-start text-left w-full disabled:cursor-not-allowed group relative">
                                    <div className="flex flex-col items-center mr-4">
                                        <motion.div
                                            animate={{
                                                backgroundColor: currentStep === index ? '#FFB800' : currentStep > index ? '#10B981' : '#2D2A26',
                                                borderColor: currentStep === index ? '#FFB800' : currentStep > index ? '#10B981' : '#5C564D',
                                                scale: currentStep === index ? 1.1 : 1,
                                                boxShadow: currentStep === index ? '0 0 15px rgba(255, 184, 0, 0.4)' : 'none'
                                            }}
                                            className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 z-10 text-brand-text shadow-sm">
                                            {currentStep > index ? <CheckCircleIcon className="w-5 h-5 text-brand-dark"/> : <span className={currentStep === index ? 'text-brand-dark' : 'text-brand-text-muted'}>{index + 1}</span>}
                                        </motion.div>
                                    </div>
                                    <div className="pt-1">
                                        <p className={`font-bold text-sm transition-colors duration-300 ${currentStep === index ? 'text-brand-text' : 'text-brand-text-muted group-hover:text-brand-text'}`}>{step.name}</p>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>

            {/* Form Content */}
            <div className="md:col-span-8 flex flex-col h-full">
                 {/* Mobile Header */}
                 <div className="md:hidden mb-8">
                    <div className="flex justify-between items-center mb-4">
                         <h2 className="text-xl font-bold text-brand-text uppercase tracking-tight">Step {currentStep + 1} <span className="text-brand-text-muted text-base font-normal normal-case">of {WIZARD_STEPS.length}</span></h2>
                         <div className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full">{WIZARD_STEPS[currentStep].name}</div>
                    </div>
                    <div className="w-full bg-brand-border h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-brand-primary shadow-glow"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                 </div>

                <div className="lg:hidden mb-6">
                    <Accordion title="Live Blueprint Summary">
                        <motion.div
                            variants={listVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-2">
                            {summaryItems.map(item => (
                                <motion.div variants={itemVariants} key={item.label} className="flex justify-between text-sm">
                                    <span className="text-brand-text-muted">{item.label}</span>
                                    <span className="font-semibold text-brand-text text-right">{item.value}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </Accordion>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="flex-grow">
                      {renderStepContent()}
                    </div>

                    <div className="pt-10 mt-auto flex justify-between items-center gap-4">
                      <motion.button type="button" onClick={handleBack} disabled={currentStep === 0} whileTap={{scale:0.95}} className="flex items-center gap-2 text-brand-text-muted font-bold py-3 px-4 rounded-xl hover:text-brand-text hover:bg-brand-dark transition-colors disabled:opacity-0 disabled:cursor-not-allowed">
                          <ArrowLeftIcon className="w-5 h-5"/>
                          Back
                      </motion.button>
                      {currentStep < WIZARD_STEPS.length - 1 ? (
                           <motion.button type="button" onClick={handleNext} whileTap={{scale:0.95}} whileHover={{ scale: 1.02 }} className="flex items-center gap-2 bg-brand-primary text-brand-dark font-bold py-3 px-8 rounded-xl hover:bg-brand-primary-hover transition-all shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30">
                              Next Step
                              <ArrowRightIcon className="w-5 h-5"/>
                          </motion.button>
                      ) : (
                          <motion.button 
                            type="submit" 
                            className="bg-gradient-to-r from-brand-primary to-amber-500 text-brand-dark font-bold py-4 px-10 rounded-xl transition-all flex items-center gap-3 uppercase tracking-widest shadow-lg shadow-brand-primary/30 text-sm"
                            whileHover={{ scale: 1.05, boxShadow: '0px 0px 25px rgba(255, 184, 0, 0.5)' }}
                            whileTap={{ scale: 0.98 }}
                          >
                              Generate Blueprint
                              <SparklesIcon className="w-5 h-5 animate-pulse" />
                          </motion.button>
                      )}
                    </div>
                </form>
            </div>
          </div>
      </motion.div>
    </motion.div>
  );
};