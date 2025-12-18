
import React from 'react';
import { DashboardStats } from '../types';
import { Activity, XCircle, Beaker, Bug, ShieldCheck, Target, Home } from 'lucide-react';

interface Props {
  stats: DashboardStats;
  onPositiveClick?: () => void;
}

export const SummaryCards: React.FC<Props> = ({ stats, onPositiveClick }) => {
  const mainCards = [
    {
      id: 'base',
      title: 'Base de Imóveis',
      value: stats.totalPropertiesInArea.toLocaleString('pt-BR'),
      icon: <Home className="w-6 h-6 text-blue-500" />,
      color: 'bg-blue-50 border-blue-100 shadow-blue-100',
      footer: 'Imóveis totais da região'
    },
    {
      id: 'positives',
      title: 'Análises Positivas',
      value: stats.totalPositives,
      icon: <XCircle className="w-6 h-6 text-rose-500" />,
      color: 'bg-rose-50 border-rose-100 shadow-rose-100 cursor-pointer hover:scale-[1.02]',
      footer: 'Ranking por bairro (clique)',
      onClick: onPositiveClick
    },
    {
      id: 'infestation',
      title: 'Índice (IIP)',
      value: `${stats.infestationRate.toFixed(2)}%`,
      icon: <Target className="w-6 h-6 text-indigo-500" />,
      color: 'bg-indigo-50 border-indigo-100 shadow-indigo-100',
      footer: 'Infestação predial calculada'
    },
    {
      id: 'negatives',
      title: 'Análises Negativas',
      value: stats.totalNegatives,
      icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
      color: 'bg-emerald-50 border-emerald-100 shadow-emerald-100',
      footer: 'Inspeções sem larvas'
    },
    {
      id: 'total',
      title: 'Total Inspecionado',
      value: stats.totalRecords,
      icon: <Activity className="w-6 h-6 text-slate-500" />,
      color: 'bg-white border-slate-200 shadow-slate-100',
      footer: 'Visitas concluídas'
    }
  ];

  const secondaryCards = [
    {
      title: 'Aedes Aegypti (+)',
      value: stats.positiveAegypti,
      detail: `${stats.larvaAegyptiTotal + stats.pupaAegyptiTotal} espécimes`,
      icon: <Beaker className="w-5 h-5 text-amber-500" />,
      bg: 'bg-amber-50'
    },
    {
      title: 'Aedes Albopictus (+)',
      value: stats.positiveAlbopictus,
      detail: `${stats.larvaAlbopictusTotal + stats.pupaAlbopictusTotal} espécimes`,
      icon: <Bug className="w-5 h-5 text-blue-500" />,
      bg: 'bg-blue-50'
    },
    {
      title: 'Outras Espécies (+)',
      value: stats.positiveOutros,
      detail: `${stats.larvaOutrosTotal + stats.pupaOutrosTotal} espécimes`,
      icon: <Bug className="w-5 h-5 text-emerald-500" />,
      bg: 'bg-emerald-50'
    }
  ];

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {mainCards.map((card) => (
          <div 
            key={card.id} 
            onClick={card.onClick}
            className={`p-5 rounded-2xl border ${card.color} shadow-lg transition-all duration-300 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">{card.title}</span>
              <div className="p-1.5 bg-white rounded-lg shadow-sm">{card.icon}</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-800 mb-0.5 tracking-tighter">{card.value}</div>
              <div className="text-[9px] font-medium text-slate-400 uppercase leading-none">{card.footer}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {secondaryCards.map((card, idx) => (
          <div key={idx} className={`${card.bg} p-4 rounded-xl border border-white/50 flex items-center gap-4 shadow-sm`}>
            <div className="bg-white p-2.5 rounded-full shadow-sm">
              {card.icon}
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">{card.title}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-800">{card.value}</span>
                <span className="text-[9px] font-semibold text-slate-400">{card.detail}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
