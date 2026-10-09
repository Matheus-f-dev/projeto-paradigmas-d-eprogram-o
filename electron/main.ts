import { app, BrowserWindow, ipcMain, session, type IpcMainInvokeEvent } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  CANAIS_IPC,
  validarConfiguracoes,
  validarDadosDeSave,
} from '../src/shared/contratosDePersistencia';

/**
 * Processo principal do Electron.
 *
 * Segurança: contextIsolation ligado, nodeIntegration desligado, sandbox
 * ligado, preload dedicado com uma API mínima, navegação externa bloqueada
 * e todos os dados recebidos do renderer validados antes de tocar o disco.
 */

const URL_DE_DESENVOLVIMENTO = process.env.VITE_DEV_SERVER_URL;
const INDEX_DE_PRODUCAO = path.join(__dirname, '..', '..', 'dist', 'index.html');
const TAMANHO_MAXIMO_DE_ARQUIVO = 256 * 1024;

const arquivoDeSave = () => path.join(app.getPath('userData'), 'jornada.json');
const arquivoDeConfiguracoes = () => path.join(app.getPath('userData'), 'configuracoes.json');

function origemPermitida(url: string): boolean {
  if (URL_DE_DESENVOLVIMENTO) return url.startsWith(URL_DE_DESENVOLVIMENTO);
  return url.startsWith(pathToFileURL(path.dirname(INDEX_DE_PRODUCAO)).href);
}

/** Garante que a chamada veio da página do jogo, e não de um frame estranho. */
function validarRemetente(evento: IpcMainInvokeEvent): boolean {
  const url = evento.senderFrame?.url ?? '';
  return origemPermitida(url);
}

async function lerJson(arquivo: string): Promise<unknown> {
  try {
    const estatisticas = await fs.stat(arquivo);
    if (estatisticas.size > TAMANHO_MAXIMO_DE_ARQUIVO) return null;
    return JSON.parse(await fs.readFile(arquivo, 'utf8'));
  } catch {
    return null;
  }
}

/** Escrita atômica: grava em um temporário e renomeia, evitando saves corrompidos. */
async function gravarJson(arquivo: string, dados: unknown): Promise<void> {
  await fs.mkdir(path.dirname(arquivo), { recursive: true });
  const temporario = `${arquivo}.${process.pid}.tmp`;
  await fs.writeFile(temporario, JSON.stringify(dados, null, 2), 'utf8');
  await fs.rename(temporario, arquivo);
}

function registrarCanais(): void {
  ipcMain.handle(CANAIS_IPC.carregarProgresso, async (evento) => {
    if (!validarRemetente(evento)) return null;
    return validarDadosDeSave(await lerJson(arquivoDeSave()));
  });

  ipcMain.handle(CANAIS_IPC.salvarProgresso, async (evento, dados: unknown) => {
    if (!validarRemetente(evento)) return false;
    const validos = validarDadosDeSave(dados);
    if (!validos) return false;
    await gravarJson(arquivoDeSave(), validos);
    return true;
  });

  ipcMain.handle(CANAIS_IPC.limparProgresso, async (evento) => {
    if (!validarRemetente(evento)) return false;
    await fs.rm(arquivoDeSave(), { force: true });
    return true;
  });

  ipcMain.handle(CANAIS_IPC.carregarConfiguracoes, async (evento) => {
    if (!validarRemetente(evento)) return null;
    return validarConfiguracoes(await lerJson(arquivoDeConfiguracoes()));
  });

  ipcMain.handle(CANAIS_IPC.salvarConfiguracoes, async (evento, dados: unknown) => {
    if (!validarRemetente(evento)) return false;
    await gravarJson(arquivoDeConfiguracoes(), validarConfiguracoes(dados));
    return true;
  });

  ipcMain.on(CANAIS_IPC.sair, (evento) => {
    if (origemPermitida(evento.senderFrame?.url ?? '')) app.quit();
  });
}

function criarJanela(): BrowserWindow {
  const janela = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 680,
    show: false,
    backgroundColor: '#0b0807',
    autoHideMenuBar: true,
    title: 'Crônicas da Cidadela',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
    },
  });

  janela.removeMenu();
  janela.once('ready-to-show', () => janela.show());

  // Nenhuma janela nova e nenhuma navegação para fora do jogo.
  janela.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  janela.webContents.on('will-navigate', (evento, url) => {
    if (!origemPermitida(url)) evento.preventDefault();
  });

  if (URL_DE_DESENVOLVIMENTO) {
    void janela.loadURL(URL_DE_DESENVOLVIMENTO);
  } else {
    void janela.loadFile(INDEX_DE_PRODUCAO);
  }
  return janela;
}

app.whenReady().then(() => {
  // O jogo não precisa de câmera, microfone, notificações etc.
  session.defaultSession.setPermissionRequestHandler((_conteudo, _permissao, responder) => responder(false));
  registrarCanais();
  criarJanela();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) criarJanela();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
