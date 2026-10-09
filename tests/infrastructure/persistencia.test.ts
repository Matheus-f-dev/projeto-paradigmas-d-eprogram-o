import { describe, expect, it } from 'vitest';
import {
  RepositorioDeConfiguracoesLocalStorage,
  RepositorioDeProgressoElectron,
  RepositorioDeProgressoLocalStorage,
  criarRepositorios,
} from '../../src/infrastructure/persistence/repositorios';
import {
  CONFIGURACOES_PADRAO,
  validarConfiguracoes,
  validarDadosDeSave,
  type DadosDeSave,
  type PonteDoJogo,
} from '../../src/shared/contratosDePersistencia';

class ArmazenamentoFalso implements Storage {
  private readonly mapa = new Map<string, string>();
  get length() {
    return this.mapa.size;
  }
  clear() {
    this.mapa.clear();
  }
  getItem(chave: string) {
    return this.mapa.get(chave) ?? null;
  }
  key(indice: number) {
    return [...this.mapa.keys()][indice] ?? null;
  }
  removeItem(chave: string) {
    this.mapa.delete(chave);
  }
  setItem(chave: string, valor: string) {
    this.mapa.set(chave, valor);
  }
}

const SAVE_VALIDO: DadosDeSave = {
  versao: 1,
  salvoEm: '2026-10-09T12:00:00.000Z',
  estagio: 1,
  campanhaConcluida: false,
  grupo: [
    {
      classe: 'guerreiro',
      vida: 30,
      bonusTemporario: 0,
      membros: { braco: 12, perna: 18 },
      extra: { furia: 5 },
      arma: { id: 'espada-longa#1', catalogoId: 'espada-longa' },
      armadura: null,
    },
  ],
  inventario: [{ id: 'pocao-de-vida#2', catalogoId: 'pocao-de-vida' }],
  estatisticas: { batalhasVencidas: 1, derrotas: 0, danoCausado: 40, danoRecebido: 10, habilidadesUsadas: 2, inimigosDerrotados: 2 },
};

describe('Validação dos dados que atravessam a fronteira', () => {
  it('aceita um save válido', () => {
    expect(validarDadosDeSave(JSON.parse(JSON.stringify(SAVE_VALIDO)))).toEqual(SAVE_VALIDO);
  });

  it.each([
    ['versão desconhecida', { ...SAVE_VALIDO, versao: 99 }],
    ['vida negativa', { ...SAVE_VALIDO, grupo: [{ ...SAVE_VALIDO.grupo[0], vida: -5 }] }],
    ['vida fracionária', { ...SAVE_VALIDO, grupo: [{ ...SAVE_VALIDO.grupo[0], vida: 3.5 }] }],
    ['grupo vazio', { ...SAVE_VALIDO, grupo: [] }],
    ['classes repetidas', { ...SAVE_VALIDO, grupo: [SAVE_VALIDO.grupo[0], SAVE_VALIDO.grupo[0]] }],
    ['id com caracteres suspeitos', { ...SAVE_VALIDO, inventario: [{ id: '<script>', catalogoId: 'pocao-de-vida' }] }],
    ['data inválida', { ...SAVE_VALIDO, salvoEm: 'ontem' }],
    ['texto em vez de objeto', 'não sou um save'],
    ['nulo', null],
  ])('rejeita %s', (_descricao, dados) => {
    expect(validarDadosDeSave(dados)).toBeNull();
  });

  it('configurações inválidas voltam ao padrão campo a campo', () => {
    expect(validarConfiguracoes({ idioma: 'fr', volume: 5, efeitos: 'ultra', reduzirMovimento: 'sim', velocidade: 'rapida' })).toEqual({
      ...CONFIGURACOES_PADRAO,
      volume: 1,
      velocidade: 'rapida',
    });
    expect(validarConfiguracoes(undefined)).toEqual(CONFIGURACOES_PADRAO);
  });
});

describe('Repositórios', () => {
  it('localStorage: salva, recupera, ignora dados corrompidos e limpa', async () => {
    const armazenamento = new ArmazenamentoFalso();
    const repositorio = new RepositorioDeProgressoLocalStorage(armazenamento);
    expect(await repositorio.carregar()).toBeNull();
    await repositorio.salvar(SAVE_VALIDO);
    expect(await repositorio.carregar()).toEqual(SAVE_VALIDO);
    armazenamento.setItem('cronicas-da-cidadela:save', '{corrompido');
    expect(await repositorio.carregar()).toBeNull();
    await repositorio.limpar();
    expect(armazenamento.length).toBe(0);
  });

  it('configurações persistidas: o idioma escolhido é recuperado', async () => {
    const armazenamento = new ArmazenamentoFalso();
    const repositorio = new RepositorioDeConfiguracoesLocalStorage(armazenamento);
    await repositorio.salvar({ ...CONFIGURACOES_PADRAO, idioma: 'zh', reduzirMovimento: true });
    const recarregado = new RepositorioDeConfiguracoesLocalStorage(armazenamento);
    expect(await recarregado.carregar()).toMatchObject({ idioma: 'zh', reduzirMovimento: true });
  });

  it('Electron: o renderer também valida o que recebe da ponte', async () => {
    const ponte: PonteDoJogo = {
      progresso: { carregar: async () => ({ versao: 1, hackeado: true }), salvar: async () => false, limpar: async () => true },
      configuracoes: { carregar: async () => ({}), salvar: async () => true },
      aplicativo: { sair: () => undefined },
    };
    const repositorio = new RepositorioDeProgressoElectron(ponte);
    expect(await repositorio.carregar()).toBeNull();
    await expect(repositorio.salvar(SAVE_VALIDO)).rejects.toThrow();
  });

  it('escolhe a implementação conforme o ambiente', () => {
    const ponte = {} as PonteDoJogo;
    expect(criarRepositorios({ rpg: ponte }).origem).toBe('electron');
    expect(criarRepositorios({ localStorage: new ArmazenamentoFalso() }).origem).toBe('navegador');
    expect(criarRepositorios({}).origem).toBe('memoria');
  });
});
