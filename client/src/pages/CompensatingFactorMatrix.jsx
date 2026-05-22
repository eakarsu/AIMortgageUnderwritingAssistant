import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function CompensatingFactorMatrix() {
  const [result, setResult] = useState(null);

  const evaluate = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/compensating-factor-matrix/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ dti: 46, ltv: 92, creditScore: 705, reservesMonths: 9, stableIncomeYears: 4, overlays: ['Low payment shock'] }),
    });
    setResult(await res.json());
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Compensating Factor Matrix</h1>
      <p className="text-gray-600 mt-2">Balance underwriting risk exceptions against verified borrower strengths.</p>
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={evaluate}>Evaluate factors</button>
      {result && (
        <div className="mt-6 bg-white rounded shadow p-4">
          <h2 className="font-semibold">{result.netScore}/100 - {result.decisionSupport}</h2>
          <pre className="mt-3 text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
