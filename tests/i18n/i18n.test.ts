import { describe, expect, it } from 'vitest';
import { Guerreiro } from '../../src/domain/model/Guerreiro';
import { Inimigo } from '../../src/domain/model/Inimigo';
import { Mago } from '../../src/domain/model/Mago';
import { EN } from '../../src/i18n/dicionarios/en';
import { PT } from '../../src/i18n/dicionarios/pt';
import { ZH } from '../../src/i18n/dicionarios/zh';
import { formatarEvento } from '../../src/i18n/formatarEvento';
import { MapBasedMessageProvider } from '../../src/i18n/MessageProvider';
import {
  ChineseMessageProvider,
  EnglishMessageProvider,
  PortugueseMessageProvider,
  criarMessageProvider,
} from '../../src/i18n/provedores';
import { LogInMemoryOutputChannel, TextCombatNotifier } from '../../src/presentation/output/OutputChannel';

/** Executa a batalha do "TOTAL SOLID" do PDF com o notificador informado. */
function executarBatalha(notifier: TextCombatNotifier) {
  const heroi = new Guerreiro('Mike', 40, 8);
  const feiticeira = new Mago('Eleven', 30, 6, 20);
  const monstrao = new Inimigo('Demogorgon', 45, 10);
  heroi.usarHabilidade(monstrao, notifier);
  feiticeira.usarHabilidade(monstrao, notifier);
  monstrao.mostrarStatus(notifier);
}

describe('Internacionalização (MessageProvider)', () => {
  it('formata argumentos posicionais como o MessageFormat do PDF', () => {
    const pt = new PortugueseMessageProvider();
    expect(pt.getMessage('event.attack', 'Mike', 'Goblin', 8)).toBe('Mike ataca Goblin causando 8 de dano!');
    expect(new EnglishMessageProvider().getMessage('event.status', 'Mike', 40)).toBe('Mike - Health: 40');
    expect(new ChineseMessageProvider().getMessage('event.defeated', 'Mike')).toBe('Mike 被击败了！');
  });

  it('a mesma batalha produz textos nos três idiomas (Main do PDF)', () => {
    const saidas = (['pt', 'en', 'zh'] as const).map((idioma) => {
      const canal = new LogInMemoryOutputChannel();
      executarBatalha(new TextCombatNotifier(canal, criarMessageProvider(idioma)));
      return canal.getLinhas();
    });
    expect(saidas[0]).toContain('Mike usa Golpe Brutal em Demogorgon!');
    expect(saidas[1]).toContain('Mike uses Brutal Strike on Demogorgon!');
    expect(saidas[2]).toContain('Mike 对 魔神 施展了野蛮打击！'); // nomes de criaturas também são traduzidos
    expect(saidas[0]?.at(-1)).toBe('Demogorgon - Vida: 16');
    expect(saidas[1]?.at(-1)).toBe('Demogorgon - Health: 16');
    expect(saidas[2]?.at(-1)).toBe('魔神 - 生命值: 16');
    // Mesmo número de linhas: só o idioma mudou, não as regras.
    expect(new Set(saidas.map((linhas) => linhas.length)).size).toBe(1);
  });

  it('inglês e chinês cobrem todas as chaves do português', () => {
    const chaves = Object.keys(PT);
    expect(chaves.filter((chave) => !(chave in EN))).toEqual([]);
    expect(chaves.filter((chave) => !(chave in ZH))).toEqual([]);
  });

  it('usa o idioma de reserva quando falta uma chave e devolve a chave em último caso', () => {
    class Parcial extends MapBasedMessageProvider {
      constructor() {
        super('en', { 'menu.quit': 'Leave' }, new PortugueseMessageProvider());
      }
    }
    const parcial = new Parcial();
    expect(parcial.getMessage('menu.quit')).toBe('Leave');
    expect(parcial.getMessage('menu.settings')).toBe('Configurações');
    expect(parcial.getMessage('chave.inexistente')).toBe('chave.inexistente');
  });

  it('traduz nomes de entidades e itens pelo id', () => {
    const en = new EnglishMessageProvider();
    const texto = formatarEvento({ key: 'chest_broken', alvoId: 'bau-antigo', alvo: 'Baú Antigo', catalogoIds: [] }, en);
    expect(texto).toBe('Old Chest broke open, revealing loot!');
    const loot = formatarEvento({ key: 'loot_collected', catalogoIds: ['pocao-de-vida', 'gibao-de-couro'] }, en);
    expect(loot).toBe('Loot collected: Health Potion, Leather Jerkin.');
  });

  it('eventos puramente visuais não poluem o registro', () => {
    const pt = new PortugueseMessageProvider();
    expect(
      formatarEvento({ key: 'resource_changed', atorId: 'm', recurso: 'mana', delta: -5, restante: 15, maximo: 20 }, pt),
    ).toBeNull();
  });
});
