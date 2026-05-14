import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { StatusBadge, Modal, FormField } from '../components/DataPage';

export default function Documents() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDocId, setOcrDocId] = useState(null);
  const fileInputRef = useRef(null);

  const load = (p = 1) => {
    api.get(`/documents?page=${p}&limit=50`).then(r => {
      const d = r.data;
      setItems(d.data || d);
      setTotal(d.total || (d.data || d).length);
      setTotalPages(d.totalPages || 1);
      setPage(p);
    });
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ type: 'w2', status: 'pending_review' }); setShowModal(true); };
  const openEdit = (item, e) => { e?.stopPropagation(); setEditItem(item); setForm(item); setShowModal(true); setDetailItem(null); };
  const save = async () => { if (editItem) await api.put(`/documents/${editItem.id}`, form); else await api.post('/documents', form); setShowModal(false); load(page); };
  const remove = async (id) => { if (confirm('Delete?')) { await api.delete(`/documents/${id}`); setDetailItem(null); load(page); } };

  const triggerOcr = (docId) => {
    setOcrDocId(docId);
    setOcrResult(null);
    fileInputRef.current.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !ocrDocId) return;
    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documents/${ocrDocId}/ocr`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'OCR failed');
      setOcrResult(data.extracted);
      load(page);
    } catch (err) {
      alert('OCR error: ' + err.message);
    }
    setOcrLoading(false);
  };

  return (
    <div>
      {/* Hidden file input for OCR */}
      <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileSelected} />

      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Documents</h1><p className="text-gray-500 text-sm">{total} documents</p></div>
        <button onClick={openNew} className="btn-primary">+ New Document</button>
      </div>

      {/* OCR Result display */}
      {ocrLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-blue-700 font-medium">Extracting document data with AI OCR...</span>
        </div>
      )}
      {ocrResult && !ocrLoading && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-emerald-800">OCR Extraction Result</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-emerald-600">Confidence: {ocrResult.confidence_score}%</span>
              <button onClick={() => setOcrResult(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[['Document Type', ocrResult.document_type],['Employer', ocrResult.employer_name],['Employee', ocrResult.employee_name],['Gross Income', ocrResult.gross_income ? `$${Number(ocrResult.gross_income).toLocaleString()}` : null],['Net Income', ocrResult.net_income ? `$${Number(ocrResult.net_income).toLocaleString()}` : null],['Pay Period', ocrResult.pay_period],['YTD Earnings', ocrResult.ytd_earnings ? `$${Number(ocrResult.ytd_earnings).toLocaleString()}` : null],['Dates Covered', ocrResult.dates_covered]].filter(([,v]) => v).map(([l,v]) => (
              <div key={l} className="flex justify-between border-b border-emerald-100 pb-1">
                <span className="text-gray-500">{l}</span>
                <span className="font-semibold text-gray-800">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <td className="px-4 py-3 flex gap-2 items-center">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(item, e); }} className="text-blue-600 mr-1">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); triggerOcr(item.id); }} className="text-purple-600 mr-1 text-xs font-medium px-2 py-0.5 bg-purple-50 rounded hover:bg-purple-100">
                    {ocrLoading && ocrDocId === item.id ? 'Extracting...' : 'OCR Extract'}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); remove(item.id); }} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-500">Page {page} of {totalPages} &mdash; {total} total</span>
            <div className="flex gap-2">
              <button onClick={() => load(page - 1)} disabled={page <= 1} className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-white">Prev</button>
              <button onClick={() => load(page + 1)} disabled={page >= totalPages} className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-white">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Document Details">
        {detailItem && (
          <div className="space-y-3">
            {[['Name', detailItem.name],['Type', detailItem.type],['Borrower', detailItem.borrower_name],['Application', detailItem.application_number],['Status', detailItem.status],['Notes', detailItem.notes||'None'],['Size', detailItem.file_size ? `${(detailItem.file_size/1024).toFixed(0)} KB` : '-']].map(([l,v]) => (
              <div key={l} className="flex justify-between border-b pb-2"><span className="text-gray-500">{l}</span><span className="font-medium">{v}</span></div>
            ))}
            <div className="flex gap-2 pt-3">
              <button onClick={() => openEdit(detailItem)} className="btn-primary">Edit</button>
              <button onClick={() => { triggerOcr(detailItem.id); setDetailItem(null); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">Upload &amp; Extract</button>
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
