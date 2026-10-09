import { contextBridge, ipcRenderer } from 'electron';
import type { Configuracoes, DadosDeSave, PonteDoJogo } from '../src/shared/contratosDePersistencia';

/**
 * Preload executado em sandbox: só pode importar o módulo "electron".
 * Por isso os nomes dos canais são repetidos aqui (um teste garante que
 * coincidem com CANAIS_IPC). Apenas operações específicas do jogo são
 * expostas; o renderer nunca recebe acesso ao ipcRenderer ou ao Node.js.
 */
const ponte: PonteDoJogo = {
  progresso: {
    carregar: () => ipcRenderer.invoke('progresso:carregar'),
    salvar: (dados: DadosDeSave) => ipcRenderer.invoke('progresso:salvar', dados),
    limpar: () => ipcRenderer.invoke('progresso:limpar'),
  },
  configuracoes: {
    carregar: () => ipcRenderer.invoke('configuracoes:carregar'),
    salvar: (configuracoes: Configuracoes) => ipcRenderer.invoke('configuracoes:salvar', configuracoes),
  },
  aplicativo: {
    sair: () => ipcRenderer.send('aplicativo:sair'),
  },
};

contextBridge.exposeInMainWorld('rpg', Object.freeze(ponte));
