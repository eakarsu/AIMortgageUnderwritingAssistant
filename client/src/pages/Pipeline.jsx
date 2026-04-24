import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { StatusBadge } from '../components/DataPage';

export default function Pipeline() {
  const [data, setData] = useState({ stages: [], applications: [] });
  const navigate = useNavigate();

  useEffect(() => { api.get('/pipeline').then(r => setData(r.data)); }, []);

  const statusToStage = {
    submitted: 'Submitted', in_review: 'In Review', conditional: 'Conditional Approval',
    approved: 'Clear to Close', denied: 'Submitted'
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Loan Pipeline</h1>
        <p className="text-gray-500 text-sm">{data.applications?.length} applications in pipeline</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.stages?.map(stage => {
          const stageApps = data.applications?.filter(a => statusToStage[a.status] === stage.name) || [];
          return (
            <div key={stage.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ borderTopWidth: 4, borderTopColor: stage.color }}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">{stageApps.length}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Avg {stage.avg_days} days</p>
              </div>
              <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                {stageApps.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No applications</p>}
                {stageApps.map(app => (
                  <div
                    key={app.id}
                    onClick={() => navigate(`/applications/${app.id}`)}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-blue-600 font-medium">{app.application_number}</span>
                      <StatusBadge status={app.priority} />
                    </div>
                    <p className="text-sm font-medium">{app.borrower_name}</p>
                    <p className="text-xs text-gray-500">${Number(app.loan_amount).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
