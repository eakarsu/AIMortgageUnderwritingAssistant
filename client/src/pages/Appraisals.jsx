import React, { useState, useEffect } from 'react';
import api from '../api';
import { StatusBadge, Modal, FormField } from '../components/DataPage';

export default function Appraisals() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api.get('/appraisals').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ status: 'pending' }); setShowModal(true); };
  const openEdit = (item, e) => { e?.stopPropagation(); setEditItem(item); setForm({...item, appraisal_date: item.appraisal_date?.split('T')[0]}); setShowModal(true); setDetailItem(null); };
  const save = async () => { if (editItem) await api.put(`/appraisals/${editItem.id}`, form); else await api.post('/appraisals', form); setShowModal(false); load(); };
  const remove = async (id) => { if (confirm('Delete?')) { await api.delete(`/appraisals/${id}`); setDetailItem(null); load(); } };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Appraisals</h1><p className="text-gray-500 text-sm">{items.length} appraisals</p></div>
        <button onClick={openNew} className="btn-primary">+ New Appraisal</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Property</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Application</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Appraiser</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Appraised Value</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Market Value</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Condition</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setDetailItem(item)} className="border-b hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-medium">{item.property_address}, {item.property_city}</td>
                <td className="px-4 py-3 font-mono text-blue-600">{item.application_number}</td>
                <td className="px-4 py-3">{item.appraiser_name}</td>
                <td className="px-4 py-3 font-medium">${Number(item.appraised_value).toLocaleString()}</td>
                <td className="px-4 py-3">${Number(item.market_value).toLocaleString()}</td>
                <td className="px-4 py-3 capitalize">{(item.condition_rating||'').replace(/_/g,' ')}</td>
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

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Appraisal Details">
        {detailItem && (
          <div className="space-y-3">
            {[['Property', `${detailItem.property_address}, ${detailItem.property_city}`],['Application', detailItem.application_number],['Appraiser', detailItem.appraiser_name],['License', detailItem.appraiser_license],['Date', detailItem.appraisal_date?.split('T')[0]],['Appraised Value', `$${Number(detailItem.appraised_value).toLocaleString()}`],['Market Value', `$${Number(detailItem.market_value).toLocaleString()}`],['Condition', detailItem.condition_rating],['Status', detailItem.status],['Notes', detailItem.notes||'None']].map(([l,v]) => (
              <div key={l} className="flex justify-between border-b pb-2"><span className="text-gray-500">{l}</span><span className="font-medium capitalize">{v}</span></div>
            ))}
            <div className="flex gap-2 pt-3"><button onClick={() => openEdit(detailItem)} className="btn-primary">Edit</button><button onClick={() => remove(detailItem.id)} className="btn-danger">Delete</button></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Appraisal' : 'New Appraisal'}>
        <div className="grid grid-cols-2 gap-4">
          {[['property_id','Property ID','number'],['application_id','Application ID','number'],['appraiser_name','Appraiser Name'],['appraiser_license','License #'],['appraisal_date','Date','date'],['appraised_value','Appraised Value','number'],['market_value','Market Value','number']].map(([k,l,t]) => (
            <FormField key={k} label={l}><input className="input-field" type={t||'text'} value={form[k]||''} onChange={e => setForm({...form,[k]:e.target.value})} /></FormField>
          ))}
          <FormField label="Condition">
            <select className="input-field" value={form.condition_rating||''} onChange={e => setForm({...form,condition_rating:e.target.value})}>
              {['excellent','very_good','good','fair','poor'].map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
            </select>
          </FormField>
          <FormField label="Status">
            <select className="input-field" value={form.status||''} onChange={e => setForm({...form,status:e.target.value})}>
              <option value="pending">Pending</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
            </select>
          </FormField>
          <div className="col-span-2"><FormField label="Notes"><input className="input-field" value={form.notes||''} onChange={e => setForm({...form,notes:e.target.value})} /></FormField></div>
        </div>
        <div className="flex gap-3 mt-6"><button onClick={save} className="btn-primary">Save</button><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
      </Modal>
    </div>
  );
}
