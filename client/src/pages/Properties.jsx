import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { StatusBadge, Modal, FormField } from '../components/DataPage';

export default function Properties() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const load = () => api.get('/properties').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ property_type: 'single_family', zoning: 'residential', flood_zone: false }); setShowModal(true); };
  const openEdit = (item, e) => { e.stopPropagation(); setEditItem(item); setForm(item); setShowModal(true); };
  const save = async () => { if (editItem) await api.put(`/properties/${editItem.id}`, form); else await api.post('/properties', form); setShowModal(false); load(); };
  const remove = async (id, e) => { e.stopPropagation(); if (confirm('Delete?')) { await api.delete(`/properties/${id}`); load(); } };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Properties</h1><p className="text-gray-500 text-sm">{items.length} properties</p></div>
        <button onClick={openNew} className="btn-primary">+ New Property</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Address</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">City, State</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Sq Ft</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Bed/Bath</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Value</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Flood</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => navigate(`/properties/${item.id}`)} className="border-b hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-medium">{item.address}</td>
                <td className="px-4 py-3">{item.city}, {item.state}</td>
                <td className="px-4 py-3 capitalize">{(item.property_type||'').replace(/_/g,' ')}</td>
                <td className="px-4 py-3">{Number(item.square_feet).toLocaleString()}</td>
                <td className="px-4 py-3">{item.bedrooms}/{item.bathrooms}</td>
                <td className="px-4 py-3 font-medium">${Number(item.estimated_value).toLocaleString()}</td>
                <td className="px-4 py-3">{item.flood_zone ? <span className="badge-danger">Yes</span> : <span className="badge-success">No</span>}</td>
                <td className="px-4 py-3">
                  <button onClick={(e) => openEdit(item, e)} className="text-blue-600 mr-2">Edit</button>
                  <button onClick={(e) => remove(item.id, e)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Property' : 'New Property'}>
        <div className="grid grid-cols-2 gap-4">
          {[['address','Address'],['city','City'],['state','State'],['zip','Zip'],['year_built','Year Built'],['square_feet','Square Feet'],['bedrooms','Bedrooms'],['bathrooms','Bathrooms'],['lot_size','Lot Size (acres)'],['estimated_value','Estimated Value'],['listing_price','Listing Price'],['hoa_fee','HOA Fee']].map(([k,l]) => (
            <FormField key={k} label={l}><input className="input-field" value={form[k]||''} onChange={e => setForm({...form,[k]:e.target.value})} /></FormField>
          ))}
          <FormField label="Type">
            <select className="input-field" value={form.property_type||''} onChange={e => setForm({...form,property_type:e.target.value})}>
              <option value="single_family">Single Family</option><option value="condo">Condo</option><option value="townhouse">Townhouse</option><option value="multi_family">Multi-Family</option>
            </select>
          </FormField>
          <FormField label="Flood Zone">
            <select className="input-field" value={form.flood_zone?'true':'false'} onChange={e => setForm({...form,flood_zone:e.target.value==='true'})}>
              <option value="false">No</option><option value="true">Yes</option>
            </select>
          </FormField>
        </div>
        <div className="flex gap-3 mt-6"><button onClick={save} className="btn-primary">Save</button><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
      </Modal>
    </div>
  );
}
