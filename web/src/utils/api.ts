const API_URL = import.meta.env.VITE_API_URL || "https://citizen-reporting-react-production.up.railway.app";

export const api = {
  join: () => fetch(`${API_URL}/api/join`, { credentials: "include" }),
  report: (issueId: string, lat?: number, lon?: number, accuracy?: number) =>
    fetch(`${API_URL}/api/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ issue_id: issueId, lat, lon, accuracy })
    }),
  sse: (slot: number) => new EventSource(`${API_URL}/api/sse/slot/${slot}`)
};

