import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Activity {
  time: string;
  title: string;
  description: string;
  location?: string;
  cost?: string;
  lat?: number;
  lng?: number;
}

export interface ItineraryDay {
  day: number;
  theme: string;
  activities: Activity[];
}

export interface BudgetSegment {
  category: string;
  amount: number;
  percentage: number;
}

export interface FullItinerary {
  title: string;
  description: string;
  days: ItineraryDay[];
  budgetAnalysis: BudgetSegment[];
  localFoods: string[];
  recommendedRestaurants: string[];
}

export interface PackingItem {
  item: string;
  category: string;
  essential: boolean;
  reason: string;
}

export interface FoodRecommendation {
  name: string;
  cuisine: string;
  description: string;
  mustTry: string;
  priceRange: string;
  restaurantLabel: string;
  bestSpot: string;
  emoji: string;
}

export const generateItinerary = async (
  destination: string, 
  duration: number, 
  interests: string,
  budget: string = "Moderate",
  travelerType: string = "Solo",
  useSearch: boolean = false,
  extraRequirements: string = ""
) => {
  const activityCount = duration === 1 ? 4 : (duration === 2 ? 5 : 6);
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a comprehensive ${duration}-day travel itinerary for ${destination} focusing on ${interests}. 
    Budget Level: ${budget}. Traveler Type: ${travelerType}. 
    ${extraRequirements ? `Additional Requirements: ${extraRequirements}` : ''}
    
    Requirements:
    1. Generate a creative trip title in the format: "<Travel Theme>: A <Traveler Type> Escape to <Destination>".
    2. Provide a short travel description (approx 2-3 sentences).
    3. For each day, provide a theme and ${activityCount} activities.
    4. For EACH activity, provide accurate latitude and longitude coordinates (lat/lng) for the location.
    5. Include a budget analysis with segments: Accommodation, Activities and Entry Fees, Food and Dining, Transport (totaling 100%).
    6. List 4 iconic local foods and 3 recommended restaurants.
    
    Please provide specific, up-to-date recommendations.`,
    config: {
      responseMimeType: "application/json",
      tools: useSearch ? [{ googleSearch: {} }] : undefined,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.NUMBER },
                theme: { type: Type.STRING },
                activities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      location: { type: Type.STRING },
                      cost: { type: Type.STRING },
                      lat: { type: Type.NUMBER },
                      lng: { type: Type.NUMBER },
                    },
                    required: ["time", "title", "description", "lat", "lng"],
                  },
                },
              },
              required: ["day", "theme", "activities"],
            },
          },
          budgetAnalysis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                percentage: { type: Type.NUMBER },
              },
              required: ["category", "amount", "percentage"],
            },
          },
          localFoods: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          recommendedRestaurants: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
        },
        required: ["title", "description", "days", "budgetAnalysis", "localFoods", "recommendedRestaurants"],
      },
    },
  });

  return JSON.parse(response.text) as FullItinerary;
};

export const generatePackingAudit = async (
  destination: string, 
  weather: string, 
  duration: number, 
  activities: string
) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a professional, categorized packing list for a ${duration}-day trip to ${destination}. 
    Weather: ${weather}. Activities: ${activities}.
    Categorize items into: Clothing, Footwear, Toiletries, Health & Safety, Essentials & Accessories, Electronics and Extras.
    
    CRITICAL REQUIREMENTS:
    - Clothing, Toiletries, Health & Safety, Essentials & Accessories: You MUST provide at least 4 items for EACH of these categories.
    - Footwear: You MUST provide at least 3 items.
    - Electronics and Extras: You MUST provide at least 2 items.
    - Do not provide fewer than these minimums.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            item: { type: Type.STRING },
            category: { 
              type: Type.STRING,
              enum: ["Clothing", "Footwear", "Toiletries", "Health & Safety", "Essentials & Accessories", "Electronics and Extras"]
            },
            essential: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
          },
          required: ["item", "category", "essential", "reason"],
        },
      },
    },
  });

  return JSON.parse(response.text) as PackingItem[];
};

export const generateFoodGuide = async (destination: string, count: number = 6, exclude: string[] = []) => {
  const excludePrompt = exclude.length > 0 ? `\nDo NOT include any of the following dishes: ${exclude.join(', ')}.` : '';
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide a detailed foodie guide for ${destination} with ${count} NEW local specialties.${excludePrompt}
    For each item, include:
    - name: the dish name
    - cuisine: the type of cuisine
    - description: a brief description
    - mustTry: a specific version or ingredient to try
    - priceRange: $, $$, or $$$
    - restaurantLabel: a famous or recommended restaurant name for this dish
    - bestSpot: the specific location or neighborhood where it's best enjoyed
    - emoji: a single relevant food emoji that represents the dish`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            cuisine: { type: Type.STRING },
            description: { type: Type.STRING },
            mustTry: { type: Type.STRING },
            priceRange: { type: Type.STRING },
            restaurantLabel: { type: Type.STRING },
            bestSpot: { type: Type.STRING },
            emoji: { type: Type.STRING },
          },
          required: ["name", "cuisine", "description", "mustTry", "priceRange", "restaurantLabel", "bestSpot", "emoji"],
        },
      },
    },
  });

  return JSON.parse(response.text) as FoodRecommendation[];
};

export const askConcierge = async (query: string, context?: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `User Question: ${query}
    ${context ? `Current Trip Context: ${context}` : ''}
    
    Provide a clear, travel-focused answer (up to 200 words). Use a structured, easy-to-read format. Focus on: location overview, best time to visit, transportation, entry fee, local tips, and food suggestions.
    
    Format strictly:
    ### Place Name
    **Overview:** [Short description]
    **Best Time to Visit:** [Details]
    **Transportation:** [Details]
    **Entry Fee:** [Details]
    **Local Tips:**
    * [Tip 1]
    * [Tip 2]
    **Food Suggestions:**
    * [Food 1]
    * [Food 2]
    
    Use bold headers and bullet points for clarity.`,
    config: {
      systemInstruction: "You are a helpful, concise travel assistant. Provide clear, structured, and actionable travel information.",
    },
  });

  return response.text;
};
