/**
 * ============================================================================
 * UNDERSTOK — ARQUITETURA DE DADOS & INTELIGÊNCIA LOGÍSTICA (CD EXTREMA MG)
 * ============================================================================
 * Contém a modelagem normalizada completa dos 7 Centros e 21 Depósitos
 * extraídos da matriz operacional de Extrema MG (Midea Carrier), além de
 * fluxos operacionais, glossário de onboarding e cenários de treinamento.
 */

window.UNDERSTOK_DEFAULT_DATA = {
  version: '2.0.0',
  unidade: 'CD Extrema MG — Midea Carrier',
  centros: [
    {
      id: 'CTR-B123',
      codigo: 'B123',
      saida: 'FIFO',
      canal: 'CD MG E-COMMERCE',
      canalDetalhado: 'CD MG NACIONAL E-COMMERCE',
      origem: 'Nacional',
      definicao: 'Canal de produtos acabados de origem nacional, ou seja, produzidos no Brasil c/ destinos a lojas (pessoa física).',
      para: 'PRODUTOS',
      dicaAprendizado: 'Par nacional do B124. Opera sempre em FIFO (Primeiro que Entra, Primeiro que Sai) e movimenta exclusivamente Produtos Acabados fabricados no Brasil para vendas online/varejo PF. Seu estoque livre padrão é o depósito B110.',
      cor: '#0ea5e9',
      ordem: 1,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'CTR-B124',
      codigo: 'B124',
      saida: 'FIFO',
      canal: 'CD MG E-COMMERCE',
      canalDetalhado: 'CD MG IMPORTADO E-COMMERCE',
      origem: 'Importado',
      definicao: 'Canal de produtos acabados de origem internacional, geralmente vindos da China c/ destinos a lojas (pessoa física).',
      para: 'PRODUTOS',
      dicaAprendizado: 'Par importado do B123. Recebe produtos acabados vindos do exterior (geralmente China). Por ser importado, possui acesso ao depósito B135 (Inspeção IQC de Importação) antes de ir ao estoque livre B110.',
      cor: '#6366f1',
      ordem: 2,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'CTR-B125',
      codigo: 'B125',
      saida: 'FIFO',
      canal: 'VIRTUAL/TRANSITÓRIO',
      canalDetalhado: 'CD MG IMPORTADO E-COMMERCE (VIRTUAL)',
      origem: 'Virtual / Internacional',
      definicao: 'Canal produto internacional (virtual). Utilizado para trâmite sistêmico e controle transitório de importação.',
      para: 'PEÇAS/PRODUTOS',
      dicaAprendizado: 'Atenção para não confundir! O código B125 existe tanto como CENTRO Virtual/Transitório (para processos internacionais e sinistros B145) quanto como DEPÓSITO Definitivo de Avaria de Devolução de Garantia nos demais centros.',
      cor: '#a855f7',
      ordem: 3,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'CTR-B158',
      codigo: 'B158',
      saida: 'LIFO',
      canal: 'CD MG LOJAS MIDEA',
      canalDetalhado: 'CD MG NACIONAL LOJAS MIDEA CARRIER',
      origem: 'Nacional',
      definicao: 'Canal de produtos de origem nacional destinados às lojas próprias, Midea.',
      para: 'PEÇAS/PRODUTOS',
      dicaAprendizado: 'Diferente do E-commerce, as Lojas Midea (B158 e B159) operam com saída LIFO (Último que Entra, Primeiro que Sai) e trabalham tanto com PEÇAS (estoque livre B130 e Blue Service B416) quanto com PRODUTOS (estoque livre B114).',
      cor: '#10b981',
      ordem: 4,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'CTR-B159',
      codigo: 'B159',
      saida: 'LIFO',
      canal: 'CD MG LOJAS MIDEA',
      canalDetalhado: 'CD MG IMPORT. LOJAS MIDEA CARRIER',
      origem: 'Importado',
      definicao: 'Canal de produtos de origem internacional destinados às lojas próprias, Midea.',
      para: 'PEÇAS/PRODUTOS',
      dicaAprendizado: 'Par importado do B158 para abastecimento das Lojas Próprias Midea Carrier. Opera em LIFO, possui depósitos livres B130 (Peças), B114 (Produtos), B416 (Blue Service) e passa por inspeção de importação IQC no B135.',
      cor: '#14b8a6',
      ordem: 5,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'CTR-B179',
      codigo: 'B179',
      saida: 'FIFO',
      canal: 'CD MG PÓS VENDA',
      canalDetalhado: 'CD MG NACIONAL PÓS VENDA',
      origem: 'Nacional',
      definicao: 'Canal de produtos de origem nacional destinados a pós-venda / garantia.',
      para: 'PEÇAS/PRODUTOS',
      dicaAprendizado: 'Centro focado em Pós-Venda e Garantia Nacional (FIFO). Seus estoques livres são exclusivos: B412 para PEÇAS e B413 para PRODUTOS. Também possui o depósito B422 exclusivo para inspeção QA de peças devolvidas.',
      cor: '#f59e0b',
      ordem: 6,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'CTR-B180',
      codigo: 'B180',
      saida: 'FIFO',
      canal: 'CD MG IMPOR. PÓS VENDA',
      canalDetalhado: 'CD MG IMPORT PÓS VENDA',
      origem: 'Importado',
      definicao: 'Canal de produtos de origem internacional destinados a pós-venda / garantia.',
      para: 'PEÇAS/PRODUTOS',
      dicaAprendizado: 'Par importado do B179 para Pós-Venda e Garantia Internacional (FIFO). Utiliza B412 (Estoque livre Peças), B413 (Estoque livre Produtos), B422 (QA de Peças) e B135 (IQC de Importação).',
      cor: '#f97316',
      ordem: 7,
      updatedAt: '2026-10-30T12:00:00Z'
    }
  ],

  depositos: [
    {
      id: 'DEP-B110',
      codigo: 'B110',
      titulo: 'Estoque Livre (E-Commerce)',
      categoria: 'Estoque Livre',
      tipo: 'Definitivo',
      definicao: 'Depósito definido para estoque disponível de produtos acabados no canal E-Commerce.',
      para: 'PRODUTO',
      centros: ['B123', 'B124'],
      canaisEspecificos: ['CD MG NACIONAL E-COMMERCE', 'CD MG IMPORTADO E-COMMERCE'],
      sla: 'Disponibilidade Imediata',
      fluxoRecomendado: 'TEMP / B135 ➔ B110 ➔ Expedição Cliente',
      dicaAprendizado: 'É o coração do E-commerce (B123 Nacional e B124 Importado). Todo produto acabado apto para venda imediata fica alocado no B110.',
      ordem: 1,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B114',
      codigo: 'B114',
      titulo: 'Estoque Livre Produtos (Lojas Midea)',
      categoria: 'Estoque Livre',
      tipo: 'Definitivo',
      definicao: 'Depósito definido para estoque disponível de produtos acabados das Lojas Midea Carrier.',
      para: 'PRODUTO',
      centros: ['B158', 'B159'],
      canaisEspecificos: ['CD MG NACIONAL LOJAS MIDEA CARRIER', 'CD MG IMPORT. LOJAS MIDEA CARRIER'],
      sla: 'Disponibilidade Imediata',
      fluxoRecomendado: 'TEMP / B135 ➔ B114 ➔ Abastecimento Lojas',
      dicaAprendizado: 'Nos centros de Lojas Midea (B158/B159), o estoque livre é separado entre Produto e Peça: B114 guarda PRODUTOS ACABADOS, enquanto B130 guarda PEÇAS.',
      ordem: 2,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B130',
      codigo: 'B130',
      titulo: 'Estoque Livre Peças (Lojas Midea)',
      categoria: 'Estoque Livre',
      tipo: 'Definitivo',
      definicao: 'Depósito definido para estoque disponível de peças nas Lojas Midea Carrier.',
      para: 'PEÇAS',
      centros: ['B158', 'B159'],
      canaisEspecificos: ['CD MG NACIONAL LOJAS MIDEA CARRIER', 'CD MG IMPORT. LOJAS MIDEA CARRIER'],
      sla: 'Disponibilidade Imediata',
      fluxoRecomendado: 'TEMP ➔ B130 ➔ Abastecimento Peças Lojas',
      dicaAprendizado: 'Par do B114 nos centros B158 e B159, porém exclusivo para PEÇAS disponíveis para venda/atendimento nas Lojas Midea Carrier.',
      ordem: 3,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B416',
      codigo: 'B416',
      titulo: 'Estoque Blue Service (Garantia Lojas)',
      categoria: 'Estoque Livre / Blue Service',
      tipo: 'Definitivo',
      definicao: 'Depósito para venda Blue Service (venda de Garantia pelo Centro de lojas).',
      para: 'PEÇAS',
      centros: ['B158', 'B159'],
      canaisEspecificos: ['CD MG NACIONAL LOJAS MIDEA CARRIER', 'CD MG IMPORT. LOJAS MIDEA CARRIER'],
      sla: 'Atendimento Blue Service',
      fluxoRecomendado: 'TEMP ➔ B416 ➔ Ordem Blue Service',
      dicaAprendizado: 'Exclusivo dos centros de Lojas (B158 e B159) para PEÇAS destinadas à operação Blue Service (atendimento de garantia realizado via centro de lojas).',
      ordem: 4,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B412',
      codigo: 'B412',
      titulo: 'Estoque Livre Peças (Pós-Venda)',
      categoria: 'Estoque Livre',
      tipo: 'Definitivo',
      definicao: 'Depósito definido para estoque disponível de peças nos centros de Pós-Venda.',
      para: 'PEÇAS',
      centros: ['B179', 'B180'],
      canaisEspecificos: ['CD MG NACIONAL PÓS VENDA', 'CD MG IMPORT PÓS VENDA'],
      sla: 'Disponibilidade Imediata',
      fluxoRecomendado: 'TEMP / B422 ➔ B412 ➔ Atendimento Garantia / Assistência',
      dicaAprendizado: 'Nos centros de Pós-Venda (B179 e B180), os depósitos começam com "B4xx": B412 é o estoque livre de PEÇAS e B413 é o estoque livre de PRODUTOS.',
      ordem: 5,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B413',
      codigo: 'B413',
      titulo: 'Estoque Livre Produtos (Pós-Venda)',
      categoria: 'Estoque Livre',
      tipo: 'Definitivo',
      definicao: 'Depósito definido para estoque disponível de produtos acabados nos centros de Pós-Venda.',
      para: 'PRODUTO',
      centros: ['B179', 'B180'],
      canaisEspecificos: ['CD MG NACIONAL PÓS VENDA', 'CD MG IMPORT PÓS VENDA'],
      sla: 'Disponibilidade Imediata',
      fluxoRecomendado: 'TEMP / B135 ➔ B413 ➔ Troca em Garantia',
      dicaAprendizado: 'Par do B412 nos centros B179 e B180. Armazena PRODUTOS ACABADOS disponíveis para reposição ou troca em garantia do Pós-Venda.',
      ordem: 6,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-TEMP',
      codigo: 'TEMP',
      titulo: 'Recebimento Temporário (Inbound)',
      categoria: 'Recebimento & Devolução',
      tipo: 'Transitório',
      definicao: 'Depósito temporário transitório para informar recebimento de mercadorias.',
      para: 'PEÇAS/PRODUTO',
      centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'],
      canaisEspecificos: ['Todos os Canais Físicos'],
      sla: 'Giro Rápido (Doca ➔ Putaway)',
      fluxoRecomendado: 'Nota Fiscal Entrada ➔ TEMP ➔ B135 (se Importado) ou Estoque Livre',
      dicaAprendizado: 'Porta de entrada de todo recebimento físico no CD. Assim que a carga é conferida e endereçada (putaway), o saldo deve sair do TEMP rumo ao estoque livre ou IQC.',
      ordem: 7,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-DEVT',
      codigo: 'DEVT',
      titulo: 'Devolução Temporária (Logística Reversa)',
      categoria: 'Recebimento & Devolução',
      tipo: 'Transitório',
      definicao: 'Depósito temporário transitório para informar devolução.',
      para: 'PEÇAS/PRODUTO',
      centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'],
      canaisEspecificos: ['Todos os Canais Físicos'],
      sla: 'Triagem Inicial Reversa',
      fluxoRecomendado: 'Entrada NF Devolução ➔ DEVT ➔ B148 (Produto) ou B422 (Peças)',
      dicaAprendizado: 'Porta de entrada da Logística Reversa! Quando uma devolução chega ao CD, entra primeiro em DEVT e rapidamente segue para inspeção de Qualidade (B148 para produtos ou B422 para peças).',
      ordem: 8,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B135',
      codigo: 'B135',
      titulo: 'Inspeção de Importação (IQC)',
      categoria: 'Inspeção & Qualidade (QA/IQC)',
      tipo: 'Transitório',
      definicao: 'Depósito transitório para análise de importação IQC (Incoming Quality Control).',
      para: 'PRODUTO',
      centros: ['B124', 'B159', 'B180'],
      canaisEspecificos: ['CD MG IMPORTADO E-COMMERCE', 'CD MG IMPORT. LOJAS MIDEA CARRIER', 'CD MG IMPORT PÓS VENDA'],
      sla: 'Durante Laudo IQC',
      fluxoRecomendado: 'TEMP ➔ B135 (Análise IQC) ➔ Estoque Livre (B110/B114/B413) ou B140 (Retrabalho)',
      dicaAprendizado: 'Repare nos centros vinculados: B124, B159 e B180 — são exatamente os 3 centros de produtos IMPORTADOS! Todo lote importado que exige inspeção de qualidade na chegada (IQC) aguarda laudo no B135.',
      ordem: 9,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B148',
      codigo: 'B148',
      titulo: 'Inspeção de Avarias / Devolução (Produtos)',
      categoria: 'Inspeção & Qualidade (QA/IQC)',
      tipo: 'Transitório',
      definicao: 'Transitório para possíveis avarias que necessitam de inspeção de QA e triagem de Devolução.',
      para: 'PRODUTO',
      centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'],
      canaisEspecificos: ['Todos os Canais Físicos'],
      sla: 'Triagem Técnica QA',
      fluxoRecomendado: 'DEVT ➔ B148 (Laudo QA) ➔ Livre / B149 (Outlet) / B137 (Slow) / B125 (Garantia) / B136 (Sucata)',
      dicaAprendizado: 'É a sala de triagem do time de Qualidade (QA) para PRODUTOS. Nenhum produto deve ficar eternamente no B148: após o laudo da QA, ele é transferido para o destino definitivo (Livre, Outlet B149, Garantia B125, Sucata B136, etc.).',
      ordem: 10,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B422',
      codigo: 'B422',
      titulo: 'Inspeção de Avarias / Devolução (Peças)',
      categoria: 'Inspeção & Qualidade (QA/IQC)',
      tipo: 'Transitório',
      definicao: 'Transitório para possíveis avarias de peças que necessitam de inspeção de QA e Devolução.',
      para: 'PEÇAS',
      centros: ['B179', 'B180'],
      canaisEspecificos: ['CD MG NACIONAL PÓS VENDA', 'CD MG IMPORT PÓS VENDA'],
      sla: 'Triagem Técnica QA Peças',
      fluxoRecomendado: 'DEVT ➔ B422 (Laudo QA Peças) ➔ B412 (Livre Peças) ou B136 (Sucata)',
      dicaAprendizado: 'Equivalente ao B148, porém exclusivo para PEÇAS nos centros de Pós-Venda (B179 Nacional e B180 Importado).',
      ordem: 11,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B140',
      codigo: 'B140',
      titulo: 'Avaria Aguardando Retrabalho (<= 30 Dias)',
      categoria: 'Avarias & Retrabalho',
      tipo: 'Transitório',
      definicao: 'Avaria importação de produto, aguardando retrabalho. Prazo limite <= 30 Dias.',
      para: 'PRODUTO',
      centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'],
      canaisEspecificos: ['Todos os Canais Físicos'],
      sla: '<= 30 Dias (Crítico)',
      fluxoRecomendado: 'B135 / B148 ➔ B140 (Retrabalho em até 30d) ➔ Estoque Livre ou B149',
      dicaAprendizado: 'Único depósito de avaria que é TRANSITÓRIO e possui SLA rigoroso de até 30 dias! Usado quando o produto tem conserto/retrabalho programado para voltar a ser vendido.',
      ordem: 12,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B149',
      codigo: 'B149',
      titulo: 'Avaria de Embalagem Retrabalhada (Outlet)',
      categoria: 'Avarias & Retrabalho',
      tipo: 'Definitivo',
      definicao: 'Depósito definido para avaria de embalagem retrabalhadas (destinado à venda Outlet).',
      para: 'PRODUTO',
      centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'],
      canaisEspecificos: ['Todos os Canais Físicos'],
      sla: 'Comercialização Outlet',
      fluxoRecomendado: 'B148 / B140 ➔ B149 ➔ Venda Canal Outlet',
      dicaAprendizado: 'O produto está 100% funcional, mas teve a embalagem avariada e retrabalhada. Vai para o B149 (Definitivo) para comercialização com desconto na modalidade Outlet.',
      ordem: 13,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B137',
      codigo: 'B137',
      titulo: 'Venda Especial / Slow Movers',
      categoria: 'Avarias & Retrabalho',
      tipo: 'Definitivo',
      definicao: 'Depósito definido para avaria de produtos disponíveis para venda especial (Slow Movers).',
      para: 'PRODUTO',
      centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'],
      canaisEspecificos: ['Todos os Canais Físicos'],
      sla: 'Liquidação Comercial',
      fluxoRecomendado: 'B148 / Estoque ➔ B137 ➔ Venda Especial Liquidar',
      dicaAprendizado: 'Destinado a produtos de baixo giro (Slow Movers) ou com pequenas avarias estéticas liberados para campanhas de Venda Especial.',
      ordem: 14,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B125',
      codigo: 'B125',
      titulo: 'Avaria de Devolução de Garantia',
      categoria: 'Avarias & Retrabalho',
      tipo: 'Definitivo',
      definicao: 'Depósito definido para avarias de produto oriundo de devolução de garantia.',
      para: 'PRODUTO',
      centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'],
      canaisEspecificos: ['Todos os Canais Físicos'],
      sla: 'Definitivo Garantia',
      fluxoRecomendado: 'DEVT ➔ B148 ➔ B125 (Baixa/Processo Garantia)',
      dicaAprendizado: 'Quando o produto avariado veio especificamente de um processo de Devolução de Garantia, após passar pela triagem QA ele é alocado definitivamente no depósito B125.',
      ordem: 15,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B136',
      codigo: 'B136',
      titulo: 'Avaria Irreversível / Sucata',
      categoria: 'Avarias & Retrabalho',
      tipo: 'Definitivo',
      definicao: 'Depósito definido para avarias de produto sem possibilidade de recuperação (sucata).',
      para: 'PEÇAS/PRODUTOS',
      centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'],
      canaisEspecificos: ['Todos os Canais Físicos'],
      sla: 'Aguardando Descarte / Baixa Fiscal',
      fluxoRecomendado: 'B148 / B422 ➔ B136 ➔ Descarte Ecológico & Baixa Contábil',
      dicaAprendizado: 'Aceita tanto PEÇAS quanto PRODUTOS condenados pela qualidade (QA). Uma vez no B136, o item não volta ao estoque comercial — segue para processo fiscal de sucateamento.',
      ordem: 16,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B145',
      codigo: 'B145',
      titulo: 'Extravio de Produto (Cobrança Transportador)',
      categoria: 'Extravio & Sinistro',
      tipo: 'Definitivo',
      definicao: 'Depósito definido para extravio de produto, e faturamento contra transportador.',
      para: 'PRODUTO',
      centros: ['B123', 'B124', 'B125', 'B158', 'B159', 'B179', 'B180'],
      canaisEspecificos: ['Todos os Canais (Incluindo Centro Virtual B125)'],
      sla: 'Faturamento Sinistro',
      fluxoRecomendado: 'Ocorrência Transporte ➔ B145 ➔ Faturamento contra Transportadora',
      dicaAprendizado: 'Curiosidade importante: o B145 é o ÚNICO depósito presente em absolutamente todos os 7 centros (incluindo o centro virtual B125!). É usado quando a transportadora extravia o produto e será faturada pelo sinistro.',
      ordem: 17,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B112',
      codigo: 'B112',
      titulo: 'Contagem de Inventário (Produtos)',
      categoria: 'Inventário & Acuracidade',
      tipo: 'Transitório',
      definicao: 'Depósito transitório para contagem de inventário de produto acabado.',
      para: 'PRODUTO',
      centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'],
      canaisEspecificos: ['Todos os Canais Físicos'],
      sla: 'Durante Ciclo de Contagem',
      fluxoRecomendado: 'Divergência Contagem ➔ B112 (Recontagem/Auditoria) ➔ Livre (se localizado) ou B111 (Falta Definitiva)',
      dicaAprendizado: 'Dica de memorização: B112 é Transitório (bloqueio temporário durante auditoria de contagem de PRODUTO). Se a falta se confirmar, vai para o B111 (Definitivo).',
      ordem: 18,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B111',
      codigo: 'B111',
      titulo: 'Falta de Inventário (Produtos)',
      categoria: 'Inventário & Acuracidade',
      tipo: 'Definitivo',
      definicao: 'Depósito definido para faltas confirmadas de inventário de produto acabado.',
      para: 'PRODUTO',
      centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'],
      canaisEspecificos: ['Todos os Canais Físicos'],
      sla: 'Ajuste de Inventário',
      fluxoRecomendado: 'B112 (Auditoria Concluída) ➔ B111 ➔ Baixa de Inventário',
      dicaAprendizado: 'Par definitivo do B112. Após esgotadas as buscas na contagem de PRODUTO ACABADO no B112, a falta confirmada é transferida para o B111.',
      ordem: 19,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B153',
      codigo: 'B153',
      titulo: 'Contagem de Inventário (Peças)',
      categoria: 'Inventário & Acuracidade',
      tipo: 'Transitório',
      definicao: 'Depósito transitório para contagem de inventário de peças.',
      para: 'PEÇAS',
      centros: ['B158', 'B159', 'B179', 'B180'],
      canaisEspecificos: ['Lojas Midea Carrier & Pós-Venda'],
      sla: 'Durante Ciclo de Contagem',
      fluxoRecomendado: 'Divergência Peças ➔ B153 (Recontagem) ➔ Livre (B130/B412) ou B152 (Falta Definitiva)',
      dicaAprendizado: 'Note que B123 e B124 não possuem B153 nem B152 porque E-commerce só opera Produtos! Apenas B158, B159, B179 e B180 operam Peças e utilizam B153 (Contagem Transitória) e B152 (Falta Definitiva).',
      ordem: 20,
      updatedAt: '2026-10-30T12:00:00Z'
    },
    {
      id: 'DEP-B152',
      codigo: 'B152',
      titulo: 'Falta de Inventário (Peças)',
      categoria: 'Inventário & Acuracidade',
      tipo: 'Definitivo',
      definicao: 'Depósito definido para faltas confirmadas de inventário de peças.',
      para: 'PEÇAS',
      centros: ['B158', 'B159', 'B179', 'B180'],
      canaisEspecificos: ['Lojas Midea Carrier & Pós-Venda'],
      sla: 'Ajuste de Inventário Peças',
      fluxoRecomendado: 'B153 (Auditoria Concluída) ➔ B152 ➔ Baixa de Inventário de Peças',
      dicaAprendizado: 'Par definitivo do B153 para PEÇAS nos centros B158, B159, B179 e B180. Registra a falta confirmada após auditoria.',
      ordem: 21,
      updatedAt: '2026-10-30T12:00:00Z'
    }
  ],

  glossario: [
    {
      id: 'GLO-1',
      termo: 'FIFO (First In, First Out)',
      categoria: 'Regra de Expedição',
      resumo: 'O primeiro lote que entrou no estoque é o primeiro a sair.',
      explicacao: 'Utilizado nos centros de E-Commerce (B123, B124), Virtual (B125) e Pós-Venda (B179, B180). Garante a rotação correta de lotes, evitando envelhecimento de produtos e vencimento de garantias de fábrica.',
      exemplo: 'Se um lote de ar-condicionado chegou em Janeiro e outro em Março no centro B123, o sistema prioriza a separação do lote de Janeiro.'
    },
    {
      id: 'GLO-2',
      termo: 'LIFO (Last In, First Out)',
      categoria: 'Regra de Expedição',
      resumo: 'O último lote que entrou no estoque é o primeiro a sair.',
      explicacao: 'Parametrizado especificamente nos centros de Lojas Próprias Midea Carrier (B158 Nacional e B159 Importado), onde o giro de abastecimento prioriza as cargas recém-recebidas ou blocadas.',
      exemplo: 'No abastecimento das lojas próprias pelos centros B158/B159, a regra de saída configurada na matriz é LIFO.'
    },
    {
      id: 'GLO-3',
      termo: 'Depósito Transitório vs. Definitivo',
      categoria: 'Natureza do Depósito',
      resumo: 'Transitório é passagem temporária com ação pendente; Definitivo é posição final.',
      explicacao: 'Depósitos Transitórios (TEMP, DEVT, B135, B148, B422, B140, B112, B153) funcionam como "salas de espera" onde o material aguarda conferência, laudo de qualidade (QA/IQC), retrabalho ou recontagem. Já os Definitivos abrigam o estoque livre para venda ou o destino final de baixa (sucata, falta confirmada, extravio).',
      exemplo: 'Um produto devolvido entra em DEVT (Transitório), vai para B148 (Transitório) para avaliação da QA e, se aprovado como embalagem recondicionada, segue para B149 (Definitivo - Outlet).'
    },
    {
      id: 'GLO-4',
      termo: 'IQC (Incoming Quality Control)',
      categoria: 'Qualidade & Importação',
      resumo: 'Inspeção de Qualidade no Recebimento de Importados (Depósito B135).',
      explicacao: 'Mercadorias de origem internacional (centros B124, B159 e B180) passam por amostragem e verificação técnica do time de Qualidade antes da liberação para venda.',
      exemplo: 'Um container vindo da China dá entrada no centro B124 via TEMP, passa pelo B135 para inspeção IQC e, após aprovado, é transferido ao B110 (Estoque Livre).'
    },
    {
      id: 'GLO-5',
      termo: 'QA (Quality Assurance) — Triagem Reversa',
      categoria: 'Qualidade & Devoluções',
      resumo: 'Análise técnica de avarias e devoluções nos depósitos B148 (Produtos) e B422 (Peças).',
      explicacao: 'Avalia o estado físico e funcional dos itens retornados ou avariados na operação para decidir se voltam ao estoque livre, vão para retrabalho (B140), Outlet (B149), Slow Movers (B137), Garantia (B125) ou Sucata (B136).',
      exemplo: 'Peça devolvida no centro B179 (Pós-Venda) aguarda avaliação técnica no depósito B422.'
    },
    {
      id: 'GLO-6',
      termo: 'Blue Service (Depósito B416)',
      categoria: 'Canais Especiais',
      resumo: 'Operação de peças para venda/atendimento de garantia pelo Centro de Lojas.',
      explicacao: 'Exclusivo dos centros B158 e B159 (Lojas Midea Carrier), separa o estoque de peças destinado ao serviço autorizado e venda de garantia das lojas próprias.',
      exemplo: 'Peça nacional para atendimento Blue Service nas lojas fica alocada no Centro B158 / Depósito B416.'
    },
    {
      id: 'GLO-7',
      termo: 'Outlet (B149) vs. Slow Movers (B137)',
      categoria: 'Comercialização de Avarias',
      resumo: 'B149 é embalagem retrabalhada; B137 é venda especial de baixo giro/avaria leve.',
      explicacao: 'Ambos são depósitos definitivos de recuperação comercial: o B149 recebe produtos perfeitos cuja embalagem original foi avariada e retrabalhada (Outlet), enquanto o B137 reúne itens de baixo giro (Slow Movers) ou condições comerciais especiais.',
      exemplo: 'Caixa amassada no transporte e reembalada no CD -> transferir de B148 para B149.'
    }
  ],

  fluxosMacro: [
    {
      id: 'FLX-INBOUND',
      titulo: '1. Fluxo de Entrada e Recebimento (Inbound)',
      subtitulo: 'Da chegada na doca até a disponibilização no Estoque Livre',
      cor: '#0ea5e9',
      etapas: [
        { codigo: 'TEMP', nome: 'Recebimento Temporário', tipo: 'Transitório', desc: 'Entrada fiscal e conferência física de Peças ou Produtos em qualquer centro físico.' },
        { codigo: 'B135', nome: 'Inspeção IQC (Se Importado)', tipo: 'Transitório', desc: 'Apenas para centros importados (B124, B159, B180). Análise técnica do lote importado.' },
        { codigo: 'B110 / B114 / B130 / B412 / B413 / B416', nome: 'Estoque Livre por Canal', tipo: 'Definitivo', desc: 'B110 (E-comm Prod), B114 (Lojas Prod), B130 (Lojas Peças), B416 (Blue Service), B412 (Pós-Venda Peças), B413 (Pós-Venda Prod).' }
      ]
    },
    {
      id: 'FLX-REVERSA',
      titulo: '2. Fluxo de Logística Reversa, Devolução & Qualidade (QA)',
      subtitulo: 'Triagem técnica e destinação de retornos e avarias',
      cor: '#10b981',
      etapas: [
        { codigo: 'DEVT', nome: 'Devolução Temporária', tipo: 'Transitório', desc: 'Recebimento inicial do retorno/devolução de cliente ou transporte.' },
        { codigo: 'B148 / B422', nome: 'Inspeção QA (Triagem)', tipo: 'Transitório', desc: 'B148 para Produtos (todos os centros) ou B422 para Peças (exclusivo Pós-Venda B179/B180).' },
        { codigo: 'B140', nome: 'Retrabalho (<= 30 Dias)', tipo: 'Transitório', desc: 'Opcional: se o produto importado/nacional precisar de retrabalho rápido em até 30 dias.' },
        { codigo: 'B149 / B137 / B125 / B136', nome: 'Destinação Definitiva', tipo: 'Definitivo', desc: 'B149 (Outlet Embalagem), B137 (Slow Movers), B125 (Avaria Garantia), B136 (Sucata) ou retorno ao Estoque Livre.' }
      ]
    },
    {
      id: 'FLX-INVENTARIO',
      titulo: '3. Fluxo de Inventário, Auditoria & Sinistros',
      subtitulo: 'Tratamento de divergências de contagem e extravio em transporte',
      cor: '#f59e0b',
      etapas: [
        { codigo: 'B112 / B153', nome: 'Contagem de Inventário', tipo: 'Transitório', desc: 'Bloqueio para recontagem e auditoria: B112 para Produtos Acabados e B153 para Peças.' },
        { codigo: 'B111 / B152', nome: 'Falta Confirmada de Inventário', tipo: 'Definitivo', desc: 'Caso o item não seja localizado após auditoria: B111 (Falta Produto) e B152 (Falta Peças).' },
        { codigo: 'B145', nome: 'Extravio em Transporte', tipo: 'Definitivo', desc: 'Sinistro ocorrido em rota externa para faturamento contra a transportadora (disponível inclusive no B125).' }
      ]
    }
  ],

  quizQuestions: [
    {
      id: 'QZ-1',
      pergunta: 'Um lote de aparelhos de ar-condicionado IMPORTADOS acabou de chegar para o canal E-COMMERCE e precisa passar pela análise de qualidade de importação (IQC). Qual a combinação correta de Centro + Depósito?',
      opcoes: [
        { texto: 'Centro B123 + Depósito B135', correta: false, explicacao: 'Incorreto: O centro B123 é para produtos Nacionais (não possui B135).' },
        { texto: 'Centro B124 + Depósito B135', correta: true, explicacao: 'Perfeito! B124 é o CD MG Importado E-Commerce e B135 é o depósito transitório de Inspeção de Importação (IQC).' },
        { texto: 'Centro B124 + Depósito B148', correta: false, explicacao: 'Incorreto: B148 é para inspeção de avarias/devolução, enquanto a análise IQC de importação é feita no B135.' },
        { texto: 'Centro B159 + Depósito B110', correta: false, explicacao: 'Incorreto: B159 é Lojas Midea e B110 é estoque livre.' }
      ]
    },
    {
      id: 'QZ-2',
      pergunta: 'Qual é a diferença fundamental na regra de saída (expedição) entre os centros de Lojas Midea (B158/B159) e os demais centros (E-commerce e Pós-Venda)?',
      opcoes: [
        { texto: 'Lojas Midea (B158/B159) operam em LIFO, enquanto E-commerce e Pós-Venda operam em FIFO.', correta: true, explicacao: 'Exato! B158 e B159 são os únicos centros parametrizados com saída LIFO na matriz de Extrema MG.' },
        { texto: 'Todos os centros operam em FEFO.', correta: false, explicacao: 'Incorreto: Na matriz de Extrema MG trabalhamos com FIFO e LIFO.' },
        { texto: 'Apenas os centros importados operam em LIFO.', correta: false, explicacao: 'Incorreto: A regra LIFO aplica-se ao canal Lojas Midea (tanto Nacional B158 quanto Importado B159).' },
        { texto: 'Pós-Venda opera em LIFO e E-commerce em FIFO.', correta: false, explicacao: 'Incorreto: Pós-Venda (B179 e B180) também opera em FIFO.' }
      ]
    },
    {
      id: 'QZ-3',
      pergunta: 'Chegou uma DEVOLUÇÃO de PEÇAS no Pós-Venda Nacional (Centro B179) com suspeita de avaria que precisa passar pela inspeção do QA. Para qual depósito transitório de QA essa peça deve ir após o DEVT?',
      opcoes: [
        { texto: 'Depósito B148', correta: false, explicacao: 'Atenção à pegadinha! O B148 é para PRODUTOS. Para PEÇAS no Pós-Venda, usamos o B422.' },
        { texto: 'Depósito B422', correta: true, explicacao: 'Excelente! O B422 é exclusivo dos centros B179 e B180 para Inspeção de Avarias/Devolução de PEÇAS.' },
        { texto: 'Depósito B412', correta: false, explicacao: 'Incorreto: B412 é o Estoque Livre definitivo de peças, não deve receber itens pendentes de inspeção QA.' },
        { texto: 'Depósito B153', correta: false, explicacao: 'Incorreto: B153 é para contagem de inventário de peças.' }
      ]
    },
    {
      id: 'QZ-4',
      pergunta: 'Após a avaliação do QA no depósito B148, constatou-se que o produto está em perfeito funcionamento, porém sua caixa original rasgou e recebeu uma embalagem retrabalhada para ser vendido como OUTLET. Qual o depósito definitivo correto?',
      opcoes: [
        { texto: 'Depósito B136', correta: false, explicacao: 'Incorreto: B136 é para Sucata (avaria irreversível).' },
        { texto: 'Depósito B140', correta: false, explicacao: 'Incorreto: B140 é transitório (aguardando retrabalho <= 30 dias). Como já foi retrabalhado para Outlet, o destino é definitivo.' },
        { texto: 'Depósito B149', correta: true, explicacao: 'Correto! O depósito B149 é o definitivo para avaria de embalagem retrabalhada (Outlet).' },
        { texto: 'Depósito B137', correta: false, explicacao: 'Incorreto: B137 é destinado a Venda Especial / Slow Movers.' }
      ]
    },
    {
      id: 'QZ-5',
      pergunta: 'Uma transportadora extraviou um produto durante a entrega e será faturada pelo sinistro. Qual depósito definitivo é utilizado e qual a sua particularidade quanto aos Centros?',
      opcoes: [
        { texto: 'Depósito B111 — presente apenas no E-commerce.', correta: false, explicacao: 'Incorreto: B111 é para falta de inventário interno no armazém.' },
        { texto: 'Depósito B145 — é o único depósito vinculado a todos os 7 centros (inclusive o virtual B125).', correta: true, explicacao: 'Na mosca! O B145 (Extravio de produto e faturamento contra transportador) abrange B123, B124, B125, B158, B159, B179 e B180.' },
        { texto: 'Depósito B125 — presente apenas em centros importados.', correta: false, explicacao: 'Incorreto: O depósito B125 trata avarias oriundas de devolução de garantia.' },
        { texto: 'Depósito DEVT — pois a transportadora devolverá a nota.', correta: false, explicacao: 'Incorreto: DEVT é transitório para devoluções físicas recebidas na doca.' }
      ]
    },
    {
      id: 'QZ-6',
      pergunta: 'Precisamos consultar o ESTOQUE LIVRE disponível de PEÇAS e de PRODUTOS nas Lojas Midea Nacional (Centro B158). Quais são os dois depósitos correspondentes?',
      opcoes: [
        { texto: 'B130 (Peças) e B114 (Produtos)', correta: true, explicacao: 'Exato! Nos centros B158 e B159, o estoque livre é B130 para Peças e B114 para Produtos (além do B416 para peças Blue Service).' },
        { texto: 'B412 (Peças) e B413 (Produtos)', correta: false, explicacao: 'Incorreto: B412 e B413 são os estoques livres do Pós-Venda (B179 e B180).' },
        { texto: 'B110 (Produtos) e B152 (Peças)', correta: false, explicacao: 'Incorreto: B110 é do E-commerce e B152 é falta de inventário de peças.' },
        { texto: 'B416 (Produtos) e B130 (Peças)', correta: false, explicacao: 'Incorreto: B416 é exclusivo para Peças da operação Blue Service.' }
      ]
    }
  ]
};
