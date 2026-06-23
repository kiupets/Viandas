import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ResourceCalendar } from './components/calendar';
import { api, money, today } from './lib/api';
import './styles.css';

const statuses = ['pendiente', 'confirmado', 'listo', 'entregado', 'cancelado'];
const tabs = [
  ['dashboard', 'Panel'],
  ['new-order', 'Pedido'],
  ['calendar', 'Calendario'],
  ['menu', 'Menu']
];

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function whatsappUrl(order) {
  const phone = normalizePhone(order.phone || order.socialUser);
  if (!phone) return '';
  const number = phone.startsWith('54') ? phone : `54${phone}`;
  return `https://wa.me/${number}`;
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [date, setDate] = useState(today());
  const [dashboard, setDashboard] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardData, menuData, orderData] = await Promise.all([
        api.dashboard(date),
        api.menuItems(),
        api.orders({ from: date, to: addDays(date, 6) })
      ]);
      setDashboard(dashboardData);
      setMenuItems(menuData);
      setOrders(orderData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [date]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p>Viandas Zarate</p>
          <h1>{tabs.find(([key]) => key === activeTab)?.[1]}</h1>
        </div>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </header>

      {error && <div className="notice is-error">{error}</div>}

      <main>
        {activeTab === 'dashboard' && (
          <Dashboard
            data={dashboard}
            loading={loading}
            onStatus={async (id, status) => {
              await api.updateStatus(id, status);
              refresh();
            }}
          />
        )}
        {activeTab === 'new-order' && (
          <OrderForm
            date={date}
            menuItems={menuItems}
            onCreated={() => {
              setActiveTab('dashboard');
              refresh();
            }}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarView
            date={date}
            menuItems={menuItems}
            orders={orders}
            onMove={async (payload) => {
              await api.moveOrderItem(payload);
              refresh();
            }}
          />
        )}
        {activeTab === 'menu' && <MenuEditor menuItems={menuItems} onChanged={refresh} />}
      </main>

      <nav className="bottom-nav">
        {tabs.map(([key, label]) => (
          <button key={key} type="button" className={activeTab === key ? 'is-active' : ''} onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Dashboard({ data, loading, onStatus }) {
  if (loading || !data) return <div className="loading">Cargando...</div>;

  return (
    <section className="stack">
      <div className="metrics">
        <Metric label="Pedidos" value={data.summary.totalOrders} />
        <Metric label="Pendientes" value={data.summary.pending} />
        <Metric label="Listos" value={data.summary.ready} />
        <Metric label="Venta" value={money(data.summary.revenue)} />
      </div>

      <section className="panel">
        <h2>Cocina</h2>
        <div className="cook-list">
          {data.kitchen.length === 0 && <p className="muted">No hay viandas cargadas para este dia.</p>}
          {data.kitchen.map((item) => (
            <div key={item.name} className="cook-row">
              <strong>{item.quantity}</strong>
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Pedidos de hoy</h2>
        <OrderList orders={data.orders} onStatus={onStatus} />
      </section>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function OrderList({ orders, onStatus }) {
  return (
    <div className="order-list">
      {orders.map((order) => (
        <article key={order._id} className={`order-card is-${order.status}`}>
          <div className="order-card__head">
            <div>
              <strong>{order.customerName}</strong>
              <span>{order.source} {order.socialUser ? `· ${order.socialUser}` : ''}</span>
            </div>
            <select value={order.status} onChange={(event) => onStatus(order._id, event.target.value)}>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <ul>
            {order.items.map((item) => (
              <li key={item._id}>{item.quantity} x {item.itemName}</li>
            ))}
          </ul>
          <div className="order-card__actions">
            {whatsappUrl(order) && <a href={whatsappUrl(order)} target="_blank" rel="noreferrer">WhatsApp</a>}
            <span>{money(order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0))}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function OrderForm({ date, menuItems, onCreated }) {
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    source: 'whatsapp',
    socialUser: '',
    deliveryDate: date,
    notes: ''
  });
  const [quantities, setQuantities] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm((current) => ({ ...current, deliveryDate: date }));
  }, [date]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const items = Object.entries(quantities)
      .map(([menuItem, quantity]) => ({ menuItem, quantity: Number(quantity) }))
      .filter((item) => item.quantity > 0);
    await api.createOrder({ ...form, items });
    setForm({ customerName: '', phone: '', source: 'whatsapp', socialUser: '', deliveryDate: date, notes: '' });
    setQuantities({});
    setSaving(false);
    onCreated();
  };

  return (
    <form className="panel form" onSubmit={submit}>
      <label>Cliente<input required value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} /></label>
      <div className="form-grid">
        <label>Origen
          <select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="telefono">Telefono</option>
            <option value="local">Local</option>
            <option value="otro">Otro</option>
          </select>
        </label>
        <label>Fecha<input type="date" required value={form.deliveryDate} onChange={(event) => setForm({ ...form, deliveryDate: event.target.value })} /></label>
      </div>
      <div className="form-grid">
        <label>Telefono<input inputMode="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
        <label>Usuario IG/WA<input value={form.socialUser} onChange={(event) => setForm({ ...form, socialUser: event.target.value })} /></label>
      </div>

      <section className="menu-picker">
        {menuItems.filter((item) => item.active).map((item) => (
          <label key={item._id} className="menu-pick">
            <span><strong>{item.name}</strong><em>{money(item.price)}</em></span>
            <input type="number" min="0" inputMode="numeric" value={quantities[item._id] || ''} onChange={(event) => setQuantities({ ...quantities, [item._id]: event.target.value })} />
          </label>
        ))}
      </section>

      <label>Notas<textarea rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
      <button className="primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar pedido'}</button>
    </form>
  );
}

function CalendarView({ date, menuItems, orders, onMove }) {
  const resources = useMemo(() => menuItems.filter((item) => item.active).map((item) => ({
    id: item._id,
    label: item.name,
    subtitle: `${item.category} · ${money(item.price)}`,
    status: 'active'
  })), [menuItems]);

  const assignments = useMemo(() => orders.flatMap((order) => (
    order.items.map((item) => ({
      id: `${order._id}:${item._id}`,
      resourceId: item.menuItem?._id || item.menuItem || '',
      title: `${item.quantity} x ${order.customerName}`,
      subtitle: `${order.source} · ${order.status}`,
      startDate: order.deliveryDate,
      endDate: order.deliveryDate,
      status: order.status,
      color: item.menuItem?.color || '#2563eb',
      meta: { order, item }
    }))
  )), [orders]);

  return (
    <section className="calendar-wrap">
      <ResourceCalendar
        resources={resources}
        assignments={assignments}
        startDate={date}
        days={7}
        unassignedLabel="Sin plato"
        onMoveAssignment={({ assignmentId, nextResourceId, nextStartDate }) => {
          const [orderId, itemId] = assignmentId.split(':');
          return onMove({ orderId, itemId, menuItem: nextResourceId, deliveryDate: nextStartDate });
        }}
        onOpenAssignment={({ assignmentId }) => {
          const assignment = assignments.find((item) => item.id === assignmentId);
          if (assignment?.meta?.order) alert(`${assignment.meta.order.customerName}\n${assignment.meta.item.quantity} x ${assignment.meta.item.itemName}`);
        }}
      />
    </section>
  );
}

function MenuEditor({ menuItems, onChanged }) {
  const [form, setForm] = useState({ name: '', category: 'Principal', price: '', color: '#0f766e' });

  const submit = async (event) => {
    event.preventDefault();
    await api.createMenuItem(form);
    setForm({ name: '', category: 'Principal', price: '', color: '#0f766e' });
    onChanged();
  };

  return (
    <section className="stack">
      <form className="panel form" onSubmit={submit}>
        <h2>Nuevo plato</h2>
        <label>Nombre<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <div className="form-grid">
          <label>Categoria<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
          <label>Precio<input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
        </div>
        <button className="primary" type="submit">Agregar</button>
      </form>

      <section className="panel">
        <h2>Menu</h2>
        <div className="menu-list">
          {menuItems.map((item) => (
            <article key={item._id} className="menu-row">
              <span style={{ backgroundColor: item.color }} />
              <div>
                <strong>{item.name}</strong>
                <em>{item.category} · {money(item.price)}</em>
              </div>
              <button type="button" onClick={() => api.updateMenuItem(item._id, { active: !item.active }).then(onChanged)}>
                {item.active ? 'Pausar' : 'Activar'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function addDays(isoDate, count) {
  const next = new Date(`${isoDate}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + count);
  return next.toISOString().slice(0, 10);
}

createRoot(document.getElementById('root')).render(<App />);
