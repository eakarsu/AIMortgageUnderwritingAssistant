import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { getMortgageOperationModule } from '../mortgageOperations';
import { FormField, Modal, StatusBadge } from '../components/DataPage';

const statusOptions = ['open', 'in_progress', 'pending', 'completed', 'blocked'];
const priorityOptions = ['low', 'medium', 'high', 'urgent'];

function rows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function dateValue(value) {
  return value ? String(value).split('T')[0] : '';
}

function money(value) {
  if (value === null || value === undefined || value === '') return '-';
  return `$${Number(value).toLocaleString()}`;
}

function prettyKey(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function MortgageOperationModule() {
  const { moduleKey } = useParams();
  const module = getMortgageOperationModule(moduleKey);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [borrowers, setBorrowers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [detailItem, setDetailItem] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadItems = async () => {
    if (!module) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/operations/${module.key}`);
      setItems(rows(data));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, [moduleKey]);

  useEffect(() => {
    api.get('/users').then((res) => setUsers(rows(res.data))).catch(() => setUsers([]));
    api.get('/applications?limit=100').then((res) => setApplications(rows(res.data))).catch(() => setApplications([]));
    api.get('/borrowers?limit=100').then((res) => setBorrowers(rows(res.data))).catch(() => setBorrowers([]));
    api.get('/properties').then((res) => setProperties(rows(res.data))).catch(() => setProperties([]));
  }, []);

  const counts = useMemo(() => {
    const open = items.filter((item) => item.status !== 'completed').length;
    const urgent = items.filter((item) => item.priority === 'urgent' || item.priority === 'high').length;
    return { open, urgent };
  }, [items]);

  const enrichForm = (values) => {
    const next = { ...values };
    const app = applications.find((row) => Number(row.id) === Number(next.application_id));
    const property = properties.find((row) => Number(row.id) === Number(next.property_id || app?.property_id));

    if (app) {
      next.application_id = Number(app.id);
      next.borrower_id = next.borrower_id ? Number(next.borrower_id) : Number(app.borrower_id);
      next.property_id = next.property_id ? Number(next.property_id) : Number(app.property_id);
      next.amount = next.amount || app.loan_amount;
    }
    if (property) next.property_id = Number(property.id);
    if (next.owner_id) next.owner_id = Number(next.owner_id);
    if (next.borrower_id) next.borrower_id = Number(next.borrower_id);

    return next;
  };

  const updateForm = (changes) => {
    setForm((current) => enrichForm({ ...current, ...changes }));
  };

  const openNew = () => {
    setDetailItem(null);
    setEditItem(null);
    setForm({
      title: '',
      status: 'open',
      priority: 'medium',
      due_date: new Date().toISOString().split('T')[0],
      metadata: {},
    });
    setShowEditor(true);
  };

  const openEdit = (item) => {
    setDetailItem(null);
    setEditItem(item);
    setForm({
      ...item,
      due_date: dateValue(item.due_date),
      metadata: item.metadata || {},
    });
    setShowEditor(true);
  };

  const save = async () => {
    const payload = enrichForm(form);
    if (editItem) await api.put(`/operations/${module.key}/${editItem.id}`, payload);
    else await api.post(`/operations/${module.key}`, payload);
    setShowEditor(false);
    setEditItem(null);
    await loadItems();
  };

  const remove = async (item) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await api.delete(`/operations/${module.key}/${item.id}`);
    setDetailItem(null);
    await loadItems();
  };

  if (!module) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h1 className="text-xl font-bold">Operations module not found</h1>
        <p className="text-gray-500 text-sm mt-1">The requested mortgage operations feature is not configured.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-2xl">{module.icon}</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{module.label}</h1>
            <p className="text-gray-500 text-sm max-w-3xl">{module.description}</p>
            <p className="text-xs text-gray-400 mt-1">{items.length} records · {counts.open} active · {counts.urgent} high priority</p>
          </div>
        </div>
        <button onClick={openNew} className="btn-primary whitespace-nowrap">+ New Record</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">Failed to load: {error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs uppercase text-gray-400 font-bold">Total</div>
          <div className="text-2xl font-bold text-gray-900">{items.length}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs uppercase text-gray-400 font-bold">Active</div>
          <div className="text-2xl font-bold text-blue-700">{counts.open}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs uppercase text-gray-400 font-bold">High Priority</div>
          <div className="text-2xl font-bold text-amber-700">{counts.urgent}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Application</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Owner</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Due</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="7" className="px-4 py-10 text-center text-gray-400">Loading records...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan="7" className="px-4 py-10 text-center text-gray-400">No records found.</td></tr>
            )}
            {!loading && items.map((item) => (
              <tr key={item.id} onClick={() => setDetailItem(item)} className="border-b hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-medium">{item.title}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3"><StatusBadge status={item.priority} /></td>
                <td className="px-4 py-3 font-mono text-blue-600">{item.application_number || '-'}</td>
                <td className="px-4 py-3">{item.owner_name || '-'}</td>
                <td className="px-4 py-3">{dateValue(item.due_date) || '-'}</td>
                <td className="px-4 py-3">{money(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title={`${module.label} Details`}>
        {detailItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ['Title', detailItem.title],
                ['Status', detailItem.status],
                ['Priority', detailItem.priority],
                ['Owner', detailItem.owner_name],
                ['Application', detailItem.application_number],
                ['Borrower', detailItem.borrower_name],
                ['Property', detailItem.property_address ? `${detailItem.property_address}, ${detailItem.property_state}` : '-'],
                ['Due Date', dateValue(detailItem.due_date)],
                ['Reference', detailItem.system_ref],
                ['Amount', money(detailItem.amount)],
              ].map(([label, value]) => (
                <div key={label} className="border-b pb-2">
                  <div className="text-xs uppercase text-gray-400 font-bold">{label}</div>
                  <div className="font-medium text-gray-800">{value || '-'}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs uppercase text-gray-400 font-bold mb-1">Notes</div>
              <p className="text-gray-700">{detailItem.notes || '-'}</p>
            </div>
            {detailItem.metadata && Object.keys(detailItem.metadata).length > 0 && (
              <div>
                <div className="text-xs uppercase text-gray-400 font-bold mb-2">Operational Evidence</div>
                <div className="bg-slate-50 rounded-lg border p-3 space-y-2">
                  {Object.entries(detailItem.metadata).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-gray-500 text-sm font-medium">{prettyKey(key)}: </span>
                      <span className="text-sm text-gray-800">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-3">
              <button onClick={() => openEdit(detailItem)} className="btn-primary">Edit</button>
              <button onClick={() => remove(detailItem)} className="btn-danger">Delete</button>
              <button onClick={() => setDetailItem(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showEditor} onClose={() => setShowEditor(false)} title={editItem ? `Edit ${module.label}` : `New ${module.label}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FormField label="Title">
              <input className="input-field" value={form.title || ''} onChange={(e) => updateForm({ title: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Status">
            <select className="input-field" value={form.status || ''} onChange={(e) => updateForm({ status: e.target.value })}>
              {statusOptions.map((option) => <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>)}
            </select>
          </FormField>
          <FormField label="Priority">
            <select className="input-field" value={form.priority || ''} onChange={(e) => updateForm({ priority: e.target.value })}>
              {priorityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </FormField>
          <FormField label="Owner">
            <select className="input-field" value={form.owner_id ? String(form.owner_id) : ''} onChange={(e) => updateForm({ owner_id: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">Select owner...</option>
              {users.map((user) => <option key={user.id} value={String(user.id)}>{user.full_name} ({user.role})</option>)}
            </select>
          </FormField>
          <FormField label="Application">
            <select className="input-field" value={form.application_id ? String(form.application_id) : ''} onChange={(e) => updateForm({ application_id: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">Select application...</option>
              {applications.map((app) => <option key={app.id} value={String(app.id)}>{app.application_number} - {app.borrower_name}</option>)}
            </select>
          </FormField>
          <FormField label="Borrower">
            <select className="input-field" value={form.borrower_id ? String(form.borrower_id) : ''} onChange={(e) => updateForm({ borrower_id: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">Select borrower...</option>
              {borrowers.map((borrower) => <option key={borrower.id} value={String(borrower.id)}>{borrower.first_name} {borrower.last_name}</option>)}
            </select>
          </FormField>
          <FormField label="Property">
            <select className="input-field" value={form.property_id ? String(form.property_id) : ''} onChange={(e) => updateForm({ property_id: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">Select property...</option>
              {properties.map((property) => <option key={property.id} value={String(property.id)}>{property.address}, {property.state}</option>)}
            </select>
          </FormField>
          <FormField label="Due Date">
            <input className="input-field" type="date" value={dateValue(form.due_date)} onChange={(e) => updateForm({ due_date: e.target.value })} />
          </FormField>
          <FormField label="System Reference">
            <input className="input-field" value={form.system_ref || ''} onChange={(e) => updateForm({ system_ref: e.target.value })} />
          </FormField>
          <FormField label="Amount">
            <input className="input-field" type="number" value={form.amount || ''} onChange={(e) => updateForm({ amount: e.target.value })} />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Notes">
              <textarea className="input-field min-h-24" value={form.notes || ''} onChange={(e) => updateForm({ notes: e.target.value })} />
            </FormField>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={save} className="btn-primary">Save</button>
          <button onClick={() => setShowEditor(false)} className="btn-secondary">Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
