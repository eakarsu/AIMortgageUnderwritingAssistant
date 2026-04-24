import React, { useState, useEffect } from 'react';
import api from '../api';
import { StatusBadge, Modal, FormField } from '../components/DataPage';

export default function LoanProducts() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api.get('/loan-products').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ type: 'conventional', is_active: true }); setShowModal(true); };
  const openEdit = (item, e) => { e?.stopPropagation(); setEditItem(item); setForm(item); setShowModal(true); setDetailItem(null); };
  const save = async () => { if (editItem) await api.put(`/loan-products/${editItem.id}`, form); else await api.post('/loan-products', form); setShowModal(false); load(); };
  const remove = async (id) => { if (confirm('Delete?')) { await api.delete(`/loan-products/${id}`); setDetailItem(null); load(); } };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Loan Products</h1><p className="text-gray-500 text-sm">{items.length} products</p></div>
        <button onClick={openNew} className="btn-primary">+ New Product</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Rate</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Min Credit</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Max LTV</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Max DTI</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Min Down</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Active</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setDetailItem(item)} className="border-b hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 capitalize">{item.type}</td>
                <td className="px-4 py-3 font-bold text-blue-600">{item.interest_rate}%</td>
                <td className="px-4 py-3">{item.min_credit_score}</td>
                <td className="px-4 py-3">{item.max_ltv}%</td>
                <td className="px-4 py-3">{item.max_dti}%</td>
                <td className="px-4 py-3">{item.min_down_payment}%</td>
                <td className="px-4 py-3">{item.is_active ? <span className="badge-success">Active</span> : <span className="badge-neutral">Inactive</span>}</td>
                <td className="px-4 py-3">
                  <button onClick={(e) => openEdit(item, e)} className="text-blue-600 mr-2">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); remove(item.id); }} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Product Details">
        {detailItem && (
          <div className="space-y-3">
            {[['Name', detailItem.name],['Type', detailItem.type],['Interest Rate', `${detailItem.interest_rate}%`],['Min Credit Score', detailItem.min_credit_score],['Max LTV', `${detailItem.max_ltv}%`],['Max DTI', `${detailItem.max_dti}%`],['Min Down Payment', `${detailItem.min_down_payment}%`],['Term', `${detailItem.term_months} months`],['Description', detailItem.description]].map(([l,v]) => (
              <div key={l} className="flex justify-between border-b pb-2"><span className="text-gray-500">{l}</span><span className="font-medium text-right max-w-xs">{v}</span></div>
            ))}
            <div className="flex gap-2 pt-3"><button onClick={() => openEdit(detailItem)} className="btn-primary">Edit</button><button onClick={() => remove(detailItem.id)} className="btn-danger">Delete</button></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Product' : 'New Product'}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name"><input className="input-field" value={form.name||''} onChange={e => setForm({...form,name:e.target.value})} /></FormField>
          <FormField label="Type">
            <select className="input-field" value={form.type||''} onChange={e => setForm({...form,type:e.target.value})}>
              {['conventional','fha','va','usda','arm','jumbo','construction','heloc','investment','second_home','community'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          {[['interest_rate','Interest Rate %'],['min_credit_score','Min Credit Score'],['max_ltv','Max LTV %'],['max_dti','Max DTI %'],['min_down_payment','Min Down Payment %'],['term_months','Term (months)']].map(([k,l]) => (
            <FormField key={k} label={l}><input className="input-field" type="number" step="0.001" value={form[k]||''} onChange={e => setForm({...form,[k]:e.target.value})} /></FormField>
          ))}
          <div className="col-span-2"><FormField label="Description"><input className="input-field" value={form.description||''} onChange={e => setForm({...form,description:e.target.value})} /></FormField></div>
        </div>
        <div className="flex gap-3 mt-6"><button onClick={save} className="btn-primary">Save</button><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
      </Modal>
    </div>
  );
}
