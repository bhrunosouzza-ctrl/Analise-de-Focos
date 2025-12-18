
import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LarvaRecord } from './types';
import { calculateStats } from './services/dataProcessor';
import { SummaryCards } from './components/SummaryCards';
import { LarvaMap } from './components/LarvaMap';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Search, Upload, FileSpreadsheet, FileText, Bug, Database, Hash, PieChart as ChartIcon, Filter, X, Trophy, XCircle } from 'lucide-react';

const COLORS = ['#4f46e5', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

const App: React.FC = () => {
  const [data, setData] = useState<LarvaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBairro, setSelectedBairro] = useState('Todos');
  const [selectedCiclo, setSelectedCiclo] = useState('Todos');
  const [selectedTipoAt, setSelectedTipoAt] = useState('Todos');
  const [showRanking, setShowRanking] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('larvascan_last_data_raw') || '';
    if (cached) {
      try {
        setData(JSON.parse(cached));
      } catch (e) {
        console.error("Erro ao carregar cache de dados", e);
      }
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
        }
      } catch (err) {
        alert("Erro ao ler arquivo.");
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
    XLSX.writeFile(wb, `LarvaScan_Timoteo_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const dateStr = new Date().toLocaleDateString('pt-BR');

    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text("TIMÓTEO LARVASCAN", 14, 20);
    
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

    doc.save(`Relatorio_LarvaScan_Timoteo_Completo_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const bairros = useMemo(() => ['Todos', ...Array.from(new Set(data.map(r => r.Bairro)))].sort(), [data]);
  const ciclos = useMemo(() => ['Todos', ...Array.from(new Set(data.map(r => r.Ciclo)))].sort(), [data]);
  const tiposAtividade = useMemo(() => ['Todos', ...Array.from(new Set(data.map(r => r.Tipo_At)))].sort(), [data]);

  return (
    <div className="min-h-screen pb-20 bg-[#f8fafc]">
      <header className="bg-white border-b h-20 sticky top-0 z-30 flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-100">
              <Bug className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none tracking-tight">TIMÓTEO <span className="text-indigo-600">LARVASCAN</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Saneamento & Vigilância</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExportPDF} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-sm">
              <FileText className="w-4 h-4 text-rose-600" /> PDF COMPLETO
            </button>
            <button onClick={handleExportExcel} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-sm">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> EXCEL
            </button>
            <label className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-2xl text-xs font-black cursor-pointer flex items-center gap-2 transition-all shadow-lg shadow-slate-200">
              <Upload className="w-4 h-4" /> IMPORTAR XLSX
              <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por endereço ou bairro..." 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 bg-slate-50 rounded-2xl border border-transparent">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select className="bg-transparent border-none py-3 text-[11px] font-black uppercase appearance-none cursor-pointer text-slate-600 focus:ring-0" value={selectedBairro} onChange={e => setSelectedBairro(e.target.value)}>
                  <option value="Todos">BAIRRO: TODOS</option>
                  {bairros.filter(b => b !== 'Todos').map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 px-4 bg-slate-50 rounded-2xl border border-transparent">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select className="bg-transparent border-none py-3 text-[11px] font-black uppercase appearance-none cursor-pointer text-slate-600 focus:ring-0" value={selectedCiclo} onChange={e => setSelectedCiclo(e.target.value)}>
                  <option value="Todos">CICLO: TODOS</option>
                  {ciclos.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 px-4 bg-slate-50 rounded-2xl border border-transparent">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select className="bg-transparent border-none py-3 text-[11px] font-black uppercase appearance-none cursor-pointer text-slate-600 focus:ring-0" value={selectedTipoAt} onChange={e => setSelectedTipoAt(e.target.value)}>
                  <option value="Todos">ATIVIDADE: TODOS</option>
                  {tiposAtividade.filter(t => t !== 'Todos').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <SummaryCards stats={stats} onPositiveClick={() => setShowRanking(true)} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Database className="w-5 h-5" /></div>
              <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Resumo de Depósitos (+)</span>
            </div>
            <div className="space-y-3">
              {topDeposits.length > 0 ? topDeposits.map(([name, count], idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                  <span className="text-sm font-black text-slate-700 uppercase">{name}</span>
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-black text-indigo-600">
                    {count} Focos
                  </div>
                </div>
              )) : <div className="text-xs text-slate-400 font-bold py-10 text-center">Nenhum foco positivo</div>}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-rose-50 rounded-xl text-rose-600"><Hash className="w-5 h-5" /></div>
              <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Resumo de Códigos Depto (+)</span>
            </div>
            <div className="space-y-3">
              {topDeptCodes.length > 0 ? topDeptCodes.map(([code, count], idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                  <span className="text-sm font-black text-slate-700 uppercase">Código: {code}</span>
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-black text-rose-600">
                    {count} Focos
                  </div>
                </div>
              )) : <div className="text-xs text-slate-400 font-bold py-10 text-center">Nenhum código registrado</div>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <LarvaMap records={filteredData} />
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-xs font-black text-slate-900 mb-8 uppercase tracking-widest flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-indigo-500" /> Perfil de Imóveis (+)
            </h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={propertyTypeData} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                    {propertyTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 'bold', paddingTop: '20px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Endereços Positivos Detalhados</h3>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Dados Entomológicos Completos</p>
            </div>
            <div className="bg-rose-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-rose-100">
              {filteredData.filter(r => r.isPositive).length} CASOS POSITIVOS
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Localização</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Dados Laboratório (L/P)</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Vigilância & Depósito</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.filter(r => r.isPositive).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-all">
                    <td className="px-8 py-6">
                      <div className="font-black text-sm text-slate-900">{(row.Endereco || 'Sem Endereço')}, {(row.Numero || 'S/N')}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded uppercase">{row.Bairro}</span>
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">{row.Tipo_At}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-2">
                        {(row.LarvaAegypti + row.PupaAegypti > 0) && (
                          <div className="bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                            <span className="text-[8px] font-black text-rose-400 uppercase block text-center">Aegypti</span>
                            <span className="text-[10px] font-black text-rose-600">L:{row.LarvaAegypti} P:{row.PupaAegypti}</span>
                          </div>
                        )}
                        {(row.LarvaAlbopictus + row.PupaAlbopictus > 0) && (
                          <div className="bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                            <span className="text-[8px] font-black text-amber-500 uppercase block text-center">Albo</span>
                            <span className="text-[10px] font-black text-amber-600">L:{row.LarvaAlbopictus} P:{row.PupaAlbopictus}</span>
                          </div>
                        )}
                        {(row.LarvaOutros + row.PupaOutros > 0) && (
                          <div className="bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                            <span className="text-[8px] font-black text-emerald-500 uppercase block text-center">Outros</span>
                            <span className="text-[10px] font-black text-emerald-600">L:{row.LarvaOutros} P:{row.PupaOutros}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[10px] font-black text-slate-700 uppercase leading-none">{row.Deposito}</div>
                      <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Cód: {row.CodigoDepto} • {row.Agente}</div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black border border-rose-100 uppercase">
                        <XCircle className="w-3.5 h-3.5" /> Positivo
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showRanking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowRanking(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b bg-rose-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-200">
                  <Trophy className="text-white w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ranking de Focos</h2>
                  <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-0.5">Distribuição por Bairro</p>
                </div>
              </div>
              <button onClick={() => setShowRanking(false)} className="p-3 bg-white hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-all shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {neighborhoodRanking.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-rose-100 transition-all">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 font-black text-sm">#{idx + 1}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-2">
                        <span className="font-black text-slate-800 uppercase tracking-tight">{item.name}</span>
                        <span className="text-xs font-black text-rose-600">{item.value} FOCOS</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(item.value / neighborhoodRanking[0].value) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t flex justify-center">
               <button onClick={() => setShowRanking(false)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">Fechar Ranking</button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center flex-col">
          <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4 shadow-2xl"></div>
          <h2 className="text-white font-black uppercase tracking-[0.3em] text-xs">Atualizando Sistema...</h2>
        </div>
      )}
    </div>
  );
};

export default App;
