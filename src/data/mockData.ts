import { Product, Movement } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PMI-001',
    nome: 'Caixa de Força Trifásica 200A',
    descricao: 'Caixa metálica de distribuição elétrica blindada com barramento de cobre.',
    categoria: 'CAIXA ELÉTRICA',
    quantidade: 14,
    quantidadeMinima: 5,
    foto: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80',
    localizacao: 'Prateleira A-01 (Setor Elétrico)',
    dataCadastro: '2026-01-15',
    status: 'Ativo',
    codigoBarras: '7891234560012'
  },
  {
    id: 'PMI-002',
    nome: 'Cabo Flexível Unipolar 10mm² Vermelho (Rolo 100m)',
    descricao: 'Cabo de cobre flexível 750V para instalações de potência industriais.',
    categoria: 'CABO',
    quantidade: 3,
    quantidadeMinima: 6, // Low stock alert!
    foto: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&auto=format&fit=crop&q=80',
    localizacao: 'Prateleira C-04 (Bobinas)',
    dataCadastro: '2026-02-10',
    status: 'Ativo',
    codigoBarras: '7891234560029'
  },
  {
    id: 'PMI-003',
    nome: 'Painel Elétrico de Comando 60x40x20cm',
    descricao: 'Quadro de comando em chapa de aço com placa de montagem e fecho fenda.',
    categoria: 'PAINEL',
    quantidade: 8,
    quantidadeMinima: 3,
    foto: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
    localizacao: 'Prateleira B-02 (Quadros)',
    dataCadastro: '2026-02-18',
    status: 'Ativo',
    codigoBarras: '7891234560036'
  },
  {
    id: 'PMI-004',
    nome: 'Alicate Amperímetro Digital True RMS Fluke',
    descricao: 'Instrumento de medição de corrente AC/DC e tensão para manutenção predial.',
    categoria: 'FERRAMENTA',
    quantidade: 2,
    quantidadeMinima: 4, // Low stock alert!
    foto: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&auto=format&fit=crop&q=80',
    localizacao: 'Armário de Ferramentas #1',
    dataCadastro: '2026-03-01',
    status: 'Ativo',
    codigoBarras: '7891234560043'
  },
  {
    id: 'PMI-005',
    nome: 'Disjuntor Caixa Moldada 3P 100A 25kA',
    descricao: 'Disjuntor termomagnético tripolar para proteção de motores e quadros principais.',
    categoria: 'DISJUNTOR',
    quantidade: 19,
    quantidadeMinima: 5,
    foto: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    localizacao: 'Prateleira A-03',
    dataCadastro: '2026-03-12',
    status: 'Ativo',
    codigoBarras: '7891234560050'
  },
  {
    id: 'PMI-006',
    nome: 'Transformador Trifásico 15kVA 440V/220V',
    descricao: 'Transformador a seco isolado em resina epóxi para rebaixamento de tensão.',
    categoria: 'EQUIPAMENTO',
    quantidade: 1,
    quantidadeMinima: 2, // Low stock alert!
    foto: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&auto=format&fit=crop&q=80',
    localizacao: 'Área de Pesados - Palete 04',
    dataCadastro: '2026-03-20',
    status: 'Ativo',
    codigoBarras: '7891234560067'
  },
  {
    id: 'PMI-007',
    nome: 'Luva de Proteção Isolante Classe 0 (1000V)',
    descricao: 'Pair de luvas de borracha natural para trabalho em alta tensão com reforço de pelica.',
    categoria: 'OUTROS',
    quantidade: 15,
    quantidadeMinima: 5,
    foto: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
    localizacao: 'Armário EPIs - Prateleira 2',
    dataCadastro: '2026-04-05',
    status: 'Ativo',
    codigoBarras: '7891234560074'
  }
];

export const INITIAL_MOVEMENTS: Movement[] = [
  {
    id: 'MOV-1001',
    produtoId: 'PMI-001',
    produtoNome: 'Caixa de Força Trifásica 200A',
    tipo: 'Entrada',
    quantidade: 10,
    data: new Date(Date.now() - 86400000 * 3).toISOString(),
    responsavel: 'Carlos Silva (Almoxarife)',
    notaFiscal: 'NF-89234',
    observacao: 'Recebimento do lote de fornecedor Schneider.'
  },
  {
    id: 'MOV-1002',
    produtoId: 'PMI-002',
    produtoNome: 'Cabo Flexível Unipolar 10mm² Vermelho',
    tipo: 'Saída',
    quantidade: 4,
    data: new Date(Date.now() - 86400000 * 2).toISOString(),
    responsavel: 'Roberto Souza (Técnico de Campo)',
    observacao: 'Retirado para Obra de Reforma Subestação Bloco B.'
  },
  {
    id: 'MOV-1003',
    produtoId: 'PMI-004',
    produtoNome: 'Alicate Amperímetro Digital True RMS Fluke',
    tipo: 'Saída',
    quantidade: 1,
    data: new Date(Date.now() - 86400000 * 1).toISOString(),
    responsavel: 'Marcos Lima (Técnico de Manutenção)',
    observacao: 'Empréstimo de ferramenta para aferição de motores.'
  }
];

export const CATEGORIES_LIST: string[] = [
  'CAIXA ELÉTRICA',
  'EQUIPAMENTO',
  'PAINEL',
  'FERRAMENTA',
  'CABO',
  'DISJUNTOR',
  'OUTROS'
];
