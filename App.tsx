
import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LarvaRecord } from './types.ts';
import { calculateStats } from './services/dataProcessor.ts';
import { SummaryCards } from './components/SummaryCards.tsx';
import { LarvaMap } from './components/LarvaMap.tsx';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Search, Upload, FileSpreadsheet, FileText, Bug, Database, Hash, PieChart as ChartIcon, Filter, X, Trophy, XCircle, FileUp } from 'lucide-react';

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

const App: React.FC = () => {
  const [data, setData] = useState<LarvaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBairro, setSelectedBairro] = useState('Todos');
  const [selectedCiclo, setSelectedCiclo] = useState('Todos');
  const [selectedTipoAt, setSelectedTipoAt] = useState('Todos');
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
      console.error("Erro ao carregar cache de dados", e);
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
          const records: LarvaRecord[] = jsonData.slice(1).map(row => {
            const record: any = {};
            headers.forEach((h, i) => {
              record[h] = ['LarvaAegypti', 'PupaAegypti', 'LarvaAlbopictus', 'PupaAlbopictus', 'LarvaOutros', 'PupaOutros'].includes(h)
                ? Number(row[i]) || 0 : String(row[i] || '');
            });
            record.isPositive = (record.LarvaAegypti + record.PupaAegypti + record.LarvaAlbopictus + record.PupaAlbopictus + record.LarvaOutros + record.PupaOutros) > 0 ||
                               [record.Classif_LarvaAegypti, record.Classif_PupaAegypti, record.Classif_LarvaAlbopictus, record.Classif_PupaAlbopictus, record.Classif_LarvaOutros, record.Classif_PupaOutros].some(c => c === 'Positivo');
            return record as LarvaRecord;
          });
          setData(records);
          localStorage.setItem('larvascan_last_data_raw', JSON.stringify(records));
        } else {
          alert("O arquivo parece estar vazio ou sem o cabeçalho correto.");
        }
      } catch (err) {
        console.error(err);
        alert("Erro ao ler arquivo. Verifique se é um arquivo Excel válido.");
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
      const matchesCiclo = selectedCiclo === 'Todos' || r.Ciclo === selectedCiclo;
      const matchesTipoAt = selectedTipoAt === 'Todos' || r.Tipo_At === selectedTipoAt;
      return matchesSearch && matchesBairro && matchesCiclo && matchesTipoAt;
    });
  }, [data, searchTerm, selectedBairro, selectedCiclo, selectedTipoAt]);

  const stats = useMemo(() => calculateStats(filteredData, selectedBairro), [filteredData, selectedBairro]);

  const neighborhoodRanking = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.filter(r => r.isPositive).forEach(r => {
      counts[r.Bairro] = (counts[r.Bairro] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const topDeposits = useMemo(() => {
    return Object.entries(stats.depositFrequency)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5);
  }, [stats]);

  const topDeptCodes = useMemo(() => {
    return Object.entries(stats.codigoDeptoFrequency)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5);
  }, [stats]);

  const propertyTypeData = useMemo(() => {
    return Object.entries(stats.propertyTypeFrequency)
      .map(([name, value]) => ({ name, value }));
  }, [stats]);

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analise");
    XLSX.writeFile(wb, `Focos_Encontrados_Timoteo_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const dateStr = new Date().toLocaleDateString('pt-BR');

    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text("ANÁLISE DE FOCOS ENCONTRADOS", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Relatório de Vigilância Entomológica - Emitido em: ${dateStr}`, 14, 28);
    doc.text(`Filtros: Bairro: ${selectedBairro} | Ciclo: ${selectedCiclo} | Atividade: ${selectedTipoAt}`, 14, 34);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Resumo de Indicadores", 14, 45);
    
    autoTable(doc, {
      startY: 48,
      head: [['Indicador', 'Valor']],
      body: [
        ['Base de Imóveis (Referência)', stats.totalPropertiesInArea.toLocaleString('pt-BR')],
        ['Análises Positivas', stats.totalPositives],
        ['Análises Negativas', stats.totalNegatives],
        ['Índice de Infestação (IIP)', `${stats.infestationRate.toFixed(2)}%`],
        ['Total Inspecionado', stats.totalRecords],
        ['Aedes Aegypti Total', stats.larvaAegyptiTotal + stats.pupaAegyptiTotal],
        ['Aedes Albopictus Total', stats.larvaAlbopictusTotal + stats.pupaAlbopictusTotal]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 14 },
      tableWidth: 120
    });

    doc.addPage();
    doc.setFontSize(14);
    doc.text("Detalhamento Completo de Endereços Positivos", 14, 20);
    
    const positiveRecords = filteredData.filter(r => r.isPositive);
    const tableData = positiveRecords.map(r => [
      r.Endereco + ", " + r.Numero,
      r.Bairro,
      r.Deposito,
      r.CodigoDepto,
      r.Tipo_At,
      `${r.LarvaAegypti}L / ${r.PupaAegypti}P`,
      `${r.LarvaAlbopictus}L / ${r.PupaAlbopictus}P`,
      `${r.LarvaOutros}L / ${r.PupaOutros}P`
    ]);

    autoTable(doc, {
      startY: 25,
      head: [['Endereço', 'Bairro', 'Depósito', 'Cód.', 'Ativ.', 'Aegypti', 'Albo', 'Outros']],
      body: tableData,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 15 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 },
        7: { cellWidth: 25 }
      }
    });

    doc.save(`Relatorio_Focos_Encontrados_Timoteo_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const bairros = useMemo(() => ['Todos', ...Array.from(new Set(data.map(r => r.Bairro)))].sort(), [data]);
  const ciclos = useMemo(() => ['Todos', ...Array.from(new Set(data.map(r => r.Ciclo)))].sort(), [data]);
  const tiposAtividade = useMemo(() => ['Todos', ...Array.from(new Set(data.map(r => r.Tipo_At)))].sort(), [data]);

  if (data.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full">
          <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(79,70,229,0.4)] animate-bounce">
            <Bug className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">ANÁLISE DE <span className="text-indigo-400">FOCOS ENCONTRADOS</span></h1>
          <p className="text-slate-400 font-medium mb-10 text-sm leading-relaxed">
            Bem-vindo ao sistema de vigilância entomológica. Importe sua planilha de focos para iniciar a análise estatística.
          </p>
          
          <label className="group relative block w-full bg-slate-900 border-2 border-dashed border-slate-800 hover:border-indigo-500 p-12 rounded-[2.5rem] cursor-pointer transition-all hover:bg-slate-800/50">
            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
            <div className="flex flex-col items-center gap-4">
              <div className="bg-slate-800 p-4 rounded-full group-hover:bg-indigo-600 transition-colors">
                <FileUp className="w-8 h-8 text-indigo-400 group-hover:text-white" />
              </div>
              <span className="text-sm font-black text-slate-300 uppercase tracking-widest">Selecionar Planilha XLSX</span>
              <span className="text-xs text-slate-500 font-bold">Arraste ou clique para navegar</span>
            </div>
          </label>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center flex-col">
            <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-white font-black uppercase tracking-[0.4em] text-[10px]">Processando Base de Dados...</h2>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-800 h-20 sticky top-0 z-30 flex items-center shadow-lg">
        <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-900/20">
              <Bug className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-100 leading-none tracking-tight">ANÁLISE DE <span className="text-indigo-400">FOCOS ENCONTRADOS</span></h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Saneamento & Vigilância</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExportPDF} className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-sm"><FileText className="w-4 h-4 text-rose-400" /> PDF</button>
            <button onClick={handleExportExcel} className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-sm"><FileSpreadsheet className="w-4 h-4 text-emerald-400" /> EXCEL</button>
            <button onClick={() => { if(confirm("Deseja limpar os dados?")) { setData([]); localStorage.removeItem('larvascan_last_data_raw'); } }} className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2"><Upload className="w-4 h-4 text-indigo-400" /> NOVO</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-800 mb-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por endereço ou bairro..." 
                className="w-full pl-12 pr-4 py-4 bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-300 placeholder:text-slate-600"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <select className="bg-slate-800 border-none py-3 px-6 rounded-2xl text-[11px] font-black uppercase text-slate-400" value={selectedBairro} onChange={e => setSelectedBairro(e.target.value)}>
                <option value="Todos">BAIRRO: TODOS</option>
                {bairros.filter(b => b !== 'Todos').map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>

        <SummaryCards stats={stats} onPositiveClick={() => setShowRanking(true)} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <LarvaMap records={filteredData} />
          </div>
          <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-sm flex flex-col items-center justify-center">
            <h3 className="text-xs font-black text-slate-200 mb-8 uppercase tracking-widest self-start flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-indigo-400" /> Perfil de Imóveis (+)
            </h3>
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={propertyTypeData} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                    {propertyTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#f1f5f9'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>

      {showRanking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowRanking(false)}></div>
          <div className="relative bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden">
            <div className="p-8 border-b border-slate-800 bg-rose-900/10 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-100 uppercase">Ranking de Focos</h2>
              <button onClick={() => setShowRanking(false)} className="p-3 bg-slate-800 rounded-2xl text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {neighborhoodRanking.map((item, idx) => (
                  <div key={item.name} className="flex justify-between items-center p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
                    <span className="font-black text-slate-200 uppercase text-sm">#{idx + 1} {item.name}</span>
                    <span className="text-[10px] font-black text-rose-400 uppercase">{item.value} FOCOS</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-50 flex items-center justify-center flex-col">
          <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-white font-black uppercase tracking-[0.4em] text-[10px]">Processando...</h2>
        </div>
      )}
    </div>
  );
};

export default App;
