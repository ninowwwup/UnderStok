/**
 * ============================================================================
 * UNDERSTOK — MOTOR DE DADOS, PERSISTÊNCIA & INTEGRAÇÃO GOOGLE APPS SCRIPT
 * ============================================================================
 * Gerencia armazenamento local (Offline-First), sincronização em nuvem 100%
 * gratuita via Google Sheets Web App (Apps Script), auditoria de movimentações
 * e exportação/importação de dados para toda a equipe.
 */

class UnderStokStore {
  constructor() {
    this.STORAGE_KEY = 'understok_db_v2';
    this.CONFIG_KEY = 'understok_config_v2';
    this.state = this.loadLocalState();
    this.config = this.loadConfig();
    this.listeners = [];
    this.isSyncing = false;
  }

  loadConfig() {
    try {
      const raw = localStorage.getItem(this.CONFIG_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Erro ao ler configuração local:', e);
    }
    return {
      scriptUrl: '',
      userName: 'Especialista Logístico',
      autoSync: true,
      lastSyncAt: null,
      spreadsheetName: '',
      spreadsheetUrl: ''
    };
  }

  saveConfig(partialConfig) {
    this.config = { ...this.config, ...partialConfig };
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
    this.notify();
  }

  loadLocalState() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.centros) && Array.isArray(parsed.depositos)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar banco local, iniciando padrão:', e);
    }
    return this.getFreshDefaultState();
  }

  getFreshDefaultState() {
    const def = JSON.parse(JSON.stringify(window.UNDERSTOK_DEFAULT_DATA));
    return {
      centros: def.centros,
      depositos: def.depositos,
      glossario: def.glossario,
      historico: [
        {
          id: 'LOG-INIT',
          timestamp: new Date().toISOString(),
          usuario: 'Sistema UnderStok',
          acao: 'INICIALIZACAO',
          entidade: 'MATRIZ EXTREMA MG',
          codigoRef: '7 Centros / 21 Depósitos',
          origem: 'Planilha Oficial',
          destino: 'Base Ativa',
          detalhes: 'Base de conhecimento de Centros e Depósitos CD Extrema MG carregada com sucesso.'
        }
      ]
    };
  }

  saveLocalState() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    this.notify();
  }

  subscribe(fn) {
    this.listeners.push(fn);
  }

  notify() {
    this.listeners.forEach(fn => {
      try { fn(this.state, this.config, this.isSyncing); } catch (e) { console.error(e); }
    });
  }

  /**
   * Registra um evento na trilha de auditoria / histórico
   */
  addHistoryLog({ acao, entidade, codigoRef, origem = '-', destino = '-', detalhes = '' }) {
    const logItem = {
      id: 'LOG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      timestamp: new Date().toISOString(),
      usuario: this.config.userName || 'Colaborador Time',
      acao,
      entidade,
      codigoRef,
      origem,
      destino,
      detalhes
    };
    this.state.historico.unshift(logItem);
    if (this.state.historico.length > 200) {
      this.state.historico = this.state.historico.slice(0, 200);
    }
    this.saveLocalState();
    return logItem;
  }

  // ==========================================================================
  // CRUD DE CENTROS
  // ==========================================================================
  upsertCentro(centroData) {
    const now = new Date().toISOString();
    const codigoUpper = String(centroData.codigo || '').trim().toUpperCase();
    const existingIndex = this.state.centros.findIndex(c => c.id === centroData.id || c.codigo === codigoUpper);

    let logItem;
    if (existingIndex >= 0) {
      const prev = this.state.centros[existingIndex];
      const updated = {
        ...prev,
        ...centroData,
        codigo: codigoUpper,
        updatedAt: now
      };
      if (prev.codigo !== codigoUpper) {
        this.state.depositos.forEach(d => {
          if (Array.isArray(d.centros)) {
            d.centros = d.centros.map(c => c === prev.codigo ? codigoUpper : c);
          }
        });
      }
      this.state.centros[existingIndex] = updated;
      logItem = this.addHistoryLog({
        acao: 'ATUALIZAR',
        entidade: 'CENTRO',
        codigoRef: codigoUpper,
        origem: `${prev.saida} | ${prev.canal}`,
        destino: `${updated.saida} | ${updated.canal}`,
        detalhes: `Centro ${codigoUpper} atualizado: ${updated.definicao}`
      });
    } else {
      const novo = {
        id: 'CTR-' + codigoUpper + '-' + Date.now().toString().slice(-4),
        codigo: codigoUpper,
        saida: centroData.saida || 'FIFO',
        canal: centroData.canal || 'CD MG NOVO CANAL',
        canalDetalhado: centroData.canalDetalhado || centroData.canal || 'CD MG NOVO CANAL',
        origem: centroData.origem || 'Nacional',
        definicao: centroData.definicao || '',
        para: centroData.para || 'PRODUTOS',
        dicaAprendizado: centroData.dicaAprendizado || '',
        cor: centroData.cor || '#0ea5e9',
        ordem: this.state.centros.length + 1,
        updatedAt: now
      };
      this.state.centros.push(novo);
      logItem = this.addHistoryLog({
        acao: 'INCLUIR',
        entidade: 'CENTRO',
        codigoRef: codigoUpper,
        origem: 'Novo Registro',
        destino: novo.canal,
        detalhes: `Novo Centro ${codigoUpper} (${novo.saida} - ${novo.origem}) incluído no sistema.`
      });
    }

    this.saveLocalState();
    this.triggerCloudSync(logItem);
  }

  deleteCentro(idOrCodigo) {
    const idx = this.state.centros.findIndex(c => c.id === idOrCodigo || c.codigo === idOrCodigo);
    if (idx === -1) return false;
    const removed = this.state.centros[idx];
    this.state.centros.splice(idx, 1);

    this.state.depositos.forEach(d => {
      if (Array.isArray(d.centros)) {
        d.centros = d.centros.filter(c => c !== removed.codigo);
      }
    });

    const logItem = this.addHistoryLog({
      acao: 'EXCLUIR',
      entidade: 'CENTRO',
      codigoRef: removed.codigo,
      origem: removed.canal,
      destino: 'Removido',
      detalhes: `Centro ${removed.codigo} excluído e desvinculado dos depósitos.`
    });

    this.saveLocalState();
    this.triggerCloudSync(logItem);
    return true;
  }

  // ==========================================================================
  // CRUD & MOVIMENTAÇÃO DE DEPÓSITOS
  // ==========================================================================
  upsertDeposito(depData) {
    const now = new Date().toISOString();
    const codigoUpper = String(depData.codigo || '').trim().toUpperCase();
    const existingIndex = this.state.depositos.findIndex(d => d.id === depData.id);

    let logItem;
    if (existingIndex >= 0) {
      const prev = this.state.depositos[existingIndex];
      const updated = {
        ...prev,
        ...depData,
        codigo: codigoUpper,
        centros: Array.isArray(depData.centros) ? depData.centros : prev.centros,
        updatedAt: now
      };
      this.state.depositos[existingIndex] = updated;
      logItem = this.addHistoryLog({
        acao: 'ATUALIZAR',
        entidade: 'DEPOSITO',
        codigoRef: codigoUpper,
        origem: `${prev.tipo} (${prev.centros.join(', ')})`,
        destino: `${updated.tipo} (${updated.centros.join(', ')})`,
        detalhes: `Depósito ${codigoUpper} (${updated.titulo}) atualizado.`
      });
    } else {
      const novo = {
        id: 'DEP-' + codigoUpper + '-' + Date.now().toString().slice(-4),
        codigo: codigoUpper,
        titulo: depData.titulo || `Depósito ${codigoUpper}`,
        categoria: depData.categoria || 'Estoque Livre',
        tipo: depData.tipo || 'Definitivo',
        definicao: depData.definicao || '',
        para: depData.para || 'PRODUTO',
        centros: Array.isArray(depData.centros) ? depData.centros : ['B123'],
        canaisEspecificos: depData.canaisEspecificos || [],
        sla: depData.sla || 'Padrão Operacional',
        fluxoRecomendado: depData.fluxoRecomendado || '',
        dicaAprendizado: depData.dicaAprendizado || '',
        ordem: this.state.depositos.length + 1,
        updatedAt: now
      };
      this.state.depositos.push(novo);
      logItem = this.addHistoryLog({
        acao: 'INCLUIR',
        entidade: 'DEPOSITO',
        codigoRef: codigoUpper,
        origem: 'Novo Depósito',
        destino: `${novo.categoria} (${novo.tipo})`,
        detalhes: `Depósito ${codigoUpper} incluído com vínculo aos centros: ${novo.centros.join(', ')}.`
      });
    }

    this.saveLocalState();
    this.triggerCloudSync(logItem);
  }

  deleteDeposito(id) {
    const idx = this.state.depositos.findIndex(d => d.id === id || d.codigo === id);
    if (idx === -1) return false;
    const removed = this.state.depositos[idx];
    this.state.depositos.splice(idx, 1);

    const logItem = this.addHistoryLog({
      acao: 'EXCLUIR',
      entidade: 'DEPOSITO',
      codigoRef: removed.codigo,
      origem: removed.categoria,
      destino: 'Removido',
      detalhes: `Depósito ${removed.codigo} (${removed.titulo}) excluído do sistema.`
    });

    this.saveLocalState();
    this.triggerCloudSync(logItem);
    return true;
  }

  moveDeposito(depositoId, { novoTipo, novaCategoria, toggleCentro, novaOrdem }) {
    const dep = this.state.depositos.find(d => d.id === depositoId || d.codigo === depositoId);
    if (!dep) return false;

    const origemDesc = `${dep.categoria} | ${dep.tipo} | [${dep.centros.join(',')}]`;

    if (novoTipo && novoTipo !== dep.tipo) {
      dep.tipo = novoTipo;
    }
    if (novaCategoria && novaCategoria !== dep.categoria) {
      dep.categoria = novaCategoria;
    }
    if (toggleCentro) {
      const has = dep.centros.includes(toggleCentro);
      if (has) {
        dep.centros = dep.centros.filter(c => c !== toggleCentro);
      } else {
        dep.centros.push(toggleCentro);
      }
    }
    if (typeof novaOrdem === 'number') {
      dep.ordem = novaOrdem;
    }

    dep.updatedAt = new Date().toISOString();
    const destinoDesc = `${dep.categoria} | ${dep.tipo} | [${dep.centros.join(',')}]`;

    const logItem = this.addHistoryLog({
      acao: 'MOVIMENTAR',
      entidade: 'DEPOSITO',
      codigoRef: dep.codigo,
      origem: origemDesc,
      destino: destinoDesc,
      detalhes: `Movimentação estrutural do depósito ${dep.codigo} (${dep.titulo}).`
    });

    this.saveLocalState();
    this.triggerCloudSync(logItem);
    return true;
  }

  registrarMovimentacaoOperacional({ centroOrigem, depOrigem, centroDestino, depDestino, tipoMaterial, quantidade, documento, motivo }) {
    const logItem = this.addHistoryLog({
      acao: 'TRANSFERENCIA_ESTOQUE',
      entidade: tipoMaterial || 'PRODUTO',
      codigoRef: `${quantidade || 1} un. (${documento || 'S/Doc'})`,
      origem: `${centroOrigem} ➔ ${depOrigem}`,
      destino: `${centroDestino} ➔ ${depDestino}`,
      detalhes: motivo || `Transferência operacional entre depósitos (${centroOrigem}/${depOrigem} para ${centroDestino}/${depDestino}).`
    });

    if (this.config.scriptUrl && this.config.autoSync) {
      this.postToGoogleSheets({ action: 'logMovement', log: logItem });
    }
    return logItem;
  }

  upsertGlossario(item) {
    const idx = this.state.glossario.findIndex(g => g.id === item.id);
    if (idx >= 0) {
      this.state.glossario[idx] = { ...this.state.glossario[idx], ...item };
    } else {
      this.state.glossario.push({
        id: 'GLO-' + Date.now(),
        termo: item.termo,
        categoria: item.categoria || 'Conceito Logístico',
        resumo: item.resumo || '',
        explicacao: item.explicacao || '',
        exemplo: item.exemplo || ''
      });
    }
    const logItem = this.addHistoryLog({
      acao: idx >= 0 ? 'ATUALIZAR' : 'INCLUIR',
      entidade: 'GLOSSARIO',
      codigoRef: item.termo,
      origem: 'Base de Treinamento',
      destino: item.categoria,
      detalhes: `Termo "${item.termo}" salvo no glossário da equipe.`
    });
    this.saveLocalState();
    this.triggerCloudSync(logItem);
  }

  deleteGlossario(id) {
    const idx = this.state.glossario.findIndex(g => g.id === id);
    if (idx === -1) return;
    const removed = this.state.glossario[idx];
    this.state.glossario.splice(idx, 1);
    const logItem = this.addHistoryLog({
      acao: 'EXCLUIR',
      entidade: 'GLOSSARIO',
      codigoRef: removed.termo,
      origem: removed.categoria,
      destino: 'Removido',
      detalhes: `Termo "${removed.termo}" removido.`
    });
    this.saveLocalState();
    this.triggerCloudSync(logItem);
  }

  resetToFactoryDefault() {
    this.state = this.getFreshDefaultState();
    const logItem = this.addHistoryLog({
      acao: 'RESTAURAR_PADRAO',
      entidade: 'SISTEMA',
      codigoRef: 'MATRIZ EXTREMA MG',
      origem: 'Backup Original',
      destino: '7 Centros e 21 Depósitos',
      detalhes: 'Dados restaurados para a configuração original da planilha Extrema MG.'
    });
    this.saveLocalState();
    this.triggerCloudSync(logItem);
  }

  async triggerCloudSync(logItem = null) {
    if (!this.config.scriptUrl || !this.config.autoSync) return;
    await this.pushToGoogleSheets(logItem);
  }

  async pullFromGoogleSheets() {
    if (!this.config.scriptUrl) {
      throw new Error('Configure a URL do Web App do Google Apps Script primeiro.');
    }
    this.isSyncing = true;
    this.notify();

    try {
      const url = new URL(this.config.scriptUrl);
      url.searchParams.set('_t', Date.now());

      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow'
      });

      const result = await response.json();
      if (result.status !== 'ok') {
        throw new Error(result.message || 'Resposta inválida do Google Apps Script.');
      }

      if (result.isEmpty) {
        await this.pushToGoogleSheets({
          id: 'LOG-SEED-' + Date.now(),
          timestamp: new Date().toISOString(),
          usuario: this.config.userName,
          acao: 'SEED_INICIAL',
          entidade: 'PLANILHA GOOGLE',
          codigoRef: 'Extrema MG',
          origem: 'Web App UnderStok',
          destino: 'Google Sheets',
          detalhes: 'População automática inicial das abas Centros, Depositos e Glossario.'
        });
        return { seeded: true, spreadsheetName: result.spreadsheetName };
      }

      if (result.data) {
        if (Array.isArray(result.data.centros) && result.data.centros.length > 0) {
          this.state.centros = result.data.centros;
        }
        if (Array.isArray(result.data.depositos) && result.data.depositos.length > 0) {
          this.state.depositos = result.data.depositos;
        }
        if (Array.isArray(result.data.glossario) && result.data.glossario.length > 0) {
          this.state.glossario = result.data.glossario;
        }
        if (Array.isArray(result.data.historico) && result.data.historico.length > 0) {
          this.state.historico = result.data.historico;
        }
      }

      this.saveConfig({
        lastSyncAt: new Date().toISOString(),
        spreadsheetName: result.spreadsheetName || 'Planilha Conectada',
        spreadsheetUrl: result.spreadsheetUrl || ''
      });
      this.saveLocalState();
      return { seeded: false, spreadsheetName: result.spreadsheetName };
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  async pushToGoogleSheets(logItem = null) {
    if (!this.config.scriptUrl) return;
    this.isSyncing = true;
    this.notify();

    try {
      const payload = {
        action: 'syncAll',
        centros: this.state.centros,
        depositos: this.state.depositos,
        glossario: this.state.glossario,
        log: logItem
      };

      const result = await this.postToGoogleSheets(payload);
      if (result && result.status === 'ok') {
        this.saveConfig({
          lastSyncAt: new Date().toISOString(),
          spreadsheetUrl: result.spreadsheetUrl || this.config.spreadsheetUrl
        });
      }
      return result;
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  async postToGoogleSheets(payload) {
    const response = await fetch(this.config.scriptUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    return await response.json();
  }
}

window.underStokStore = new UnderStokStore();
