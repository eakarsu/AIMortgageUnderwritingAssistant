import React, { useState, useEffect } from 'react';
import api from '../api';
import { StatusBadge, Modal, FormField } from '../components/DataPage';

export default function CreditReports() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api.get('/credit-reports').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ bureau: 'Experian', report_date: new Date().toISOString().split('T')[0] }); setShowModal(true); };
  const openEdit = (item, e) => { e?.stopPropagation(); setEditItem(item); setForm({...item, report_date: item.report_date?.split('T')[0]}); setShowModal(true); setDetailItem(null); };
  const save = async () => { if (editItem) await api.put(`/credit-reports/${editItem.id}`, form); else await api.post('/credit-reports', form); setShowModal(false); load(); };
  const remove = async (id) => { if (confirm('Delete?')) { await api.delete(`/credit-reports/${id}`); setDetailItem(null); load(); } };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Credit Reports</h1><p className="text-gray-500 text-sm">{items.length} reports</p></div>
        <button onClick={openNew} className="btn-primary">+ New Report</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Borrower</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Bureau</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Accounts</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Balance</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Delinq.</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setDetailItem(item)} className="border-b hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-medium">{item.borrower_name}</td>
                <td className="px-4 py-3">{item.bureau}</td>
                <td className="px-4 py-3"><span className={`font-bold ${item.score >= 740 ? 'text-emerald-600' : item.score >= 680 ? 'text-amber-600' : 'text-red-600'}`}>{item.score}</span></td>
                <td className="px-4 py-3">{item.report_date?.split('T')[0]}</td>
                <td className="px-4 py-3">{item.total_accounts} ({item.open_accounts} open)</td>
                <td className="px-4 py-3">${Number(item.total_balance).toLocaleString()}</td>
                <td className="px-4 py-3">{item.delinquencies > 0 ? <span className="badge-danger">{item.delinquencies}</span> : <span className="badge-success">0</span>}</td>
                <td className="px-4 py-3">
                  <button onClick={(e) => openEdit(item, e)} className="text-blue-600 mr-2">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); remove(item.id); }} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Credit Report Details">
        {detailItem && (
          <div className="space-y-3">
            {[['Borrower', detailItem.borrower_name],['Bureau', detailItem.bureau],['Score', detailItem.score],['Date', detailItem.report_date?.split('T')[0]],['Total Accounts', detailItem.total_accounts],['Open Accounts', detailItem.open_accounts],['Total Balance', `$${Number(detailItem.total_balance).toLocaleString()}`],['Monthly Payments', `$${Number(detailItem.monthly_payments).toLocaleString()}`],['Delinquencies', detailItem.delinquencies],['Bankruptcies', detailItem.bankruptcies],['Collections', detailItem.collections],['Inquiries (6mo)', detailItem.inquiries_last_6months],['Oldest Account', `${detailItem.oldest_account_years} years`]].map(([l,v]) => (
              <div key={l} className="flex justify-between border-b pb-2"><span className="text-gray-500">{l}</span><span className="font-medium">{v}</span></div>
            ))}
            <div className="flex gap-2 pt-3"><button onClick={() => openEdit(detailItem)} className="btn-primary">Edit</button><button onClick={() => remove(detailItem.id)} className="btn-danger">Delete</button></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Report' : 'New Report'}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Borrower ID"><input className="input-field" type="number" value={form.borrower_id||''} onChange={e => setForm({...form,borrower_id:e.target.value})} /></FormField>
          <FormField label="Bureau">
            <select className="input-field" value={form.bureau||''} onChange={e => setForm({...form,bureau:e.target.value})}>
              <option value="Experian">Experian</option><option value="TransUnion">TransUnion</option><option value="Equifax">Equifax</option>
            </select>
          </FormField>
          {[['score','Score'],['report_date','Date','date'],['total_accounts','Total Accounts'],['open_accounts','Open Accounts'],['total_balance','Total Balance'],['monthly_payments','Monthly Payments'],['delinquencies','Delinquencies'],['bankruptcies','Bankruptcies'],['collections','Collections'],['inquiries_last_6months','Inquiries (6mo)'],['oldest_account_years','Oldest Account (years)']].map(([k,l,t]) => (
            <FormField key={k} label={l}><input className="input-field" type={t||'number'} value={form[k]||''} onChange={e => setForm({...form,[k]:e.target.value})} /></FormField>
          ))}
        </div>
        <div className="flex gap-3 mt-6"><button onClick={save} className="btn-primary">Save</button><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
      </Modal>
    </div>
  );
}
