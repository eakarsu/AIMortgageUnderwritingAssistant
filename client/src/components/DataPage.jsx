import React from 'react';

export function StatusBadge({ status }) {
  const colors = {
    approved: 'badge-success', completed: 'badge-success', active: 'badge-success', pass: 'badge-success', passed: 'badge-success', low: 'badge-success',
    in_review: 'badge-warning', pending: 'badge-warning', in_progress: 'badge-warning', pending_review: 'badge-warning', conditional: 'badge-warning', medium: 'badge-warning',
    denied: 'badge-danger', failed: 'badge-danger', high: 'badge-danger', error: 'badge-danger', urgent: 'badge-danger',
    submitted: 'badge-info', info: 'badge-info',
  };
  const cls = colors[status?.toLowerCase()] || 'badge-neutral';
  return <span className={cls}>{(status || '').replace(/_/g, ' ')}</span>;
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function AIResultDisplay({ result, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium">AI is analyzing...</p>
        <p className="text-gray-400 text-sm mt-1">This may take a few moments</p>
      </div>
    );
  }
  if (!result) return null;

  const formatLabel = (key) =>
    String(key)
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const parseStructuredText = (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    const candidate = fenced ? fenced[1].trim() : trimmed;
    if (!candidate.startsWith('{') && !candidate.startsWith('[')) return value;
    try {
      return JSON.parse(candidate);
    } catch {
      return value;
    }
  };

  const normalizedResult = parseStructuredText(result);

  const renderScalar = (value) => {
    if (value === null || value === undefined || value === '') return <span className="text-gray-400">Not provided</span>;
    if (typeof value === 'boolean') return <StatusBadge status={value ? 'approved' : 'pending'} />;
    if (typeof value === 'number') return <span>{Number.isInteger(value) ? value.toLocaleString() : value}</span>;
    return <span>{String(value)}</span>;
  };

  const renderObject = (value, depth = 0) => {
    const parsed = parseStructuredText(value);

    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return <p className="text-gray-500 text-sm">No items returned.</p>;
      if (parsed.every((item) => item === null || typeof item !== 'object')) {
        return (
          <ul className="space-y-2">
            {parsed.map((item, index) => (
              <li key={index} className="flex gap-2 text-gray-700">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                <span>{renderScalar(item)}</span>
              </li>
            ))}
          </ul>
        );
      }
      return (
        <div className="space-y-3">
          {parsed.map((item, index) => (
            <div key={index} className="bg-white rounded-lg border border-blue-100 p-4 shadow-sm">
              {renderObject(item, depth + 1)}
            </div>
          ))}
        </div>
      );
    }

    if (parsed && typeof parsed === 'object') {
      const entries = Object.entries(parsed);
      if (entries.length === 0) return <p className="text-gray-500 text-sm">No details returned.</p>;
      return (
        <div className={depth === 0 ? 'space-y-5' : 'space-y-3'}>
          {entries.map(([key, value]) => {
            const complex = value && typeof value === 'object';
            return (
              <section key={key} className={complex ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-[220px_1fr] gap-2 border-b border-slate-100 pb-2 last:border-b-0'}>
                <h4 className={complex ? 'text-sm font-bold uppercase tracking-wide text-blue-800' : 'text-sm font-medium text-gray-500'}>
                  {formatLabel(key)}
                </h4>
                <div className="text-sm text-gray-800">
                  {complex ? renderObject(value, depth + 1) : renderScalar(value)}
                </div>
              </section>
            );
          })}
        </div>
      );
    }

    const text = String(parsed);
    return (
      <div className="prose prose-sm max-w-none">
        {text.split('\n').map((line, i) => {
          if (!line.trim()) return <br key={i} />;
          if (line.startsWith('###')) return <h4 key={i} className="text-lg font-bold text-gray-800 mt-4 mb-2 border-b pb-1">{line.replace(/^#+\s*/, '')}</h4>;
          if (line.startsWith('##')) return <h3 key={i} className="text-xl font-bold text-blue-800 mt-5 mb-2">{line.replace(/^#+\s*/, '')}</h3>;
          if (line.startsWith('#')) return <h2 key={i} className="text-2xl font-bold text-blue-900 mt-6 mb-3">{line.replace(/^#+\s*/, '')}</h2>;
          if (line.match(/^\*\*.*\*\*$/)) return <p key={i} className="font-bold text-gray-800 mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
          if (line.startsWith('- ') || line.startsWith('* ')) {
            const content = line.replace(/^[-*]\s*/, '');
            const boldMatch = content.match(/^\*\*(.*?)\*\*:?\s*(.*)/);
            if (boldMatch) {
              return (
                <div key={i} className="flex items-start gap-2 ml-4 my-1">
                  <span className="text-blue-500 mt-1">•</span>
                  <div><span className="font-semibold text-gray-800">{boldMatch[1]}: </span><span className="text-gray-600">{boldMatch[2]}</span></div>
                </div>
              );
            }
            return <div key={i} className="flex items-start gap-2 ml-4 my-1"><span className="text-blue-500 mt-1">•</span><span className="text-gray-700">{content}</span></div>;
          }
          if (line.match(/^\d+[\.\)]/)) {
            const content = line.replace(/^\d+[\.\)]\s*/, '');
            const boldMatch = content.match(/^\*\*(.*?)\*\*:?\s*(.*)/);
            if (boldMatch) {
              return (
                <div key={i} className="bg-white rounded-lg p-3 my-2 border-l-4 border-blue-400 shadow-sm">
                  <span className="font-semibold text-blue-800">{boldMatch[1]}</span>
                  {boldMatch[2] && <p className="text-gray-600 mt-1">{boldMatch[2]}</p>}
                </div>
              );
            }
            return <div key={i} className="bg-white rounded-lg p-3 my-2 border-l-4 border-gray-300 shadow-sm text-gray-700">{content}</div>;
          }
          const parts = line.split(/(\*\*.*?\*\*)/);
          return (
            <p key={i} className="text-gray-700 my-1">
              {parts.map((part, j) =>
                part.startsWith('**') && part.endsWith('**')
                  ? <strong key={j} className="text-gray-900">{part.slice(2, -2)}</strong>
                  : <span key={j}>{part}</span>
              )}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-blue-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-white text-lg">🤖</span>
          <h3 className="text-white font-semibold">AI Analysis Result</h3>
          <span className="ml-auto bg-white/20 text-white text-xs px-2 py-1 rounded-full">Powered by Claude</span>
        </div>
      </div>
      <div className="p-6">
        {renderObject(normalizedResult)}
      </div>
    </div>
  );
}

export function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
