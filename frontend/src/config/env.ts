// Environment configuration for the frontend application
export const env = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  
  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Codra.AI',
  APP_DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || 'AI-powered hackathon platform',
  
  // Environment
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
} as const;

// Type-safe environment check
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production'; 