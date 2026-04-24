import React, { useState, useEffect } from 'react';
import api from '../api';
import { Modal, FormField } from '../components/DataPage';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api.get('/notifications').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ type: 'info' }); setShowModal(true); };
  const save = async () => { await api.post('/notifications', form); setShowModal(false); load(); };
  const markRead = async (id, e) => { e.stopPropagation(); await api.put(`/notifications/${id}/read`); load(); };
  const remove = async (id, e) => { e.stopPropagation(); if (confirm('Delete?')) { await api.delete(`/notifications/${id}`); setDetailItem(null); load(); } };

  const typeIcon = { info: '📘', success: '✅', warning: '⚠️', error: '🚨' };
  const typeBg = { info: 'border-l-blue-400', success: 'border-l-emerald-400', warning: 'border-l-amber-400', error: 'border-l-red-400' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Notifications</h1><p className="text-gray-500 text-sm">{items.filter(i=>!i.is_read).length} unread</p></div>
        <button onClick={openNew} className="btn-primary">+ New Notification</button>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} onClick={() => setDetailItem(item)} className={`bg-white rounded-lg border-l-4 ${typeBg[item.type]||typeBg.info} p-4 shadow-sm hover:shadow-md cursor-pointer transition-all ${item.is_read ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-xl">{typeIcon[item.type]||'📘'}</span>
                <div>
                  <h3 className={`font-semibold ${item.is_read ? 'text-gray-500' : 'text-gray-900'}`}>{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{item.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(item.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {!item.is_read && <button onClick={(e) => markRead(item.id, e)} className="text-blue-600 text-xs hover:text-blue-800">Mark Read</button>}
                <button onClick={(e) => remove(item.id, e)} className="text-red-600 text-xs hover:text-red-800">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Notification Details">
        {detailItem && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-2xl">{typeIcon[detailItem.type]} <span className="text-lg font-bold">{detailItem.title}</span></div>
            <p className="text-gray-700">{detailItem.message}</p>
            <p className="text-sm text-gray-400">{new Date(detailItem.created_at).toLocaleString()}</p>
            {detailItem.link && <p className="text-sm"><span className="text-gray-500">Link: </span><span className="text-blue-600">{detailItem.link}</span></p>}
            <div className="flex gap-2 pt-3"><button onClick={() => remove(detailItem.id, {stopPropagation:()=>{}})} className="btn-danger">Delete</button></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Notification">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="User ID"><input className="input-field" type="number" value={form.user_id||''} onChange={e => setForm({...form,user_id:e.target.value})} /></FormField>
          <FormField label="Type">
            <select className="input-field" value={form.type||''} onChange={e => setForm({...form,type:e.target.value})}>
              <option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="error">Error</option>
            </select>
          </FormField>
          <div className="col-span-2"><FormField label="Title"><input className="input-field" value={form.title||''} onChange={e => setForm({...form,title:e.target.value})} /></FormField></div>
          <div className="col-span-2"><FormField label="Message"><input className="input-field" value={form.message||''} onChange={e => setForm({...form,message:e.target.value})} /></FormField></div>
          <FormField label="Link"><input className="input-field" value={form.link||''} onChange={e => setForm({...form,link:e.target.value})} /></FormField>
        </div>
        <div className="flex gap-3 mt-6"><button onClick={save} className="btn-primary">Save</button><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
      </Modal>
    </div>
  );
}
