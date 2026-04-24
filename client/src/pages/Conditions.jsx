import React, { useState, useEffect } from 'react';
import api from '../api';
import { StatusBadge, Modal, FormField } from '../components/DataPage';

export default function Conditions() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api.get('/conditions').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ type: 'prior_to_closing', priority: 'medium', status: 'pending' }); setShowModal(true); };
  const openEdit = (item, e) => { e?.stopPropagation(); setEditItem(item); setForm({...item, due_date: item.due_date?.split('T')[0]}); setShowModal(true); setDetailItem(null); };
  const save = async () => { if (editItem) await api.put(`/conditions/${editItem.id}`, form); else await api.post('/conditions', form); setShowModal(false); load(); };
  const remove = async (id) => { if (confirm('Delete?')) { await api.delete(`/conditions/${id}`); setDetailItem(null); load(); } };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Conditions / Checklist</h1><p className="text-gray-500 text-sm">{items.length} conditions</p></div>
        <button onClick={openNew} className="btn-primary">+ New Condition</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Application</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Due Date</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setDetailItem(item)} className="border-b hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-mono text-blue-600">{item.application_number}</td>
                <td className="px-4 py-3 capitalize">{item.category}</td>
                <td className="px-4 py-3 max-w-xs truncate">{item.description}</td>
                <td className="px-4 py-3 capitalize text-xs">{(item.type||'').replace(/_/g,' ')}</td>
                <td className="px-4 py-3"><StatusBadge status={item.priority} /></td>
                <td className="px-4 py-3">{item.due_date?.split('T')[0]}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3">
                  <button onClick={(e) => openEdit(item, e)} className="text-blue-600 mr-2">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); remove(item.id); }} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Condition Details">
        {detailItem && (
          <div className="space-y-3">
            {[['Application', detailItem.application_number],['Category', detailItem.category],['Description', detailItem.description],['Type', (detailItem.type||'').replace(/_/g,' ')],['Priority', detailItem.priority],['Status', detailItem.status],['Due Date', detailItem.due_date?.split('T')[0]],['Notes', detailItem.notes||'None']].map(([l,v]) => (
              <div key={l} className="flex justify-between border-b pb-2"><span className="text-gray-500">{l}</span><span className="font-medium capitalize max-w-sm text-right">{v}</span></div>
            ))}
            <div className="flex gap-2 pt-3"><button onClick={() => openEdit(detailItem)} className="btn-primary">Edit</button><button onClick={() => remove(detailItem.id)} className="btn-danger">Delete</button></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Condition' : 'New Condition'}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Application ID"><input className="input-field" type="number" value={form.application_id||''} onChange={e => setForm({...form,application_id:e.target.value})} /></FormField>
          <FormField label="Category">
            <select className="input-field" value={form.category||''} onChange={e => setForm({...form,category:e.target.value})}>
              {['Income','Assets','Credit','Property','Insurance','Title','Employment','Eligibility'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <div className="col-span-2"><FormField label="Description"><input className="input-field" value={form.description||''} onChange={e => setForm({...form,description:e.target.value})} /></FormField></div>
          <FormField label="Type">
            <select className="input-field" value={form.type||''} onChange={e => setForm({...form,type:e.target.value})}>
              <option value="prior_to_closing">Prior to Closing</option><option value="prior_to_approval">Prior to Approval</option><option value="prior_to_funding">Prior to Funding</option>
            </select>
          </FormField>
          <FormField label="Priority">
            <select className="input-field" value={form.priority||''} onChange={e => setForm({...form,priority:e.target.value})}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </FormField>
          <FormField label="Status">
            <select className="input-field" value={form.status||''} onChange={e => setForm({...form,status:e.target.value})}>
              <option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option>
            </select>
          </FormField>
          <FormField label="Due Date"><input className="input-field" type="date" value={form.due_date||''} onChange={e => setForm({...form,due_date:e.target.value})} /></FormField>
          <div className="col-span-2"><FormField label="Notes"><input className="input-field" value={form.notes||''} onChange={e => setForm({...form,notes:e.target.value})} /></FormField></div>
        </div>
        <div className="flex gap-3 mt-6"><button onClick={save} className="btn-primary">Save</button><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
      </Modal>
    </div>
  );
}
