import React, { useState, useEffect } from 'react';
import api from '../api';
import { StatusBadge, Modal, FormField } from '../components/DataPage';

export default function Compliance() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api.get('/compliance').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ status: 'pending' }); setShowModal(true); };
  const openEdit = (item, e) => { e?.stopPropagation(); setEditItem(item); setForm(item); setShowModal(true); setDetailItem(null); };
  const save = async () => { if (editItem) await api.put(`/compliance/${editItem.id}`, form); else await api.post('/compliance', form); setShowModal(false); load(); };
  const remove = async (id) => { if (confirm('Delete?')) { await api.delete(`/compliance/${id}`); setDetailItem(null); load(); } };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Compliance Checks</h1><p className="text-gray-500 text-sm">{items.length} checks</p></div>
        <button onClick={openNew} className="btn-primary">+ New Check</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Application</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Check Type</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Regulation</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Result</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setDetailItem(item)} className="border-b hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-mono text-blue-600">{item.application_number}</td>
                <td className="px-4 py-3 font-medium">{item.check_type}</td>
                <td className="px-4 py-3 text-gray-600">{item.regulation}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3">{item.result ? <StatusBadge status={item.result} /> : '-'}</td>
                <td className="px-4 py-3">
                  <button onClick={(e) => openEdit(item, e)} className="text-blue-600 mr-2">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); remove(item.id); }} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Compliance Check Details">
        {detailItem && (
          <div className="space-y-3">
            {[['Application', detailItem.application_number],['Check Type', detailItem.check_type],['Regulation', detailItem.regulation],['Status', detailItem.status],['Result', detailItem.result||'Pending'],['Details', detailItem.details||'None']].map(([l,v]) => (
              <div key={l} className="flex justify-between border-b pb-2"><span className="text-gray-500">{l}</span><span className="font-medium capitalize max-w-sm text-right">{v}</span></div>
            ))}
            <div className="flex gap-2 pt-3"><button onClick={() => openEdit(detailItem)} className="btn-primary">Edit</button><button onClick={() => remove(detailItem.id)} className="btn-danger">Delete</button></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Check' : 'New Check'}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Application ID"><input className="input-field" type="number" value={form.application_id||''} onChange={e => setForm({...form,application_id:e.target.value})} /></FormField>
          <FormField label="Check Type"><input className="input-field" value={form.check_type||''} onChange={e => setForm({...form,check_type:e.target.value})} /></FormField>
          <FormField label="Regulation"><input className="input-field" value={form.regulation||''} onChange={e => setForm({...form,regulation:e.target.value})} /></FormField>
          <FormField label="Status">
            <select className="input-field" value={form.status||''} onChange={e => setForm({...form,status:e.target.value})}>
              <option value="pending">Pending</option><option value="passed">Passed</option><option value="failed">Failed</option>
            </select>
          </FormField>
          <FormField label="Result">
            <select className="input-field" value={form.result||''} onChange={e => setForm({...form,result:e.target.value})}>
              <option value="">Pending</option><option value="pass">Pass</option><option value="fail">Fail</option>
            </select>
          </FormField>
          <div className="col-span-2"><FormField label="Details"><input className="input-field" value={form.details||''} onChange={e => setForm({...form,details:e.target.value})} /></FormField></div>
        </div>
        <div className="flex gap-3 mt-6"><button onClick={save} className="btn-primary">Save</button><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
      </Modal>
    </div>
  );
}
