import React from 'react';

interface StatusBadgeProps {
  type: 'risk' | 'model' | 'category' | 'brand';
  value: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  if (type === 'risk') {
    if (value.toLowerCase().includes('critical')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse"></span>
          {value}
        </span>
      );
    }
    if (value.toLowerCase().includes('high')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
          {value}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
        {value}
      </span>
    );
  }

  if (type === 'brand') {
    const colors: Record<string, string> = {
      Luxury: 'bg-purple-50 text-purple-700 border-purple-200',
      Premium: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      Mainstream: 'bg-slate-50 text-slate-700 border-slate-200',
      Budget: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${colors[value] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
        {value}
      </span>
    );
  }

  if (type === 'category') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">
        {value}
      </span>
    );
  }

  // Model
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-navy-800 text-teal-300 border border-teal-500/30">
      {value}
    </span>
  );
};
