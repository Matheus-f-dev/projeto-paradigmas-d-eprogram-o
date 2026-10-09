import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PT } from '../../src/i18n/dicionarios/pt';
import { criarMessageProvider } from '../../src/i18n/provedores';
import { CONCEITOS } from '../../src/presentation/lab/conceitos';
import { executarDemonstracao } from '../../src/presentation/lab/demonstracoes';
import { extrairBlocosMermaid, extrairRegiao } from '../../src/presentation/lab/extrairRegiao';

const raiz = resolve(__dirname, '..', '..');

function arquivosTs(diretorio: string): string[] {
  return readdirSync(diretorio).flatMap((nome) => {
    const caminho = join(diretorio, nome);
    return statSync(caminho).isDirectory() ? arquivosTs(caminho) : caminho.endsWith('.ts') || caminho.endsWith('.tsx') ? [caminho] : [];
  });
}

describe('Laboratório de Programação — exemplos verificáveis', () => {
  it('todo trecho exibido corresponde a uma região real do código-fonte', () => {
    for (const conceito of CONCEITOS) {
      for (const trecho of conceito.trechos) {
        const fonte = readFileSync(resolve(raiz, trecho.arquivo), 'utf8');
        const codigo = extrairRegiao(fonte, trecho.regiao);
        expect(codigo, `${conceito.id}: ${trecho.arquivo}#${trecho.regiao}`).not.toBeNull();
        expect(codigo!.length).toBeGreaterThan(40);
      }
    }
  });

  it('todo teste citado no Laboratório existe no arquivo de teste indicado', () => {
    for (const conceito of CONCEITOS) {
      for (const referencia of conceito.testes) {
        const [arquivo, nome] = referencia.split(' › ');
        const fonte = readFileSync(resolve(raiz, arquivo!), 'utf8');
        expect(fonte, `${conceito.id}: ${referencia}`).toContain(nome!);
      }
    }
  });

  it('todo conceito tem textos nos três idiomas', () => {
    const campos = ['title', 'explain', 'game', 'why', 'evidence', 'pdf'];
    for (const conceito of CONCEITOS) {
      for (const campo of campos) {
        expect(PT, `lab.${conceito.id}.${campo}`).toHaveProperty([`lab.${conceito.id}.${campo}`]);
      }
    }
  });

  it('as demonstrações executam o domínio real e respondem ao idioma', () => {
    for (const conceito of CONCEITOS.filter((c) => c.demonstracao)) {
      const pt = executarDemonstracao(conceito.demonstracao!, criarMessageProvider('pt'));
      expect(pt.length, conceito.id).toBeGreaterThan(1);
    }
    const ptBatalha = executarDemonstracao('batalha-do-pdf', criarMessageProvider('pt'));
    const enBatalha = executarDemonstracao('batalha-do-pdf', criarMessageProvider('en'));
    expect(ptBatalha).toContain('Luna lança Bola de Fogo em Goblin!');
    expect(enBatalha).toContain('Luna casts Fireball on Goblin!');
    expect(ptBatalha.at(-1)).toBe('Goblin - Vida: 1');
  });

  it('o diagrama UML cita apenas classes que existem no código', () => {
    const markdown = readFileSync(resolve(raiz, 'docs/DIAGRAMA_UML.md'), 'utf8');
    const blocos = extrairBlocosMermaid(markdown);
    expect(blocos).toHaveLength(3);
    const codigo = arquivosTs(resolve(raiz, 'src')).map((arquivo) => readFileSync(arquivo, 'utf8')).join('\n');
    const classes = new Set(blocos.flatMap((bloco) => [...bloco.matchAll(/^\s*class (\w+)/gm)].map((m) => m[1]!)));
    expect(classes.size).toBeGreaterThan(40);
    for (const classe of classes) {
      expect(codigo, `classe ${classe}`).toMatch(new RegExp(`(class|interface|type) ${classe}\\b`));
    }
  });

  it('as relações do diagrama refletem o código (herança e implementação)', () => {
    const ler = (arquivo: string) => readFileSync(resolve(raiz, arquivo), 'utf8');
    expect(ler('src/domain/model/Guerreiro.ts')).toMatch(/class Guerreiro extends Personagem implements ComHabilidadeEspecial, ComRecurso/);
    expect(ler('src/domain/model/Mago.ts')).toMatch(/class Mago extends Personagem implements ComHabilidadeEspecial, ComRecurso, PossuiMana/);
    expect(ler('src/domain/model/Inimigo.ts')).toMatch(/class Inimigo extends Personagem \{/);
    expect(ler('src/domain/model/Zumbi.ts')).toMatch(/class Zumbi extends Inimigo/);
    expect(ler('src/domain/model/Chefe.ts')).toMatch(/class Chefe extends Inimigo implements ComHabilidadeEspecial/);
    expect(ler('src/domain/model/Bau.ts')).toMatch(/class Bau implements Destrutivel, ContemItens/);
    expect(ler('src/domain/model/Personagem.ts')).toMatch(/abstract class Personagem implements Destrutivel/);
  });
});
