import React, { useState, useEffect } from 'react';
import api from '../api';
import { Modal } from '../components/DataPage';

export default function AuditLog() {
  const [items, setItems] = useState([]);
  const [detailItem, setDetailItem] = useState(null);

  useEffect(() => { api.get('/audit').then(r => setItems(r.data)); }, []);

  const actionColor = (action) => {
    if (action?.includes('created') || action?.includes('approved')) return 'text-emerald-600 bg-emerald-50';
    if (action?.includes('denied') || action?.includes('deleted')) return 'text-red-600 bg-red-50';
    if (action?.includes('updated') || action?.includes('reviewed')) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-gray-500 text-sm">{items.length} entries</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Entity</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Entity ID</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setDetailItem(item)} className="border-b hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(item.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 font-medium">{item.user_name}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${actionColor(item.action)}`}>{(item.action||'').replace(/_/g,' ')}</span></td>
                <td className="px-4 py-3 capitalize">{(item.entity_type||'').replace(/_/g,' ')}</td>
                <td className="px-4 py-3 font-mono">{item.entity_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Audit Entry Details">
        {detailItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['User', detailItem.user_name],['Action', (detailItem.action||'').replace(/_/g,' ')],['Entity', (detailItem.entity_type||'').replace(/_/g,' ')],['Entity ID', detailItem.entity_id],['Time', new Date(detailItem.created_at).toLocaleString()]].map(([l,v]) => (
                <div key={l}><span className="text-gray-500 text-sm">{l}</span><p className="font-medium capitalize">{v}</p></div>
              ))}
            </div>
            {detailItem.old_values && <div><h4 className="font-medium text-sm text-gray-500 mb-1">Previous Values</h4><pre className="bg-red-50 rounded-lg p-3 text-xs overflow-auto">{JSON.stringify(detailItem.old_values, null, 2)}</pre></div>}
            {detailItem.new_values && <div><h4 className="font-medium text-sm text-gray-500 mb-1">New Values</h4><pre className="bg-emerald-50 rounded-lg p-3 text-xs overflow-auto">{JSON.stringify(detailItem.new_values, null, 2)}</pre></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
