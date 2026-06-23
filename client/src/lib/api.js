const headers = { 'Content-Type': 'application/json' };

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers,
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Error de servidor');
  }

  return response.json();
}

export const api = {
  dashboard: (date) => request(`/api/dashboard?date=${date}`),
  menuItems: () => request('/api/menu-items'),
  createMenuItem: (payload) => request('/api/menu-items', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateMenuItem: (id, payload) => request(`/api/menu-items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),
  orders: ({ from, to, date } = {}) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (date) params.set('date', date);
    return request(`/api/orders?${params.toString()}`);
  },
  createOrder: (payload) => request('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateStatus: (id, status) => request(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  moveOrderItem: ({ orderId, itemId, menuItem, deliveryDate }) => request(`/api/orders/${orderId}/items/${itemId}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ menuItem, deliveryDate })
  })
};

export function money(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
