const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://codra-ai.onrender.com';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from localStorage as backup
  const storedToken = localStorage.getItem('authToken');
  
  const config: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      // Add Authorization header if token exists
      ...(storedToken && { 'Authorization': `Bearer ${storedToken}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new ApiError(response.status, errorData.error || errorData.message || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, 'Network error');
  }
};

export interface ChatSession {
  _id: string;
  userId: string;
  title: string;
  description: string;
  isArchived: boolean;
  messageCount: number;
  lastMessageAt: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  sessionId: string;
  userId: string;
  type: 'user' | 'assistant';
  content: string;
  messageMode: 'text' | 'ideas';
  ideaData?: Array<{
    'Idea Title': string;
    'Idea Description': string;
    'USP': string;
    'Tech Stack': string[];
    'Target Audience': string[];
    'Implementation Complexity': 'Beginner' | 'Intermediate' | 'Advanced';
    'Estimated Timeline': '12 hrs' | '24 hrs' | '36 hrs' | '48 hrs';
    'Market Potential': string;
    'Social Impact': string[];
  }>;
  isEdited: boolean;
  editHistory: Array<{ originalContent: string; editedAt: string }>;
  isStarred: boolean;
  metadata: Record<string, any>;
  tokensUsed: number;
  processingTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatStats {
  totalSessions: number;
  totalMessages: number;
  archivedSessions: number;
}

export interface FavoriteIdea {
  _id: string;
  userId: string;
  ideaTitle: string;
  ideaDescription: string;
  usp: string;
  techStack: string[];
  targetAudience: string[];
  implementationComplexity: "Beginner" | "Intermediate" | "Advanced";
  estimatedTimeline: "12 hrs" | "24 hrs" | "36 hrs" | "48 hrs";
  marketPotential: string;
  socialImpact: string[];
  originalMessageId?: string;
  tags: string[];
  notes: string;
  priority: "Low" | "Medium" | "High";
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteStats {
  totalIdeas: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  beginnerComplexity: number;
  intermediateComplexity: number;
  advancedComplexity: number;
}

export interface User {
  id: string;
  githubId: string;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  githubUrl?: string;
  lastLogin: string;
  createdAt: string;
}

// Auth API
export const authApi = {
  getMe: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
};

// Chat Sessions API
export const chatSessionsApi = {
  getSessions: (params?: {
    page?: number;
    limit?: number;
    archived?: boolean;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.archived !== undefined) searchParams.append('archived', params.archived.toString());
    if (params?.search) searchParams.append('search', params.search);
    
    const query = searchParams.toString();
    return apiRequest(`/api/chat/sessions${query ? `?${query}` : ''}`);
  },

  createSession: (data: {
    title?: string;
    description?: string;
    tags?: string[];
  }) => apiRequest('/api/chat/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateSession: (sessionId: string, data: Partial<ChatSession>) =>
    apiRequest(`/api/chat/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSession: (sessionId: string) =>
    apiRequest(`/api/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
};

// Messages API
export const messagesApi = {
  getMessages: (sessionId: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const query = searchParams.toString();
    return apiRequest(`/api/chat/sessions/${sessionId}/messages${query ? `?${query}` : ''}`);
  },

  sendMessage: (sessionId: string, data: {
    content: string;
    messageMode?: 'text' | 'ideas';
  }) => apiRequest(`/api/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  toggleMessageStar: (messageId: string) =>
    apiRequest(`/api/chat/messages/${messageId}/star`, {
      method: 'PATCH',
    }),
};

// Favorite Ideas API
export const favoriteIdeasApi = {
  getFavorites: (params?: {
    page?: number;
    limit?: number;
    priority?: string;
    complexity?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.complexity) searchParams.append('complexity', params.complexity);
    if (params?.search) searchParams.append('search', params.search);
    
    const query = searchParams.toString();
    return apiRequest(`/api/favorites${query ? `?${query}` : ''}`);
  },

  addFavorite: (data: {
    ideaTitle: string;
    ideaDescription: string;
    usp: string;
    techStack: string[];
    targetAudience: string[];
    implementationComplexity: "Beginner" | "Intermediate" | "Advanced";
    estimatedTimeline: "12 hrs" | "24 hrs" | "36 hrs" | "48 hrs";
    marketPotential: string;
    socialImpact: string[];
    originalMessageId?: string;
    tags?: string[];
    notes?: string;
    priority?: "Low" | "Medium" | "High";
  }) => apiRequest('/api/favorites', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateFavorite: (ideaId: string, data: Partial<FavoriteIdea>) =>
    apiRequest(`/api/favorites/${ideaId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteFavorite: (ideaId: string) =>
    apiRequest(`/api/favorites/${ideaId}`, {
      method: 'DELETE',
    }),

  checkFavoriteStatus: (ideaTitle: string, ideaDescription: string) => {
    const searchParams = new URLSearchParams();
    searchParams.append('ideaTitle', ideaTitle);
    searchParams.append('ideaDescription', ideaDescription);
    return apiRequest(`/api/favorites/check?${searchParams.toString()}`);
  },

  getStats: () => apiRequest('/api/favorites/stats'),
};

// Stats API
export const statsApi = {
  getChatStats: () => apiRequest('/api/chat/stats'),
};

export { ApiError }; 