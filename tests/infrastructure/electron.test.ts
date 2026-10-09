import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CANAIS_IPC } from '../../src/shared/contratosDePersistencia';

const raiz = resolve(__dirname, '..', '..');
const ler = (arquivo: string) => readFileSync(resolve(raiz, arquivo), 'utf8');

describe('Configuração de segurança do Electron', () => {
  const main = ler('electron/main.ts');
  const preload = ler('electron/preload.ts');

  it('isola o contexto, desliga o Node no renderer e usa sandbox com preload dedicado', () => {
    expect(main).toMatch(/contextIsolation:\s*true/);
    expect(main).toMatch(/nodeIntegration:\s*false/);
    expect(main).toMatch(/sandbox:\s*true/);
    expect(main).toMatch(/preload:\s*path\.join\(__dirname, 'preload\.js'\)/);
  });

  it('bloqueia novas janelas e navegação externa', () => {
    expect(main).toContain("setWindowOpenHandler(() => ({ action: 'deny' }))");
    expect(main).toContain("'will-navigate'");
  });

  it('valida os dados recebidos antes de gravar', () => {
    expect(main).toMatch(/validarDadosDeSave\(dados\)/);
    expect(main).toMatch(/validarConfiguracoes\(dados\)/);
  });

  it('o preload usa exatamente os canais declarados e expõe só a ponte do jogo', () => {
    for (const canal of Object.values(CANAIS_IPC)) {
      expect(preload).toContain(`'${canal}'`);
    }
    expect(preload).toContain("contextBridge.exposeInMainWorld('rpg'");
    expect(preload).not.toMatch(/exposeInMainWorld\([^)]*ipcRenderer\s*[,)]/);
    // Em sandbox o preload só pode importar "electron" (importações de tipo são apagadas).
    const importacoesReais = preload.match(/^import (?!type).*from '(.+)';$/gm) ?? [];
    expect(importacoesReais).toEqual(["import { contextBridge, ipcRenderer } from 'electron';"]);
  });
});
