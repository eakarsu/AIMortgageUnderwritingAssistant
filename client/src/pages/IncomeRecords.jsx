import React, { useState, useEffect } from 'react';
import api from '../api';
import { StatusBadge, Modal, FormField } from '../components/DataPage';

export default function IncomeRecords() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api.get('/income').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ type: 'salary', frequency: 'annual' }); setShowModal(true); };
  const openEdit = (item, e) => { e?.stopPropagation(); setEditItem(item); setForm(item); setShowModal(true); setDetailItem(null); };
  const save = async () => { if (editItem) await api.put(`/income/${editItem.id}`, form); else await api.post('/income', form); setShowModal(false); load(); };
  const remove = async (id) => { if (confirm('Delete?')) { await api.delete(`/income/${id}`); setDetailItem(null); load(); } };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Income Records</h1><p className="text-gray-500 text-sm">{items.length} records</p></div>
        <button onClick={openNew} className="btn-primary">+ New Record</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Borrower</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Frequency</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Verified</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setDetailItem(item)} className="border-b hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-medium">{item.borrower_name}</td>
                <td className="px-4 py-3">{item.source}</td>
                <td className="px-4 py-3 capitalize">{(item.type||'').replace(/_/g,' ')}</td>
                <td className="px-4 py-3 font-medium">${Number(item.amount).toLocaleString()}</td>
                <td className="px-4 py-3 capitalize">{item.frequency}</td>
                <td className="px-4 py-3">{item.verified ? <span className="badge-success">Verified</span> : <span className="badge-warning">Pending</span>}</td>
                <td className="px-4 py-3">
                  <button onClick={(e) => openEdit(item, e)} className="text-blue-600 mr-2">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); remove(item.id); }} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Income Record Details">
        {detailItem && (
          <div className="space-y-3">
            {[['Borrower', detailItem.borrower_name],['Source', detailItem.source],['Type', detailItem.type],['Amount', `$${Number(detailItem.amount).toLocaleString()}`],['Frequency', detailItem.frequency],['Verified', detailItem.verified?'Yes':'No'],['Method', detailItem.verification_method],['Employer', detailItem.employer_name],['Start Date', detailItem.start_date?.split('T')[0]]].map(([l,v]) => (
              <div key={l} className="flex justify-between border-b pb-2"><span className="text-gray-500">{l}</span><span className="font-medium">{v||'-'}</span></div>
            ))}
            <div className="flex gap-2 pt-3"><button onClick={() => openEdit(detailItem)} className="btn-primary">Edit</button><button onClick={() => remove(detailItem.id)} className="btn-danger">Delete</button></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Record' : 'New Record'}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Borrower ID"><input className="input-field" type="number" value={form.borrower_id||''} onChange={e => setForm({...form,borrower_id:e.target.value})} /></FormField>
          <FormField label="Source"><input className="input-field" value={form.source||''} onChange={e => setForm({...form,source:e.target.value})} /></FormField>
          <FormField label="Type">
            <select className="input-field" value={form.type||''} onChange={e => setForm({...form,type:e.target.value})}>
              {['salary','self_employment','freelance','investment','pension','rental','bonus','commission'].map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
            </select>
          </FormField>
          <FormField label="Amount"><input className="input-field" type="number" value={form.amount||''} onChange={e => setForm({...form,amount:e.target.value})} /></FormField>
          <FormField label="Frequency">
            <select className="input-field" value={form.frequency||''} onChange={e => setForm({...form,frequency:e.target.value})}>
              {['annual','monthly','biweekly','weekly'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Employer"><input className="input-field" value={form.employer_name||''} onChange={e => setForm({...form,employer_name:e.target.value})} /></FormField>
          <FormField label="Verification Method"><input className="input-field" value={form.verification_method||''} onChange={e => setForm({...form,verification_method:e.target.value})} /></FormField>
          <FormField label="Verified">
            <select className="input-field" value={form.verified?'true':'false'} onChange={e => setForm({...form,verified:e.target.value==='true'})}>
              <option value="false">No</option><option value="true">Yes</option>
            </select>
          </FormField>
        </div>
        <div className="flex gap-3 mt-6"><button onClick={save} className="btn-primary">Save</button><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
      </Modal>
    </div>
  );
}
