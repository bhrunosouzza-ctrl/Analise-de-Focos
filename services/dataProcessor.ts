
import { LarvaRecord, DashboardStats } from '../types';

// Dados exatos da imagem fornecida para a cidade de Timóteo
export const TIMOTEO_BAIRROS_TOTAL: Record<string, number> = {
  'Alegre': 1631,
  'Alphaville': 728,
  'Alvorada I': 606,
  'Alvorada II': 910,
  'Ana Malaquias': 595,
  'Ana Moura': 1657,
  'Ana Rita': 2080,
  'Arataquinha': 95,
  'Bairro dos Vieiras': 503,
  'Bandeirantes': 226,
  'Bela Vista': 759,
  'Bromélias': 1344,
  'Cachoeira Do Vale': 2267,
  'Centro Norte': 1793,
  'Centro Sul': 1158,
  'Coqueiro': 78,
  'Cruzeirinho': 557,
  'Distrito Industrial': 145,
  'Eldorado': 1174,
  'Esplanada': 164,
  'Fazenda Boa Vista': 203,
  'Ferroviários': 84,
  'Funcionários': 853,
  'Garapa': 170,
  'Jardim Primavera': 291,
  'Jardim Vitória': 236,
  'Jhon Kennedy': 389,
  'João XXIII': 942,
  'Limoeiro': 966,
  'Macuco': 1466,
  'Nossa Senhora das Graças': 447,
  'Nova Esperança': 282,
  'Novo Horizonte': 862,
  'Novo Tempo': 1733,
  'Olaria': 852,
  'Parque Recanto': 96,
  'Petrópolis': 622,
  'Primavera': 2167,
  'Quitandinha': 901,
  'Recanto do Sossego': 202,
  'Recanto Verde': 2770,
  'Santa Cecília': 662,
  'Santa Maria': 836,
  'Santa Rita': 94,
  'Santa Terezinha': 701,
  'São Cristóvão': 385,
  'São José': 850,
  'Serenata': 429,
  'Timirim': 1114,
  'Timotinho': 498,
  'Vale Verde': 280,
  'Vila dos Técnicos': 242
};

export const parseRawCSV = (csvText: string): LarvaRecord[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].replace('\ufeff', '').split(';');
  
  return lines.slice(1).map(line => {
    const values = line.split(';');
    const record: any = {};
    headers.forEach((header, index) => {
      let val = values[index]?.trim() || '';
      
      if (['LarvaAegypti', 'PupaAegypti', 'LarvaAlbopictus', 'PupaAlbopictus', 'LarvaOutros', 'PupaOutros'].includes(header)) {
        record[header] = parseInt(val) || 0;
      } else {
        record[header] = val;
      }
    });

    const isPositiveByClassif = [
      record.Classif_LarvaAegypti,
      record.Classif_PupaAegypti,
      record.Classif_LarvaAlbopictus,
      record.Classif_PupaAlbopictus,
      record.Classif_LarvaOutros,
      record.Classif_PupaOutros
    ].some(c => c === 'Positivo');

    const totalInsects = (record.LarvaAegypti || 0) + (record.PupaAegypti || 0) + 
                         (record.LarvaAlbopictus || 0) + (record.PupaAlbopictus || 0) + 
                         (record.LarvaOutros || 0) + (record.PupaOutros || 0);
    
    record.isPositive = isPositiveByClassif || totalInsects > 0;

    return record as LarvaRecord;
  });
};

export const calculateStats = (data: LarvaRecord[], selectedBairro: string): DashboardStats => {
  let positiveAegypti = 0;
  let positiveAlbopictus = 0;
  let positiveOutros = 0;
  let totalPositives = 0;
  
  let larvaAegyptiTotal = 0;
  let pupaAegyptiTotal = 0;
  let larvaAlbopictusTotal = 0;
  let pupaAlbopictusTotal = 0;
  let larvaOutrosTotal = 0;
  let pupaOutrosTotal = 0;

  const depositFrequency: Record<string, number> = {};
  const codigoDeptoFrequency: Record<string, number> = {};
  const propertyTypeFrequency: Record<string, number> = {};
  const agentPerformance: Record<string, number> = {};
  const supervisorPerformance: Record<string, number> = {};

  data.forEach(r => {
    const isAegypti = r.Classif_LarvaAegypti === 'Positivo' || r.Classif_PupaAegypti === 'Positivo' || (r.LarvaAegypti + r.PupaAegypti > 0);
    const isAlbopictus = r.Classif_LarvaAlbopictus === 'Positivo' || r.Classif_PupaAlbopictus === 'Positivo' || (r.LarvaAlbopictus + r.PupaAlbopictus > 0);
    const isOthers = r.Classif_LarvaOutros === 'Positivo' || r.Classif_PupaOutros === 'Positivo' || (r.LarvaOutros + r.PupaOutros > 0);

    if (isAegypti) positiveAegypti++;
    if (isAlbopictus) positiveAlbopictus++;
    if (isOthers) positiveOutros++;
    if (r.isPositive) totalPositives++;

    larvaAegyptiTotal += r.LarvaAegypti;
    pupaAegyptiTotal += r.PupaAegypti;
    larvaAlbopictusTotal += r.LarvaAlbopictus;
    pupaAlbopictusTotal += r.PupaAlbopictus;
    larvaOutrosTotal += r.LarvaOutros;
    pupaOutrosTotal += r.PupaOutros;

    if (r.isPositive) {
      const dep = r.Deposito || 'Não Informado';
      depositFrequency[dep] = (depositFrequency[dep] || 0) + 1;

      const codDep = r.CodigoDepto || 'Sem Código';
      codigoDeptoFrequency[codDep] = (codigoDeptoFrequency[codDep] || 0) + 1;
      
      const prop = r.TipoImovel || 'Outros';
      propertyTypeFrequency[prop] = (propertyTypeFrequency[prop] || 0) + 1;

      const agent = r.Agente || 'Desconhecido';
      agentPerformance[agent] = (agentPerformance[agent] || 0) + 1;

      const supervisor = r.Supervisor || 'Desconhecido';
      supervisorPerformance[supervisor] = (supervisorPerformance[supervisor] || 0) + 1;
    }
  });

  // Determinar o total de imóveis para cálculo do IIP
  let totalPropertiesInArea = 0;
  if (selectedBairro === 'Todos') {
    totalPropertiesInArea = Object.values(TIMOTEO_BAIRROS_TOTAL).reduce((a, b) => a + b, 0);
  } else {
    totalPropertiesInArea = TIMOTEO_BAIRROS_TOTAL[selectedBairro] || 0;
  }

  // IIP = (Nº de imóveis positivos / Nº de imóveis totais do bairro) * 100
  const infestationRate = totalPropertiesInArea > 0 ? (totalPositives / totalPropertiesInArea) * 100 : 0;

  return {
    totalRecords: data.length,
    positiveAegypti,
    positiveAlbopictus,
    positiveOutros,
    totalPositives,
    totalNegatives: data.length - totalPositives,
    larvaAegyptiTotal,
    pupaAegyptiTotal,
    larvaAlbopictusTotal,
    pupaAlbopictusTotal,
    larvaOutrosTotal,
    pupaOutrosTotal,
    infestationRate,
    totalPropertiesInArea,
    depositFrequency,
    codigoDeptoFrequency,
    propertyTypeFrequency,
    agentPerformance,
    supervisorPerformance
  };
};
