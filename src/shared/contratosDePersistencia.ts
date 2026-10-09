/**
 * Formatos de dados que atravessam a fronteira entre o renderer e o processo
 * principal do Electron (e o armazenamento local). Este módulo não depende do
 * domínio nem de bibliotecas: é compilado tanto para o renderer quanto para o
 * processo principal, que valida tudo o que recebe antes de gravar em disco.
 */

export const VERSAO_DO_SAVE = 1;
const TAMANHO_MAXIMO_DE_TEXTO = 64;
const LIMITE_DE_ITENS = 200;

export interface ItemSalvo {
  readonly id: string;
  readonly catalogoId: string;
}

export interface HeroiSalvo {
  readonly classe: string;
  readonly vida: number;
  readonly bonusTemporario: number;
  readonly membros: Readonly<Record<string, number>>;
  readonly extra: Readonly<Record<string, number>>;
  readonly arma: ItemSalvo | null;
  readonly armadura: ItemSalvo | null;
}

export interface EstatisticasDaJornada {
  readonly batalhasVencidas: number;
  readonly derrotas: number;
  readonly danoCausado: number;
  readonly danoRecebido: number;
  readonly habilidadesUsadas: number;
  readonly inimigosDerrotados: number;
}

export interface DadosDeSave {
  readonly versao: typeof VERSAO_DO_SAVE;
  readonly salvoEm: string;
  readonly estagio: number;
  readonly campanhaConcluida: boolean;
  readonly grupo: readonly HeroiSalvo[];
  readonly inventario: readonly ItemSalvo[];
  readonly estatisticas: EstatisticasDaJornada;
}

export type IntensidadeDeEfeitos = 'completo' | 'reduzido' | 'minimo';
export type VelocidadeDeCombate = 'normal' | 'rapida';
export type IdiomaSalvo = 'pt' | 'en' | 'zh';

export interface Configuracoes {
  readonly idioma: IdiomaSalvo;
  readonly volume: number;
  readonly efeitos: IntensidadeDeEfeitos;
  readonly reduzirMovimento: boolean;
  readonly velocidade: VelocidadeDeCombate;
}

export const CONFIGURACOES_PADRAO: Configuracoes = {
  idioma: 'pt',
  volume: 0.6,
  efeitos: 'completo',
  reduzirMovimento: false,
  velocidade: 'normal',
};

// ------------------------------------------------------------- validação

type Objeto = Record<string, unknown>;

const ehObjeto = (valor: unknown): valor is Objeto => typeof valor === 'object' && valor !== null && !Array.isArray(valor);

const ehTextoSeguro = (valor: unknown): valor is string =>
  typeof valor === 'string' && valor.length > 0 && valor.length <= TAMANHO_MAXIMO_DE_TEXTO && /^[\w#:.-]+$/.test(valor);

const ehInteiroEntre = (valor: unknown, minimo: number, maximo: number): valor is number =>
  typeof valor === 'number' && Number.isInteger(valor) && valor >= minimo && valor <= maximo;

function validarMapaNumerico(valor: unknown): Record<string, number> | null {
  if (!ehObjeto(valor)) return null;
  const entradas = Object.entries(valor);
  if (entradas.length > 16) return null;
  const resultado: Record<string, number> = {};
  for (const [chave, numero] of entradas) {
    if (!ehTextoSeguro(chave) || !ehInteiroEntre(numero, 0, 10_000)) return null;
    resultado[chave] = numero;
  }
  return resultado;
}

function validarItem(valor: unknown): ItemSalvo | null {
  if (!ehObjeto(valor) || !ehTextoSeguro(valor.id) || !ehTextoSeguro(valor.catalogoId)) return null;
  return { id: valor.id, catalogoId: valor.catalogoId };
}

function validarItemOpcional(valor: unknown): ItemSalvo | null | undefined {
  if (valor === null) return null;
  return validarItem(valor) ?? undefined;
}

function validarHeroi(valor: unknown): HeroiSalvo | null {
  if (!ehObjeto(valor)) return null;
  const membros = validarMapaNumerico(valor.membros);
  const extra = validarMapaNumerico(valor.extra);
  const arma = validarItemOpcional(valor.arma);
  const armadura = validarItemOpcional(valor.armadura);
  if (
    !ehTextoSeguro(valor.classe) ||
    !ehInteiroEntre(valor.vida, 0, 10_000) ||
    !ehInteiroEntre(valor.bonusTemporario, 0, 1_000) ||
    !membros ||
    !extra ||
    arma === undefined ||
    armadura === undefined
  ) {
    return null;
  }
  return { classe: valor.classe, vida: valor.vida, bonusTemporario: valor.bonusTemporario, membros, extra, arma, armadura };
}

function validarEstatisticas(valor: unknown): EstatisticasDaJornada | null {
  if (!ehObjeto(valor)) return null;
  const campos = ['batalhasVencidas', 'derrotas', 'danoCausado', 'danoRecebido', 'habilidadesUsadas', 'inimigosDerrotados'] as const;
  if (!campos.every((campo) => ehInteiroEntre(valor[campo], 0, 10_000_000))) return null;
  return Object.fromEntries(campos.map((campo) => [campo, valor[campo]])) as unknown as EstatisticasDaJornada;
}

/** Valida dados desconhecidos (vindos do disco ou do renderer). Devolve null se forem inválidos. */
export function validarDadosDeSave(valor: unknown): DadosDeSave | null {
  if (!ehObjeto(valor) || valor.versao !== VERSAO_DO_SAVE) return null;
  if (typeof valor.salvoEm !== 'string' || Number.isNaN(Date.parse(valor.salvoEm))) return null;
  if (!ehInteiroEntre(valor.estagio, 0, 100) || typeof valor.campanhaConcluida !== 'boolean') return null;
  if (!Array.isArray(valor.grupo) || valor.grupo.length < 1 || valor.grupo.length > 4) return null;
  if (!Array.isArray(valor.inventario) || valor.inventario.length > LIMITE_DE_ITENS) return null;

  const grupo = valor.grupo.map(validarHeroi);
  const inventario = valor.inventario.map(validarItem);
  const estatisticas = validarEstatisticas(valor.estatisticas);
  if (grupo.some((heroi) => heroi === null) || inventario.some((item) => item === null) || !estatisticas) return null;

  const classes = (grupo as HeroiSalvo[]).map((heroi) => heroi.classe);
  if (new Set(classes).size !== classes.length) return null;

  return {
    versao: VERSAO_DO_SAVE,
    salvoEm: valor.salvoEm,
    estagio: valor.estagio,
    campanhaConcluida: valor.campanhaConcluida,
    grupo: grupo as HeroiSalvo[],
    inventario: inventario as ItemSalvo[],
    estatisticas,
  };
}

/** Valida configurações; campos inválidos voltam ao padrão em vez de descartar tudo. */
export function validarConfiguracoes(valor: unknown): Configuracoes {
  if (!ehObjeto(valor)) return CONFIGURACOES_PADRAO;
  const idiomas: readonly string[] = ['pt', 'en', 'zh'];
  const efeitos: readonly string[] = ['completo', 'reduzido', 'minimo'];
  const velocidades: readonly string[] = ['normal', 'rapida'];
  return {
    idioma: typeof valor.idioma === 'string' && idiomas.includes(valor.idioma) ? (valor.idioma as IdiomaSalvo) : CONFIGURACOES_PADRAO.idioma,
    volume:
      typeof valor.volume === 'number' && Number.isFinite(valor.volume)
        ? Math.min(1, Math.max(0, valor.volume))
        : CONFIGURACOES_PADRAO.volume,
    efeitos:
      typeof valor.efeitos === 'string' && efeitos.includes(valor.efeitos)
        ? (valor.efeitos as IntensidadeDeEfeitos)
        : CONFIGURACOES_PADRAO.efeitos,
    reduzirMovimento:
      typeof valor.reduzirMovimento === 'boolean' ? valor.reduzirMovimento : CONFIGURACOES_PADRAO.reduzirMovimento,
    velocidade:
      typeof valor.velocidade === 'string' && velocidades.includes(valor.velocidade)
        ? (valor.velocidade as VelocidadeDeCombate)
        : CONFIGURACOES_PADRAO.velocidade,
  };
}

/** API exposta pelo preload ao renderer (via contextBridge). */
export interface PonteDoJogo {
  readonly progresso: {
    carregar(): Promise<unknown>;
    salvar(dados: DadosDeSave): Promise<boolean>;
    limpar(): Promise<boolean>;
  };
  readonly configuracoes: {
    carregar(): Promise<unknown>;
    salvar(configuracoes: Configuracoes): Promise<boolean>;
  };
  readonly aplicativo: {
    sair(): void;
  };
}

export const CANAIS_IPC = {
  carregarProgresso: 'progresso:carregar',
  salvarProgresso: 'progresso:salvar',
  limparProgresso: 'progresso:limpar',
  carregarConfiguracoes: 'configuracoes:carregar',
  salvarConfiguracoes: 'configuracoes:salvar',
  sair: 'aplicativo:sair',
} as const;
