import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { AIResultDisplay } from '../components/DataPage';

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeAI, setActiveAI] = useState('');

  useEffect(() => { api.get(`/properties/${id}`).then(r => setProperty(r.data)); }, [id]);

  const runAI = async (type) => {
    setAiLoading(true); setActiveAI(type); setAiResult(null);
    try {
      const { data } = await api.post(`/ai/${type}`, { property_id: parseInt(id) });
      setAiResult(data.analysis);
    } catch (err) { setAiResult('Error: ' + (err.response?.data?.error || err.message)); }
    setAiLoading(false);
  };

  if (!property) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  const p = property;

  return (
    <div>
      <Link to="/properties" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">&larr; Back</Link>
      <h1 className="text-2xl font-bold mb-6">{p.address}, {p.city}, {p.state}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold text-gray-500 text-sm uppercase mb-3">Property Details</h3>
          <div className="space-y-2">
            {[['Type', (p.property_type||'').replace(/_/g,' ')],['Year Built', p.year_built],['Square Feet', Number(p.square_feet).toLocaleString()],['Bed/Bath', `${p.bedrooms}/${p.bathrooms}`],['Lot Size', `${p.lot_size} acres`],['Zoning', p.zoning],['Flood Zone', p.flood_zone?'Yes':'No'],['HOA', `$${p.hoa_fee}/mo`]].map(([l,v]) => (
              <div key={l} className="flex justify-between"><span className="text-gray-500">{l}</span><span className="font-medium capitalize">{v}</span></div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-500 text-sm uppercase mb-3">Valuation</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Estimated Value</span><span className="font-bold text-lg text-emerald-600">${Number(p.estimated_value).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Listing Price</span><span className="font-bold text-lg">${Number(p.listing_price).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Price/SqFt</span><span className="font-medium">${(p.listing_price / p.square_feet).toFixed(0)}</span></div>
          </div>
        </div>
      </div>
      <div className="card mb-6">
        <h3 className="font-semibold mb-4">🤖 AI Analysis</h3>
        <div className="flex flex-wrap gap-2">
          {[['property-valuation','🏠 Valuation'],['market-analysis','📈 Market Analysis']].map(([t,l]) => (
            <button key={t} onClick={() => runAI(t)} disabled={aiLoading} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeAI===t?'bg-blue-600 text-white':'bg-gray-100 hover:bg-blue-50'}`}>{l}</button>
          ))}
        </div>
      </div>
      <AIResultDisplay result={aiResult} loading={aiLoading} />
    </div>
  );
}
