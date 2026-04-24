import React, { useState, useEffect } from 'react';
import api from '../api';
import { StatusBadge, Modal, FormField } from '../components/DataPage';

export default function Documents() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api.get('/documents').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ type: 'w2', status: 'pending_review' }); setShowModal(true); };
  const openEdit = (item, e) => { e?.stopPropagation(); setEditItem(item); setForm(item); setShowModal(true); setDetailItem(null); };
  const save = async () => { if (editItem) await api.put(`/documents/${editItem.id}`, form); else await api.post('/documents', form); setShowModal(false); load(); };
  const remove = async (id) => { if (confirm('Delete?')) { await api.delete(`/documents/${id}`); setDetailItem(null); load(); } };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Documents</h1><p className="text-gray-500 text-sm">{items.length} documents</p></div>
        <button onClick={openNew} className="btn-primary">+ New Document</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Borrower</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Application</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setDetailItem(item)} className="border-b hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 capitalize">{(item.type||'').replace(/_/g,' ')}</td>
                <td className="px-4 py-3">{item.borrower_name}</td>
                <td className="px-4 py-3 font-mono text-blue-600">{item.application_number}</td>
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

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Document Details">
        {detailItem && (
          <div className="space-y-3">
            {[['Name', detailItem.name],['Type', detailItem.type],['Borrower', detailItem.borrower_name],['Application', detailItem.application_number],['Status', detailItem.status],['Notes', detailItem.notes||'None'],['Size', detailItem.file_size ? `${(detailItem.file_size/1024).toFixed(0)} KB` : '-']].map(([l,v]) => (
              <div key={l} className="flex justify-between border-b pb-2"><span className="text-gray-500">{l}</span><span className="font-medium">{v}</span></div>
            ))}
            <div className="flex gap-2 pt-3">
              <button onClick={() => openEdit(detailItem)} className="btn-primary">Edit</button>
              <button onClick={() => remove(detailItem.id)} className="btn-danger">Delete</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Document' : 'New Document'}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name"><input className="input-field" value={form.name||''} onChange={e => setForm({...form,name:e.target.value})} /></FormField>
          <FormField label="Type">
            <select className="input-field" value={form.type||''} onChange={e => setForm({...form,type:e.target.value})}>
              {['w2','tax_return','pay_stub','bank_statement','employment_letter','business_license','profit_loss','asset_statement','credit_letter','professional_license','income_verification'].map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
            </select>
          </FormField>
          <FormField label="Application ID"><input className="input-field" type="number" value={form.application_id||''} onChange={e => setForm({...form,application_id:e.target.value})} /></FormField>
          <FormField label="Borrower ID"><input className="input-field" type="number" value={form.borrower_id||''} onChange={e => setForm({...form,borrower_id:e.target.value})} /></FormField>
          <FormField label="Status">
            <select className="input-field" value={form.status||''} onChange={e => setForm({...form,status:e.target.value})}>
              <option value="pending_review">Pending Review</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
            </select>
          </FormField>
          <FormField label="Notes"><input className="input-field" value={form.notes||''} onChange={e => setForm({...form,notes:e.target.value})} /></FormField>
        </div>
        <div className="flex gap-3 mt-6"><button onClick={save} className="btn-primary">Save</button><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
      </Modal>
    </div>
  );
}
