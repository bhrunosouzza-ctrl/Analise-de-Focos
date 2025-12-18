
export interface LarvaRecord {
  Identificação: string;
  DataCadastro: string;
  Laboratorista: string;
  Tipo_At: string;
  DataColeta: string;
  Ciclo: string;
  Semana: string;
  Supervisor: string;
  Agente: string;
  Quarteirao: string;
  Endereco: string;
  Numero: string;
  Complemento: string;
  Setor: string;
  Bairro: string;
  TipoImovel: string;
  CodigoDepto: string;
  Deposito: string;
  LarvaAegypti: number;
  PupaAegypti: number;
  LarvaAlbopictus: number;
  PupaAlbopictus: number;
  LarvaOutros: number;
  PupaOutros: number;
  Classif_LarvaAegypti: string;
  Classif_PupaAegypti: string;
  Classif_LarvaAlbopictus: string;
  Classif_PupaAlbopictus: string;
  Classif_LarvaOutros: string;
  Classif_PupaOutros: string;
  isPositive: boolean;
}

export interface DashboardStats {
  totalRecords: number;
  positiveAegypti: number;
  positiveAlbopictus: number;
  positiveOutros: number;
  totalPositives: number;
  totalNegatives: number;
  larvaAegyptiTotal: number;
  pupaAegyptiTotal: number;
  larvaAlbopictusTotal: number;
  pupaAlbopictusTotal: number;
  larvaOutrosTotal: number;
  pupaOutrosTotal: number;
  infestationRate: number; // IIP - Índice de Infestação Predial
  totalPropertiesInArea: number; // Total de imóveis do bairro segundo a tabela fornecida
  depositFrequency: Record<string, number>;
  codigoDeptoFrequency: Record<string, number>; // Frequência dos códigos de depósito
  propertyTypeFrequency: Record<string, number>;
  agentPerformance: Record<string, number>;
  supervisorPerformance: Record<string, number>;
}
