import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateStats } from './services/dataProcessor.ts';
import { SummaryCards } from './components/SummaryCards.tsx';
import { LarvaMap } from './components/LarvaMap.tsx';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Search, Upload, FileSpreadsheet, FileText, Bug, Database, Hash, PieChart as ChartIcon, Filter, X, Trophy, XCircle, FileUp } from 'lucide-react';

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

const App: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBairro, setSelectedBairro] = useState('Todos');
  const [showRanking, setShowRanking] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('larvascan_last_data_raw');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setData(parsed);
        }
      }
    } catch (e) {
      localStorage.removeItem('larvascan_last_data_raw');
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (jsonData.length > 1) {
          const headers = jsonData[0].map(h => String(h).trim());
          const records = jsonData.slice(1).map(row => {
            const record: any = {};
            headers.forEach((h, i) => {
              record[h] = ['LarvaAegypti', 'PupaAegypti', 'LarvaAlbopictus', 'PupaAlbopictus', 'LarvaOutros', 'PupaOutros'].includes(h)
                ? Number(row[i]) || 0 : String(row[i] || '');
            });
            record.isPositive = (record.LarvaAegypti + record.PupaAegypti + record.LarvaAlbopictus + record.PupaAlbopictus + record.LarvaOutros + record.PupaOutros) > 0 ||
                               [record.Classif_LarvaAegypti, record.Classif_PupaAegypti, record.Classif_LarvaAlbopictus, record.Classif_PupaAlbopictus, record.Classif_LarvaOutros, record.Classif_PupaOutros].some(c => c === 'Positivo');
            return record;
          });
          setData(records);
          localStorage.setItem('larvascan_last_data_raw', JSON.stringify(records));
        }
      } catch (err) {
        alert("Erro ao processar arquivo Excel.");
      }
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const filteredData = useMemo(() => {
    return data.filter(r => {
      const matchesSearch = (r.Endereco || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (r.Bairro || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBairro = selectedBairro === 'Todos' || r.Bairro === selectedBairro;
      return matchesSearch && matchesBairro;
    });
  }, [data, searchTerm, selectedBairro]);

  const stats = useMemo(() => calculateStats(filteredData, selectedBairro), [filteredData, selectedBairro]);
  const bairros = useMemo(() => ['Todos', ...Array.from(new Set(data.map(r => r.Bairro)))].sort(), [data]);

  const neighborhoodRanking = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.filter(r => r.isPositive).forEach(r => {
      counts[r.Bairro] = (counts[r.Bairro] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const propertyTypeData = useMemo(() => {
    return Object.entries(stats.propertyTypeFrequency)
      .map(([name, value]) => ({ name, value }));
  }, [stats]);

  if (data.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full">
          <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(79,70,229,0.3)]">
            <Bug className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">Análise de Focos</h1>
          <p className="text-slate-400 font-medium mb-10 text-sm">
            Importe sua planilha Excel para visualizar as estatísticas e o mapa de focos.
          </p>
          
          <label className="group block w-full bg-slate-900 border-2 border-dashed border-slate-800 hover:border-indigo-500 p-12 rounded-[2.5rem] cursor-pointer transition-all">
            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
            <div className="flex flex-col items-center gap-4">
              <FileUp className="w-12 h-12 text-indigo-500 mb-2" />
              <span className="text-sm font-black text-slate-300 uppercase">Selecionar Planilha XLSX</span>
            </div>
          </label>
        </div>
        {loading && <div className="mt-8 text-indigo-400 font-bold animate-pulse uppercase tracking-widest text-xs">Processando Base de Dados...</div>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-10">
      <header className="bg-slate-900 border-b border-slate-800 h-20 flex items-center px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Bug className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-black text-white uppercase tracking-tighter">Focos Timóteo</h1>
          </div>
          <button 
            onClick={() => { if(confirm("Deseja importar outro arquivo?")) { setData([]); localStorage.removeItem('larvascan_last_data_raw'); } }}
            className="bg-slate-800 hover:bg-slate-700 text-xs font-bold px-4 py-2 rounded-xl text-slate-300 transition-colors"
          >
            Novo Arquivo
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar endereço..." 
              className="w-full bg-slate-900 border border-slate-800 pl-12 pr-4 py-3 rounded-2xl text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="bg-slate-900 border border-slate-800 px-6 py-3 rounded-2xl text-xs font-bold uppercase text-slate-400 outline-none focus:ring-1 focus:ring-indigo-500"
            value={selectedBairro}
            onChange={e => setSelectedBairro(e.target.value)}
          >
            <option value="Todos">Bairro: Todos</option>
            {bairros.filter(b => b !== 'Todos').map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <SummaryCards stats={stats} onPositiveClick={() => setShowRanking(true)} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <LarvaMap records={filteredData} />
          </div>
          <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 flex flex-col items-center">
            <h3 className="text-xs font-black text-slate-400 mb-8 uppercase tracking-widest self-start flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-indigo-400" /> Perfil de Imóveis (+)
            </h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={propertyTypeData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                    {propertyTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '12px'}}
                    itemStyle={{color: '#f1f5f9'}}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>

      {showRanking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowRanking(false)}>
          <div className="bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-800 p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Trophy className="text-amber-500 w-5 h-5" />
                <h2 className="text-lg font-black uppercase tracking-tight">Ranking por Bairro</h2>
              </div>
              <X className="cursor-pointer text-slate-500 hover:text-white transition-colors" onClick={() => setShowRanking(false)} />
            </div>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {neighborhoodRanking.map((item, i) => (
                <div key={item.name} className="flex justify-between items-center p-4 bg-slate-800/50 rounded-2xl border border-slate-800 group hover:border-rose-500/30 transition-all">
                  <span className="font-bold text-sm text-slate-300">#{i+1} {item.name}</span>
                  <span className="font-black text-rose-500 text-xs bg-rose-500/10 px-3 py-1 rounded-full">{item.value} FOCOS</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;