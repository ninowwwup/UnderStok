/**
 * ============================================================================
 * UNDERSTOK — GERADOR AUTOMÁTICO GOOGLE PLANILHAS + API WEB APP (EXTREMA MG)
 * ============================================================================
 * Especialista de Estoque Logístico | Arquitetura de Dados CD Extrema MG
 *
 * ESTE ARQUIVO FAZ TUDO SOZINHO NO GOOGLE PLANILHAS:
 * 1. Cria um Menu Personalizado "📦 UnderStok Extrema MG" no topo da Planilha.
 * 2. Possui a função `gerarPlanilhaCompletaExtremaMG()` que cria, estiliza e
 *    preenche automaticamente TODAS as 5 abas no Google Sheets:
 *      - Matriz_Visual (Visão executiva Centros x Depósitos igual e melhorada da planilha original)
 *      - Centros (Os 7 Centros de Extrema MG: B123, B124, B125, B158, B159, B179, B180)
 *      - Depositos (Os 21 Depósitos completos com SLA, Fluxo e Dicas de Aprendizado)
 *      - Glossario_Treinamento (Conceitos-chave para novos integrantes)
 *      - Historico_Movimentacoes (Log de auditoria em tempo real da equipe)
 * 3. Funciona como Backend Web App (doGet / doPost) 100% gratuito conectado ao App!
 * ============================================================================
 */

const SHEET_NAMES = {
  MATRIZ: 'Matriz_Visual',
  CENTROS: 'Centros',
  DEPOSITOS: 'Depositos',
  GLOSSARIO: 'Glossario_Treinamento',
  HISTORICO: 'Historico_Movimentacoes'
};

/**
 * Cria menu interativo no Google Planilhas ao abrir o arquivo
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📦 UnderStok Extrema MG')
    .addItem('🚀 Gerar / Restaurar Todas as Abas e Dados (Extrema MG)', 'gerarPlanilhaCompletaExtremaMG')
    .addItem('📊 Atualizar Aba Matriz Visual', 'construirAbaMatrizVisual')
    .addToUi();
}

/**
 * FUNÇÃO PRINCIPAL: Execute esta função no Apps Script para gerar e popular
 * automaticamente toda a Planilha Google com os dados de Extrema MG!
 */
function gerarPlanilhaCompletaExtremaMG() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const { shCentros, shDepositos, shHistorico, shGlossario } = setupSheetsIfNeeded(ss);

  const initialData = getInitialExtremaMgData();

  const headersCentros = ['id', 'codigo', 'saida', 'canal', 'canalDetalhado', 'origem', 'definicao', 'para', 'dicaAprendizado', 'cor', 'ordem', 'updatedAt'];
  const headersDepositos = ['id', 'codigo', 'titulo', 'categoria', 'tipo', 'definicao', 'para', 'centros', 'canaisEspecificos', 'sla', 'fluxoRecomendado', 'dicaAprendizado', 'ordem', 'updatedAt'];
  const headersGlossario = ['id', 'termo', 'categoria', 'resumo', 'explicacao', 'exemplo'];

  objectsToSheet(shCentros, headersCentros, initialData.centros);
  objectsToSheet(shDepositos, headersDepositos, initialData.depositos);
  objectsToSheet(shGlossario, headersGlossario, initialData.glossario);

  appendHistoryLog(shHistorico, {
    id: 'LOG-INIT-' + new Date().getTime(),
    timestamp: new Date().toISOString(),
    usuario: 'Script Automático UnderStok',
    acao: 'GERACAO_COMPLETA',
    entidade: 'GOOGLE SHEETS',
    codigoRef: '7 Centros / 21 Depósitos',
    origem: 'Matriz Extrema MG',
    destino: 'Planilha Google',
    detalhes: 'Todas as abas e dados de Centros e Depósitos de Extrema MG foram gerados e formatados automaticamente.'
  });

  construirAbaMatrizVisual();
}

/**
 * Constrói uma aba executiva visual "Matriz_Visual" formatada com cores para
 * consulta direta no Google Planilhas pelos gestores e time.
 */
function construirAbaMatrizVisual() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const { shCentros, shDepositos } = setupSheetsIfNeeded(ss);

  let shMatriz = ss.getSheetByName(SHEET_NAMES.MATRIZ);
  if (!shMatriz) {
    shMatriz = ss.insertSheet(SHEET_NAMES.MATRIZ, 0);
  } else {
    shMatriz.clear();
  }

  const centros = sheetToObjects(shCentros);
  const depositos = sheetToObjects(shDepositos);

  // Título Principal
  shMatriz.getRange('A1:M1').merge()
    .setValue('UNDERSTOK — MATRIZ OFICIAL DE CENTROS E DEPÓSITOS LOGÍSTICOS (CD EXTREMA MG)')
    .setBackground('#0f172a')
    .setFontColor('#38bdf8')
    .setFontWeight('bold')
    .setFontSize(12)
    .setHorizontalAlignment('center');

  // Seção 1: Tabela de Centros
  shMatriz.getRange('A3:G3').merge()
    .setValue('1. CENTROS DE DISTRIBUIÇÃO — EXTREMA MG (REGRAS DE SAÍDA FIFO / LIFO)')
    .setBackground('#1e293b')
    .setFontColor('#f8fafc')
    .setFontWeight('bold');

  const centerHeaders = [['CENTRO', 'SAÍDA', 'CANAL MACRO', 'CANAL DETALHADO', 'ORIGEM', 'PARA', 'DEFINIÇÃO OPERACIONAL']];
  shMatriz.getRange(4, 1, 1, 7).setValues(centerHeaders)
    .setBackground('#0284c7')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  if (centros.length > 0) {
    const centerRows = centros.map(c => [
      c.codigo,
      c.saida,
      c.canal,
      c.canalDetalhado,
      c.origem,
      c.para,
      c.definicao
    ]);
    shMatriz.getRange(5, 1, centerRows.length, 7).setValues(centerRows);
  }

  // Seção 2: Matriz Cruzada Depósitos x Centros
  const startRowDep = 5 + centros.length + 2;
  const totalColsDep = 6 + centros.length;

  shMatriz.getRange(startRowDep, 1, 1, totalColsDep).merge()
    .setValue('2. MATRIZ DE DEPÓSITOS × CENTROS HABILITADOS (DEFINITIVOS VS TRANSITÓRIOS)')
    .setBackground('#065f46')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  const depHeaders = [[
    'DEPÓSITO',
    'TÍTULO / FINALIDADE',
    'NATUREZA',
    'CATEGORIA',
    'DESTINADO PARA',
    'DEFINIÇÃO OFICIAL',
    ...centros.map(c => c.codigo + ' (' + c.saida + ')')
  ]];

  shMatriz.getRange(startRowDep + 1, 1, 1, totalColsDep).setValues(depHeaders)
    .setBackground('#0f172a')
    .setFontColor('#34d399')
    .setFontWeight('bold');

  if (depositos.length > 0) {
    const depRows = depositos.map(d => {
      const cList = Array.isArray(d.centros) ? d.centros : [];
      return [
        d.codigo,
        d.titulo,
        d.tipo,
        d.categoria,
        d.para,
        d.definicao,
        ...centros.map(c => cList.includes(c.codigo) ? '✔ SIM' : '—')
      ];
    });
    shMatriz.getRange(startRowDep + 2, 1, depRows.length, totalColsDep).setValues(depRows);
  }

  shMatriz.setFrozenRows(1);
  shMatriz.autoResizeColumns(1, totalColsDep);
}

function setupSheetsIfNeeded(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();

  let shCentros = ss.getSheetByName(SHEET_NAMES.CENTROS);
  if (!shCentros) {
    shCentros = ss.insertSheet(SHEET_NAMES.CENTROS);
    const headers = ['id', 'codigo', 'saida', 'canal', 'canalDetalhado', 'origem', 'definicao', 'para', 'dicaAprendizado', 'cor', 'ordem', 'updatedAt'];
    shCentros.getRange(1, 1, 1, headers.length).setValues([headers])
      .setBackground('#0f172a').setFontColor('#38bdf8').setFontWeight('bold');
    shCentros.setFrozenRows(1);
  }

  let shDepositos = ss.getSheetByName(SHEET_NAMES.DEPOSITOS);
  if (!shDepositos) {
    shDepositos = ss.insertSheet(SHEET_NAMES.DEPOSITOS);
    const headers = ['id', 'codigo', 'titulo', 'categoria', 'tipo', 'definicao', 'para', 'centros', 'canaisEspecificos', 'sla', 'fluxoRecomendado', 'dicaAprendizado', 'ordem', 'updatedAt'];
    shDepositos.getRange(1, 1, 1, headers.length).setValues([headers])
      .setBackground('#0f172a').setFontColor('#34d399').setFontWeight('bold');
    shDepositos.setFrozenRows(1);
  }

  let shHistorico = ss.getSheetByName(SHEET_NAMES.HISTORICO);
  if (!shHistorico) {
    shHistorico = ss.insertSheet(SHEET_NAMES.HISTORICO);
    const headers = ['id', 'timestamp', 'usuario', 'acao', 'entidade', 'codigoRef', 'origem', 'destino', 'detalhes'];
    shHistorico.getRange(1, 1, 1, headers.length).setValues([headers])
      .setBackground('#1e1b4b').setFontColor('#f8fafc').setFontWeight('bold');
    shHistorico.setFrozenRows(1);
  }

  let shGlossario = ss.getSheetByName(SHEET_NAMES.GLOSSARIO);
  if (!shGlossario) {
    shGlossario = ss.insertSheet(SHEET_NAMES.GLOSSARIO);
    const headers = ['id', 'termo', 'categoria', 'resumo', 'explicacao', 'exemplo'];
    shGlossario.getRange(1, 1, 1, headers.length).setValues([headers])
      .setBackground('#0f172a').setFontColor('#fbbf24').setFontWeight('bold');
    shGlossario.setFrozenRows(1);
  }

  return { shCentros, shDepositos, shHistorico, shGlossario };
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = data.slice(1);

  return rows
    .filter(row => row[0] !== '' && row[0] !== null)
    .map(row => {
      const obj = {};
      headers.forEach((h, idx) => {
        let val = row[idx];
        if ((h === 'centros' || h === 'canaisEspecificos') && typeof val === 'string') {
          try {
            val = val.startsWith('[') || val.startsWith('{') ? JSON.parse(val) : val.split(',').map(s => s.trim()).filter(Boolean);
          } catch (e) {
            val = val.split(',').map(s => s.trim()).filter(Boolean);
          }
        }
        obj[h] = val;
      });
      return obj;
    });
}

function objectsToSheet(sheet, headers, items) {
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  if (!items || items.length === 0) return;

  const rows = items.map(item => {
    return headers.map(h => {
      const val = item[h];
      if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
        return JSON.stringify(val);
      }
      return val !== undefined && val !== null ? val : '';
    });
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);
}

function appendHistoryLog(shHistorico, logItem) {
  if (!logItem) return;
  const row = [
    logItem.id || ('LOG-' + new Date().getTime()),
    logItem.timestamp || new Date().toISOString(),
    logItem.usuario || 'Colaborador Time',
    logItem.acao || 'ATUALIZACAO',
    logItem.entidade || 'SISTEMA',
    logItem.codigoRef || '-',
    logItem.origem || '-',
    logItem.destino || '-',
    logItem.detalhes || ''
  ];
  shHistorico.insertRowAfter(1);
  shHistorico.getRange(2, 1, 1, row.length).setValues([row]);
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const { shCentros, shDepositos, shHistorico, shGlossario } = setupSheetsIfNeeded(ss);

    let centros = sheetToObjects(shCentros);
    let depositos = sheetToObjects(shDepositos);

    if (centros.length === 0 && depositos.length === 0) {
      gerarPlanilhaCompletaExtremaMG();
      centros = sheetToObjects(shCentros);
      depositos = sheetToObjects(shDepositos);
    }

    const historico = sheetToObjects(shHistorico).slice(0, 150);
    const glossario = sheetToObjects(shGlossario);

    const response = {
      status: 'ok',
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      updatedAt: new Date().toISOString(),
      isEmpty: false,
      data: { centros, depositos, historico, glossario }
    };

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const { shCentros, shDepositos, shHistorico, shGlossario } = setupSheetsIfNeeded(ss);

    const body = JSON.parse(e.postData.contents);
    const action = body.action || 'syncAll';

    const headersCentros = ['id', 'codigo', 'saida', 'canal', 'canalDetalhado', 'origem', 'definicao', 'para', 'dicaAprendizado', 'cor', 'ordem', 'updatedAt'];
    const headersDepositos = ['id', 'codigo', 'titulo', 'categoria', 'tipo', 'definicao', 'para', 'centros', 'canaisEspecificos', 'sla', 'fluxoRecomendado', 'dicaAprendizado', 'ordem', 'updatedAt'];
    const headersGlossario = ['id', 'termo', 'categoria', 'resumo', 'explicacao', 'exemplo'];

    if (action === 'syncAll' || action === 'seedDatabase') {
      if (body.centros) objectsToSheet(shCentros, headersCentros, body.centros);
      if (body.depositos) objectsToSheet(shDepositos, headersDepositos, body.depositos);
      if (body.glossario) objectsToSheet(shGlossario, headersGlossario, body.glossario);
      if (body.log) appendHistoryLog(shHistorico, body.log);
      construirAbaMatrizVisual();
    } else if (action === 'logMovement') {
      if (body.log) appendHistoryLog(shHistorico, body.log);
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'ok',
        action: action,
        updatedAt: new Date().toISOString(),
        spreadsheetUrl: ss.getUrl(),
        data: {
          centros: sheetToObjects(shCentros),
          depositos: sheetToObjects(shDepositos),
          historico: sheetToObjects(shHistorico).slice(0, 150),
          glossario: sheetToObjects(shGlossario)
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getInitialExtremaMgData() {
  const now = new Date().toISOString();
  return {
    centros: [
      { id: 'CTR-B123', codigo: 'B123', saida: 'FIFO', canal: 'CD MG E-COMMERCE', canalDetalhado: 'CD MG NACIONAL E-COMMERCE', origem: 'Nacional', definicao: 'Canal de produtos acabados de origem nacional, produzidos no Brasil c/ destinos a lojas (pessoa física).', para: 'PRODUTOS', dicaAprendizado: 'Par nacional do B124. Opera em FIFO e movimenta Produtos Acabados (Estoque Livre B110).', cor: '#0ea5e9', ordem: 1, updatedAt: now },
      { id: 'CTR-B124', codigo: 'B124', saida: 'FIFO', canal: 'CD MG E-COMMERCE', canalDetalhado: 'CD MG IMPORTADO E-COMMERCE', origem: 'Importado', definicao: 'Canal de produtos acabados de origem internacional, geralmente vindos da China c/ destinos a lojas (pessoa física).', para: 'PRODUTOS', dicaAprendizado: 'Par importado do B123. Possui inspeção de importação IQC no B135 e estoque livre no B110.', cor: '#6366f1', ordem: 2, updatedAt: now },
      { id: 'CTR-B125', codigo: 'B125', saida: 'FIFO', canal: 'VIRTUAL/TRANSITÓRIO', canalDetalhado: 'CD MG IMPORTADO E-COMMERCE (VIRTUAL)', origem: 'Virtual / Internacional', definicao: 'Canal produto internacional (virtual).', para: 'PEÇAS/PRODUTOS', dicaAprendizado: 'Centro Virtual/Transitório internacional (vinculado ao depósito de extravio B145).', cor: '#a855f7', ordem: 3, updatedAt: now },
      { id: 'CTR-B158', codigo: 'B158', saida: 'LIFO', canal: 'CD MG LOJAS MIDEA', canalDetalhado: 'CD MG NACIONAL LOJAS MIDEA CARRIER', origem: 'Nacional', definicao: 'Canal de produtos de origem nacional destinados às lojas próprias, Midea.', para: 'PEÇAS/PRODUTOS', dicaAprendizado: 'Opera com saída LIFO. Estoques livres: B130 (Peças), B114 (Produtos) e B416 (Blue Service).', cor: '#10b981', ordem: 4, updatedAt: now },
      { id: 'CTR-B159', codigo: 'B159', saida: 'LIFO', canal: 'CD MG LOJAS MIDEA', canalDetalhado: 'CD MG IMPORT. LOJAS MIDEA CARRIER', origem: 'Importado', definicao: 'Canal de produtos de origem internacional destinados às lojas próprias, Midea.', para: 'PEÇAS/PRODUTOS', dicaAprendizado: 'Par importado do B158 (LIFO). Possui B130 (Peças), B114 (Produtos), B416 (Blue Service) e B135 (IQC).', cor: '#14b8a6', ordem: 5, updatedAt: now },
      { id: 'CTR-B179', codigo: 'B179', saida: 'FIFO', canal: 'CD MG PÓS VENDA', canalDetalhado: 'CD MG NACIONAL PÓS VENDA', origem: 'Nacional', definicao: 'Canal de produtos de origem nacional destinados pós venda / garantia.', para: 'PEÇAS/PRODUTOS', dicaAprendizado: 'Pós-Venda Nacional (FIFO). Estoques livres: B412 (Peças) e B413 (Produtos), além de QA de Peças no B422.', cor: '#f59e0b', ordem: 6, updatedAt: now },
      { id: 'CTR-B180', codigo: 'B180', saida: 'FIFO', canal: 'CD MG IMPOR. PÓS VENDA', canalDetalhado: 'CD MG IMPORT PÓS VENDA', origem: 'Importado', definicao: 'Canal de produtos de origem internacional destinados pós venda / garantia.', para: 'PEÇAS/PRODUTOS', dicaAprendizado: 'Pós-Venda Importado (FIFO). Possui B412 (Peças), B413 (Produtos), B422 (QA Peças) e B135 (IQC).', cor: '#f97316', ordem: 7, updatedAt: now }
    ],
    depositos: [
      { id: 'DEP-B110', codigo: 'B110', titulo: 'Estoque Livre (E-Commerce)', categoria: 'Estoque Livre', tipo: 'Definitivo', definicao: 'Depósito definido para estoque disponível.', para: 'PRODUTO', centros: ['B123', 'B124'], canaisEspecificos: ['CD MG NACIONAL E-COMMERCE', 'CD MG IMPORTADO E-COMMERCE'], sla: 'Disponibilidade Imediata', fluxoRecomendado: 'TEMP / B135 ➔ B110 ➔ Expedição', dicaAprendizado: 'Estoque livre de produtos acabados do E-Commerce.', ordem: 1, updatedAt: now },
      { id: 'DEP-B114', codigo: 'B114', titulo: 'Estoque Livre Produtos (Lojas Midea)', categoria: 'Estoque Livre', tipo: 'Definitivo', definicao: 'Depósito definido para estoque disponível (Produtos Lojas Midea).', para: 'PRODUTO', centros: ['B158', 'B159'], canaisEspecificos: ['CD MG NACIONAL LOJAS MIDEA CARRIER', 'CD MG IMPORT. LOJAS MIDEA CARRIER'], sla: 'Disponibilidade Imediata', fluxoRecomendado: 'TEMP / B135 ➔ B114 ➔ Lojas', dicaAprendizado: 'Estoque livre de PRODUTOS nas Lojas Midea (B158/B159).', ordem: 2, updatedAt: now },
      { id: 'DEP-B130', codigo: 'B130', titulo: 'Estoque Livre Peças (Lojas Midea)', categoria: 'Estoque Livre', tipo: 'Definitivo', definicao: 'Depósito definido para estoque disponível (Peças Lojas Midea).', para: 'PEÇAS', centros: ['B158', 'B159'], canaisEspecificos: ['CD MG NACIONAL LOJAS MIDEA CARRIER', 'CD MG IMPORT. LOJAS MIDEA CARRIER'], sla: 'Disponibilidade Imediata', fluxoRecomendado: 'TEMP ➔ B130 ➔ Lojas', dicaAprendizado: 'Estoque livre de PEÇAS nas Lojas Midea (B158/B159).', ordem: 3, updatedAt: now },
      { id: 'DEP-B416', codigo: 'B416', titulo: 'Estoque Blue Service (Garantia Lojas)', categoria: 'Estoque Livre / Blue Service', tipo: 'Definitivo', definicao: 'Depósito para venda Blue Service (venda de Garantia pelo Centro de lojas).', para: 'PEÇAS', centros: ['B158', 'B159'], canaisEspecificos: ['CD MG NACIONAL LOJAS MIDEA CARRIER', 'CD MG IMPORT. LOJAS MIDEA CARRIER'], sla: 'Atendimento Blue Service', fluxoRecomendado: 'TEMP ➔ B416 ➔ Blue Service', dicaAprendizado: 'Exclusivo para peças Blue Service nos centros B158 e B159.', ordem: 4, updatedAt: now },
      { id: 'DEP-B412', codigo: 'B412', titulo: 'Estoque Livre Peças (Pós-Venda)', categoria: 'Estoque Livre', tipo: 'Definitivo', definicao: 'Depósito definido para estoque disponível (Peças Pós-Venda).', para: 'PEÇAS', centros: ['B179', 'B180'], canaisEspecificos: ['CD MG NACIONAL PÓS VENDA', 'CD MG IMPORT PÓS VENDA'], sla: 'Disponibilidade Imediata', fluxoRecomendado: 'TEMP / B422 ➔ B412', dicaAprendizado: 'Estoque livre de PEÇAS nos centros de Pós-Venda B179/B180.', ordem: 5, updatedAt: now },
      { id: 'DEP-B413', codigo: 'B413', titulo: 'Estoque Livre Produtos (Pós-Venda)', categoria: 'Estoque Livre', tipo: 'Definitivo', definicao: 'Depósito definido para estoque disponível (Produtos Pós-Venda).', para: 'PRODUTO', centros: ['B179', 'B180'], canaisEspecificos: ['CD MG NACIONAL PÓS VENDA', 'CD MG IMPORT PÓS VENDA'], sla: 'Disponibilidade Imediata', fluxoRecomendado: 'TEMP / B135 ➔ B413', dicaAprendizado: 'Estoque livre de PRODUTOS nos centros de Pós-Venda B179/B180.', ordem: 6, updatedAt: now },
      { id: 'DEP-TEMP', codigo: 'TEMP', titulo: 'Depósito Temporário (Recebimento)', categoria: 'Recebimento & Devolução', tipo: 'Transitório', definicao: 'Transitório para informar recebimento.', para: 'PEÇAS/PRODUTO', centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'], canaisEspecificos: ['Todos os Canais Físicos'], sla: 'Giro Rápido Inbound', fluxoRecomendado: 'NF Entrada ➔ TEMP ➔ B135 ou Livre', dicaAprendizado: 'Porta de entrada de todo recebimento físico.', ordem: 7, updatedAt: now },
      { id: 'DEP-DEVT', codigo: 'DEVT', titulo: 'Depósito Temporário (Devolução)', categoria: 'Recebimento & Devolução', tipo: 'Transitório', definicao: 'Transitório para informar devolução.', para: 'PEÇAS/PRODUTO', centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'], canaisEspecificos: ['Todos os Canais Físicos'], sla: 'Triagem Reversa', fluxoRecomendado: 'NF Devolução ➔ DEVT ➔ B148 ou B422', dicaAprendizado: 'Porta de entrada de toda devolução (Logística Reversa).', ordem: 8, updatedAt: now },
      { id: 'DEP-B135', codigo: 'B135', titulo: 'Inspeção de Importação (IQC)', categoria: 'Inspeção & Qualidade (QA/IQC)', tipo: 'Transitório', definicao: 'Depósito para análise de importação IQC.', para: 'PRODUTO', centros: ['B124', 'B159', 'B180'], canaisEspecificos: ['Canais Importados'], sla: 'Laudo IQC', fluxoRecomendado: 'TEMP ➔ B135 ➔ Estoque Livre', dicaAprendizado: 'Exclusivo dos 3 centros importados (B124, B159 e B180).', ordem: 9, updatedAt: now },
      { id: 'DEP-B148', codigo: 'B148', titulo: 'Inspeção de Avarias / Devolução (Produtos)', categoria: 'Inspeção & Qualidade (QA/IQC)', tipo: 'Transitório', definicao: 'Transitório para possíveis avarias que necessitam de inspeção de QA. Devolução.', para: 'PRODUTO', centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'], canaisEspecificos: ['Todos os Canais Físicos'], sla: 'Triagem QA', fluxoRecomendado: 'DEVT ➔ B148 ➔ Livre / B149 / B137 / B125 / B136', dicaAprendizado: 'Triagem técnica QA para PRODUTOS.', ordem: 10, updatedAt: now },
      { id: 'DEP-B422', codigo: 'B422', titulo: 'Inspeção de Avarias / Devolução (Peças)', categoria: 'Inspeção & Qualidade (QA/IQC)', tipo: 'Transitório', definicao: 'Transitório para possíveis avarias que necessitam de inspeção de QA. Devolução (Peças).', para: 'PEÇAS', centros: ['B179', 'B180'], canaisEspecificos: ['Pós-Venda Nacional e Importado'], sla: 'Triagem QA Peças', fluxoRecomendado: 'DEVT ➔ B422 ➔ B412 ou B136', dicaAprendizado: 'Triagem técnica QA exclusiva para PEÇAS no Pós-Venda.', ordem: 11, updatedAt: now },
      { id: 'DEP-B140', codigo: 'B140', titulo: 'Avaria Aguardando Retrabalho (<= 30 Dias)', categoria: 'Avarias & Retrabalho', tipo: 'Transitório', definicao: 'Avaria importação de produto, aguardando retrabalho. <= 30 Dias.', para: 'PRODUTO', centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'], canaisEspecificos: ['Todos os Canais Físicos'], sla: '<= 30 Dias', fluxoRecomendado: 'B135 / B148 ➔ B140 ➔ Livre ou B149', dicaAprendizado: 'Único depósito de avaria transitório com SLA de 30 dias.', ordem: 12, updatedAt: now },
      { id: 'DEP-B149', codigo: 'B149', titulo: 'Avaria Embalagem Retrabalhada (Outlet)', categoria: 'Avarias & Retrabalho', tipo: 'Definitivo', definicao: 'Depósito definido para avaria de embalagem retrabalhadas. (outlet)', para: 'PRODUTO', centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'], canaisEspecificos: ['Todos os Canais Físicos'], sla: 'Venda Outlet', fluxoRecomendado: 'B148 / B140 ➔ B149', dicaAprendizado: 'Produto funcional com embalagem retrabalhada para Outlet.', ordem: 13, updatedAt: now },
      { id: 'DEP-B137', codigo: 'B137', titulo: 'Venda Especial (Slow Movers)', categoria: 'Avarias & Retrabalho', tipo: 'Definitivo', definicao: 'Depósito definido para avaria de produtos disponíveis para venda especial. (Slow Movers)', para: 'PRODUTO', centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'], canaisEspecificos: ['Todos os Canais Físicos'], sla: 'Liquidação Comercial', fluxoRecomendado: 'B148 ➔ B137', dicaAprendizado: 'Produtos para Venda Especial / Slow Movers.', ordem: 14, updatedAt: now },
      { id: 'DEP-B125', codigo: 'B125', titulo: 'Avaria Devolução de Garantia', categoria: 'Avarias & Retrabalho', tipo: 'Definitivo', definicao: 'Depósito definido para avarias de produto oriundo de devolução de garantia.', para: 'PRODUTO', centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'], canaisEspecificos: ['Todos os Canais Físicos'], sla: 'Processo Garantia', fluxoRecomendado: 'DEVT ➔ B148 ➔ B125', dicaAprendizado: 'Avarias oriundas especificamente de devolução de garantia.', ordem: 15, updatedAt: now },
      { id: 'DEP-B136', codigo: 'B136', titulo: 'Avaria de Produto (Sucata)', categoria: 'Avarias & Retrabalho', tipo: 'Definitivo', definicao: 'Depósito definido para avarias de produto (sucata).', para: 'PEÇAS/PRODUTOS', centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'], canaisEspecificos: ['Todos os Canais Físicos'], sla: 'Baixa / Descarte', fluxoRecomendado: 'B148 / B422 ➔ B136', dicaAprendizado: 'Itens sem recuperação (Peças ou Produtos) destinados a sucata.', ordem: 16, updatedAt: now },
      { id: 'DEP-B145', codigo: 'B145', titulo: 'Extravio de Produto (Transportador)', categoria: 'Extravio & Sinistro', tipo: 'Definitivo', definicao: 'Depósito definido para extravio de produto, e faturamento contra transportador.', para: 'PRODUTO', centros: ['B123', 'B124', 'B125', 'B158', 'B159', 'B179', 'B180'], canaisEspecificos: ['Todos os 7 Centros'], sla: 'Faturamento Sinistro', fluxoRecomendado: 'Sinistro Rota ➔ B145', dicaAprendizado: 'Presente em todos os 7 centros (inclusive o virtual B125).', ordem: 17, updatedAt: now },
      { id: 'DEP-B112', codigo: 'B112', titulo: 'Contagem de Inventário (Produtos)', categoria: 'Inventário & Acuracidade', tipo: 'Transitório', definicao: 'Depósito transitório para contagem de inventário de produto acabado.', para: 'PRODUTO', centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'], canaisEspecificos: ['Todos os Canais Físicos'], sla: 'Auditoria Contagem', fluxoRecomendado: 'Divergência ➔ B112 ➔ Livre ou B111', dicaAprendizado: 'Transitório de contagem para Produtos Acabados.', ordem: 18, updatedAt: now },
      { id: 'DEP-B111', codigo: 'B111', titulo: 'Falta de Inventário (Produtos)', categoria: 'Inventário & Acuracidade', tipo: 'Definitivo', definicao: 'Depósito definido para faltas de inventário de produto acabado.', para: 'PRODUTO', centros: ['B123', 'B124', 'B158', 'B159', 'B179', 'B180'], canaisEspecificos: ['Todos os Canais Físicos'], sla: 'Baixa Inventário', fluxoRecomendado: 'B112 ➔ B111', dicaAprendizado: 'Falta confirmada de Produto Acabado após contagem no B112.', ordem: 19, updatedAt: now },
      { id: 'DEP-B153', codigo: 'B153', titulo: 'Contagem de Inventário (Peças)', categoria: 'Inventário & Acuracidade', tipo: 'Transitório', definicao: 'Depósito transitório para contagem de inventário de peças.', para: 'PEÇAS', centros: ['B158', 'B159', 'B179', 'B180'], canaisEspecificos: ['Lojas Midea e Pós-Venda'], sla: 'Auditoria Peças', fluxoRecomendado: 'Divergência Peças ➔ B153 ➔ Livre ou B152', dicaAprendizado: 'Transitório de contagem de Peças (B158, B159, B179, B180).', ordem: 20, updatedAt: now },
      { id: 'DEP-B152', codigo: 'B152', titulo: 'Falta de Inventário (Peças)', categoria: 'Inventário & Acuracidade', tipo: 'Definitivo', definicao: 'Depósito definido para faltas de inventário de peças.', para: 'PEÇAS', centros: ['B158', 'B159', 'B179', 'B180'], canaisEspecificos: ['Lojas Midea e Pós-Venda'], sla: 'Baixa Inventário Peças', fluxoRecomendado: 'B153 ➔ B152', dicaAprendizado: 'Falta confirmada de Peças após auditoria no B153.', ordem: 21, updatedAt: now }
    ],
    glossario: [
      { id: 'GLO-1', termo: 'FIFO (First In, First Out)', categoria: 'Regra de Expedição', resumo: 'Primeiro que entra é o primeiro que sai.', explicacao: 'Aplicado nos centros B123, B124, B125, B179 e B180.', exemplo: 'Lote mais antigo é expedido primeiro.' },
      { id: 'GLO-2', termo: 'LIFO (Last In, First Out)', categoria: 'Regra de Expedição', resumo: 'Último que entra é o primeiro que sai.', explicacao: 'Aplicado nos centros de Lojas Midea Carrier (B158 e B159).', exemplo: 'Cargas recém-chegadas saem primeiro para abastecimento das lojas.' },
      { id: 'GLO-3', termo: 'Transitório vs. Definitivo', categoria: 'Natureza do Depósito', resumo: 'Transitório exige ação/transferência; Definitivo é posição final.', explicacao: 'TEMP, DEVT, B135, B148, B422, B140, B112 e B153 são transitórios.', exemplo: 'DEVT -> B148 -> B149.' }
    ]
  };
}
