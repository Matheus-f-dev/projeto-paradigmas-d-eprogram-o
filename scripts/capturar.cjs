/**
 * Roteiro de inspeção visual: abre o jogo compilado no Electron (mesmo
 * preload e mesmas opções de segurança), navega pela interface clicando
 * nos botões reais e salva capturas de tela em ./captures.
 *
 * Uso: npm run build && npx electron scripts/capturar.cjs [roteiro]
 * Roteiros: completo (padrão), derrota, chefe, idiomas
 */
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const pastaDeCapturas = path.join(raiz, 'captures');
const roteiro = process.argv.find((arg) => ['completo', 'derrota', 'chefe', 'idiomas'].includes(arg)) ?? 'completo';
fs.mkdirSync(pastaDeCapturas, { recursive: true });
app.setPath('userData', path.join(app.getPath('temp'), `cronicas-captura-${Date.now()}`));

// Persistência em memória (a captura não toca nos saves reais do jogador).
let save = null;
let configuracoes = null;

function saveDeTeste(estagio, vida) {
  return {
    versao: 1,
    salvoEm: new Date().toISOString(),
    estagio,
    campanhaConcluida: false,
    grupo: [
      { classe: 'guerreiro', vida, bonusTemporario: 0, membros: { braco: 12, perna: 18 }, extra: { furia: 10 }, arma: { id: 'espada-vorpal#90', catalogoId: 'espada-vorpal' }, armadura: { id: 'cota-de-malha#91', catalogoId: 'cota-de-malha' } },
      { classe: 'mago', vida: Math.min(vida, 30), bonusTemporario: 0, membros: { braco: 12, perna: 18 }, extra: { mana: 20 }, arma: { id: 'cajado-das-brasas#92', catalogoId: 'cajado-das-brasas' }, armadura: null },
    ],
    inventario: [
      { id: 'pocao-de-vida#93', catalogoId: 'pocao-de-vida' },
      { id: 'elixir-do-santuario#94', catalogoId: 'elixir-do-santuario' },
      { id: 'pocao-de-mana#95', catalogoId: 'pocao-de-mana' },
    ],
    estatisticas: { batalhasVencidas: 2, derrotas: 0, danoCausado: 120, danoRecebido: 40, habilidadesUsadas: 6, inimigosDerrotados: 4 },
  };
}

if (roteiro === 'derrota') save = saveDeTeste(2, 1);
if (roteiro === 'chefe') save = saveDeTeste(2, 40);

ipcMain.handle('progresso:carregar', () => save);
ipcMain.handle('progresso:salvar', (_e, dados) => ((save = dados), true));
ipcMain.handle('progresso:limpar', () => ((save = null), true));
ipcMain.handle('configuracoes:carregar', () => configuracoes);
ipcMain.handle('configuracoes:salvar', (_e, dados) => ((configuracoes = dados), true));
ipcMain.on('aplicativo:sair', () => app.quit());

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

const AUXILIARES = `
window.__cap = {
  clicarTexto(texto, seletor = 'button') {
    const alvo = [...document.querySelectorAll(seletor)].find((b) => b.textContent.trim().includes(texto) && !b.disabled);
    if (!alvo) return false;
    alvo.click();
    return true;
  },
  clicar(seletor) {
    const alvo = document.querySelector(seletor);
    if (!alvo) return false;
    alvo.click();
    return true;
  },
  /** Executa o turno do herói atual: habilidade se possível, senão ataque, no primeiro alvo hostil. */
  async jogarTurno(preferirHabilidade = true) {
    const botoes = [...document.querySelectorAll('.menu-de-acoes__botoes .botao-acao')];
    if (botoes.length === 0) return 'sem-menu';
    const habilidade = botoes[1];
    const usar = preferirHabilidade && habilidade && habilidade.getAttribute('aria-disabled') !== 'true' ? habilidade : botoes[0];
    usar.click();
    // O React aplica o novo estado de forma assíncrona; espera um quadro antes de procurar o alvo.
    await new Promise((resolver) => requestAnimationFrame(() => setTimeout(resolver, 30)));
    const alvo = [...document.querySelectorAll('.combatente--inimigo .combatente__corpo, .combatente--objeto .combatente__corpo')].find((b) => !b.disabled);
    if (!alvo) return 'sem-alvo';
    alvo.click();
    return 'ok';
  },
  tela() {
    return document.querySelector('main.tela')?.className ?? '';
  },
};
true;
`;

async function capturar(janela, nome) {
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    try {
      const imagem = await janela.webContents.capturePage();
      fs.writeFileSync(path.join(pastaDeCapturas, `${roteiro}-${nome}.png`), imagem.toPNG());
      console.log(`capturado: ${roteiro}-${nome}.png`);
      return;
    } catch (erro) {
      // No Windows a captura falha se a janela estiver oculta por outra; traz para frente e tenta de novo.
      console.log(`falha ao capturar ${nome} (tentativa ${tentativa}): ${erro.message}`);
      janela.show();
      janela.focus();
      janela.moveTop();
      await esperar(400);
    }
  }
}

async function js(janela, codigo) {
  return janela.webContents.executeJavaScript(codigo);
}

async function lutar(janela, prefixo, maximo = 40, capturasDeTurno = []) {
  for (let turno = 0; turno < maximo; turno++) {
    const tela = await js(janela, '__cap.tela()');
    if (!tela.includes('tela--combate')) return tela;
    const resultado = await js(janela, `__cap.jogarTurno(${turno % 3 !== 2})`);
    console.log(`turno ${turno}: ${resultado} | ${tela}`);
    if (resultado === 'ok') {
      const capturas = capturasDeTurno[turno] ?? [];
      let decorrido = 0;
      for (const [instante, nome] of capturas) {
        await esperar(instante - decorrido);
        decorrido = instante;
        await capturar(janela, `${prefixo}-${nome}`);
      }
    }
    await esperar(1400);
  }
  return js(janela, '__cap.tela()');
}

async function executarRoteiro(janela) {
  await esperar(2600);
  await js(janela, AUXILIARES);

  if (roteiro === 'idiomas') {
    await js(janela, `__cap.clicarTexto('Configurações')`);
    await esperar(900);
    await js(janela, `__cap.clicarTexto('English')`);
    await esperar(600);
    await capturar(janela, '01-config-en');
    await js(janela, `__cap.clicarTexto('Back')`);
    await esperar(1600);
    await capturar(janela, '02-menu-en');
    await js(janela, `__cap.clicarTexto('Settings')`);
    await esperar(900);
    await js(janela, `__cap.clicarTexto('中文')`);
    await esperar(800);
    await js(janela, `__cap.clicarTexto('返回')`);
    await esperar(1600);
    await capturar(janela, '03-menu-zh');
    await js(janela, `__cap.clicarTexto('编程实验室')`);
    await esperar(1400);
    await capturar(janela, '04-lab-zh');
    await js(janela, `__cap.clicarTexto('运行演示')`);
    await esperar(1200);
    await capturar(janela, '05-lab-demo-zh');
    await js(janela, `__cap.clicarTexto('返回菜单')`);
    await esperar(1400);
    await js(janela, `__cap.clicarTexto('新的旅程')`);
    await esperar(1500);
    await capturar(janela, '06-selecao-zh');
    return;
  }

  if (roteiro === 'derrota' || roteiro === 'chefe') {
    await js(janela, `__cap.clicarTexto('Continuar')`);
    await esperar(1600);
    await capturar(janela, '01-acampamento');
    console.log('marchar →', await js(janela, `__cap.clicarTexto('Marchar para a batalha')`), await js(janela, '__cap.tela()'));
    await esperar(900);
    console.log('tela após marchar:', await js(janela, '__cap.tela()'));
    await capturar(janela, '02-intro');
    await esperar(2600);
    await capturar(janela, '03-combate');
    const capturas =
      roteiro === 'chefe'
        ? Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i, [[500, `t${i}-a`], [1300, `t${i}-b`], [2400, `t${i}-c`]]]))
        : { 0: [[1800, 'inimigo-ataca'], [2600, 'heroi-cai']] };
    const tela = await lutar(janela, '04-luta', 60, capturas);
    await esperar(1500);
    await capturar(janela, `05-${tela.includes('resultado') ? 'resultado' : 'fim'}`);
    return;
  }

  // ------------------------------------------------------ roteiro completo
  await capturar(janela, '01-menu');
  await js(janela, `__cap.clicarTexto('Configurações')`);
  await esperar(1300);
  await capturar(janela, '02-configuracoes');
  await js(janela, `__cap.clicarTexto('Voltar')`);
  await esperar(1300);
  await js(janela, `__cap.clicarTexto('Créditos')`);
  await esperar(1800);
  await capturar(janela, '03-creditos');
  await js(janela, `__cap.clicarTexto('Voltar')`);
  await esperar(1300);
  await js(janela, `__cap.clicarTexto('Laboratório de Programação')`);
  await esperar(1500);
  await capturar(janela, '04-laboratorio');
  await js(janela, `__cap.clicarTexto('Executar demonstração')`);
  await esperar(1200);
  await capturar(janela, '05-laboratorio-demo');
  await js(janela, `__cap.clicarTexto('Agregação')`);
  await esperar(900);
  await js(janela, `__cap.clicarTexto('Executar demonstração')`);
  await esperar(1200);
  await capturar(janela, '06-laboratorio-agregacao');
  await js(janela, `__cap.clicarTexto('Diagrama de classes')`);
  await esperar(4500);
  await capturar(janela, '07-laboratorio-uml');
  await js(janela, `__cap.clicarTexto('Voltar ao menu')`);
  await esperar(1500);

  await js(janela, `__cap.clicarTexto('Nova jornada')`);
  await esperar(1600);
  await capturar(janela, '08-selecao');
  await js(janela, `__cap.clicarTexto('Recrutar')`);
  await esperar(300);
  await js(janela, `__cap.clicarTexto('Maga', '.cartao-classe')`);
  await esperar(700);
  await js(janela, `__cap.clicarTexto('Recrutar')`);
  await esperar(900);
  await capturar(janela, '09-selecao-mago');
  await js(janela, `__cap.clicarTexto('Partir em jornada')`);
  await esperar(1800);
  await capturar(janela, '10-acampamento');
  await js(janela, `__cap.clicarTexto('Equipamentos e itens')`);
  await esperar(1200);
  await capturar(janela, '11-inventario');
  await js(janela, `__cap.clicarTexto('Fechar')`);
  await esperar(800);
  await js(janela, `__cap.clicarTexto('Marchar para a batalha')`);
  await esperar(1100);
  await capturar(janela, '12-combate-intro');
  await esperar(2600);
  await capturar(janela, '13-combate');

  // Golpe Brutal no Goblin, com capturas das fases da animação.
  await js(janela, `__cap.clicarTexto('Golpe Brutal', '.botao-acao')`);
  await esperar(500);
  await capturar(janela, '14-mira');
  await js(janela, `__cap.clicar('.combatente--inimigo .combatente__corpo')`);
  await esperar(330);
  await capturar(janela, '15-golpe-preparo');
  await esperar(500);
  await capturar(janela, '16-golpe-impacto');
  await esperar(250);
  await capturar(janela, '17-golpe-dano');
  await esperar(1500);

  // Bola de Fogo.
  await js(janela, `__cap.clicarTexto('Bola de Fogo', '.botao-acao')`);
  await esperar(300);
  await js(janela, `__cap.clicar('.combatente--inimigo .combatente__corpo')`);
  await esperar(450);
  await capturar(janela, '18-bola-conjuracao');
  await esperar(500);
  await capturar(janela, '19-bola-projetil');
  await esperar(300);
  await capturar(janela, '20-bola-explosao');
  await esperar(2400);
  await capturar(janela, '21-turno-inimigo');

  const tela = await lutar(janela, '22-luta', 40);
  await esperar(1200);
  await capturar(janela, '23-resultado');
  if (tela.includes('resultado')) {
    await js(janela, `__cap.clicarTexto('Seguir para o acampamento')`);
    await esperar(2200);
    await capturar(janela, '24-acampamento-pos-vitoria');
  }
}

app.whenReady().then(async () => {
  const janela = new BrowserWindow({
    width: 1440,
    height: 900,
    show: true,
    backgroundColor: '#0b0807',
    webPreferences: {
      preload: path.join(raiz, 'dist-electron', 'electron', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  janela.removeMenu();
  janela.webContents.on('console-message', (_e, nivel, mensagem) => {
    if (nivel >= 1) console.log(`[renderer ${nivel}] ${mensagem}`);
  });
  await janela.loadFile(path.join(raiz, 'dist', 'index.html'));
  try {
    await executarRoteiro(janela);
  } catch (erro) {
    console.error('Falha no roteiro de captura:', erro);
  }
  app.quit();
});
