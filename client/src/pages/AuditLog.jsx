import React, { useState, useEffect } from 'react';
import api from '../api';
import { Modal } from '../components/DataPage';

export default function AuditLog() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailItem, setDetailItem] = useState(null);

  const load = (p = 1) => {
    api.get(`/audit?page=${p}&limit=50`).then(r => {
      const d = r.data;
      setItems(d.data || d);
      setTotal(d.total || (d.data || d).length);
      setTotalPages(d.totalPages || 1);
      setPage(p);
    });
  };

  useEffect(() => { load(); }, []);

  const actionColor = (action) => {
    if (!action) return 'text-gray-600 bg-gray-50';
    if (['POST', 'created', 'approved'].some(k => action.includes(k))) return 'text-emerald-600 bg-emerald-50';
    if (['DELETE', 'denied', 'deleted'].some(k => action.includes(k))) return 'text-red-600 bg-red-50';
    if (['PUT', 'updated', 'reviewed'].some(k => action.includes(k))) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-gray-500 text-sm">{total} entries</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Entity</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Entity ID</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">IP</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setDetailItem(item)} className="border-b hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(item.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 font-medium">{item.user_name || '-'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${actionColor(item.action)}`}>{(item.action||'').replace(/_/g,' ')}</span></td>
                <td className="px-4 py-3 capitalize">{(item.entity_type||'').replace(/_/g,' ')}</td>
                <td className="px-4 py-3 font-mono">{item.entity_id}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{item.ip_address || '-'}</td>
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

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Audit Entry Details">
        {detailItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['User', detailItem.user_name],['Action', (detailItem.action||'').replace(/_/g,' ')],['Entity', (detailItem.entity_type||'').replace(/_/g,' ')],['Entity ID', detailItem.entity_id],['IP', detailItem.ip_address || '-'],['Time', new Date(detailItem.created_at).toLocaleString()]].map(([l,v]) => (
                <div key={l}><span className="text-gray-500 text-sm">{l}</span><p className="font-medium capitalize">{v}</p></div>
              ))}
            </div>
            {detailItem.details && <div><h4 className="font-medium text-sm text-gray-500 mb-1">Details</h4><pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-auto border">{typeof detailItem.details === 'string' ? detailItem.details : JSON.stringify(detailItem.details, null, 2)}</pre></div>}
            {detailItem.old_values && <div><h4 className="font-medium text-sm text-gray-500 mb-1">Previous Values</h4><pre className="bg-red-50 rounded-lg p-3 text-xs overflow-auto">{JSON.stringify(detailItem.old_values, null, 2)}</pre></div>}
            {detailItem.new_values && <div><h4 className="font-medium text-sm text-gray-500 mb-1">New Values</h4><pre className="bg-emerald-50 rounded-lg p-3 text-xs overflow-auto">{JSON.stringify(detailItem.new_values, null, 2)}</pre></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
