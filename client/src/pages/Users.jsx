import React, { useState, useEffect } from 'react';
import api from '../api';
import { Modal, FormField } from '../components/DataPage';

export default function Users() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api.get('/users').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ role: 'underwriter', password: 'password123' }); setShowModal(true); };
  const openEdit = (item, e) => { e?.stopPropagation(); setEditItem(item); setForm(item); setShowModal(true); setDetailItem(null); };
  const save = async () => { if (editItem) await api.put(`/users/${editItem.id}`, form); else await api.post('/users', form); setShowModal(false); load(); };
  const remove = async (id) => { if (confirm('Delete?')) { await api.delete(`/users/${id}`); setDetailItem(null); load(); } };

  const roleColors = { admin: 'bg-purple-100 text-purple-700', manager: 'bg-blue-100 text-blue-700', underwriter: 'bg-emerald-100 text-emerald-700', analyst: 'bg-cyan-100 text-cyan-700', processor: 'bg-amber-100 text-amber-700', closer: 'bg-pink-100 text-pink-700', reviewer: 'bg-indigo-100 text-indigo-700', compliance: 'bg-red-100 text-red-700', supervisor: 'bg-orange-100 text-orange-700', intern: 'bg-gray-100 text-gray-700' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">User Management</h1><p className="text-gray-500 text-sm">{items.length} users</p></div>
        <button onClick={openNew} className="btn-primary">+ New User</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setDetailItem(item)} className="border-b hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-medium">{item.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{item.email}</td>
                <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[item.role]||roleColors.intern}`}>{item.role}</span></td>
                <td className="px-4 py-3 text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={(e) => openEdit(item, e)} className="text-blue-600 mr-2">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); remove(item.id); }} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="User Details">
        {detailItem && (
          <div className="space-y-3">
            {[['Name', detailItem.full_name],['Email', detailItem.email],['Role', detailItem.role],['Joined', new Date(detailItem.created_at).toLocaleDateString()]].map(([l,v]) => (
              <div key={l} className="flex justify-between border-b pb-2"><span className="text-gray-500">{l}</span><span className="font-medium capitalize">{v}</span></div>
            ))}
            <div className="flex gap-2 pt-3"><button onClick={() => openEdit(detailItem)} className="btn-primary">Edit</button><button onClick={() => remove(detailItem.id)} className="btn-danger">Delete</button></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit User' : 'New User'}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Full Name"><input className="input-field" value={form.full_name||''} onChange={e => setForm({...form,full_name:e.target.value})} /></FormField>
          <FormField label="Email"><input className="input-field" type="email" value={form.email||''} onChange={e => setForm({...form,email:e.target.value})} /></FormField>
          {!editItem && <FormField label="Password"><input className="input-field" type="password" value={form.password||''} onChange={e => setForm({...form,password:e.target.value})} /></FormField>}
          <FormField label="Role">
            <select className="input-field" value={form.role||''} onChange={e => setForm({...form,role:e.target.value})}>
              {['admin','manager','underwriter','analyst','processor','closer','reviewer','compliance','supervisor','intern'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </FormField>
        </div>
        <div className="flex gap-3 mt-6"><button onClick={save} className="btn-primary">Save</button><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
      </Modal>
    </div>
  );
}
