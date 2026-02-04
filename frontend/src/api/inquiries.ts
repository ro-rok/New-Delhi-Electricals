const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/+$/, '');

export interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'in-progress' | 'resolved';
  created_at: string;
  updated_at: string;
}

export interface InquiryCreate {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

/**
 * Create a new inquiry (public endpoint)
 */
export async function createInquiry(data: InquiryCreate): Promise<Inquiry> {
  const res = await fetch(`${API_BASE}/api/inquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create inquiry');
  }

  return res.json();
}

/**
 * Get all inquiries (admin only)
 */
export async function getInquiries(statusFilter?: string): Promise<Inquiry[]> {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const url = statusFilter 
    ? `${API_BASE}/api/inquiries?status=${statusFilter}`
    : `${API_BASE}/api/inquiries`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch inquiries');
  }

  return res.json();
}

/**
 * Update inquiry status (admin only)
 */
export async function updateInquiryStatus(
  inquiryId: string,
  status: 'new' | 'in-progress' | 'resolved'
): Promise<Inquiry> {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${API_BASE}/api/inquiries/${inquiryId}?status=${status}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update inquiry status');
  }

  return res.json();
}

/**
 * Delete inquiry (admin only)
 * Note: This endpoint may not exist yet in the backend
 */
export async function deleteInquiry(inquiryId: string): Promise<void> {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${API_BASE}/api/inquiries/${inquiryId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to delete inquiry');
  }
}
