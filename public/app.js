const API = '/admin/api';

const tabs = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.tab-panel');

let activeTab = 'orders';
const loaders = {
  orders: loadOrders,
  'safety-events': loadSafetyEvents,
  'gps-events': loadGpsEvents,
  'sos-events': loadSosEvents,
  messages: loadMessages,
  documents: loadDocuments,
  logs: loadLogs,
};

tabs.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabs.forEach((b) => b.classList.remove('active'));
    panels.forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    activeTab = btn.dataset.tab;
    loaders[activeTab]();
  });
});

function fmtDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString();
}

function jsonCell(value) {
  return JSON.stringify(value, null, 2) ?? '';
}

// ---- Orders -----------------------------------------------------------------

const orderForm = document.getElementById('order-form');
const orderSubmit = document.getElementById('order-submit');
const orderCancel = document.getElementById('order-cancel');

async function loadOrders() {
  const orders = await fetch(`${API}/orders`).then((r) => r.json());
  const body = document.getElementById('orders-body');
  body.innerHTML = '';
  for (const order of orders) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${order.id}</td>
      <td>${order.title}</td>
      <td>${order.status}</td>
      <td>${order.priority}</td>
      <td>${order.pickupAddress}</td>
      <td>${order.deliveryAddress}</td>
      <td>${order.distanceKm}</td>
      <td>${fmtDate(order.createdAt)}</td>
      <td>
        <button data-action="edit" data-id="${order.id}">Edit</button>
        <button data-action="delete" data-id="${order.id}" class="danger">Delete</button>
      </td>
    `;
    body.appendChild(tr);
  }

  body.querySelectorAll('button[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const order = orders.find((o) => o.id === btn.dataset.id);
      fillForm(order);
    });
  });
  body.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm(`Delete order ${btn.dataset.id}?`)) return;
      await fetch(`${API}/orders/${encodeURIComponent(btn.dataset.id)}`, { method: 'DELETE' });
      loadOrders();
    });
  });
}

function fillForm(order) {
  orderForm.elements.id.value = order.id;
  orderForm.elements.idInput.value = order.id;
  orderForm.elements.idInput.disabled = true;
  orderForm.elements.title.value = order.title;
  orderForm.elements.status.value = order.status;
  orderForm.elements.priority.value = order.priority;
  orderForm.elements.pickupAddress.value = order.pickupAddress;
  orderForm.elements.deliveryAddress.value = order.deliveryAddress;
  orderForm.elements.pickupLat.value = order.pickupLat;
  orderForm.elements.pickupLng.value = order.pickupLng;
  orderForm.elements.deliveryLat.value = order.deliveryLat;
  orderForm.elements.deliveryLng.value = order.deliveryLng;
  orderForm.elements.distanceKm.value = order.distanceKm;
  orderForm.elements.estimatedMinutes.value = order.estimatedMinutes;
  orderForm.elements.itemCount.value = order.itemCount;
  orderSubmit.textContent = 'Save changes';
  orderCancel.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  orderForm.reset();
  orderForm.elements.id.value = '';
  orderForm.elements.idInput.disabled = false;
  orderSubmit.textContent = 'Add order';
  orderCancel.hidden = true;
}

orderCancel.addEventListener('click', resetForm);

orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(orderForm);
  const editingId = orderForm.elements.id.value;

  const body = {
    title: fd.get('title'),
    status: fd.get('status'),
    priority: fd.get('priority'),
    pickupAddress: fd.get('pickupAddress'),
    deliveryAddress: fd.get('deliveryAddress'),
    pickupLat: Number(fd.get('pickupLat')),
    pickupLng: Number(fd.get('pickupLng')),
    deliveryLat: Number(fd.get('deliveryLat')),
    deliveryLng: Number(fd.get('deliveryLng')),
    distanceKm: Number(fd.get('distanceKm')),
    estimatedMinutes: Number(fd.get('estimatedMinutes')),
    itemCount: Number(fd.get('itemCount')),
  };

  if (editingId) {
    await fetch(`${API}/orders/${encodeURIComponent(editingId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } else {
    const idInput = fd.get('idInput')?.trim();
    if (idInput) body.id = idInput;
    await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  resetForm();
  loadOrders();
});

// ---- Read-only event views ---------------------------------------------------

async function loadSafetyEvents() {
  const rows = await fetch(`${API}/safety-events`).then((r) => r.json());
  const body = document.getElementById('safety-events-body');
  body.innerHTML = rows.map((r) => `
    <tr>
      <td>${fmtDate(r.receivedAt)}</td>
      <td>${r.type}</td>
      <td>${r.severity}</td>
      <td>${r.orderId ?? ''}</td>
      <td>${r.driverId ?? ''}</td>
      <td class="json">${jsonCell(r.payload)}</td>
    </tr>
  `).join('');
}

async function loadGpsEvents() {
  const rows = await fetch(`${API}/gps-events`).then((r) => r.json());
  const body = document.getElementById('gps-events-body');
  body.innerHTML = rows.map((r) => `
    <tr>
      <td>${fmtDate(r.receivedAt)}</td>
      <td>${r.driverId ?? ''}</td>
      <td>${r.orderId ?? ''}</td>
      <td>${r.latitude ?? ''}</td>
      <td>${r.longitude ?? ''}</td>
      <td>${r.speedKmh ?? ''}</td>
    </tr>
  `).join('');
}

async function loadSosEvents() {
  const rows = await fetch(`${API}/sos-events`).then((r) => r.json());
  const body = document.getElementById('sos-events-body');
  body.innerHTML = rows.map((r) => `
    <tr>
      <td>${fmtDate(r.receivedAt)}</td>
      <td>${r.reason ?? ''}</td>
      <td>${r.driverId ?? ''}</td>
      <td>${r.orderId ?? ''}</td>
      <td>${r.status ?? ''}</td>
      <td class="json">${jsonCell(r.location)}</td>
    </tr>
  `).join('');
}

async function loadMessages() {
  const rows = await fetch(`${API}/messages`).then((r) => r.json());
  const body = document.getElementById('messages-body');
  body.innerHTML = rows.map((r) => `
    <tr>
      <td>${fmtDate(r.createdAt)}</td>
      <td>${r.orderId}</td>
      <td>${r.sender}</td>
      <td>${r.text ?? ''}</td>
    </tr>
  `).join('');
}

async function loadDocuments() {
  const rows = await fetch(`${API}/documents`).then((r) => r.json());
  const body = document.getElementById('documents-body');
  body.innerHTML = rows.map((r) => `
    <tr>
      <td>${fmtDate(r.receivedAt)}</td>
      <td>${r.kind}</td>
      <td class="json">${jsonCell(r.payload)}</td>
    </tr>
  `).join('');
}

async function loadLogs() {
  const rows = await fetch(`${API}/logs`).then((r) => r.json());
  const body = document.getElementById('logs-body');
  body.innerHTML = rows.map((r) => `
    <tr>
      <td>${fmtDate(r.receivedAt)}</td>
      <td>${r.method}</td>
      <td>${r.path}</td>
      <td class="json">${jsonCell(r.body)}</td>
    </tr>
  `).join('');
}

loadOrders();

// Keep the active tab fresh so incoming events from the driver app show up live.
setInterval(() => loaders[activeTab](), 3000);
