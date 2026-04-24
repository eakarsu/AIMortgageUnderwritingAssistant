import React, { useState, useEffect } from 'react';
import api from '../api';
import { Modal, FormField } from '../components/DataPage';

export default function FeeSchedules() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api.get('/fees').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ is_percentage: false, is_active: true }); setShowModal(true); };
  const openEdit = (item, e) => { e?.stopPropagation(); setEditItem(item); setForm(item); setShowModal(true); setDetailItem(null); };
  const save = async () => { if (editItem) await api.put(`/fees/${editItem.id}`, form); else await api.post('/fees', form); setShowModal(false); load(); };
  const remove = async (id) => { if (confirm('Delete?')) { await api.delete(`/fees/${id}`); setDetailItem(null); load(); } };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Fee Schedules</h1><p className="text-gray-500 text-sm">{items.length} fees</p></div>
        <button onClick={openNew} className="btn-primary">+ New Fee</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Applies To</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Active</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setDetailItem(item)} className="border-b hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 capitalize">{item.category}</td>
                <td className="px-4 py-3 font-bold text-blue-600">{item.is_percentage ? `${item.amount}%` : `$${Number(item.amount).toLocaleString()}`}</td>
                <td className="px-4 py-3 capitalize">{(item.applies_to||'').replace(/_/g,' ')}</td>
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

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Fee Details">
        {detailItem && (
          <div className="space-y-3">
            {[['Name', detailItem.name],['Category', detailItem.category],['Amount', detailItem.is_percentage ? `${detailItem.amount}%` : `$${Number(detailItem.amount).toLocaleString()}`],['Type', detailItem.is_percentage?'Percentage':'Fixed'],['Applies To', detailItem.applies_to],['Description', detailItem.description],['Active', detailItem.is_active?'Yes':'No']].map(([l,v]) => (
              <div key={l} className="flex justify-between border-b pb-2"><span className="text-gray-500">{l}</span><span className="font-medium capitalize">{v}</span></div>
            ))}
            <div className="flex gap-2 pt-3"><button onClick={() => openEdit(detailItem)} className="btn-primary">Edit</button><button onClick={() => remove(detailItem.id)} className="btn-danger">Delete</button></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Fee' : 'New Fee'}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name"><input className="input-field" value={form.name||''} onChange={e => setForm({...form,name:e.target.value})} /></FormField>
          <FormField label="Category">
            <select className="input-field" value={form.category||''} onChange={e => setForm({...form,category:e.target.value})}>
              {['origination','application','third_party','title','government','legal','processing','insurance'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Amount"><input className="input-field" type="number" step="0.01" value={form.amount||''} onChange={e => setForm({...form,amount:e.target.value})} /></FormField>
          <FormField label="Is Percentage">
            <select className="input-field" value={form.is_percentage?'true':'false'} onChange={e => setForm({...form,is_percentage:e.target.value==='true'})}>
              <option value="false">No (Fixed $)</option><option value="true">Yes (%)</option>
            </select>
          </FormField>
          <FormField label="Applies To"><input className="input-field" value={form.applies_to||''} onChange={e => setForm({...form,applies_to:e.target.value})} /></FormField>
          <div className="col-span-2"><FormField label="Description"><input className="input-field" value={form.description||''} onChange={e => setForm({...form,description:e.target.value})} /></FormField></div>
        </div>
        <div className="flex gap-3 mt-6"><button onClick={save} className="btn-primary">Save</button><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
      </Modal>
    </div>
  );
}
