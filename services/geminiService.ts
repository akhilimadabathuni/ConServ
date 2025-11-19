


import { GoogleGenAI, Type } from "@google/genai";
import type { WizardData, ProjectPlan, SupportTicket } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        if (retries > 0) {
            // Check for specific retryable errors, e.g., rate limiting
            if (error.message.includes('429') || error.message.includes('503')) {
                console.warn(`API call failed, retrying in ${delay}ms... (${retries} retries left)`);
                await new Promise(res => setTimeout(res, delay));
                return withRetry(fn, retries - 1, delay * 2); // Exponential backoff
            }
        }
        throw error;
    }
};

const safeParseJSON = (jsonString: string): any => {
    // LLMs sometimes wrap JSON in markdown, so we strip it.
    const sanitizedString = jsonString.replace(/^```json\s*/, '').replace(/```$/, '');
    try {
        return JSON.parse(sanitizedString);
    } catch (error) {
        console.error("Failed to parse JSON response:", sanitizedString);
        throw new Error("Invalid response structure from the service.");
    }
};


// This is a highly complex schema that mirrors the new ProjectPlan type
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: 'A unique project ID.' },
    totalCost: { type: Type.NUMBER, description: 'Total estimated construction cost in INR, localized to the city.' },
    costPerSqFt: { type: Type.NUMBER, description: 'Average cost per square foot in INR.' },
    budgetBreakdown: {
      type: Type.ARRAY,
      description: "A detailed, itemized budget broken down into key construction sections.",
      items: {
        type: Type.OBJECT,
        properties: {
          sectionName: { type: Type.STRING, enum: ['Structure', 'Materials', 'Labour', 'Electrical', 'Plumbing', 'Finishing', 'Miscellaneous'] },
          totalCost: { type: Type.NUMBER },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item: { type: Type.STRING },
                cost: { type: Type.NUMBER },
                details: { type: Type.STRING },
                floorBreakdown: {
                    type: Type.ARRAY,
                    description: "If applicable, a breakdown of this item's cost per floor.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            floor: { type: Type.STRING, description: "e.g., Foundation, Ground Floor, First Floor" },
                            cost: { type: Type.NUMBER }
                        },
                        required: ['floor', 'cost']
                    }
                }
              },
              required: ['item', 'cost']
            }
          }
        },
        required: ['sectionName', 'totalCost', 'items']
      }
    },
    chatHistory: {
      type: Type.ARRAY,
      description: "A sample chat history to begin the negotiation. Start with one message from the 'advisor'.",
      items: {
        type: Type.OBJECT,
        properties: {
          sender: { type: Type.STRING, enum: ['user', 'advisor'] },
          text: { type: Type.STRING },
          timestamp: { type: Type.STRING, description: 'ISO format timestamp' },
        },
        required: ['sender', 'text', 'timestamp']
      }
    },
    paymentSchedule: {
        type: Type.ARRAY,
        description: "A milestone-based payment schedule. The first milestone must be the 'Booking Amount' (10% of total) and its status must be 'Due'. All other milestones must have a status of 'Pending'.",
        items: {
            type: Type.OBJECT,
            properties: {
                milestone: { type: Type.STRING },
                percentage: { type: Type.NUMBER },
                amount: { type: Type.NUMBER },
                status: { type: Type.STRING, enum: ['Completed', 'Due', 'Pending'] },
            },
            required: ['milestone', 'percentage', 'amount', 'status']
        }
    },
    paymentStatus: { type: Type.STRING, enum: ['Pending Booking', 'Booking Paid', 'Fully Paid'], description: "Initial status is always 'Pending Booking'." },
    timeline: {
      type: Type.ARRAY,
      description: "A projected timeline of major construction stages.",
      items: {
        type: Type.OBJECT,
        properties: {
          stage: { type: Type.STRING },
          expectedDate: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['Completed', 'In Progress', 'Pending', 'Delayed'] },
        },
        required: ['stage', 'expectedDate', 'status']
      }
    },
    weeklyUpdates: {
      type: Type.ARRAY,
      description: "Sample weekly updates to simulate a project in progress. Create 1-2 updates for the initial stages.",
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          engineerNotes: { type: Type.STRING },
          photos: { type: Type.ARRAY, items: { type: Type.STRING, description: 'Unsplash URL of a construction photo.' } },
          materialLogs: { type: Type.STRING },
        },
        required: ['date', 'engineerNotes', 'photos', 'materialLogs']
      }
    },
    supportTickets: {
        type: Type.ARRAY,
        description: "A list of 1-2 sample support tickets to demonstrate the feature.",
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING, description: 'A unique ticket ID.' },
                subject: { type: Type.STRING },
                category: { type: Type.STRING, enum: ['Material', 'Work Quality', 'Delay', 'Safety', 'Other'] },
                status: { type: Type.STRING, enum: ['Open', 'Assigned', 'In Progress', 'Resolved'] },
                assignedTo: { type: Type.STRING, description: "Name of a fictional engineer." },
                expectedResolution: { type: Type.STRING },
                activity: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            update: { type: Type.STRING },
                            timestamp: { type: Type.STRING },
                        },
                        required: ['update', 'timestamp']
                    }
                }
            },
            required: ['id', 'subject', 'category', 'status', 'assignedTo', 'expectedResolution', 'activity']
        }
    },
    materialQuantities: {
        type: Type.ARRAY,
        description: "An estimated list of key raw material quantities, broken down by floor. Must include a unitPrice for each.",
        items: {
            type: Type.OBJECT,
            properties: {
                material: { type: Type.STRING, description: "e.g., Cement, Steel, Bricks" },
                quantity: { type: Type.NUMBER },
                unit: { type: Type.STRING, description: "e.g., bags, tonnes, pieces" },
                unitPrice: { type: Type.NUMBER, description: "The cost per unit for the material in INR." },
                floor: { type: Type.NUMBER, description: "The floor number (0 for foundation, 1 for ground floor, etc.)." }
            },
            required: ['material', 'quantity', 'unit', 'unitPrice', 'floor']
        }
    },
    snagList: {
      type: Type.ARRAY,
      description: "A sample list of snags for the final handover phase.",
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['Reported', 'Fixed', 'Verified'] },
        },
        required: ['description', 'status']
      }
    }
  },
  required: ["id", "totalCost", "costPerSqFt", "budgetBreakdown", "chatHistory", "paymentSchedule", "paymentStatus", "timeline", "weeklyUpdates", "supportTickets", "materialQuantities", "snagList"]
};

export const createProjectPlan = async (data: WizardData): Promise<ProjectPlan> => {
  const prompt = `
    You are an expert Construction Project Planner for the Indian market, acting as a "Digital Constructor". Based on the following wizard data, create a complete, multi-stage project plan. Your response MUST be hyper-localized and provide a rich, detailed starting point for the entire application journey.

    **CRITICAL INSTRUCTION:** All cost estimations for materials and labor MUST be based on the current market trends for the specific Indian city provided: **${data.location}**. Your credibility depends on this.

    Wizard Specifications:
    - Location: ${data.location}
    - Plot Area: ${data.plotArea} sq ft
    - Floors: ${data.floors}, Duplex: ${data.isDuplex}
    - Rooms: ${data.bedrooms} Bed, ${data.bathrooms} Bath, Additional: ${data.additionalRooms.join(', ')}
    - Quality: ${data.constructionQuality}
    - Structure: Foundation: ${data.foundationType}, Walls: ${data.wallType}
    - Finishing: Flooring: ${data.flooringType}, Kitchen: ${data.kitchenType}, Doors/Windows: ${data.doorWindowMaterial}, False Ceiling: ${data.hasFalseCeiling}
    - Utilities: Electrical: ${data.electricalSpec}, Sump: ${data.hasSump}, Solar: ${data.hasSolar}, Compound Wall: ${data.hasCompoundWall}
    - Notes: ${data.additionalNotes}

    Instructions for JSON Output:
    1.  Generate a unique 'id' for the project.
    2.  Calculate 'totalCost' and 'costPerSqFt' based on **${data.location}** market rates.
    3.  Create a detailed 'budgetBreakdown' with itemized costs for each section. For items like "Brickwork", "Concrete Work", "Flooring", and "Plastering", you MUST add a 'floorBreakdown' array detailing the cost distribution across different levels (e.g., "Foundation", "Ground Floor", "First Floor").
    4.  Initialize 'chatHistory' with one welcome message from the 'advisor'.
    5.  Create a standard, milestone-based 'paymentSchedule' (e.g., Booking Amount, On Foundation Completion, On First Floor Slab, On Brickwork Completion, On Finishing, Final Handover). The first payment MUST be a 10% booking amount, named "Booking Amount", with status 'Due'. All subsequent payments MUST have a status of 'Pending'.
    6.  Set 'paymentStatus' to "Pending Booking".
    7.  Create a realistic project 'timeline' with statuses. Make the first stage "In Progress" and others "Pending".
    8.  Create 1-2 sample 'weeklyUpdates' with Unsplash photo URLs.
    9.  Create 1-2 sample 'supportTickets' with realistic details.
    10. Create a small, sample 'snagList' for the handover phase.
    11. Based on the project specifications, provide a realistic estimate for the quantities of key materials (Cement, Steel, Bricks, Sand, Aggregate). For each material, you MUST include a realistic 'unitPrice' based on ${data.location} market rates. **Crucially, you must break down these quantities by floor.** For each material, provide a separate JSON object for the foundation (use 'floor': 0), and then for each subsequent floor (e.g., 'floor': 1 for the ground floor, 'floor': 2 for the first floor, and so on, up to the total number of floors). Add all these detailed entries to the 'materialQuantities' array. **IMPORTANT: For materials with 'bags' as the unit, the quantity MUST be a whole number (integer).**
    12. Ensure the entire output is a single, valid JSON object that strictly follows the provided schema. Do not include any text before or after the JSON.
  `;
  
  const generate = async () => {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.2,
          },
        });

        const jsonText = response.text.trim();
        const result = safeParseJSON(jsonText);
        
        // Add wizardData back into the final object, as the model doesn't need to generate it.
        result.wizardData = data;
        
        if (!result.totalCost || !result.budgetBreakdown) {
          throw new Error("Invalid response structure from the service.");
        }

        return result as ProjectPlan;

      } catch (error) {
        console.error("Error fetching or parsing Gemini response:", error);
        throw new Error("Failed to get a valid project plan from the service.");
      }
  };
  
  return withRetry(generate);
};

const generateSuggestion = async (prompt: string): Promise<string> => {
   const generate = async () => {
       try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: {
            temperature: 0.5,
            thinkingConfig: { thinkingBudget: 32768 },
          },
        });

        return response.text.trim();
      } catch (error) {
        console.error("Error fetching Gemini suggestion:", error);
        throw new Error("Failed to get suggestions from the service.");
      }
   };
   return withRetry(generate);
}

export const getCostSavingSuggestions = async (projectPlan: ProjectPlan): Promise<string> => {
  const prompt = `
    You are an expert Indian construction cost consultant. A user has generated a project plan and is looking for ways to reduce the total cost. 
    Analyze their plan, especially the budget breakdown and wizard specifications. 
    Provide actionable, specific, and practical cost-saving suggestions without significantly compromising the specified quality level.
    Present your suggestions in a friendly, conversational tone.
    Format your response as a single, coherent message, using markdown for lists. Start with "I've analyzed your plan and here are a few ideas to optimize the budget:".
    
    Project Context:
    - Location: ${projectPlan.wizardData.location}
    - Quality: ${projectPlan.wizardData.constructionQuality}
    - Total Cost: ${projectPlan.totalCost}
    - Budget Breakdown: ${JSON.stringify(projectPlan.budgetBreakdown.map(b => ({ section: b.sectionName, cost: b.totalCost})), null, 2)}
    - Key Specs: ${JSON.stringify(projectPlan.wizardData, null, 2)}
  `;
  return generateSuggestion(prompt);
};

export const getMaterialAlternativeSuggestions = async (projectPlan: ProjectPlan): Promise<string> => {
  const prompt = `
    You are an expert Indian construction materials engineer. A user is reviewing their project plan.
    Analyze their specifications (quality, wall type, flooring, etc.) and suggest 1-2 interesting alternative materials. 
    Focus on options that offer better value, durability, or unique aesthetics for their specified quality level ('${projectPlan.wizardData.constructionQuality}').
    For example, suggest AAC blocks instead of red bricks and explain the benefits, or compare vitrified tiles to polished concrete.
    Present your suggestions in a friendly, conversational tone.
    Format your response as a single, coherent message, using markdown for comparisons. Start with "Considering your project goals, here are some interesting material alternatives to think about:".
    
    Project Context:
    - Location: ${projectPlan.wizardData.location}
    - Quality: ${projectPlan.wizardData.constructionQuality}
    - Walls: ${projectPlan.wizardData.wallType}
    - Flooring: ${projectPlan.wizardData.flooringType}
    - Key Specs: ${JSON.stringify(projectPlan.wizardData, null, 2)}
  `;
  return generateSuggestion(prompt);
};

export const getDesignImprovementSuggestions = async (projectPlan: ProjectPlan): Promise<string> => {
  const prompt = `
    You are an innovative Indian architect. A user is reviewing their project plan.
    Analyze their specifications (plot area, floors, rooms) and suggest 1-2 creative design improvements. 
    Focus on functionality, space utilization (especially for a ${projectPlan.wizardData.plotArea} sq ft plot), natural light, or aesthetic enhancements that align with a modern Indian home.
    For example, suggest a double-height living area for a duplex, or strategic placement of windows for cross-ventilation.
    Present your suggestions in a friendly, conversational tone.
    Format your response as a single, coherent message, using markdown. Start with "From an architectural perspective, here are a couple of ideas to enhance your home's design and feel:".
    
    Project Context:
    - Location: ${projectPlan.wizardData.location}
    - Plot Area: ${projectPlan.wizardData.plotArea} sq ft
    - Floors: ${projectPlan.wizardData.floors}
    - Rooms: ${projectPlan.wizardData.bedrooms} Bed, ${projectPlan.wizardData.bathrooms} Bath
    - Key Specs: ${JSON.stringify(projectPlan.wizardData, null, 2)}
  `;
  return generateSuggestion(prompt);
};

const ticketAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    subject: {
      type: Type.STRING,
      description: 'A concise, descriptive subject line for the support ticket, no more than 10 words.'
    },
    category: {
      type: Type.STRING,
      description: 'The most appropriate category for the issue.',
      enum: ['Material', 'Work Quality', 'Delay', 'Safety', 'Other']
    }
  },
  required: ['subject', 'category']
};

export const analyzeSupportTicket = async (description: string): Promise<{ subject: string, category: SupportTicket['category'] }> => {
  const prompt = `
    Analyze the following user-provided description of an issue at a construction site. 
    Based on the description, generate a short, clear subject line and select the best category for the support ticket.
    
    Issue Description: "${description}"
  `;
  const generate = async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: ticketAnalysisSchema,
          temperature: 0.1,
        },
      });

      const jsonText = response.text.trim();
      return safeParseJSON(jsonText);
    } catch (error) {
      console.error("Error analyzing support ticket:", error);
      throw new Error("Failed to get ticket analysis from the service.");
    }
  };
  return withRetry(generate);
};