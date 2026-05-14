import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { StatusBadge, Modal, FormField } from '../components/DataPage';

export default function Applications() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [borrowers, setBorrowers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  const load = (p = 1) => {
    api.get(`/applications?page=${p}&limit=25`).then(r => {
      const d = r.data;
      setItems(d.data || d);
      setTotal(d.total || (d.data || d).length);
      setTotalPages(d.totalPages || 1);
      setPage(p);
    });
    api.get('/borrowers?limit=100').then(r => setBorrowers(r.data.data || r.data));
    api.get('/properties').then(r => setProperties(r.data));
    api.get('/loan-products').then(r => setProducts(r.data));
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ purpose: 'purchase', status: 'submitted', priority: 'normal', loan_amount: '', down_payment: '', interest_rate: '', term_months: 360 }); setShowModal(true); };
  const openEdit = (item, e) => { e.stopPropagation(); setEditItem(item); setForm(item); setShowModal(true); };

  const save = async () => {
    if (editItem) await api.put(`/applications/${editItem.id}`, form);
    else await api.post('/applications', form);
    setShowModal(false); load(page);
  };

  const remove = async (id, e) => { e.stopPropagation(); if (confirm('Delete this application?')) { await api.delete(`/applications/${id}`); load(page); } };

  const fmt = (v) => v ? `$${Number(v).toLocaleString()}` : '-';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Applications</h1>
          <p className="text-gray-500 text-sm">{total} applications</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ New Application</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">App #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Borrower</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Property</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">LTV</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">DTI</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => navigate(`/applications/${item.id}`)} className="border-b hover:bg-blue-50 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-mono font-medium text-blue-600">{item.application_number}</td>
                <td className="px-4 py-3">{item.borrower_name}</td>
                <td className="px-4 py-3 text-gray-600">{item.property_address}, {item.property_state}</td>
                <td className="px-4 py-3 font-medium">{fmt(item.loan_amount)}</td>
                <td className="px-4 py-3">{item.ltv_ratio}%</td>
                <td className="px-4 py-3">{item.dti_ratio}%</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3"><StatusBadge status={item.priority} /></td>
                <td className="px-4 py-3">
                  <button onClick={(e) => openEdit(item, e)} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                  <button onClick={(e) => remove(item.id, e)} className="text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-500">Page {page} of {totalPages} &mdash; {total} total</span>
            <div className="flex gap-2">
              <button onClick={() => load(page - 1)} disabled={page <= 1} className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-white">Prev</button>
              <button onClick={() => load(page + 1)} disabled={page >= totalPages} className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-white">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Application' : 'New Application'}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Borrower">
            <select className="input-field" value={form.borrower_id || ''} onChange={e => setForm({...form, borrower_id: e.target.value})}>
              <option value="">Select...</option>
              {borrowers.map(b => <option key={b.id} value={b.id}>{b.first_name} {b.last_name}</option>)}
            </select>
          </FormField>
          <FormField label="Property">
            <select className="input-field" value={form.property_id || ''} onChange={e => setForm({...form, property_id: e.target.value})}>
              <option value="">Select...</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.address}, {p.state}</option>)}
            </select>
          </FormField>
          <FormField label="Loan Product">
            <select className="input-field" value={form.loan_product_id || ''} onChange={e => setForm({...form, loan_product_id: e.target.value})}>
              <option value="">Select...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FormField>
          <FormField label="Loan Amount"><input className="input-field" type="number" value={form.loan_amount || ''} onChange={e => setForm({...form, loan_amount: e.target.value})} /></FormField>
          <FormField label="Down Payment"><input className="input-field" type="number" value={form.down_payment || ''} onChange={e => setForm({...form, down_payment: e.target.value})} /></FormField>
          <FormField label="Interest Rate %"><input className="input-field" type="number" step="0.001" value={form.interest_rate || ''} onChange={e => setForm({...form, interest_rate: e.target.value})} /></FormField>
          <FormField label="LTV %"><input className="input-field" type="number" value={form.ltv_ratio || ''} onChange={e => setForm({...form, ltv_ratio: e.target.value})} /></FormField>
          <FormField label="DTI %"><input className="input-field" type="number" value={form.dti_ratio || ''} onChange={e => setForm({...form, dti_ratio: e.target.value})} /></FormField>
          <FormField label="Purpose">
            <select className="input-field" value={form.purpose || ''} onChange={e => setForm({...form, purpose: e.target.value})}>
              <option value="purchase">Purchase</option><option value="refinance">Refinance</option><option value="cash_out">Cash-Out Refinance</option>
            </select>
          </FormField>
          <FormField label="Status">
            <select className="input-field" value={form.status || ''} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="submitted">Submitted</option><option value="in_review">In Review</option><option value="conditional">Conditional</option><option value="approved">Approved</option><option value="denied">Denied</option>
            </select>
          </FormField>
          <FormField label="Priority">
            <select className="input-field" value={form.priority || ''} onChange={e => setForm({...form, priority: e.target.value})}>
              <option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
          </FormField>
          <FormField label="Term (months)"><input className="input-field" type="number" value={form.term_months || ''} onChange={e => setForm({...form, term_months: e.target.value})} /></FormField>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={save} className="btn-primary">Save</button>
          <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
