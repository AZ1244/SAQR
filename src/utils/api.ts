export const API_BASE_URL = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('saqr_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('saqr_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('saqr_token');
}

// Base request — returns result.data (the outer data wrapper)
async function request(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Do not set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    const errorMsg = result.error?.message || response.statusText || 'API Request failed';
    throw new Error(errorMsg);
  }

  // Return the full data wrapper — each method below extracts its named key
  return result.data;
}

export const api = {
  // ─── Authentication ──────────────────────────────────────────────────────────
  auth: {
    login: async (email: string, password: string) => {
      // Shape: { user: {...}, token: "..." }
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data.token) setAuthToken(data.token);
      return data; // callers use .user and .token
    },

    register: async (payload: any) => {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    // Shape: { user: {...} }
    me: async () => {
      const data = await request('/auth/me');
      return data.user ?? data;
    }
  },

  // ─── Workspaces ──────────────────────────────────────────────────────────────
  workspaces: {
    list: async () => {
      const data = await request('/workspaces');
      return data.workspaces ?? data;
    },
    create: async (name: string) => {
      const data = await request('/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      return data.workspace ?? data;
    }
  },

  // ─── Projects ────────────────────────────────────────────────────────────────
  projects: {
    // Shape: { projects: [...] }
    list: async () => {
      const data = await request('/projects');
      return data.projects ?? data;
    },

    create: async (payload: any) => {
      const data = await request('/projects', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return data.project ?? data;
    },

    // Shape: { project: {..., rooms: [...] } }
    getById: async (id: string) => {
      const data = await request(`/projects/${id}`);
      return data.project ?? data;
    },

    update: async (id: string, payload: any) => {
      const data = await request(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      return data.project ?? data;
    },

    delete: async (id: string) => {
      return request(`/projects/${id}`, { method: 'DELETE' });
    },

    generateDesign: async (projectId: string) => {
      // Returns { roomsCount, rooms, warnings, engineerReviewRequired }
      return request(`/projects/${projectId}/generate-design`, { method: 'POST' });
    },

    generateBOQ: async (projectId: string) => {
      // Returns { itemsCount, boqItems, totalAmount }
      return request(`/projects/${projectId}/generate-boq`, { method: 'POST' });
    },

    // Shape: { boqItems: [...] } or { items: [...] } — try both
    getBOQ: async (projectId: string) => {
      const data = await request(`/projects/${projectId}/boq`);
      return data.boqItems ?? data.items ?? data;
    },

    generateReport: async (projectId: string) => {
      const data = await request(`/projects/${projectId}/generate-report`, { method: 'POST' });
      return data.report ?? data;
    },

    getReports: async (projectId: string) => {
      const data = await request(`/projects/${projectId}/reports`);
      return data.reports ?? data;
    },

    // Shape: { answer: "...", conversationId: "..." }
    chat: async (projectId: string, question: string, conversationId?: string) => {
      const data = await request(`/projects/${projectId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ question, conversationId })
      });
      return data; // callers use .answer
    },

    getConversations: async (projectId: string) => {
      const data = await request(`/projects/${projectId}/conversations`);
      return data.conversations ?? data;
    },

    // Site Photos
    uploadPhoto: async (projectId: string, photoFile: File, roomName: string, systemType: string) => {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('roomName', roomName);
      formData.append('systemType', systemType);
      const data = await request(`/projects/${projectId}/site-photos`, {
        method: 'POST',
        body: formData
      });
      return data.photo ?? data.sitePhoto ?? data;
    },

    getPhotos: async (projectId: string) => {
      const data = await request(`/projects/${projectId}/site-photos`);
      return data.sitePhotos ?? data.photos ?? data;
    },

    runInspection: async (photoId: string) => {
      const data = await request(`/projects/site-photos/${photoId}/inspect`, { method: 'POST' });
      return data.photo ?? data.sitePhoto ?? data;
    },

    // Variation Claims
    getClaims: async (projectId: string) => {
      const data = await request(`/projects/${projectId}/variation-claims`);
      return data.variationClaims ?? data.claims ?? data;
    },

    createClaim: async (projectId: string, payload: any) => {
      const data = await request(`/projects/${projectId}/variation-claims`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return data.variationClaim ?? data.claim ?? data;
    },

    // Assets / Digital Twin
    getAssets: async (projectId: string) => {
      const data = await request(`/projects/${projectId}/assets`);
      return data.assets ?? data;
    },

    createAsset: async (projectId: string, payload: any) => {
      const data = await request(`/projects/${projectId}/assets`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return data.asset ?? data;
    },

    // Document Ingestion
    uploadFile: async (projectId: string, file: File, category: string, notes?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      if (notes) formData.append('notes', notes);
      const data = await request(`/projects/${projectId}/files`, {
        method: 'POST',
        body: formData
      });
      return data.file ?? data;
    },

    getFiles: async (projectId: string) => {
      const data = await request(`/projects/${projectId}/files`);
      return data.files ?? data;
    },

    deleteFile: async (id: string) => {
      return request(`/projects/files/${id}`, { method: 'DELETE' });
    }
  },

  // ─── Rooms ───────────────────────────────────────────────────────────────────
  rooms: {
    // Shape: { rooms: [...] }
    list: async (projectId: string) => {
      const data = await request(`/projects/${projectId}/rooms`);
      return data.rooms ?? data;
    },

    create: async (projectId: string, payload: any) => {
      const data = await request(`/projects/${projectId}/rooms`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return data.room ?? data;
    },

    update: async (roomId: string, payload: any) => {
      const data = await request(`/rooms/${roomId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      return data.room ?? data;
    },

    delete: async (roomId: string) => {
      return request(`/rooms/${roomId}`, { method: 'DELETE' });
    }
  },

  // ─── Templates ───────────────────────────────────────────────────────────────
  templates: {
    list: async () => {
      const data = await request('/templates');
      return data.templates ?? data;
    }
  }
};
