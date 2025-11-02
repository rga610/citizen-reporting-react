// Use local API in development, Railway API in production
// IMPORTANT: In production, set VITE_API_URL to your API service URL (not the web service URL!)
// Example: https://citizen-reporting-api-production.up.railway.app
const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV 
    ? "http://localhost:3000" 
    : "" // Empty in production - MUST be set via VITE_API_URL environment variable
);

function handleError(error: unknown, context: string) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    if (!API_URL) {
      console.error(`[${context}] VITE_API_URL is not set! Configure it in Railway environment variables.`)
    } else {
      console.warn(`[${context}] Backend not available at ${API_URL}. Is the API server running?`)
    }
    return
  }
  console.error(`[${context}]`, error)
}

export const api = {
  login: (username: string, forceLogout?: boolean) =>
    fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, forceLogout: forceLogout || false })
    }).catch(err => {
      handleError(err, 'API.login')
      throw err
    }),
  logout: () =>
    fetch(`${API_URL}/api/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}) // Send empty JSON body to satisfy Fastify
    }).catch(err => {
      handleError(err, 'API.logout')
      throw err
    }),
  join: () => fetch(`${API_URL}/api/join`, { credentials: "include" }).catch(err => {
    handleError(err, 'API.join')
    throw err
  }),
  report: (issueId: string, lat?: number, lon?: number, accuracy?: number) =>
    fetch(`${API_URL}/api/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ issue_id: issueId, lat, lon, accuracy })
    }).catch(err => {
      handleError(err, 'API.report')
      throw err
    }),
  sse: (slot: number, treatment?: string) => {
    // EventSource doesn't support credentials option, so we pass treatment as query param
    const url = new URL(`${API_URL}/api/sse/slot/${slot}`)
    if (treatment) {
      url.searchParams.set('treatment', treatment)
    }
    const es = new EventSource(url.toString())
    es.onerror = () => {
      console.warn(`[SSE] Connection error to ${url.toString()}. Is the API server running?`)
    }
    return es
  },
  // Dev-only endpoints
  dev: {
    listParticipants: () => fetch(`${API_URL}/api/dev/participants`, { credentials: "include" }).catch(err => {
      handleError(err, 'API.dev.listParticipants')
      throw err
    }),
    switchUser: (participantId: string) =>
      fetch(`${API_URL}/api/dev/switch-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ participantId })
      }).catch(err => {
        handleError(err, 'API.dev.switchUser')
        throw err
      })
  },
  // Admin endpoints
  admin: {
    getParticipants: (token: string, slot?: number) => {
      const url = new URL(`${API_URL}/api/admin/participants`)
      if (slot) url.searchParams.set('slot', slot.toString())
      return fetch(url.toString(), {
        headers: { "x-admin-token": token },
        credentials: "include"
      }).catch(err => {
        handleError(err, 'API.admin.getParticipants')
        throw err
      })
    },
    resetGroup: (token: string, treatment: string, slot?: number) => {
      const url = new URL(`${API_URL}/api/admin/reset-group`)
      if (slot) url.searchParams.set('slot', slot.toString())
      return fetch(url.toString(), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": token
        },
        credentials: "include",
        body: JSON.stringify({ treatment })
      }).catch(err => {
        handleError(err, 'API.admin.resetGroup')
        throw err
      })
    },
    resetUser: (token: string, participantId: string) =>
      fetch(`${API_URL}/api/admin/reset-user`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": token
        },
        credentials: "include",
        body: JSON.stringify({ participantId })
      }).catch(err => {
        handleError(err, 'API.admin.resetUser')
        throw err
      }),
    setScore: (token: string, participantId: string, score: number) =>
      fetch(`${API_URL}/api/admin/set-score`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": token
        },
        credentials: "include",
        body: JSON.stringify({ participantId, score })
      }).catch(err => {
        handleError(err, 'API.admin.setScore')
        throw err
      }),
    logoutUser: (token: string, participantId: string) =>
      fetch(`${API_URL}/api/admin/logout-user`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": token
        },
        credentials: "include",
        body: JSON.stringify({ participantId })
      }).catch(err => {
        handleError(err, 'API.admin.logoutUser')
        throw err
      })
  }
};

