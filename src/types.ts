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

export const normalizeDriveUrl = (url: string): string => {
  if (!url) return '';
  // Converte URLs do tipo docs.google.com/uc?id= ou export=view&id= para lh3.googleusercontent.com/d/
  const match = url.match(/docs\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/i);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  // Converte URLs do tipo drive.google.com/file/d/FILE_ID/view
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileMatch && fileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  }
  return url;
};

export const normalizeProductUrls = (product: Product): Product => {
  return {
    ...product,
    foto: normalizeDriveUrl(product.foto),
    fotos: product.fotos ? product.fotos.map(normalizeDriveUrl) : []
  };
};

export const getProductPhotos = (product: Product): string[] => {
  let rawPhotos: string[] = [];
  if (product.fotos && product.fotos.length > 0) {
    rawPhotos = product.fotos.filter(Boolean);
  } else if (product.foto) {
    rawPhotos = [product.foto];
  }
  return rawPhotos.map(normalizeDriveUrl);
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
