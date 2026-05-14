import React, { useState, useEffect } from 'react';
import api from '../api';
import { StatusBadge, Modal, FormField } from '../components/DataPage';

export default function UnderwritingRules() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api.get('/rules').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ severity: 'warning', is_active: true }); setShowModal(true); };
  const openEdit = (item, e) => { e?.stopPropagation(); setEditItem(item); setForm(item); setShowModal(true); setDetailItem(null); };
  const save = async () => { if (editItem) await api.put(`/rules/${editItem.id}`, form); else await api.post('/rules', form); setShowModal(false); load(); };
  const remove = async (id) => { if (confirm('Delete?')) { await api.delete(`/rules/${id}`); setDetailItem(null); load(); } };

  const severityColor = { error: 'badge-danger', warning: 'badge-warning', info: 'badge-info' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Underwriting Rules</h1><p className="text-gray-500 text-sm">{items.length} rules — evaluate on the Application Detail page</p></div>
        <button onClick={openNew} className="btn-primary">+ New Rule</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Condition</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Severity</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Active</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setDetailItem(item)} className="border-b hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 capitalize">{item.category}</td>
                <td className="px-4 py-3 font-mono text-xs">{item.condition_field} {item.operator} {item.threshold_value}</td>
                <td className="px-4 py-3 capitalize text-xs">{(item.action||'').replace(/_/g,' ')}</td>
                <td className="px-4 py-3"><span className={severityColor[item.severity]||'badge-neutral'}>{item.severity}</span></td>
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

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Rule Details">
        {detailItem && (
          <div className="space-y-3">
            {[['Name', detailItem.name],['Category', detailItem.category],['Condition', `${detailItem.condition_field} ${detailItem.operator} ${detailItem.threshold_value}`],['Action', (detailItem.action||'').replace(/_/g,' ')],['Severity', detailItem.severity],['Active', detailItem.is_active?'Yes':'No'],['Description', detailItem.description]].map(([l,v]) => (
              <div key={l} className="flex justify-between border-b pb-2"><span className="text-gray-500">{l}</span><span className="font-medium capitalize max-w-sm text-right">{v}</span></div>
            ))}
            <div className="flex gap-2 pt-3"><button onClick={() => openEdit(detailItem)} className="btn-primary">Edit</button><button onClick={() => remove(detailItem.id)} className="btn-danger">Delete</button></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Rule' : 'New Rule'}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><FormField label="Name"><input className="input-field" value={form.name||''} onChange={e => setForm({...form,name:e.target.value})} /></FormField></div>
          <FormField label="Category">
            <select className="input-field" value={form.category||''} onChange={e => setForm({...form,category:e.target.value})}>
              {['credit','capacity','collateral','income','assets','loan','property'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Condition Field"><input className="input-field" value={form.condition_field||''} onChange={e => setForm({...form,condition_field:e.target.value})} placeholder="e.g. credit_score" /></FormField>
          <FormField label="Operator">
            <select className="input-field" value={form.operator||''} onChange={e => setForm({...form,operator:e.target.value})}>
              {['>=','<=','>','<','==','!='].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Threshold"><input className="input-field" value={form.threshold_value||''} onChange={e => setForm({...form,threshold_value:e.target.value})} /></FormField>
          <FormField label="Action"><input className="input-field" value={form.action||''} onChange={e => setForm({...form,action:e.target.value})} placeholder="e.g. flag_review" /></FormField>
          <FormField label="Severity">
            <select className="input-field" value={form.severity||''} onChange={e => setForm({...form,severity:e.target.value})}>
              <option value="info">Info</option><option value="warning">Warning</option><option value="error">Error</option>
            </select>
          </FormField>
          <div className="col-span-2"><FormField label="Description"><input className="input-field" value={form.description||''} onChange={e => setForm({...form,description:e.target.value})} /></FormField></div>
        </div>
        <div className="flex gap-3 mt-6"><button onClick={save} className="btn-primary">Save</button><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
      </Modal>
    </div>
  );
}
