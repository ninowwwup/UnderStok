/**
 * ============================================================================
 * UNDERSTOK — APLICAÇÃO INTERATIVA PRINCIPAL (UI, CRUD, KANBAN, QUIZ & PWA)
 * ============================================================================
 */

const AppState = {
  activeTab: 'dashboard',
  searchQuery: '',
  filterCentro: 'ALL',
  filterTipo: 'ALL',
  filterPara: 'ALL',
  filterCategoria: 'ALL',
  depositosViewMode: 'cards', // 'cards' | 'kanban'
  wizard: {
    canal: 'ECOMMERCE',
    origem: 'NACIONAL',
    material: 'PRODUTO',
    situacao: 'LIVRE'
  },
  quizState: {
    currentIdx: 0,
    score: 0,
    answered: {}
  },
  deferredPwaPrompt: null
};

// ============================================================================
// INICIALIZAÇÃO E PWA
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initPwaSupport();

  window.underStokStore.subscribe(() => {
    renderHeaderSyncStatus();
    renderMainView();
  });

  renderHeaderSyncStatus();
  renderMainView();

  // Se houver URL do Apps Script configurada, sincroniza silenciosamente ao abrir
  if (window.underStokStore.config.scriptUrl && window.underStokStore.config.autoSync) {
    window.underStokStore.pullFromGoogleSheets()
      .then(() => showToast('Sincronizado com Google Planilhas!', 'emerald'))
      .catch(() => console.warn('Operando em modo cache offline.'));
  }
});

function initTheme() {
  const savedTheme = localStorage.getItem('understok_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButtonIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('understok_theme', next);
  updateThemeButtonIcon(next);
}

function updateThemeButtonIcon(theme) {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;
  btn.innerHTML = theme === 'dark'
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

function initPwaSupport() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW registro:', err));
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    AppState.deferredPwaPrompt = e;
    const installBtn = document.getElementById('pwaInstallBtn');
    if (installBtn) installBtn.style.display = 'inline-flex';
  });
}

async function triggerPwaInstall() {
  if (AppState.deferredPwaPrompt) {
    AppState.deferredPwaPrompt.prompt();
    const { outcome } = await AppState.deferredPwaPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('Aplicativo instalado com sucesso!', 'emerald');
    }
    AppState.deferredPwaPrompt = null;
  } else {
    openInstallInstructionsModal();
  }
}

// ============================================================================
// NAVEGAÇÃO ENTRE ABAS
// ============================================================================
function switchTab(tabId) {
  AppState.activeTab = tabId;
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  renderMainView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderHeaderSyncStatus() {
  const { config, isSyncing, state } = window.underStokStore;
  const pill = document.getElementById('syncStatusPill');
  if (!pill) return;

  const countCentros = document.getElementById('navCountCentros');
  const countDepositos = document.getElementById('navCountDepositos');
  if (countCentros) countCentros.textContent = state.centros.length;
  if (countDepositos) countDepositos.textContent = state.depositos.length;

  if (isSyncing) {
    pill.className = 'sync-pill';
    pill.innerHTML = `<span class="sync-dot pulse"></span><span>Sincronizando Planilha...</span>`;
    return;
  }

  if (config.scriptUrl) {
    pill.className = 'sync-pill';
    pill.innerHTML = `<span class="sync-dot"></span><span>Google Sheets Ativo (${escapeHtml(config.userName)})</span>`;
  } else {
    pill.className = 'sync-pill local-mode';
    pill.innerHTML = `<span class="sync-dot"></span><span>Banco Local • Conectar Planilha</span>`;
  }
}

// ============================================================================
// RENDERIZADOR CENTRAL DE VISÕES
// ============================================================================
function renderMainView() {
  const container = document.getElementById('appMainContainer');
  if (!container) return;

  switch (AppState.activeTab) {
    case 'dashboard':
      container.innerHTML = renderDashboardView();
      break;
    case 'centros':
      container.innerHTML = renderCentrosView();
      break;
    case 'depositos':
      container.innerHTML = renderDepositosView();
      setupKanbanDragAndDrop();
      break;
    case 'fluxos':
      container.innerHTML = renderFluxosView();
      break;
    case 'academia':
      container.innerHTML = renderAcademiaView();
      break;
    case 'cloud':
      container.innerHTML = renderCloudView();
      break;
    default:
      container.innerHTML = renderDashboardView();
  }
}

// ============================================================================
// ABA 1: DASHBOARD, CONSULTOR INTELIGENTE & MATRIZ DE VÍNCULOS
// ============================================================================
function renderDashboardView() {
  const { centros, depositos, historico } = window.underStokStore.state;
  const totalDefinitivos = depositos.filter(d => d.tipo === 'Definitivo').length;
  const totalTransitorios = depositos.filter(d => d.tipo === 'Transitório').length;
  const totalFifo = centros.filter(c => c.saida === 'FIFO').length;
  const totalLifo = centros.filter(c => c.saida === 'LIFO').length;
  const totalVinculos = depositos.reduce((acc, d) => acc + (Array.isArray(d.centros) ? d.centros.length : 0), 0);

  const filteredDepositos = getFilteredDepositos();
  const wizardRec = computeWizardRecommendation();

  return `
    <!-- KPIs Executivos -->
    <div class="kpi-grid">
      <div class="kpi-card" style="--kpi-color: linear-gradient(180deg, #0ea5e9, #6366f1);">
        <div class="kpi-top">
          <span class="kpi-label">Centros Logísticos</span>
          <span class="badge badge-fifo">${totalFifo} FIFO • ${totalLifo} LIFO</span>
        </div>
        <div class="kpi-value">${centros.length}</div>
        <div class="kpi-sub">E-Commerce, Lojas Midea, Pós-Venda & Virtual</div>
      </div>

      <div class="kpi-card" style="--kpi-color: linear-gradient(180deg, #10b981, #059669);">
        <div class="kpi-top">
          <span class="kpi-label">Depósitos Mapeados</span>
          <span class="badge badge-definitivo">${totalDefinitivos} Definitivos</span>
        </div>
        <div class="kpi-value">${depositos.length}</div>
        <div class="kpi-sub">${totalTransitorios} Transitórios (Recebimento, QA, IQC, Contagem)</div>
      </div>

      <div class="kpi-card" style="--kpi-color: linear-gradient(180deg, #f59e0b, #ea580c);">
        <div class="kpi-top">
          <span class="kpi-label">Matriz Centro × Depósito</span>
          <span class="badge badge-transitorio">Interativa</span>
        </div>
        <div class="kpi-value">${totalVinculos}</div>
        <div class="kpi-sub">Combinações operacionais ativas em Extrema MG</div>
      </div>

      <div class="kpi-card" style="--kpi-color: linear-gradient(180deg, #a855f7, #ec4899);">
        <div class="kpi-top">
          <span class="kpi-label">Histórico & Auditoria</span>
          <span class="badge badge-produto">Tempo Real</span>
        </div>
        <div class="kpi-value">${historico.length}</div>
        <div class="kpi-sub">Movimentações e atualizações registradas</div>
      </div>
    </div>

    <!-- Assistente Inteligente de Decisão Logística -->
    <div class="wizard-box">
      <div class="section-header" style="margin-bottom: 0.4rem;">
        <div class="section-title-group">
          <h2>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            Consultor Inteligente: "Qual Centro e Depósito devo utilizar?"
          </h2>
          <p>Simule qualquer cenário real da operação de Extrema MG e descubra na hora a alocação exata e o fluxo correto.</p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-sm btn-secondary" onclick="openCentroModal()">+ Novo Centro</button>
          <button class="btn btn-sm btn-primary" onclick="openDepositoModal()">+ Novo Depósito</button>
        </div>
      </div>

      <div class="wizard-grid">
        <div class="wizard-field">
          <label>1. Canal de Negócio</label>
          <select class="form-control" onchange="updateWizard('canal', this.value)">
            <option value="ECOMMERCE" ${AppState.wizard.canal === 'ECOMMERCE' ? 'selected' : ''}>CD MG E-Commerce (Varejo PF)</option>
            <option value="LOJAS" ${AppState.wizard.canal === 'LOJAS' ? 'selected' : ''}>CD MG Lojas Midea Carrier</option>
            <option value="POSVENDA" ${AppState.wizard.canal === 'POSVENDA' ? 'selected' : ''}>CD MG Pós-Venda / Garantia</option>
            <option value="VIRTUAL" ${AppState.wizard.canal === 'VIRTUAL' ? 'selected' : ''}>Virtual / Trâmite Internacional (B125)</option>
          </select>
        </div>

        <div class="wizard-field">
          <label>2. Origem do Material</label>
          <select class="form-control" onchange="updateWizard('origem', this.value)">
            <option value="NACIONAL" ${AppState.wizard.origem === 'NACIONAL' ? 'selected' : ''}>Nacional (Produzido no Brasil)</option>
            <option value="IMPORTADO" ${AppState.wizard.origem === 'IMPORTADO' ? 'selected' : ''}>Internacional / Importado (China)</option>
          </select>
        </div>

        <div class="wizard-field">
          <label>3. Tipo de Item</label>
          <select class="form-control" onchange="updateWizard('material', this.value)">
            <option value="PRODUTO" ${AppState.wizard.material === 'PRODUTO' ? 'selected' : ''}>Produto Acabado (Equipamento)</option>
            <option value="PECAS" ${AppState.wizard.material === 'PECAS' ? 'selected' : ''}>Peças / Componentes</option>
          </select>
        </div>

        <div class="wizard-field">
          <label>4. Etapa / Situação Operacional</label>
          <select class="form-control" onchange="updateWizard('situacao', this.value)">
            <option value="LIVRE" ${AppState.wizard.situacao === 'LIVRE' ? 'selected' : ''}>Estoque Livre (Disponível p/ Venda/Saída)</option>
            <option value="BLUESERVICE" ${AppState.wizard.situacao === 'BLUESERVICE' ? 'selected' : ''}>Venda Garantia Blue Service (Lojas)</option>
            <option value="RECEBIMENTO" ${AppState.wizard.situacao === 'RECEBIMENTO' ? 'selected' : ''}>Recebimento Físico na Doca (Inbound)</option>
            <option value="IQC" ${AppState.wizard.situacao === 'IQC' ? 'selected' : ''}>Análise de Importação (IQC)</option>
            <option value="DEVOLUCAO_ENTRADA" ${AppState.wizard.situacao === 'DEVOLUCAO_ENTRADA' ? 'selected' : ''}>Entrada Inicial de Devolução (Reversa)</option>
            <option value="QA_TRIAGEM" ${AppState.wizard.situacao === 'QA_TRIAGEM' ? 'selected' : ''}>Inspeção de Qualidade / Avaria (QA)</option>
            <option value="RETRABALHO_30D" ${AppState.wizard.situacao === 'RETRABALHO_30D' ? 'selected' : ''}>Avaria Aguardando Retrabalho (<= 30 Dias)</option>
            <option value="OUTLET" ${AppState.wizard.situacao === 'OUTLET' ? 'selected' : ''}>Embalagem Retrabalhada (Outlet)</option>
            <option value="SLOW_MOVERS" ${AppState.wizard.situacao === 'SLOW_MOVERS' ? 'selected' : ''}>Venda Especial (Slow Movers)</option>
            <option value="GARANTIA_AVARIA" ${AppState.wizard.situacao === 'GARANTIA_AVARIA' ? 'selected' : ''}>Avaria Oriunda de Devolução de Garantia</option>
            <option value="SUCATA" ${AppState.wizard.situacao === 'SUCATA' ? 'selected' : ''}>Avaria Irreversível / Sucata</option>
            <option value="EXTRAVIO" ${AppState.wizard.situacao === 'EXTRAVIO' ? 'selected' : ''}>Extravio em Transporte (Faturar Transp.)</option>
            <option value="INV_CONTAGEM" ${AppState.wizard.situacao === 'INV_CONTAGEM' ? 'selected' : ''}>Contagem de Inventário (Em Auditoria)</option>
            <option value="INV_FALTA" ${AppState.wizard.situacao === 'INV_FALTA' ? 'selected' : ''}>Falta Confirmada de Inventário</option>
          </select>
        </div>
      </div>

      <div class="wizard-result-banner">
        <div style="flex: 1; min-width: 260px;">
          <div style="display:flex; align-items:center; gap:0.65rem; flex-wrap:wrap; margin-bottom:0.4rem;">
            <span class="badge ${wizardRec.status === 'ok' ? 'badge-definitivo' : 'badge-transitorio'}">${wizardRec.badgeText}</span>
            <span style="font-size:1.15rem; font-weight:800; color:var(--text-primary);">${wizardRec.headline}</span>
          </div>
          <p style="font-size:0.88rem; color:var(--text-secondary);">${wizardRec.explanation}</p>
          ${wizardRec.flow ? `<div style="margin-top:0.5rem; font-size:0.8rem; color:#38bdf8; font-weight:600;">Fluxo Padrão: ${wizardRec.flow}</div>` : ''}
        </div>
        <div style="display:flex; gap:0.6rem; align-items:center;">
          ${wizardRec.centroCodigo ? `<div class="code-pill" title="Centro Recomendado">Centro ${wizardRec.centroCodigo}</div>` : ''}
          ${wizardRec.depCodigo ? `<div class="code-pill" style="background:rgba(16,185,129,0.16); color:#34d399; border-color:rgba(52,211,153,0.4);" title="Depósito Recomendado">Dep. ${wizardRec.depCodigo}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- Barra de Pesquisa e Filtros Instantâneos -->
    <div class="search-command-panel">
      <div class="search-row">
        <div class="search-input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            class="search-input"
            placeholder="Pesquise por código (ex: B123, B148, TEMP, B412), finalidade (sucata, outlet, IQC, inventário, peças)..."
            value="${escapeHtml(AppState.searchQuery)}"
            oninput="handleSearchInput(this.value)"
          />
        </div>

        <select class="filter-select" onchange="setFilter('filterCentro', this.value)">
          <option value="ALL">Todos os Centros (${centros.length})</option>
          ${centros.map(c => `<option value="${c.codigo}" ${AppState.filterCentro === c.codigo ? 'selected' : ''}>Centro ${c.codigo} — ${c.canal} (${c.origem})</option>`).join('')}
        </select>

        <select class="filter-select" onchange="setFilter('filterTipo', this.value)">
          <option value="ALL">Tipo: Definitivo + Transitório</option>
          <option value="Definitivo" ${AppState.filterTipo === 'Definitivo' ? 'selected' : ''}>Apenas Definitivos</option>
          <option value="Transitório" ${AppState.filterTipo === 'Transitório' ? 'selected' : ''}>Apenas Transitórios</option>
        </select>

        <select class="filter-select" onchange="setFilter('filterPara', this.value)">
          <option value="ALL">Material: Produtos & Peças</option>
          <option value="PRODUTO" ${AppState.filterPara === 'PRODUTO' ? 'selected' : ''}>Produtos Acabados</option>
          <option value="PEÇAS" ${AppState.filterPara === 'PEÇAS' ? 'selected' : ''}>Peças</option>
        </select>

        ${(AppState.searchQuery || AppState.filterCentro !== 'ALL' || AppState.filterTipo !== 'ALL' || AppState.filterPara !== 'ALL' || AppState.filterCategoria !== 'ALL')
          ? `<button class="btn btn-secondary btn-sm" onclick="clearAllFilters()">Limpar Filtros</button>`
          : ''}
      </div>

      <div class="quick-chips">
        <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-right:0.25rem;">FILTRO RÁPIDO:</span>
        ${['ALL', 'Estoque Livre', 'Recebimento & Devolução', 'Inspeção & Qualidade (QA/IQC)', 'Avarias & Retrabalho', 'Inventário & Acuracidade', 'Extravio & Sinistro'].map(cat => `
          <button class="chip-btn ${AppState.filterCategoria === cat ? 'active' : ''}" onclick="setFilter('filterCategoria', '${cat}')">
            ${cat === 'ALL' ? 'Todas as Categorias' : cat}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Resultado dos Depósitos Filtrados -->
    <div class="section-header">
      <div class="section-title-group">
        <h2>Catálogo de Consulta Rápida (${filteredDepositos.length} depósitos exibidos)</h2>
        <p>Clique em qualquer centro vinculado para filtrar ou use os botões para editar, mover ou excluir.</p>
      </div>
    </div>

    <div class="cards-grid">
      ${filteredDepositos.map(dep => renderDepositoCardHtml(dep)).join('')}
    </div>

    <!-- Matriz Completa Centros x Depósitos -->
    <div class="matrix-container">
      <div style="padding: 1.25rem 1.25rem 0.75rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.8rem;">
        <div>
          <h3 style="font-size:1.1rem; font-weight:800;">Matriz Interativa de Vínculos: Centros × Depósitos (Extrema MG)</h3>
          <p style="font-size:0.82rem; color:var(--text-secondary);">Clique em qualquer célula da matriz abaixo para <strong>vincular ou desvincular</strong> instantaneamente um depósito a um Centro!</p>
        </div>
        <button class="btn btn-sm btn-secondary" onclick="exportToCsv()">Exportar Matriz CSV (Excel)</button>
      </div>
      <div class="matrix-scroll">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Depósito</th>
              <th>Finalidade / Definição</th>
              <th>Natureza</th>
              <th>Para</th>
              ${centros.map(c => `<th style="text-align:center;" title="${escapeHtml(c.definicao)}">${c.codigo}<br><span style="font-size:0.63rem; color:#38bdf8;">${c.saida}</span></th>`).join('')}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${filteredDepositos.map(dep => `
              <tr>
                <td><span class="code-pill" style="font-size:0.9rem; padding:0.22rem 0.55rem;">${escapeHtml(dep.codigo)}</span></td>
                <td>
                  <div style="font-weight:700; color:var(--text-primary);">${escapeHtml(dep.titulo)}</div>
                  <div style="font-size:0.76rem; color:var(--text-secondary); max-width:340px;">${escapeHtml(dep.definicao)}</div>
                </td>
                <td>
                  <span class="badge ${dep.tipo === 'Definitivo' ? 'badge-definitivo' : 'badge-transitorio'}" style="cursor:pointer;" title="Clique para alternar Definitivo/Transitório" onclick="quickToggleDepTipo('${dep.id}')">
                    ${dep.tipo} ⇄
                  </span>
                </td>
                <td><span class="badge ${getParaBadgeClass(dep.para)}">${escapeHtml(dep.para)}</span></td>
                ${centros.map(c => {
                  const isLinked = Array.isArray(dep.centros) && dep.centros.includes(c.codigo);
                  return `
                    <td class="matrix-toggle-cell">
                      <button
                        class="matrix-check-btn ${isLinked ? 'linked' : ''}"
                        title="${isLinked ? `Desvincular ${dep.codigo} do centro ${c.codigo}` : `Vincular ${dep.codigo} ao centro ${c.codigo}`}"
                        onclick="toggleMatrixLink('${dep.id}', '${c.codigo}')"
                      >
                        ✓
                      </button>
                    </td>
                  `;
                }).join('')}
                <td>
                  <div style="display:flex; gap:0.35rem;">
                    <button class="btn btn-sm btn-secondary" onclick="openDepositoModal('${dep.id}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteDeposito('${dep.id}')">×</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================================================
// LÓGICA DO CONSULTOR INTELIGENTE DE DECISÃO LOGÍSTICA
// ============================================================================
function updateWizard(field, value) {
  AppState.wizard[field] = value;
  renderMainView();
}

function computeWizardRecommendation() {
  const { canal, origem, material, situacao } = AppState.wizard;

  let centroCodigo = 'B123';
  let centroDesc = '';

  if (canal === 'VIRTUAL') {
    centroCodigo = 'B125';
    centroDesc = 'Centro Virtual / Transitório Internacional (FIFO)';
  } else if (canal === 'ECOMMERCE') {
    if (material === 'PECAS') {
      return {
        status: 'warn',
        badgeText: 'Atenção Operacional',
        headline: 'O canal E-Commerce (B123/B124) opera exclusivamente PRODUTOS ACABADOS!',
        explanation: 'Na matriz de Extrema MG, PEÇAS são movimentadas nos centros de Lojas Midea (B158 Nacional / B159 Importado) ou Pós-Venda (B179 Nacional / B180 Importado). Mude o canal para Lojas ou Pós-Venda para alocar Peças.',
        centroCodigo: origem === 'NACIONAL' ? 'B158 / B179' : 'B159 / B180',
        depCodigo: 'B130 / B412'
      };
    }
    centroCodigo = origem === 'NACIONAL' ? 'B123' : 'B124';
    centroDesc = origem === 'NACIONAL' ? 'CD MG Nacional E-Commerce (FIFO)' : 'CD MG Importado E-Commerce (FIFO)';
  } else if (canal === 'LOJAS') {
    centroCodigo = origem === 'NACIONAL' ? 'B158' : 'B159';
    centroDesc = origem === 'NACIONAL' ? 'CD MG Nacional Lojas Midea Carrier (LIFO)' : 'CD MG Importado Lojas Midea Carrier (LIFO)';
  } else if (canal === 'POSVENDA') {
    centroCodigo = origem === 'NACIONAL' ? 'B179' : 'B180';
    centroDesc = origem === 'NACIONAL' ? 'CD MG Nacional Pós-Venda (FIFO)' : 'CD MG Importado Pós-Venda (FIFO)';
  }

  if (canal === 'VIRTUAL') {
    if (situacao === 'EXTRAVIO') {
      return {
        status: 'ok',
        badgeText: 'Definitivo • Sinistro',
        headline: 'Alocar no Centro B125 ➔ Depósito B145 (Extravio de Produto)',
        explanation: 'O depósito B145 está habilitado no centro virtual B125 para registro de extravio e faturamento contra o transportador.',
        flow: 'Ocorrência Transporte ➔ Centro B125 / Depósito B145 ➔ Faturamento Sinistro',
        centroCodigo: 'B125',
        depCodigo: 'B145'
      };
    }
    return {
      status: 'warn',
      badgeText: 'Centro Virtual FIFO',
      headline: 'Centro B125 — Trâmite Virtual Internacional',
      explanation: 'O Centro B125 é um centro virtual/transitório para produtos e peças internacionais. Para armazenagem física em Extrema MG, selecione E-Commerce (B124), Lojas (B159) ou Pós-Venda (B180).',
      centroCodigo: 'B125',
      depCodigo: 'B145'
    };
  }

  switch (situacao) {
    case 'LIVRE': {
      let dep = 'B110';
      if (canal === 'ECOMMERCE') dep = 'B110';
      else if (canal === 'LOJAS') dep = material === 'PECAS' ? 'B130' : 'B114';
      else if (canal === 'POSVENDA') dep = material === 'PECAS' ? 'B412' : 'B413';

      return {
        status: 'ok',
        badgeText: 'Definitivo • Estoque Livre',
        headline: `Alocar no Centro ${centroCodigo} ➔ Depósito ${dep}`,
        explanation: `No ${centroDesc}, todo ${material === 'PECAS' ? 'estoque livre de PEÇAS' : 'estoque livre de PRODUTOS ACABADOS'} disponível para atendimento fica no depósito definitivo ${dep}.`,
        flow: `TEMP ${origem === 'IMPORTADO' && material === 'PRODUTO' ? '➔ B135 (IQC) ' : ''}➔ ${dep} (Estoque Livre Disponível)`,
        centroCodigo,
        depCodigo: dep
      };
    }
    case 'BLUESERVICE': {
      if (canal !== 'LOJAS' || material !== 'PECAS') {
        return {
          status: 'warn',
          badgeText: 'Regra Específica Blue Service',
          headline: 'O depósito B416 (Blue Service) é exclusivo para PEÇAS nas Lojas Midea (B158/B159)!',
          explanation: 'O estoque Blue Service atende vendas de garantia pelo Centro de Lojas. Selecione Canal "Lojas Midea" e Item "Peças".',
          centroCodigo: origem === 'NACIONAL' ? 'B158' : 'B159',
          depCodigo: 'B416'
        };
      }
      return {
        status: 'ok',
        badgeText: 'Definitivo • Blue Service',
        headline: `Alocar no Centro ${centroCodigo} ➔ Depósito B416`,
        explanation: 'Depósito definitivo exclusivo para Peças destinadas à operação Blue Service (venda de garantia pelo Centro de Lojas Midea).',
        flow: `TEMP ➔ ${centroCodigo} / B416 ➔ Atendimento Blue Service`,
        centroCodigo,
        depCodigo: 'B416'
      };
    }
    case 'RECEBIMENTO':
      return {
        status: 'ok',
        badgeText: 'Transitório • Inbound',
        headline: `Alocar no Centro ${centroCodigo} ➔ Depósito TEMP`,
        explanation: 'Todo recebimento físico na doca entra primeiramente no depósito transitório TEMP para informar o recebimento antes da conferência e endereçamento.',
        flow: `Entrada NF ➔ ${centroCodigo} / TEMP ➔ ${origem === 'IMPORTADO' ? 'B135 (IQC) ➔ ' : ''}Estoque Livre`,
        centroCodigo,
        depCodigo: 'TEMP'
      };

    case 'IQC':
      if (origem === 'NACIONAL') {
        return {
          status: 'warn',
          badgeText: 'Exclusivo Importados',
          headline: 'O Depósito B135 (Inspeção IQC) aplica-se apenas a Centros IMPORTADOS (B124, B159, B180)!',
          explanation: 'Produtos Nacionais (B123, B158, B179) não passam por IQC de importação no B135. Para inspeção de avaria geral, utilize o B148.',
          centroCodigo,
          depCodigo: 'B148'
        };
      }
      return {
        status: 'ok',
        badgeText: 'Transitório • Qualidade IQC',
        headline: `Alocar no Centro ${centroCodigo} ➔ Depósito B135`,
        explanation: 'Depósito transitório para análise de importação IQC (Incoming Quality Control). Após liberação técnica, segue para o Estoque Livre.',
        flow: `TEMP ➔ ${centroCodigo} / B135 (Laudo IQC) ➔ Estoque Livre`,
        centroCodigo,
        depCodigo: 'B135'
      };

    case 'DEVOLUCAO_ENTRADA':
      return {
        status: 'ok',
        badgeText: 'Transitório • Logística Reversa',
        headline: `Alocar no Centro ${centroCodigo} ➔ Depósito DEVT`,
        explanation: 'Depósito transitório utilizado para informar a chegada física da devolução na doca antes da triagem técnica do QA.',
        flow: `Chegada Devolução ➔ ${centroCodigo} / DEVT ➔ ${material === 'PECAS' && canal === 'POSVENDA' ? 'B422' : 'B148'} (Inspeção QA)`,
        centroCodigo,
        depCodigo: 'DEVT'
      };

    case 'QA_TRIAGEM':
      if (material === 'PECAS') {
        if (canal === 'POSVENDA') {
          return {
            status: 'ok',
            badgeText: 'Transitório • Triagem QA Peças',
            headline: `Alocar no Centro ${centroCodigo} ➔ Depósito B422`,
            explanation: 'Nos centros de Pós-Venda (B179 e B180), a inspeção de avarias/devolução de PEÇAS é realizada no depósito transitório B422.',
            flow: `DEVT ➔ ${centroCodigo} / B422 (Laudo QA) ➔ B412 (Livre) ou B136 (Sucata)`,
            centroCodigo,
            depCodigo: 'B422'
          };
        }
        return {
          status: 'warn',
          badgeText: 'Atenção • QA de Peças',
          headline: 'O depósito de QA específico para PEÇAS é o B422 (Centros B179 e B180)!',
          explanation: 'O depósito B148 é parametrizado para PRODUTOS, enquanto o B422 atende PEÇAS no Pós-Venda.',
          centroCodigo,
          depCodigo: 'B422 / B148'
        };
      }
      return {
        status: 'ok',
        badgeText: 'Transitório • Triagem QA Produtos',
        headline: `Alocar no Centro ${centroCodigo} ➔ Depósito B148`,
        explanation: 'Depósito transitório de Inspeção de Avarias e Devolução de PRODUTOS. O time de Qualidade (QA) laudará o item para definir o destino definitivo.',
        flow: `DEVT ➔ ${centroCodigo} / B148 ➔ Livre / B149 (Outlet) / B137 (Slow) / B125 (Garantia) / B136 (Sucata)`,
        centroCodigo,
        depCodigo: 'B148'
      };

    case 'RETRABALHO_30D':
      return {
        status: 'ok',
        badgeText: 'Transitório • SLA <= 30 Dias',
        headline: `Alocar no Centro ${centroCodigo} ➔ Depósito B140`,
        explanation: 'Depósito transitório para avaria de produto aguardando retrabalho com prazo máximo de permanência de 30 dias.',
        flow: `B135 / B148 ➔ ${centroCodigo} / B140 (Retrabalho <= 30d) ➔ Estoque Livre ou B149`,
        centroCodigo,
        depCodigo: 'B140'
      };

    case 'OUTLET':
      return {
        status: 'ok',
        badgeText: 'Definitivo • Outlet',
        headline: `Alocar no Centro ${centroCodigo} ➔ Depósito B149`,
        explanation: 'Depósito definitivo para produtos com avaria apenas na embalagem que já foram retrabalhados e estão prontos para venda Outlet.',
        flow: `DEVT ➔ B148 / B140 ➔ ${centroCodigo} / B149 (Venda Outlet)`,
        centroCodigo,
        depCodigo: 'B149'
      };

    case 'SLOW_MOVERS':
      return {
        status: 'ok',
        badgeText: 'Definitivo • Venda Especial',
        headline: `Alocar no Centro ${centroCodigo} ➔ Depósito B137`,
        explanation: 'Depósito definitivo para produtos avariados ou de baixo giro liberados para Venda Especial (Slow Movers).',
        flow: `B148 ➔ ${centroCodigo} / B137 (Venda Especial Slow Movers)`,
        centroCodigo,
        depCodigo: 'B137'
      };

    case 'GARANTIA_AVARIA':
      return {
        status: 'ok',
        badgeText: 'Definitivo • Devolução Garantia',
        headline: `Alocar no Centro ${centroCodigo} ➔ Depósito B125`,
        explanation: 'Depósito definitivo destinado a avarias de produto oriundas especificamente de processos de devolução de garantia.',
        flow: `DEVT ➔ B148 ➔ ${centroCodigo} / B125 (Definitivo Garantia)`,
        centroCodigo,
        depCodigo: 'B125'
      };

    case 'SUCATA':
      return {
        status: 'ok',
        badgeText: 'Definitivo • Sucata',
        headline: `Alocar no Centro ${centroCodigo} ➔ Depósito B136`,
        explanation: 'Depósito definitivo para avarias irreversíveis de Peças ou Produtos (Sucata), aguardando processo fiscal de descarte.',
        flow: `B148 / B422 ➔ ${centroCodigo} / B136 (Baixa / Sucateamento)`,
        centroCodigo,
        depCodigo: 'B136'
      };

    case 'EXTRAVIO':
      return {
        status: 'ok',
        badgeText: 'Definitivo • Sinistro Transporte',
        headline: `Alocar no Centro ${centroCodigo} ➔ Depósito B145`,
        explanation: 'Depósito definitivo para extravio de produto e faturamento do sinistro contra a transportadora.',
        flow: `Confirmação de Sinistro ➔ ${centroCodigo} / B145 ➔ Cobrança Transportadora`,
        centroCodigo,
        depCodigo: 'B145'
      };

    case 'INV_CONTAGEM': {
      const depInv = material === 'PECAS' ? 'B153' : 'B112';
      return {
        status: 'ok',
        badgeText: 'Transitório • Auditoria Inventário',
        headline: `Alocar no Centro ${centroCodigo} ➔ Depósito ${depInv}`,
        explanation: `Depósito transitório para bloqueio e recontagem de inventário de ${material === 'PECAS' ? 'PEÇAS (B153)' : 'PRODUTO ACABADO (B112)'}.`,
        flow: `Divergência Contagem ➔ ${centroCodigo} / ${depInv} ➔ Livre (se achado) ou ${material === 'PECAS' ? 'B152' : 'B111'} (Falta)`,
        centroCodigo,
        depCodigo: depInv
      };
    }

    case 'INV_FALTA': {
      const depFalta = material === 'PECAS' ? 'B152' : 'B111';
      return {
        status: 'ok',
        badgeText: 'Definitivo • Falta de Inventário',
        headline: `Alocar no Centro ${centroCodigo} ➔ Depósito ${depFalta}`,
        explanation: `Depósito definitivo para baixa de faltas confirmadas de inventário de ${material === 'PECAS' ? 'PEÇAS (B152)' : 'PRODUTO ACABADO (B111)'}.`,
        flow: `${material === 'PECAS' ? 'B153' : 'B112'} (Auditoria) ➔ ${centroCodigo} / ${depFalta} (Falta Confirmada)`,
        centroCodigo,
        depCodigo: depFalta
      };
    }
  }
}

// ============================================================================
// ABA 2: GESTÃO DE CENTROS (CD EXTREMA MG)
// ============================================================================
function renderCentrosView() {
  const { centros, depositos } = window.underStokStore.state;

  return `
    <div class="section-header">
      <div class="section-title-group">
        <h2>Centros de Distribuição — Extrema MG (${centros.length})</h2>
        <p>Compreenda a regra de expedição (FIFO vs LIFO), a origem (Nacional vs Importado) e todos os depósitos vinculados a cada Centro.</p>
      </div>
      <button class="btn btn-primary" onclick="openCentroModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Incluir Novo Centro
      </button>
    </div>

    <div class="cards-grid">
      ${centros.map(c => {
        const depsVinculados = depositos.filter(d => Array.isArray(d.centros) && d.centros.includes(c.codigo));
        const depsDef = depsVinculados.filter(d => d.tipo === 'Definitivo');
        const depsTrans = depsVinculados.filter(d => d.tipo === 'Transitório');

        return `
          <div class="entity-card" style="border-top: 3px solid ${c.cor || '#0ea5e9'};">
            <div>
              <div class="card-header-row">
                <div>
                  <span class="code-pill" style="border-color:${c.cor || '#38bdf8'};">${escapeHtml(c.codigo)}</span>
                  <div class="card-title">${escapeHtml(c.canalDetalhado || c.canal)}</div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.35rem;">
                  <span class="badge ${c.saida === 'FIFO' ? 'badge-fifo' : 'badge-lifo'}">Saída: ${escapeHtml(c.saida)}</span>
                  <span class="badge ${getParaBadgeClass(c.para)}">${escapeHtml(c.para)}</span>
                </div>
              </div>

              <p class="card-desc" style="margin-top:0.75rem;">${escapeHtml(c.definicao)}</p>

              ${c.dicaAprendizado ? `
                <div class="learning-tip-box" style="margin-top:0.85rem;">
                  <strong>💡 Visão do Especialista (Aprendizado Rápido)</strong>
                  ${escapeHtml(c.dicaAprendizado)}
                </div>
              ` : ''}

              <div style="margin-top:1rem;">
                <div style="font-size:0.73rem; font-weight:700; color:#34d399; text-transform:uppercase; margin-bottom:0.35rem;">
                  Depósitos Definitivos (${depsDef.length})
                </div>
                <div class="center-tags-wrap">
                  ${depsDef.map(d => `<span class="center-mini-tag" style="background:rgba(16,185,129,0.12); color:#34d399; border-color:rgba(16,185,129,0.3);" title="${escapeHtml(d.titulo)}: ${escapeHtml(d.definicao)}" onclick="openDepositoModal('${d.id}')">${d.codigo} (${d.titulo.split(' ')[0]})</span>`).join('') || '<span style="font-size:0.76rem; color:var(--text-muted);">Nenhum</span>'}
                </div>

                <div style="font-size:0.73rem; font-weight:700; color:#fbbf24; text-transform:uppercase; margin:0.75rem 0 0.35rem;">
                  Depósitos Transitórios (${depsTrans.length})
                </div>
                <div class="center-tags-wrap">
                  ${depsTrans.map(d => `<span class="center-mini-tag" style="background:rgba(245,158,11,0.12); color:#fbbf24; border-color:rgba(245,158,11,0.3);" title="${escapeHtml(d.titulo)}: ${escapeHtml(d.definicao)}" onclick="openDepositoModal('${d.id}')">${d.codigo}</span>`).join('') || '<span style="font-size:0.76rem; color:var(--text-muted);">Nenhum</span>'}
                </div>
              </div>
            </div>

            <div class="card-footer-actions">
              <span style="font-size:0.75rem; color:var(--text-muted);">Origem: <strong>${escapeHtml(c.origem)}</strong></span>
              <div style="display:flex; gap:0.4rem;">
                <button class="btn btn-sm btn-secondary" onclick="filterByCentroAndGo('${c.codigo}')">Filtrar Depósitos</button>
                <button class="btn btn-sm btn-secondary" onclick="openCentroModal('${c.id}')">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteCentro('${c.id}')">Excluir</button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ============================================================================
// ABA 3: GESTÃO DE DEPÓSITOS & QUADRO KANBAN (MOVIMENTAÇÃO DRAG & DROP)
// ============================================================================
function renderDepositosView() {
  const filtered = getFilteredDepositos();

  return `
    <div class="section-header">
      <div class="section-title-group">
        <h2>Gestão e Movimentação de Depósitos (${filtered.length})</h2>
        <p>Inclua novos depósitos, atualize regras ou use o modo <strong>Quadro Kanban</strong> para arrastar e movimentar depósitos entre categorias e tipos.</p>
      </div>
      <div style="display:flex; gap:0.55rem; flex-wrap:wrap;">
        <button class="btn ${AppState.depositosViewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}" onclick="setDepositosViewMode('cards')">
          Visão em Cards
        </button>
        <button class="btn ${AppState.depositosViewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}" onclick="setDepositosViewMode('kanban')">
          Quadro Kanban (Arrastar & Mover)
        </button>
        <button class="btn btn-emerald" onclick="openDepositoModal()">
          + Incluir Depósito
        </button>
      </div>
    </div>

    ${AppState.depositosViewMode === 'kanban' ? renderKanbanBoardHtml(filtered) : `
      <div class="cards-grid">
        ${filtered.map(dep => renderDepositoCardHtml(dep)).join('')}
      </div>
    `}
  `;
}

function renderDepositoCardHtml(dep) {
  return `
    <div class="entity-card">
      <div>
        <div class="card-header-row">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span class="code-pill">${escapeHtml(dep.codigo)}</span>
              <span class="badge ${dep.tipo === 'Definitivo' ? 'badge-definitivo' : 'badge-transitorio'}">${escapeHtml(dep.tipo)}</span>
            </div>
            <div class="card-title" style="margin-top:0.45rem;">${escapeHtml(dep.titulo)}</div>
          </div>
          <span class="badge ${getParaBadgeClass(dep.para)}">${escapeHtml(dep.para)}</span>
        </div>

        <div style="margin-top:0.5rem; font-size:0.75rem; font-weight:700; color:#38bdf8; text-transform:uppercase;">
          Categoria: ${escapeHtml(dep.categoria)} ${dep.sla ? `• SLA: ${escapeHtml(dep.sla)}` : ''}
        </div>

        <p class="card-desc" style="margin-top:0.55rem;">${escapeHtml(dep.definicao)}</p>

        ${dep.fluxoRecomendado ? `
          <div style="margin-top:0.65rem; font-size:0.78rem; padding:0.45rem 0.65rem; border-radius:8px; background:rgba(16,185,129,0.08); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
            <strong>Fluxo:</strong> ${escapeHtml(dep.fluxoRecomendado)}
          </div>
        ` : ''}

        ${dep.dicaAprendizado ? `
          <div class="learning-tip-box" style="margin-top:0.75rem;">
            <strong>💡 Como memorizar</strong>
            ${escapeHtml(dep.dicaAprendizado)}
          </div>
        ` : ''}

        <div style="margin-top:0.9rem;">
          <div style="font-size:0.72rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.35rem;">
            Centros Habilitados (${Array.isArray(dep.centros) ? dep.centros.length : 0}):
          </div>
          <div class="center-tags-wrap">
            ${(dep.centros || []).map(cCod => `
              <span class="center-mini-tag" onclick="setFilter('filterCentro', '${cCod}')">${cCod}</span>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="card-footer-actions">
        <button class="btn btn-sm btn-secondary" onclick="quickToggleDepTipo('${dep.id}')" title="Alternar entre Transitório e Definitivo">
          Mover p/ ${dep.tipo === 'Definitivo' ? 'Transitório' : 'Definitivo'} ⇄
        </button>
        <div style="display:flex; gap:0.4rem;">
          <button class="btn btn-sm btn-secondary" onclick="openDepositoModal('${dep.id}')">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="confirmDeleteDeposito('${dep.id}')">Excluir</button>
        </div>
      </div>
    </div>
  `;
}

function renderKanbanBoardHtml(depositosList) {
  const columns = [
    { key: 'Estoque Livre', title: 'Estoque Livre & Blue Service', color: '#10b981' },
    { key: 'Recebimento & Devolução', title: 'Recebimento & Devolução (TEMP/DEVT)', color: '#0ea5e9' },
    { key: 'Inspeção & Qualidade (QA/IQC)', title: 'Inspeção QA & Importação IQC', color: '#6366f1' },
    { key: 'Avarias & Retrabalho', title: 'Avarias, Retrabalho, Outlet & Sucata', color: '#f59e0b' },
    { key: 'Inventário & Acuracidade', title: 'Inventário & Extravio (B145)', color: '#a855f7' }
  ];

  return `
    <div style="margin-bottom:1rem; padding:0.85rem 1.1rem; border-radius:12px; background:rgba(14,165,233,0.1); border:1px solid rgba(56,189,248,0.3); font-size:0.84rem;">
      <strong>🖐️ Modo Movimentação Interativa (Drag & Drop):</strong> Arraste qualquer cartão de depósito de uma coluna para outra para reclassificar sua categoria, ou clique em <em>Alternar Tipo</em> no cartão!
    </div>
    <div class="kanban-board">
      ${columns.map(col => {
        const items = depositosList.filter(d => {
          if (col.key === 'Estoque Livre') return d.categoria.includes('Estoque Livre');
          if (col.key === 'Inventário & Acuracidade') return d.categoria.includes('Inventário') || d.categoria.includes('Extravio');
          return d.categoria === col.key;
        });

        return `
          <div class="kanban-column" data-kanban-cat="${col.key}">
            <div class="kanban-col-header">
              <span style="font-weight:800; font-size:0.9rem; color:${col.color};">${col.title}</span>
              <span class="badge badge-fifo">${items.length}</span>
            </div>
            <div class="kanban-items-list">
              ${items.map(item => `
                <div class="kanban-item" draggable="true" data-dep-id="${item.id}">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
                    <span class="code-pill" style="font-size:0.88rem; padding:0.18rem 0.5rem;">${escapeHtml(item.codigo)}</span>
                    <span class="badge ${item.tipo === 'Definitivo' ? 'badge-definitivo' : 'badge-transitorio'}" style="cursor:pointer;" onclick="quickToggleDepTipo('${item.id}')">${item.tipo} ⇄</span>
                  </div>
                  <div style="font-weight:700; font-size:0.88rem; margin-bottom:0.25rem;">${escapeHtml(item.titulo)}</div>
                  <p style="font-size:0.76rem; color:var(--text-secondary); margin-bottom:0.5rem;">${escapeHtml(item.definicao)}</p>
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="badge ${getParaBadgeClass(item.para)}">${escapeHtml(item.para)}</span>
                    <button class="btn btn-sm btn-secondary" onclick="openDepositoModal('${item.id}')">Editar</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function setupKanbanDragAndDrop() {
  const items = document.querySelectorAll('.kanban-item');
  const columns = document.querySelectorAll('.kanban-column');

  items.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.getAttribute('data-dep-id'));
    });
  });

  columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });
    col.addEventListener('dragleave', () => {
      col.classList.remove('drag-over');
    });
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const depId = e.dataTransfer.getData('text/plain');
      const targetCat = col.getAttribute('data-kanban-cat');
      if (depId && targetCat) {
        window.underStokStore.moveDeposito(depId, { novaCategoria: targetCat });
        showToast(`Depósito movimentado para "${targetCat}"!`, 'emerald');
      }
    });
  });
}

// ============================================================================
// ABA 4: FLUXOGRAMA LOGÍSTICO & SIMULADOR DE MOVIMENTAÇÃO SAP/WMS
// ============================================================================
function renderFluxosView() {
  const { centros, depositos, historico } = window.underStokStore.state;
  const fluxos = window.UNDERSTOK_DEFAULT_DATA.fluxosMacro;
  const movLogs = historico.filter(h => h.acao === 'TRANSFERENCIA_ESTOQUE' || h.acao === 'MOVIMENTAR').slice(0, 12);

  return `
    <div class="section-header">
      <div class="section-title-group">
        <h2>Mapa de Fluxos & Simulador de Movimentação entre Depósitos</h2>
        <p>Visualize o caminho completo das mercadorias em Extrema MG e registre/simule transferências com validação automática de regras.</p>
      </div>
    </div>

    <div class="wizard-box" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(14, 165, 233, 0.12) 100%); border-color: rgba(16, 185, 129, 0.35);">
      <h3 style="font-size:1.1rem; font-weight:800; margin-bottom:0.35rem;">🔄 Executar / Simular Movimentação de Estoque entre Depósitos</h3>
      <p style="font-size:0.83rem; color:var(--text-secondary);">Simule uma transferência sistêmica (ex: saída do <code>DEVT</code> para <code>B148</code>, ou de <code>B148</code> para <code>B149</code>) e valide se o Centro e o Tipo de Material permitem a operação.</p>

      <form onsubmit="handleExecutarMovimentacao(event)" style="margin-top:1rem;">
        <div class="wizard-grid">
          <div class="wizard-field">
            <label>Centro de Origem</label>
            <select id="simCentroOrigem" class="form-control" required>
              ${centros.map(c => `<option value="${c.codigo}">${c.codigo} — ${c.canal} (${c.origem})</option>`).join('')}
            </select>
          </div>

          <div class="wizard-field">
            <label>Depósito de Origem</label>
            <select id="simDepOrigem" class="form-control" required>
              ${depositos.map(d => `<option value="${d.codigo}" ${d.codigo === 'DEVT' ? 'selected' : ''}>${d.codigo} — ${d.titulo} (${d.tipo})</option>`).join('')}
            </select>
          </div>

          <div class="wizard-field">
            <label>Centro de Destino</label>
            <select id="simCentroDestino" class="form-control" required>
              ${centros.map(c => `<option value="${c.codigo}">${c.codigo} — ${c.canal} (${c.origem})</option>`).join('')}
            </select>
          </div>

          <div class="wizard-field">
            <label>Depósito de Destino</label>
            <select id="simDepDestino" class="form-control" required>
              ${depositos.map(d => `<option value="${d.codigo}" ${d.codigo === 'B148' ? 'selected' : ''}>${d.codigo} — ${d.titulo} (${d.tipo})</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="wizard-grid" style="margin-top:0.85rem;">
          <div class="wizard-field">
            <label>Tipo de Material</label>
            <select id="simMaterial" class="form-control">
              <option value="PRODUTO">PRODUTO ACABADO</option>
              <option value="PEÇAS">PEÇAS</option>
            </select>
          </div>
          <div class="wizard-field">
            <label>Quantidade</label>
            <input type="number" id="simQtd" class="form-control" value="10" min="1" required />
          </div>
          <div class="wizard-field">
            <label>NF / Documento / Lote</label>
            <input type="text" id="simDoc" class="form-control" placeholder="Ex: NF 45892 / Lote QA" />
          </div>
          <div class="wizard-field">
            <label>Observação / Motivo da Movimentação</label>
            <input type="text" id="simMotivo" class="form-control" placeholder="Ex: Triagem de devolução aprovada p/ Outlet" />
          </div>
        </div>

        <div style="margin-top:1rem; display:flex; justify-content:flex-end;">
          <button type="submit" class="btn btn-emerald">Validar & Registrar Movimentação</button>
        </div>
      </form>
      <div id="simValidationOutput" style="margin-top:0.85rem;"></div>
    </div>

    <div class="flow-track">
      ${fluxos.map(flx => `
        <div class="flow-card" style="border-left: 4px solid ${flx.cor};">
          <h3 style="font-size:1.08rem; font-weight:800;">${escapeHtml(flx.titulo)}</h3>
          <p style="font-size:0.82rem; color:var(--text-secondary);">${escapeHtml(flx.subtitulo)}</p>
          <div class="flow-steps-row">
            ${flx.etapas.map((et, idx) => `
              <div class="flow-step-node">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.45rem;">
                  <span class="code-pill" style="font-size:0.82rem; padding:0.2rem 0.55rem;">${escapeHtml(et.codigo)}</span>
                  <span class="badge ${et.tipo === 'Definitivo' ? 'badge-definitivo' : 'badge-transitorio'}">${et.tipo}</span>
                </div>
                <div style="font-weight:700; font-size:0.9rem; margin-bottom:0.25rem;">Etapa ${idx + 1}: ${escapeHtml(et.nome)}</div>
                <p style="font-size:0.78rem; color:var(--text-secondary);">${escapeHtml(et.desc)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="matrix-container">
      <div style="padding:1rem 1.25rem; border-bottom:1px solid var(--border-color);">
        <h3 style="font-size:1rem; font-weight:800;">Histórico Recente de Transferências e Movimentações</h3>
      </div>
      <div class="matrix-scroll">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Colaborador</th>
              <th>Ação</th>
              <th>Item / Ref</th>
              <th>Origem</th>
              <th>Destino</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            ${movLogs.length > 0 ? movLogs.map(l => `
              <tr>
                <td style="white-space:nowrap;">${formatDateBr(l.timestamp)}</td>
                <td><strong>${escapeHtml(l.usuario)}</strong></td>
                <td><span class="badge badge-fifo">${escapeHtml(l.acao)}</span></td>
                <td>${escapeHtml(l.codigoRef)}</td>
                <td><code>${escapeHtml(l.origem)}</code></td>
                <td><code>${escapeHtml(l.destino)}</code></td>
                <td>${escapeHtml(l.detalhes)}</td>
              </tr>
            `).join('') : `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Nenhuma movimentação registrada ainda.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function handleExecutarMovimentacao(e) {
  e.preventDefault();
  const centroOrigem = document.getElementById('simCentroOrigem').value;
  const depOrigem = document.getElementById('simDepOrigem').value;
  const centroDestino = document.getElementById('simCentroDestino').value;
  const depDestino = document.getElementById('simDepDestino').value;
  const tipoMaterial = document.getElementById('simMaterial').value;
  const quantidade = document.getElementById('simQtd').value;
  const documento = document.getElementById('simDoc').value;
  const motivo = document.getElementById('simMotivo').value;

  const { depositos } = window.underStokStore.state;
  const dOrigObj = depositos.find(d => d.codigo === depOrigem);
  const dDestObj = depositos.find(d => d.codigo === depDestino);

  const alerts = [];
  if (dOrigObj && !dOrigObj.centros.includes(centroOrigem)) {
    alerts.push(`⚠️ O depósito de origem <strong>${depOrigem}</strong> não está vinculado originalmente ao centro <strong>${centroOrigem}</strong>.`);
  }
  if (dDestObj && !dDestObj.centros.includes(centroDestino)) {
    alerts.push(`⚠️ O depósito de destino <strong>${depDestino}</strong> não está vinculado ao centro <strong>${centroDestino}</strong> (Centros válidos p/ ${depDestino}: ${dDestObj.centros.join(', ')}).`);
  }
  if (dDestObj && !dDestObj.para.includes(tipoMaterial.slice(0, 4))) {
    alerts.push(`⚠️ Atenção de Material: O depósito <strong>${depDestino}</strong> é destinado a <strong>${dDestObj.para}</strong>, e você selecionou <strong>${tipoMaterial}</strong>.`);
  }

  window.underStokStore.registrarMovimentacaoOperacional({
    centroOrigem,
    depOrigem,
    centroDestino,
    depDestino,
    tipoMaterial,
    quantidade,
    documento,
    motivo
  });

  const out = document.getElementById('simValidationOutput');
  if (out) {
    if (alerts.length > 0) {
      out.innerHTML = `
        <div style="padding:0.9rem; border-radius:12px; background:rgba(245,158,11,0.14); border:1px solid rgba(245,158,11,0.4); color:#fbbf24; font-size:0.84rem;">
          <strong>Movimentação registrada com alertas pedagógicos:</strong><br>
          ${alerts.join('<br>')}
        </div>
      `;
    } else {
      out.innerHTML = `
        <div style="padding:0.9rem; border-radius:12px; background:rgba(16,185,129,0.14); border:1px solid rgba(16,185,129,0.4); color:#34d399; font-size:0.84rem;">
          ✅ <strong>Movimentação 100% compatível com a matriz de Extrema MG!</strong> Transferência de <strong>${centroOrigem}/${depOrigem}</strong> para <strong>${centroDestino}/${depDestino}</strong> gravada no histórico.
        </div>
      `;
    }
  }
  showToast('Movimentação registrada no histórico!', 'emerald');
}

// ============================================================================
// ABA 5: ACADEMIA DE ONBOARDING, GLOSSÁRIO & QUIZ DE TREINAMENTO
// ============================================================================
function renderAcademiaView() {
  const { glossario } = window.underStokStore.state;
  const questions = window.UNDERSTOK_DEFAULT_DATA.quizQuestions;

  return `
    <div class="section-header">
      <div class="section-title-group">
        <h2>🎓 Academia de Onboarding — Aprendizado Rápido Extrema MG</h2>
        <p>Trilha estruturada para que novos integrantes e operadores dominem rapidamente a lógica por trás dos Centros e Depósitos.</p>
      </div>
      <button class="btn btn-primary" onclick="openGlossarioModal()">+ Adicionar Conceito ao Glossário</button>
    </div>

    <div class="wizard-box" style="margin-bottom:1.75rem;">
      <h3 style="font-size:1.12rem; font-weight:800; margin-bottom:0.75rem;">🚀 Guia de Bolso: As 5 Regras de Ouro do Estoque Extrema MG</h3>
      <div class="cards-grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
        <div class="flow-step-node">
          <span class="badge badge-fifo">Regra #1 • Pares de Centros</span>
          <h4 style="margin:0.45rem 0 0.25rem;">Nacional vs. Importado</h4>
          <p style="font-size:0.8rem; color:var(--text-secondary);">
            Os centros funcionam em duplas por canal:<br>
            • <strong>E-Commerce:</strong> B123 (Nacional) e B124 (Importado)<br>
            • <strong>Lojas Midea:</strong> B158 (Nacional) e B159 (Importado)<br>
            • <strong>Pós-Venda:</strong> B179 (Nacional) e B180 (Importado)
          </p>
        </div>

        <div class="flow-step-node">
          <span class="badge badge-lifo">Regra #2 • FIFO vs. LIFO</span>
          <h4 style="margin:0.45rem 0 0.25rem;">Quem sai primeiro?</h4>
          <p style="font-size:0.8rem; color:var(--text-secondary);">
            Quase todos os centros operam em <strong>FIFO</strong> (Primeiro que Entra, Primeiro que Sai). A única exceção são as <strong>Lojas Midea (B158 e B159)</strong>, que operam em <strong>LIFO</strong>.
          </p>
        </div>

        <div class="flow-step-node">
          <span class="badge badge-definitivo">Regra #3 • Onde fica o Estoque Livre?</span>
          <h4 style="margin:0.45rem 0 0.25rem;">Cada canal tem seu depósito livre</h4>
          <p style="font-size:0.8rem; color:var(--text-secondary);">
            • <strong>E-Commerce:</strong> B110 (Produtos)<br>
            • <strong>Lojas Midea:</strong> B114 (Produtos), B130 (Peças) e B416 (Peças Blue Service)<br>
            • <strong>Pós-Venda:</strong> B413 (Produtos) e B412 (Peças)
          </p>
        </div>

        <div class="flow-step-node">
          <span class="badge badge-transitorio">Regra #4 • Qualidade (IQC & QA)</span>
          <h4 style="margin:0.45rem 0 0.25rem;">B135, B148 e B422</h4>
          <p style="font-size:0.8rem; color:var(--text-secondary);">
            • <strong>B135 (IQC):</strong> Só existe nos centros Importados (B124, B159, B180).<br>
            • <strong>B148 (QA Produto):</strong> Triagem de avaria/devolução de produtos.<br>
            • <strong>B422 (QA Peças):</strong> Triagem de peças no Pós-Venda (B179/B180).
          </p>
        </div>
      </div>
    </div>

    <div class="matrix-container" style="padding:1.5rem; margin-bottom:1.75rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
        <div>
          <h3 style="font-size:1.12rem; font-weight:800;">🎯 Simulador Prático & Quiz de Treinamento da Equipe</h3>
          <p style="font-size:0.82rem; color:var(--text-secondary);">Teste seus conhecimentos em situações reais do dia a dia de Extrema MG.</p>
        </div>
        <button class="btn btn-sm btn-secondary" onclick="resetQuiz()">Reiniciar Quiz</button>
      </div>

      <div class="cards-grid">
        ${questions.map((q, qIdx) => {
          const userAns = AppState.quizState.answered[q.id];
          return `
            <div class="entity-card">
              <div>
                <span class="badge badge-fifo">Caso Prático #${qIdx + 1}</span>
                <div style="font-weight:700; font-size:0.94rem; margin:0.6rem 0 0.9rem;">${escapeHtml(q.pergunta)}</div>
                <div style="display:flex; flex-direction:column; gap:0.5rem;">
                  ${q.opcoes.map((op, oIdx) => {
                    let btnStyle = 'justify-content:flex-start; text-align:left;';
                    if (userAns !== undefined) {
                      if (op.correta) {
                        btnStyle += 'border-color:#10b981; background:rgba(16,185,129,0.18); color:#34d399;';
                      } else if (userAns === oIdx && !op.correta) {
                        btnStyle += 'border-color:#f43f5e; background:rgba(244,63,94,0.18); color:#fb7185;';
                      }
                    }
                    return `
                      <button class="btn btn-secondary" style="${btnStyle}" onclick="answerQuiz('${q.id}', ${oIdx})">
                        ${escapeHtml(op.texto)}
                      </button>
                    `;
                  }).join('')}
                </div>
                ${userAns !== undefined ? `
                  <div class="learning-tip-box" style="margin-top:0.85rem;">
                    <strong>${q.opcoes[userAns].correta ? '✅ Resposta Correta!' : '❌ Explicação Técnica:'}</strong>
                    ${escapeHtml(q.opcoes[userAns].explicacao)}
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="section-header">
      <div class="section-title-group">
        <h2>Glossário Técnico de Estoque (${glossario.length} conceitos)</h2>
      </div>
    </div>
    <div class="cards-grid">
      ${glossario.map(g => `
        <div class="entity-card">
          <div>
            <span class="badge badge-produto">${escapeHtml(g.categoria)}</span>
            <h3 class="card-title" style="margin-top:0.45rem;">${escapeHtml(g.termo)}</h3>
            <p style="font-size:0.84rem; font-weight:600; color:#38bdf8; margin:0.35rem 0;">${escapeHtml(g.resumo)}</p>
            <p class="card-desc">${escapeHtml(g.explicacao)}</p>
            ${g.exemplo ? `
              <div class="learning-tip-box" style="margin-top:0.75rem;">
                <strong>Exemplo Prático no CD</strong>
                ${escapeHtml(g.exemplo)}
              </div>
            ` : ''}
          </div>
          <div class="card-footer-actions">
            <button class="btn btn-sm btn-secondary" onclick="openGlossarioModal('${g.id}')">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="window.underStokStore.deleteGlossario('${g.id}')">Excluir</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function answerQuiz(qId, optionIdx) {
  AppState.quizState.answered[qId] = optionIdx;
  renderMainView();
}

function resetQuiz() {
  AppState.quizState.answered = {};
  renderMainView();
}

// ============================================================================
// ABA 6: INTEGRAÇÃO GOOGLE SHEETS + APPS SCRIPT & AUDITORIA
// ============================================================================
function renderCloudView() {
  const { config, state } = window.underStokStore;

  return `
    <div class="section-header">
      <div class="section-title-group">
        <h2>☁️ Banco de Dados Gratuito em Nuvem (Google Planilhas + Apps Script)</h2>
        <p>Compartilhe o sistema em tempo real com seus gestores e todo o time sem nenhum custo de servidor ou licença.</p>
      </div>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="exportToJson()">Exportar Backup JSON</button>
        <button class="btn btn-secondary" onclick="exportToCsv()">Exportar Planilha CSV</button>
        <button class="btn btn-danger" onclick="confirmResetFactory()">Restaurar Base Original Extrema MG</button>
      </div>
    </div>

    <div class="cards-grid" style="grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));">
      <div class="entity-card">
        <div>
          <span class="badge badge-definitivo">Configuração da Equipe</span>
          <h3 class="card-title" style="margin-top:0.5rem;">Conectar ao Google Planilhas (Web App URL)</h3>
          <p class="card-desc" style="margin-top:0.35rem;">
            Ao conectar a URL do Google Apps Script, toda inclusão, exclusão, edição ou movimentação feita no app reflete automaticamente nas abas da Planilha Google compartilhada com a equipe!
          </p>

          <form onsubmit="handleSaveCloudConfig(event)" style="margin-top:1rem;">
            <div class="form-group">
              <label>Seu Nome / Identificação (Para o Histórico de Auditoria)</label>
              <input type="text" id="cfgUserName" class="form-control" value="${escapeHtml(config.userName || '')}" placeholder="Ex: Franc / Gestor Logístico" required />
            </div>

            <div class="form-group">
              <label>URL do App da Web (Google Apps Script)</label>
              <input type="url" id="cfgScriptUrl" class="form-control" value="${escapeHtml(config.scriptUrl || '')}" placeholder="https://script.google.com/macros/s/.../exec" />
            </div>

            <div class="form-group">
              <label class="checkbox-pill-label" style="text-transform:none;">
                <input type="checkbox" id="cfgAutoSync" ${config.autoSync ? 'checked' : ''} />
                Sincronizar automaticamente toda alteração com a planilha
              </label>
            </div>

            <div style="display:flex; gap:0.55rem; flex-wrap:wrap; margin-top:1rem;">
              <button type="submit" class="btn btn-primary">Salvar Configuração</button>
              <button type="button" class="btn btn-emerald" onclick="manualPullSync()">Sincronizar da Planilha (Pull)</button>
              <button type="button" class="btn btn-secondary" onclick="manualPushSync()">Enviar Base p/ Planilha (Push)</button>
            </div>
          </form>

          ${config.lastSyncAt ? `
            <div style="margin-top:1rem; font-size:0.78rem; color:#34d399;">
              ✓ Última sincronização: <strong>${formatDateBr(config.lastSyncAt)}</strong>
              ${config.spreadsheetUrl ? `• <a href="${escapeHtml(config.spreadsheetUrl)}" target="_blank" style="color:#38bdf8;">Abrir Planilha Google ↗</a>` : ''}
            </div>
          ` : ''}
        </div>
      </div>

      <div class="entity-card">
        <div>
          <span class="badge badge-fifo">100% Gratuito • Sem Servidor Pago</span>
          <h3 class="card-title" style="margin-top:0.5rem;">Script Pronto (Code.gs) — Implantação em 2 Minutos</h3>
          <ol style="font-size:0.81rem; color:var(--text-secondary); padding-left:1.2rem; margin:0.65rem 0; line-height:1.65;">
            <li>Abra uma nova planilha no Google Sheets (<a href="https://sheets.new" target="_blank" style="color:#38bdf8;">sheets.new</a>).</li>
            <li>No menu superior, clique em <strong>Extensões ➔ Apps Script</strong>.</li>
            <li>Clique no botão abaixo <strong>Copiar Código Code.gs</strong> (ou copie de <code>backend/Code.gs</code>) e cole no editor do Apps Script.</li>
            <li>Clique em <strong>Implantar ➔ Nova implantação ➔ App da Web</strong>.</li>
            <li>Em <em>Quem pode acessar</em>, selecione <strong>Qualquer pessoa</strong> e copie a URL gerada.</li>
            <li>Cole a URL ao lado e clique em <strong>Enviar Base p/ Planilha (Push)</strong>: o script criará e formatará todas as abas sozinho!</li>
          </ol>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
            <span style="font-size:0.74rem; font-weight:700; color:#38bdf8;">ARQUIVO: backend/Code.gs</span>
            <button class="btn btn-sm btn-primary" onclick="copyAppsScriptCode()">Copiar Código Code.gs</button>
          </div>
          <pre class="code-block-pre" id="appsScriptCodePreview">${escapeHtml(getEmbeddedAppsScriptCode())}</pre>
        </div>
      </div>
    </div>

    <div class="matrix-container" style="margin-top:1.5rem;">
      <div style="padding:1rem 1.25rem; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h3 style="font-size:1rem; font-weight:800;">Log Completo de Auditoria do Sistema (${state.historico.length} registros)</h3>
          <p style="font-size:0.78rem; color:var(--text-secondary);">Rastreabilidade total de quem incluiu, alterou, excluiu ou movimentou informações.</p>
        </div>
      </div>
      <div class="matrix-scroll">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Usuário</th>
              <th>Operação</th>
              <th>Entidade</th>
              <th>Código</th>
              <th>De (Origem)</th>
              <th>Para (Destino)</th>
              <th>Descrição</th>
            </tr>
          </thead>
          <tbody>
            ${state.historico.map(h => `
              <tr>
                <td style="white-space:nowrap;">${formatDateBr(h.timestamp)}</td>
                <td><strong>${escapeHtml(h.usuario)}</strong></td>
                <td><span class="badge badge-fifo">${escapeHtml(h.acao)}</span></td>
                <td>${escapeHtml(h.entidade)}</td>
                <td><span class="code-pill" style="font-size:0.75rem; padding:0.15rem 0.45rem;">${escapeHtml(h.codigoRef)}</span></td>
                <td>${escapeHtml(h.origem)}</td>
                <td>${escapeHtml(h.destino)}</td>
                <td>${escapeHtml(h.detalhes)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================================================
// MODAIS DE INCLUSÃO / EDIÇÃO (CENTROS, DEPÓSITOS, GLOSSÁRIO, INSTALAÇÃO PWA)
// ============================================================================
function openCentroModal(centroId = null) {
  const { centros } = window.underStokStore.state;
  const existing = centroId ? centros.find(c => c.id === centroId) : null;

  const modalHtml = `
    <div class="modal-header">
      <h3>${existing ? `Editar Centro ${existing.codigo}` : 'Incluir Novo Centro Logístico'}</h3>
      <button class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>
    <form onsubmit="submitCentroModal(event, '${existing ? existing.id : ''}')">
      <div class="form-grid">
        <div class="form-group">
          <label>Código do Centro (Ex: B123, B190)</label>
          <input type="text" id="mdlCentroCodigo" class="form-control" value="${escapeHtml(existing ? existing.codigo : '')}" required placeholder="Ex: B185" />
        </div>
        <div class="form-group">
          <label>Regra de Saída (Expedição)</label>
          <select id="mdlCentroSaida" class="form-control">
            <option value="FIFO" ${existing && existing.saida === 'FIFO' ? 'selected' : ''}>FIFO (First In, First Out)</option>
            <option value="LIFO" ${existing && existing.saida === 'LIFO' ? 'selected' : ''}>LIFO (Last In, First Out)</option>
            <option value="FEFO" ${existing && existing.saida === 'FEFO' ? 'selected' : ''}>FEFO (First Expired, First Out)</option>
          </select>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Canal Macro</label>
          <input type="text" id="mdlCentroCanal" class="form-control" value="${escapeHtml(existing ? existing.canal : '')}" required placeholder="Ex: CD MG E-COMMERCE" />
        </div>
        <div class="form-group">
          <label>Nomenclatura Completa do Canal</label>
          <input type="text" id="mdlCentroCanalDet" class="form-control" value="${escapeHtml(existing ? existing.canalDetalhado : '')}" required placeholder="Ex: CD MG NACIONAL E-COMMERCE" />
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Origem dos Materiais</label>
          <select id="mdlCentroOrigem" class="form-control">
            <option value="Nacional" ${existing && existing.origem === 'Nacional' ? 'selected' : ''}>Nacional (Brasil)</option>
            <option value="Importado" ${existing && existing.origem === 'Importado' ? 'selected' : ''}>Importado (Internacional)</option>
            <option value="Virtual / Internacional" ${existing && existing.origem.includes('Virtual') ? 'selected' : ''}>Virtual / Transitório</option>
          </select>
        </div>
        <div class="form-group">
          <label>Destinado Para</label>
          <select id="mdlCentroPara" class="form-control">
            <option value="PRODUTOS" ${existing && existing.para === 'PRODUTOS' ? 'selected' : ''}>PRODUTOS</option>
            <option value="PEÇAS/PRODUTOS" ${existing && existing.para === 'PEÇAS/PRODUTOS' ? 'selected' : ''}>PEÇAS/PRODUTOS</option>
            <option value="PEÇAS" ${existing && existing.para === 'PEÇAS' ? 'selected' : ''}>PEÇAS</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Definição Oficial do Centro</label>
        <textarea id="mdlCentroDefinicao" class="form-control" rows="2" required>${escapeHtml(existing ? existing.definicao : '')}</textarea>
      </div>

      <div class="form-group">
        <label>Dica de Aprendizado Rápido (Para Novos Integrantes)</label>
        <textarea id="mdlCentroDica" class="form-control" rows="2">${escapeHtml(existing ? existing.dicaAprendizado || '' : '')}</textarea>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:0.6rem; margin-top:1rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar Centro</button>
      </div>
    </form>
  `;
  showModal(modalHtml);
}

function submitCentroModal(e, id) {
  e.preventDefault();
  window.underStokStore.upsertCentro({
    id: id || undefined,
    codigo: document.getElementById('mdlCentroCodigo').value,
    saida: document.getElementById('mdlCentroSaida').value,
    canal: document.getElementById('mdlCentroCanal').value,
    canalDetalhado: document.getElementById('mdlCentroCanalDet').value,
    origem: document.getElementById('mdlCentroOrigem').value,
    para: document.getElementById('mdlCentroPara').value,
    definicao: document.getElementById('mdlCentroDefinicao').value,
    dicaAprendizado: document.getElementById('mdlCentroDica').value
  });
  closeModal();
  showToast('Centro salvo com sucesso!', 'emerald');
}

function openDepositoModal(depId = null) {
  const { depositos, centros } = window.underStokStore.state;
  const existing = depId ? depositos.find(d => d.id === depId) : null;
  const linkedCentros = existing && Array.isArray(existing.centros) ? existing.centros : ['B123', 'B124'];

  const modalHtml = `
    <div class="modal-header">
      <h3>${existing ? `Editar Depósito ${existing.codigo}` : 'Incluir Novo Depósito Logístico'}</h3>
      <button class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>
    <form onsubmit="submitDepositoModal(event, '${existing ? existing.id : ''}')">
      <div class="form-grid">
        <div class="form-group">
          <label>Código do Depósito (Ex: B148, TEMP)</label>
          <input type="text" id="mdlDepCodigo" class="form-control" value="${escapeHtml(existing ? existing.codigo : '')}" required placeholder="Ex: B155" />
        </div>
        <div class="form-group">
          <label>Título / Nome Curto</label>
          <input type="text" id="mdlDepTitulo" class="form-control" value="${escapeHtml(existing ? existing.titulo : '')}" required placeholder="Ex: Inspeção de Avarias QA" />
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Natureza da Alocação</label>
          <select id="mdlDepTipo" class="form-control">
            <option value="Definitivo" ${existing && existing.tipo === 'Definitivo' ? 'selected' : ''}>Definitivo</option>
            <option value="Transitório" ${existing && existing.tipo === 'Transitório' ? 'selected' : ''}>Transitório</option>
          </select>
        </div>
        <div class="form-group">
          <label>Categoria Operacional</label>
          <select id="mdlDepCategoria" class="form-control">
            ${['Estoque Livre', 'Estoque Livre / Blue Service', 'Recebimento & Devolução', 'Inspeção & Qualidade (QA/IQC)', 'Avarias & Retrabalho', 'Extravio & Sinistro', 'Inventário & Acuracidade'].map(cat => `
              <option value="${cat}" ${existing && existing.categoria === cat ? 'selected' : ''}>${cat}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Destinado Para (Material)</label>
          <select id="mdlDepPara" class="form-control">
            <option value="PRODUTO" ${existing && existing.para === 'PRODUTO' ? 'selected' : ''}>PRODUTO</option>
            <option value="PEÇAS" ${existing && existing.para === 'PEÇAS' ? 'selected' : ''}>PEÇAS</option>
            <option value="PEÇAS/PRODUTO" ${existing && existing.para.includes('PEÇAS/PRODUTO') ? 'selected' : ''}>PEÇAS/PRODUTO</option>
          </select>
        </div>
        <div class="form-group">
          <label>Regra de SLA / Prazo</label>
          <input type="text" id="mdlDepSla" class="form-control" value="${escapeHtml(existing ? existing.sla || '' : '')}" placeholder="Ex: <= 30 Dias ou Disponibilidade Imediata" />
        </div>
      </div>

      <div class="form-group">
        <label>Centros Vinculados a este Depósito</label>
        <div class="checkbox-pills">
          ${centros.map(c => `
            <label class="checkbox-pill-label">
              <input type="checkbox" name="mdlDepCentros" value="${c.codigo}" ${linkedCentros.includes(c.codigo) ? 'checked' : ''} />
              ${c.codigo} (${c.canal.replace('CD MG ', '')})
            </label>
          `).join('')}
        </div>
      </div>

      <div class="form-group">
        <label>Definição Oficial (Conforme Matriz)</label>
        <textarea id="mdlDepDefinicao" class="form-control" rows="2" required>${escapeHtml(existing ? existing.definicao : '')}</textarea>
      </div>

      <div class="form-group">
        <label>Fluxo Recomendado (De ➔ Para)</label>
        <input type="text" id="mdlDepFluxo" class="form-control" value="${escapeHtml(existing ? existing.fluxoRecomendado || '' : '')}" placeholder="Ex: DEVT ➔ B148 ➔ B149" />
      </div>

      <div class="form-group">
        <label>Dica de Aprendizado (Explicação Didática para o Time)</label>
        <textarea id="mdlDepDica" class="form-control" rows="2">${escapeHtml(existing ? existing.dicaAprendizado || '' : '')}</textarea>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:0.6rem; margin-top:1rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar Depósito</button>
      </div>
    </form>
  `;
  showModal(modalHtml);
}

function submitDepositoModal(e, id) {
  e.preventDefault();
  const checkedCentros = Array.from(document.querySelectorAll('input[name="mdlDepCentros"]:checked')).map(el => el.value);
  if (checkedCentros.length === 0) {
    alert('Selecione pelo menos um Centro vinculado ao depósito.');
    return;
  }

  window.underStokStore.upsertDeposito({
    id: id || undefined,
    codigo: document.getElementById('mdlDepCodigo').value,
    titulo: document.getElementById('mdlDepTitulo').value,
    tipo: document.getElementById('mdlDepTipo').value,
    categoria: document.getElementById('mdlDepCategoria').value,
    para: document.getElementById('mdlDepPara').value,
    sla: document.getElementById('mdlDepSla').value,
    centros: checkedCentros,
    definicao: document.getElementById('mdlDepDefinicao').value,
    fluxoRecomendado: document.getElementById('mdlDepFluxo').value,
    dicaAprendizado: document.getElementById('mdlDepDica').value
  });
  closeModal();
  showToast('Depósito salvo e atualizado na matriz!', 'emerald');
}

function openGlossarioModal(gloId = null) {
  const { glossario } = window.underStokStore.state;
  const existing = gloId ? glossario.find(g => g.id === gloId) : null;

  const modalHtml = `
    <div class="modal-header">
      <h3>${existing ? 'Editar Conceito do Glossário' : 'Novo Conceito para Treinamento'}</h3>
      <button class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>
    <form onsubmit="submitGlossarioModal(event, '${existing ? existing.id : ''}')">
      <div class="form-group">
        <label>Termo / Sigla</label>
        <input type="text" id="mdlGloTermo" class="form-control" value="${escapeHtml(existing ? existing.termo : '')}" required placeholder="Ex: FEFO, Cross-Docking, Putaway..." />
      </div>
      <div class="form-group">
        <label>Categoria</label>
        <input type="text" id="mdlGloCat" class="form-control" value="${escapeHtml(existing ? existing.categoria : 'Operação Logística')}" required />
      </div>
      <div class="form-group">
        <label>Resumo Rápido (1 Linha)</label>
        <input type="text" id="mdlGloResumo" class="form-control" value="${escapeHtml(existing ? existing.resumo : '')}" required />
      </div>
      <div class="form-group">
        <label>Explicação Detalhada</label>
        <textarea id="mdlGloExp" class="form-control" rows="3" required>${escapeHtml(existing ? existing.explicacao : '')}</textarea>
      </div>
      <div class="form-group">
        <label>Exemplo Prático no CD Extrema MG</label>
        <textarea id="mdlGloEx" class="form-control" rows="2">${escapeHtml(existing ? existing.exemplo || '' : '')}</textarea>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:0.6rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar no Glossário</button>
      </div>
    </form>
  `;
  showModal(modalHtml);
}

function submitGlossarioModal(e, id) {
  e.preventDefault();
  window.underStokStore.upsertGlossario({
    id: id || undefined,
    termo: document.getElementById('mdlGloTermo').value,
    categoria: document.getElementById('mdlGloCat').value,
    resumo: document.getElementById('mdlGloResumo').value,
    explicacao: document.getElementById('mdlGloExp').value,
    exemplo: document.getElementById('mdlGloEx').value
  });
  closeModal();
  showToast('Conceito salvo na Academia!', 'emerald');
}

function openInstallInstructionsModal() {
  const modalHtml = `
    <div class="modal-header">
      <h3>📲 Instalar Aplicativo no Android, iOS (iPhone/iPad) ou PC</h3>
      <button class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>
    <div style="display:flex; flex-direction:column; gap:1rem; font-size:0.88rem;">
      <div class="flow-step-node">
        <span class="badge badge-definitivo">Android (Chrome / Edge / Samsung Internet)</span>
        <p style="margin-top:0.4rem; color:var(--text-secondary);">
          1. Toque no menu de <strong>3 pontos (⋮)</strong> no canto superior direito do navegador.<br>
          2. Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.<br>
          3. O ícone do <strong>UnderStok</strong> será criado na sua gaveta de apps funcionando em tela cheia, inclusive offline!
        </p>
      </div>
      <div class="flow-step-node">
        <span class="badge badge-fifo">iOS — iPhone & iPad (Safari / Chrome)</span>
        <p style="margin-top:0.4rem; color:var(--text-secondary);">
          1. Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima ⬆️ na barra inferior).<br>
          2. Role a lista e toque em <strong>"Adicionar à Tela de Início"</strong>.<br>
          3. Confirme em <strong>Adicionar</strong> no canto superior direito.
        </p>
      </div>
      <div class="flow-step-node">
        <span class="badge badge-produto">Computador (Windows / Mac)</span>
        <p style="margin-top:0.4rem; color:var(--text-secondary);">
          Clique no ícone de instalação (computador com seta ⬇️) localizado no lado direito da barra de endereços do Chrome ou Edge.
        </p>
      </div>
    </div>
  `;
  showModal(modalHtml);
}

// ============================================================================
// AÇÕES RÁPIDAS, FILTROS E EXPORTAÇÕES
// ============================================================================
function getFilteredDepositos() {
  const { depositos } = window.underStokStore.state;
  const q = AppState.searchQuery.trim().toLowerCase();

  return depositos.filter(d => {
    if (AppState.filterCentro !== 'ALL' && (!Array.isArray(d.centros) || !d.centros.includes(AppState.filterCentro))) {
      return false;
    }
    if (AppState.filterTipo !== 'ALL' && d.tipo !== AppState.filterTipo) {
      return false;
    }
    if (AppState.filterPara !== 'ALL' && !d.para.toUpperCase().includes(AppState.filterPara)) {
      return false;
    }
    if (AppState.filterCategoria !== 'ALL' && !d.categoria.includes(AppState.filterCategoria)) {
      return false;
    }
    if (q) {
      const hay = `${d.codigo} ${d.titulo} ${d.categoria} ${d.tipo} ${d.definicao} ${d.para} ${(d.centros || []).join(' ')} ${d.dicaAprendizado || ''}`.toLowerCase();
      return hay.includes(q);
    }
    return true;
  });
}

function handleSearchInput(val) {
  AppState.searchQuery = val;
  renderMainView();
  const input = document.querySelector('.search-input');
  if (input) {
    input.focus();
    input.setSelectionRange(val.length, val.length);
  }
}

function setFilter(key, val) {
  AppState[key] = val;
  renderMainView();
}

function clearAllFilters() {
  AppState.searchQuery = '';
  AppState.filterCentro = 'ALL';
  AppState.filterTipo = 'ALL';
  AppState.filterPara = 'ALL';
  AppState.filterCategoria = 'ALL';
  renderMainView();
}

function filterByCentroAndGo(centroCodigo) {
  AppState.filterCentro = centroCodigo;
  switchTab('dashboard');
  showToast(`Filtrando depósitos do Centro ${centroCodigo}`, 'cyan');
}

function setDepositosViewMode(mode) {
  AppState.depositosViewMode = mode;
  renderMainView();
}

function toggleMatrixLink(depId, centroCodigo) {
  window.underStokStore.moveDeposito(depId, { toggleCentro: centroCodigo });
  showToast(`Vínculo com Centro ${centroCodigo} atualizado!`, 'cyan');
}

function quickToggleDepTipo(depId) {
  const dep = window.underStokStore.state.depositos.find(d => d.id === depId);
  if (!dep) return;
  const novoTipo = dep.tipo === 'Definitivo' ? 'Transitório' : 'Definitivo';
  window.underStokStore.moveDeposito(depId, { novoTipo });
  showToast(`Depósito ${dep.codigo} movido para ${novoTipo}!`, 'emerald');
}

function confirmDeleteCentro(id) {
  if (confirm('Deseja realmente excluir este Centro e remover seus vínculos nos depósitos?')) {
    window.underStokStore.deleteCentro(id);
    showToast('Centro excluído.', 'rose');
  }
}

function confirmDeleteDeposito(id) {
  if (confirm('Deseja realmente excluir este Depósito da matriz?')) {
    window.underStokStore.deleteDeposito(id);
    showToast('Depósito excluído.', 'rose');
  }
}

function confirmResetFactory() {
  if (confirm('Tem certeza que deseja restaurar os 7 Centros e 21 Depósitos originais da planilha Extrema MG?')) {
    window.underStokStore.resetToFactoryDefault();
    showToast('Base original Extrema MG restaurada!', 'emerald');
  }
}

async function handleSaveCloudConfig(e) {
  e.preventDefault();
  const userName = document.getElementById('cfgUserName').value.trim();
  const scriptUrl = document.getElementById('cfgScriptUrl').value.trim();
  const autoSync = document.getElementById('cfgAutoSync').checked;

  window.underStokStore.saveConfig({ userName, scriptUrl, autoSync });
  showToast('Configuração salva!', 'emerald');

  if (scriptUrl) {
    await manualPullSync();
  }
}

async function manualPullSync() {
  try {
    const res = await window.underStokStore.pullFromGoogleSheets();
    if (res.seeded) {
      showToast('Planilha nova detectada: Abas criadas e populadas automaticamente!', 'emerald');
    } else {
      showToast('Dados sincronizados da Planilha Google com sucesso!', 'emerald');
    }
  } catch (err) {
    alert('Não foi possível conectar ao Google Apps Script: ' + err.message);
  }
}

async function manualPushSync() {
  try {
    await window.underStokStore.pushToGoogleSheets({
      id: 'LOG-PUSH-' + Date.now(),
      timestamp: new Date().toISOString(),
      usuario: window.underStokStore.config.userName,
      acao: 'SYNC_MANUAL',
      entidade: 'BASE COMPLETA',
      codigoRef: 'Push Manual',
      origem: 'App UnderStok',
      destino: 'Google Sheets',
      detalhes: 'Envio completo de Centros, Depósitos e Glossário para a Planilha Google.'
    });
    showToast('Base enviada para a Planilha Google com sucesso!', 'emerald');
  } catch (err) {
    alert('Erro ao enviar para a planilha: ' + err.message);
  }
}

function exportToJson() {
  const dataStr = JSON.stringify(window.underStokStore.state, null, 2);
  downloadBlob(dataStr, `understok-extrema-mg-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  showToast('Arquivo JSON exportado!', 'cyan');
}

function exportToCsv() {
  const { centros, depositos } = window.underStokStore.state;
  const headers = ['CODIGO_DEPOSITO', 'TITULO', 'NATUREZA_TIPO', 'CATEGORIA', 'DESTINADO_PARA', 'DEFINICAO', ...centros.map(c => `CENTRO_${c.codigo}`)];
  const rows = depositos.map(d => [
    d.codigo,
    `"${(d.titulo || '').replace(/"/g, '""')}"`,
    d.tipo,
    `"${(d.categoria || '').replace(/"/g, '""')}"`,
    d.para,
    `"${(d.definicao || '').replace(/"/g, '""')}"`,
    ...centros.map(c => (d.centros && d.centros.includes(c.codigo) ? 'SIM' : 'NAO'))
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  downloadBlob(csvContent, `matriz-centros-depositos-extrema-mg.csv`, 'text/csv;charset=utf-8;');
  showToast('Planilha CSV exportada!', 'emerald');
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function copyAppsScriptCode() {
  const code = getEmbeddedAppsScriptCode();
  navigator.clipboard.writeText(code).then(() => {
    showToast('Código Code.gs copiado! Cole no Google Apps Script.', 'emerald');
  });
}

function showModal(innerHtml) {
  const backdrop = document.getElementById('globalModalBackdrop');
  const windowEl = document.getElementById('globalModalWindow');
  if (!backdrop || !windowEl) return;
  windowEl.innerHTML = innerHtml;
  backdrop.classList.add('open');
}

function closeModal() {
  const backdrop = document.getElementById('globalModalBackdrop');
  if (backdrop) backdrop.classList.remove('open');
}

function showToast(message, color = 'cyan') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast-msg';
  const borderMap = { cyan: '#0ea5e9', emerald: '#10b981', rose: '#f43f5e' };
  el.style.borderLeftColor = borderMap[color] || '#0ea5e9';
  el.innerHTML = `<span>${escapeHtml(message)}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 3600);
}

function getParaBadgeClass(para) {
  const p = String(para || '').toUpperCase();
  if (p.includes('PEÇAS') && p.includes('PRODUTO')) return 'badge-ambos';
  if (p.includes('PEÇAS')) return 'badge-pecas';
  return 'badge-produto';
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDateBr(iso) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch (e) {
    return iso;
  }
}

function getEmbeddedAppsScriptCode() {
  return `// Cole este código em Extensões > Apps Script na sua Planilha Google
const SHEET_NAMES = {
  CENTROS: 'Centros',
  DEPOSITOS: 'Depositos',
  HISTORICO: 'Historico_Movimentacoes',
  GLOSSARIO: 'Glossario_Treinamento'
};

function setupSheetsIfNeeded(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  let shCentros = ss.getSheetByName(SHEET_NAMES.CENTROS);
  if (!shCentros) {
    shCentros = ss.insertSheet(SHEET_NAMES.CENTROS);
    const h1 = ['id','codigo','saida','canal','canalDetalhado','origem','definicao','para','dicaAprendizado','cor','ordem','updatedAt'];
    shCentros.getRange(1,1,1,h1.length).setValues([h1]).setBackground('#0f172a').setFontColor('#38bdf8').setFontWeight('bold');
    shCentros.setFrozenRows(1);
  }
  let shDepositos = ss.getSheetByName(SHEET_NAMES.DEPOSITOS);
  if (!shDepositos) {
    shDepositos = ss.insertSheet(SHEET_NAMES.DEPOSITOS);
    const h2 = ['id','codigo','titulo','categoria','tipo','definicao','para','centros','canaisEspecificos','sla','fluxoRecomendado','dicaAprendizado','ordem','updatedAt'];
    shDepositos.getRange(1,1,1,h2.length).setValues([h2]).setBackground('#0f172a').setFontColor('#34d399').setFontWeight('bold');
    shDepositos.setFrozenRows(1);
  }
  let shHistorico = ss.getSheetByName(SHEET_NAMES.HISTORICO);
  if (!shHistorico) {
    shHistorico = ss.insertSheet(SHEET_NAMES.HISTORICO);
    const h3 = ['id','timestamp','usuario','acao','entidade','codigoRef','origem','destino','detalhes'];
    shHistorico.getRange(1,1,1,h3.length).setValues([h3]).setBackground('#1e1b4b').setFontColor('#f8fafc').setFontWeight('bold');
    shHistorico.setFrozenRows(1);
  }
  let shGlossario = ss.getSheetByName(SHEET_NAMES.GLOSSARIO);
  if (!shGlossario) {
    shGlossario = ss.insertSheet(SHEET_NAMES.GLOSSARIO);
    const h4 = ['id','termo','categoria','resumo','explicacao','exemplo'];
    shGlossario.getRange(1,1,1,h4.length).setValues([h4]).setBackground('#0f172a').setFontColor('#fbbf24').setFontWeight('bold');
    shGlossario.setFrozenRows(1);
  }
  return { shCentros, shDepositos, shHistorico, shGlossario };
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).filter(r => r[0] !== '').map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      if ((h === 'centros' || h === 'canaisEspecificos') && typeof val === 'string') {
        try { val = JSON.parse(val); } catch(e) { val = val.split(',').map(s => s.trim()).filter(Boolean); }
      }
      obj[h] = val;
    });
    return obj;
  });
}

function objectsToSheet(sheet, headers, items) {
  sheet.clearContents();
  sheet.getRange(1,1,1,headers.length).setValues([headers]);
  if (!items || !items.length) return;
  const rows = items.map(item => headers.map(h => {
    const v = item[h];
    return Array.isArray(v) || (typeof v === 'object' && v !== null) ? JSON.stringify(v) : (v ?? '');
  }));
  sheet.getRange(2,1,rows.length,headers.length).setValues(rows);
}

function appendHistoryLog(sh, log) {
  if (!log) return;
  sh.insertRowAfter(1);
  sh.getRange(2,1,1,9).setValues([[log.id||('LOG-'+Date.now()), log.timestamp||new Date().toISOString(), log.usuario||'Time', log.acao||'SYNC', log.entidade||'SIS', log.codigoRef||'-', log.origem||'-', log.destino||'-', log.detalhes||'']]);
}

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const { shCentros, shDepositos, shHistorico, shGlossario } = setupSheetsIfNeeded(ss);
  const centros = sheetToObjects(shCentros);
  const depositos = sheetToObjects(shDepositos);
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    spreadsheetName: ss.getName(),
    spreadsheetUrl: ss.getUrl(),
    isEmpty: centros.length === 0 && depositos.length === 0,
    data: { centros, depositos, historico: sheetToObjects(shHistorico).slice(0,150), glossario: sheetToObjects(shGlossario) }
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const { shCentros, shDepositos, shHistorico, shGlossario } = setupSheetsIfNeeded(ss);
    const body = JSON.parse(e.postData.contents);
    const h1 = ['id','codigo','saida','canal','canalDetalhado','origem','definicao','para','dicaAprendizado','cor','ordem','updatedAt'];
    const h2 = ['id','codigo','titulo','categoria','tipo','definicao','para','centros','canaisEspecificos','sla','fluxoRecomendado','dicaAprendizado','ordem','updatedAt'];
    const h4 = ['id','termo','categoria','resumo','explicacao','exemplo'];
    if (body.centros) objectsToSheet(shCentros, h1, body.centros);
    if (body.depositos) objectsToSheet(shDepositos, h2, body.depositos);
    if (body.glossario) objectsToSheet(shGlossario, h4, body.glossario);
    if (body.log) appendHistoryLog(shHistorico, body.log);
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', spreadsheetUrl: ss.getUrl() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;
}
