const API_BASE = "http://127.0.0.1:8000";

export async function getSummary(eventId: string) {
  const res = await fetch(`${API_BASE}/sales/${eventId}/summary`);
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

export async function getStatus(eventId: string) {
  const res = await fetch(`${API_BASE}/sales/${eventId}/status`);
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

export async function patchItem(eventId: string, bundleId: string, itemId: string, updates: any) {
  const res = await fetch(`${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

export async function triggerReestimation(eventId: string) {
  const res = await fetch(`${API_BASE}/sales/${eventId}/estimate`, {
    method: 'POST',
  });
  return res.json();
}