import { Product, Movement } from '../types';

/**
 * Converts products list to CSV format compatible with Google Sheets Pagina1 tab
 */
export const productsToCSV = (products: Product[]): string => {
  const headers = ['ID_PRODUTO', 'NOME', 'DESCRICAO', 'CATEGORIA', 'FOTO', 'QUANTIDADE', 'QUANTIDADE_MINIMA', 'LOCALIZACAO', 'DATA_CADASTRO', 'STATUS'];
  const rows = products.map(p => [
    `"${p.id}"`,
    `"${p.nome.replace(/"/g, '""')}"`,
    `"${(p.descricao || '').replace(/"/g, '""')}"`,
    `"${p.categoria}"`,
    `"${p.foto || ''}"`,
    p.quantidade,
    p.quantidadeMinima,
    `"${(p.localizacao || '').replace(/"/g, '""')}"`,
    `"${p.dataCadastro}"`,
    `"${p.status}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

/**
 * Converts movements log to CSV format compatible with Google Sheets MOVIMENTACOES tab
 */
export const movementsToCSV = (movements: Movement[]): string => {
  const headers = ['ID_MOVIMENTACAO', 'ID_PRODUTO', 'TIPO', 'QUANTIDADE', 'DATA', 'RESPONSAVEL', 'OBSERVACAO', 'NOTA_FISCAL'];
  const rows = movements.map(m => [
    `"${m.id}"`,
    `"${m.produtoId}"`,
    `"${m.tipo}"`,
    m.quantidade,
    `"${m.data}"`,
    `"${(m.responsavel || '').replace(/"/g, '""')}"`,
    `"${(m.observacao || '').replace(/"/g, '""')}"`,
    `"${(m.notaFiscal || '').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

/**
 * Downloads a string as a CSV file in the browser
 */
export const downloadFile = (content: string, fileName: string, contentType: string = 'text/csv;charset=utf-8;') => {
  const blob = new Blob(['\ufeff' + content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
