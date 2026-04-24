import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { StatusBadge, Modal, FormField } from '../components/DataPage';

export default function Borrowers() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const load = () => api.get('/borrowers').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ employment_status: 'employed' }); setShowModal(true); };
  const openEdit = (item, e) => { e.stopPropagation(); setEditItem(item); setForm(item); setShowModal(true); };

  const save = async () => {
    if (editItem) await api.put(`/borrowers/${editItem.id}`, form);
    else await api.post('/borrowers', form);
    setShowModal(false); load();
  };

  const remove = async (id, e) => { e.stopPropagation(); if (confirm('Delete?')) { await api.delete(`/borrowers/${id}`); load(); } };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Borrowers</h1><p className="text-gray-500 text-sm">{items.length} borrowers</p></div>
        <button onClick={openNew} className="btn-primary">+ New Borrower</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Employer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Income</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Credit Score</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => navigate(`/borrowers/${item.id}`)} className="border-b hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-medium">{item.first_name} {item.last_name}</td>
                <td className="px-4 py-3 text-gray-600">{item.email}</td>
                <td className="px-4 py-3">{item.employer_name}</td>
                <td className="px-4 py-3 font-medium">${Number(item.annual_income).toLocaleString()}</td>
                <td className="px-4 py-3"><span className={`font-bold ${item.credit_score >= 740 ? 'text-emerald-600' : item.credit_score >= 680 ? 'text-amber-600' : 'text-red-600'}`}>{item.credit_score}</span></td>
                <td className="px-4 py-3"><StatusBadge status={item.employment_status} /></td>
                <td className="px-4 py-3">
                  <button onClick={(e) => openEdit(item, e)} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                  <button onClick={(e) => remove(item.id, e)} className="text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Borrower' : 'New Borrower'}>
        <div className="grid grid-cols-2 gap-4">
          {[['first_name','First Name'],['last_name','Last Name'],['email','Email'],['phone','Phone'],['employer_name','Employer'],['job_title','Job Title'],['annual_income','Annual Income'],['monthly_debt','Monthly Debt'],['credit_score','Credit Score'],['years_employed','Years Employed'],['address','Address'],['city','City'],['state','State'],['zip','Zip']].map(([k,l]) => (
            <FormField key={k} label={l}><input className="input-field" value={form[k]||''} onChange={e => setForm({...form,[k]:e.target.value})} /></FormField>
          ))}
          <FormField label="Employment Status">
            <select className="input-field" value={form.employment_status||''} onChange={e => setForm({...form, employment_status: e.target.value})}>
              <option value="employed">Employed</option><option value="self_employed">Self-Employed</option><option value="retired">Retired</option><option value="unemployed">Unemployed</option>
            </select>
          </FormField>
        </div>
        <div className="flex gap-3 mt-6"><button onClick={save} className="btn-primary">Save</button><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
      </Modal>
    </div>
  );
}
