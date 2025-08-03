export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem('healthcare_token');
  
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (data && !(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  
  return res;
}

export async function apiGet<T>(url: string): Promise<T> {
  const response = await apiRequest('GET', url);
  return await response.json();
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiRequest('POST', url, data);
  return await response.json();
}

export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiRequest('PUT', url, data);
  return await response.json();
}

export async function apiDelete(url: string): Promise<void> {
  await apiRequest('DELETE', url);
}

export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiRequest('PATCH', url, data);
  return await response.json();
}
