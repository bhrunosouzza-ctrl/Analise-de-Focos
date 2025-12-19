
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
      icon: <Home className="w-6 h-6 text-blue-400" />,
      color: 'bg-blue-500/10 border-blue-900/50 shadow-blue-950',
      footer: 'Imóveis totais da região',
      valColor: 'text-blue-100'
    },
    {
      id: 'positives',
      title: 'Análises Positivas',
      value: stats.totalPositives,
      icon: <XCircle className="w-6 h-6 text-rose-400" />,
      color: 'bg-rose-500/10 border-rose-900/50 shadow-rose-950 cursor-pointer hover:bg-rose-500/20 hover:scale-[1.02]',
      footer: 'Ranking por bairro (clique)',
      onClick: onPositiveClick,
      valColor: 'text-rose-100'
    },
    {
      id: 'infestation',
      title: 'Índice (IIP)',
      value: `${stats.infestationRate.toFixed(2)}%`,
      icon: <Target className="w-6 h-6 text-indigo-400" />,
      color: 'bg-indigo-500/10 border-indigo-900/50 shadow-indigo-950',
      footer: 'Infestação predial calculada',
      valColor: 'text-indigo-100'
    },
    {
      id: 'negatives',
      title: 'Análises Negativas',
      value: stats.totalNegatives,
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      color: 'bg-emerald-500/10 border-emerald-900/50 shadow-emerald-950',
      footer: 'Inspeções sem larvas',
      valColor: 'text-emerald-100'
    },
    {
      id: 'total',
      title: 'Total Inspecionado',
      value: stats.totalRecords,
      icon: <Activity className="w-6 h-6 text-slate-400" />,
      color: 'bg-slate-900 border-slate-800 shadow-slate-950',
      footer: 'Visitas concluídas',
      valColor: 'text-slate-100'
    }
  ];

  const secondaryCards = [
    {
      title: 'Aedes Aegypti (+)',
      value: stats.positiveAegypti,
      detail: `${stats.larvaAegyptiTotal + stats.pupaAegyptiTotal} espécimes`,
      icon: <Beaker className="w-5 h-5 text-amber-400" />,
      bg: 'bg-amber-900/20 border-amber-800/30'
    },
    {
      title: 'Aedes Albopictus (+)',
      value: stats.positiveAlbopictus,
      detail: `${stats.larvaAlbopictusTotal + stats.pupaAlbopictusTotal} espécimes`,
      icon: <Bug className="w-5 h-5 text-blue-400" />,
      bg: 'bg-blue-900/20 border-blue-800/30'
    },
    {
      title: 'Outras Espécies (+)',
      value: stats.positiveOutros,
      detail: `${stats.larvaOutrosTotal + stats.pupaOutrosTotal} espécimes`,
      icon: <Bug className="w-5 h-5 text-emerald-400" />,
      bg: 'bg-emerald-900/20 border-emerald-800/30'
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
              <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">{card.title}</span>
              <div className="p-1.5 bg-slate-800/50 rounded-lg shadow-sm">{card.icon}</div>
            </div>
            <div>
              <div className={`text-3xl font-black ${card.valColor || 'text-slate-100'} mb-0.5 tracking-tighter`}>{card.value}</div>
              <div className="text-[9px] font-medium text-slate-500 uppercase leading-none">{card.footer}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {secondaryCards.map((card, idx) => (
          <div key={idx} className={`${card.bg} p-4 rounded-xl border flex items-center gap-4 shadow-sm`}>
            <div className="bg-slate-900 p-2.5 rounded-full shadow-sm">
              {card.icon}
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">{card.title}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-100">{card.value}</span>
                <span className="text-[9px] font-semibold text-slate-500">{card.detail}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};