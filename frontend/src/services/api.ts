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

    const result = await response.json();
    
    // Handle ApiResponse wrapper - extract data property if it exists
    if (result && typeof result === 'object' && 'data' in result) {
      return result.data;
    }
    
    return result;
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
  hackathonId?: string;
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

export interface Hackathon {
  _id: string;
  userId: string;
  title: string;
  startDate: string;
  endDate: string;
  endDateTime?: string;
  timezone?: string;
  icon?: string;
  totalPrizePool?: string;
  tracks: Array<{
    name: string;
    totalPrize?: string;
    subTracks: Array<{
      name: string;
      description: string;
      prizes: {
        first?: string;
        second?: string;
        third?: string;
      };
    }>;
  }>;
  prizes: Array<{
    amount: string;
    description: string;
  }>;
  rules: string[];
  link: string;
  scrapedAt: string;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface HackathonStats {
  totalHackathons: number;
  activeHackathons: number;
  upcomingHackathons: number;
}

export interface HackathonProject {
  _id: string;
  hackathonId: string;
  userId: string;
  title: string;
  description: string;
  usp: string;
  techStack: string[];
  targetAudience: string[];
  implementationComplexity: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTimeline: '12 hrs' | '24 hrs' | '36 hrs' | '48 hrs';
  marketPotential: string;
  socialImpact: string[];
  sourceMessageId?: string;
  notes?: string;
  progress?: 'planning' | 'development' | 'testing' | 'submission' | 'completed';
  repositoryUrl?: string;
  demoUrl?: string;
  submissionUrl?: string;
  teamMembers?: string[];
  tags?: string[];
  submissionAnswers?: Array<{
    id: string;
    question: string;
    answer: string;
    category: 'overview' | 'technical' | 'challenges' | 'track';
  }>;
  createdAt: string;
  updatedAt: string;
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
    hackathonId?: string;
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

// Hackathon API
export const hackathonApi = {
  scrapeHackathon: (data: { url: string }) =>
    apiRequest('/api/hackathons/scrape', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getHackathons: (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
    
    const query = searchParams.toString();
    return apiRequest(`/api/hackathons${query ? `?${query}` : ''}`);
  },

  getHackathon: (hackathonId: string) =>
    apiRequest(`/api/hackathons/${hackathonId}`),

  updateHackathon: (hackathonId: string, data: Partial<Hackathon>) =>
    apiRequest(`/api/hackathons/${hackathonId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteHackathon: (hackathonId: string) =>
    apiRequest(`/api/hackathons/${hackathonId}`, {
      method: 'DELETE',
    }),

  importProject: (hackathonId: string, projectData: {
    title: string;
    description: string;
    usp: string;
    techStack: string[];
    targetAudience: string[];
    implementationComplexity: string;
    estimatedTimeline: string;
    marketPotential: string;
    socialImpact: string[];
    sourceMessageId?: string;
  }) => apiRequest(`/api/hackathons/${hackathonId}/project`, {
    method: 'POST',
    body: JSON.stringify(projectData),
  }),

  getProject: (hackathonId: string) =>
    apiRequest(`/api/hackathons/${hackathonId}/project`),

  updateProject: (hackathonId: string, projectData: any) =>
    apiRequest(`/api/hackathons/${hackathonId}/project`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    }),

  deleteProject: (hackathonId: string) =>
    apiRequest(`/api/hackathons/${hackathonId}/project`, {
      method: 'DELETE',
    }),

  // Todo management
  getTodos: (hackathonId: string) =>
    apiRequest(`/api/hackathons/${hackathonId}/project/todos`),

  addTodo: (hackathonId: string, todoData: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
  }) => apiRequest(`/api/hackathons/${hackathonId}/project/todos`, {
    method: 'POST',
    body: JSON.stringify(todoData),
  }),

  updateTodo: (hackathonId: string, todoId: string, todoData: {
    title?: string;
    description?: string;
    completed?: boolean;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
  }) => apiRequest(`/api/hackathons/${hackathonId}/project/todos/${todoId}`, {
    method: 'PUT',
    body: JSON.stringify(todoData),
  }),

  deleteTodo: (hackathonId: string, todoId: string) =>
    apiRequest(`/api/hackathons/${hackathonId}/project/todos/${todoId}`, {
      method: 'DELETE',
    }),

  generateTodos: (hackathonId: string) =>
    apiRequest(`/api/hackathons/${hackathonId}/project/todos/generate`, {
      method: 'POST',
    }),

  generateAIAnswer: (hackathonId: string, question: string, context?: any) =>
    apiRequest(`/api/hackathons/${hackathonId}/project/ai/answer`, {
      method: 'POST',
      body: JSON.stringify({ question, context }),
    }),

  // Fetch GitHub commits for a project
  getGitHubCommits: (hackathonId: string, count?: number) =>
    apiRequest(`/api/hackathons/${hackathonId}/project/github/commits${count ? `?count=${count}` : ''}`),

  // Team collaboration APIs
  generateTeamCode: (hackathonId: string) =>
    apiRequest(`/api/hackathons/${hackathonId}/project/team/generate`, {
      method: 'POST',
    }),

  joinTeamByCode: (teamCode: string) =>
    apiRequest('/api/hackathons/team/join', {
      method: 'POST',
      body: JSON.stringify({ teamCode }),
    }),

  getTeamInfo: (hackathonId: string) =>
    apiRequest(`/api/hackathons/${hackathonId}/project/team`),

  removeTeamMember: (hackathonId: string, memberId: string) =>
    apiRequest(`/api/hackathons/${hackathonId}/project/team/members/${memberId}`, {
      method: 'DELETE',
    }),

  leaveTeam: (hackathonId: string) =>
    apiRequest(`/api/hackathons/${hackathonId}/project/team/leave`, {
      method: 'POST',
    }),

  updateTeamSettings: (hackathonId: string, settings: { allowJoin?: boolean; maxMembers?: number }) =>
    apiRequest(`/api/hackathons/${hackathonId}/project/team/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};

export { ApiError }; 