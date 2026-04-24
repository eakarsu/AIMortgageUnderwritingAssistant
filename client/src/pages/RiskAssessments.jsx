import React, { useState, useEffect } from 'react';
import api from '../api';
import { StatusBadge, Modal, FormField } from '../components/DataPage';

export default function RiskAssessments() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api.get('/risk').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ risk_level: 'medium', assessed_by: 'Manual' }); setShowModal(true); };
  const openEdit = (item, e) => { e?.stopPropagation(); setEditItem(item); setForm(item); setShowModal(true); setDetailItem(null); };
  const save = async () => { if (editItem) await api.put(`/risk/${editItem.id}`, form); else await api.post('/risk', form); setShowModal(false); load(); };
  const remove = async (id) => { if (confirm('Delete?')) { await api.delete(`/risk/${id}`); setDetailItem(null); load(); } };

  const riskColor = (level) => level === 'low' ? 'text-emerald-600' : level === 'medium' ? 'text-amber-600' : 'text-red-600';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Risk Assessments</h1><p className="text-gray-500 text-sm">{items.length} assessments</p></div>
        <button onClick={openNew} className="btn-primary">+ New Assessment</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Application</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Risk Level</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Assessed By</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Recommendation</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setDetailItem(item)} className="border-b hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-mono text-blue-600">{item.application_number}</td>
                <td className="px-4 py-3 font-medium">{item.risk_category}</td>
                <td className="px-4 py-3"><StatusBadge status={item.risk_level} /></td>
                <td className="px-4 py-3"><span className={`font-bold ${riskColor(item.risk_level)}`}>{item.score}</span></td>
                <td className="px-4 py-3">{item.assessed_by}</td>
                <td className="px-4 py-3 max-w-xs truncate text-gray-600">{item.recommendation}</td>
                <td className="px-4 py-3">
                  <button onClick={(e) => openEdit(item, e)} className="text-blue-600 mr-2">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); remove(item.id); }} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Risk Assessment Details">
        {detailItem && (
          <div className="space-y-3">
            {[['Application', detailItem.application_number],['Category', detailItem.risk_category],['Risk Level', detailItem.risk_level],['Score', detailItem.score],['Assessed By', detailItem.assessed_by],['Recommendation', detailItem.recommendation]].map(([l,v]) => (
              <div key={l} className="flex justify-between border-b pb-2"><span className="text-gray-500">{l}</span><span className="font-medium capitalize max-w-sm text-right">{v}</span></div>
            ))}
            {detailItem.factors && (
              <div className="mt-4"><h4 className="font-medium mb-2">Risk Factors</h4>
                <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-auto">{JSON.stringify(detailItem.factors, null, 2)}</pre>
              </div>
            )}
            <div className="flex gap-2 pt-3"><button onClick={() => openEdit(detailItem)} className="btn-primary">Edit</button><button onClick={() => remove(detailItem.id)} className="btn-danger">Delete</button></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Assessment' : 'New Assessment'}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Application ID"><input className="input-field" type="number" value={form.application_id||''} onChange={e => setForm({...form,application_id:e.target.value})} /></FormField>
          <FormField label="Risk Category"><input className="input-field" value={form.risk_category||''} onChange={e => setForm({...form,risk_category:e.target.value})} placeholder="e.g. Credit Risk" /></FormField>
          <FormField label="Risk Level">
            <select className="input-field" value={form.risk_level||''} onChange={e => setForm({...form,risk_level:e.target.value})}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </FormField>
          <FormField label="Score (0-100)"><input className="input-field" type="number" value={form.score||''} onChange={e => setForm({...form,score:e.target.value})} /></FormField>
          <FormField label="Assessed By"><input className="input-field" value={form.assessed_by||''} onChange={e => setForm({...form,assessed_by:e.target.value})} /></FormField>
          <div className="col-span-2"><FormField label="Recommendation"><input className="input-field" value={form.recommendation||''} onChange={e => setForm({...form,recommendation:e.target.value})} /></FormField></div>
        </div>
        <div className="flex gap-3 mt-6"><button onClick={save} className="btn-primary">Save</button><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
      </Modal>
    </div>
  );
}
