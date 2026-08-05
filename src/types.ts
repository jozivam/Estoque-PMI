export type CategoryType = 
  | 'CAIXA ELÉTRICA'
  | 'EQUIPAMENTO'
  | 'PAINEL'
  | 'FERRAMENTA'
  | 'CABO'
  | 'DISJUNTOR'
  | 'OUTROS';

export type ItemStatus = 'Ativo' | 'Inativo';

export interface Product {
  id: string; // e.g. PMI-001
  nome: string;
  descricao: string;
  categoria: CategoryType | string;
  quantidade: number;
  quantidadeMinima: number;
  foto: string; // Base64 data URL or Google Drive URL (Main cover photo)
  fotos?: string[]; // Array of photos for multiple image support
  localizacao: string; // e.g. Prateleira A-2, Setor 1
  dataCadastro: string; // YYYY-MM-DD
  status: ItemStatus;
  codigoBarras?: string;
}

export const getProductPhotos = (product: Product): string[] => {
  if (product.fotos && product.fotos.length > 0) {
    return product.fotos.filter(Boolean);
  }
  if (product.foto) {
    return [product.foto];
  }
  return [];
};

export type MovementType = 'Entrada' | 'Saída';

export interface Movement {
  id: string;
  produtoId: string;
  produtoNome: string;
  tipo: MovementType;
  quantidade: number;
  data: string; // ISO string with date & time
  responsavel: string;
  observacao?: string;
  notaFiscal?: string;
}

export interface GoogleSheetsConfig {
  sheetId: string;
  scriptUrl?: string;
  apiKey?: string;
  accessToken?: string;
  autoSync: boolean;
  lastSynced?: string;
}

export type ActiveTab = 'estoque' | 'movimentacoes' | 'cadastrar' | 'alertas' | 'configuracoes';
