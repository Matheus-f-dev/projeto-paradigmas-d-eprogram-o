import type { RepositorioDeConfiguracoes, RepositorioDeProgresso } from '../../application/portas';
import {
  CONFIGURACOES_PADRAO,
  validarConfiguracoes,
  validarDadosDeSave,
  type Configuracoes,
  type DadosDeSave,
  type PonteDoJogo,
} from '../../shared/contratosDePersistencia';

// #region lab:repositorios
/** Implementação em memória: usada nos testes e como último recurso. */
export class RepositorioDeProgressoEmMemoria implements RepositorioDeProgresso {
  private dados: string | null = null;

  async carregar(): Promise<DadosDeSave | null> {
    return this.dados ? validarDadosDeSave(JSON.parse(this.dados)) : null;
  }

  async salvar(dados: DadosDeSave): Promise<void> {
    this.dados = JSON.stringify(dados); // serializa para simular o armazenamento real
  }

  async limpar(): Promise<void> {
    this.dados = null;
  }
}

/** Implementação do Electron: conversa com o processo principal pela ponte segura do preload. */
export class RepositorioDeProgressoElectron implements RepositorioDeProgresso {
  constructor(private readonly ponte: PonteDoJogo) {}

  async carregar(): Promise<DadosDeSave | null> {
    return validarDadosDeSave(await this.ponte.progresso.carregar());
  }

  async salvar(dados: DadosDeSave): Promise<void> {
    if (!(await this.ponte.progresso.salvar(dados))) throw new Error('O processo principal recusou o salvamento.');
  }

  async limpar(): Promise<void> {
    await this.ponte.progresso.limpar();
  }
}
// #endregion

/** Implementação para o navegador (modo de desenvolvimento sem Electron). */
export class RepositorioDeProgressoLocalStorage implements RepositorioDeProgresso {
  constructor(
    private readonly armazenamento: Storage,
    private readonly chave = 'cronicas-da-cidadela:save',
  ) {}

  async carregar(): Promise<DadosDeSave | null> {
    try {
      const texto = this.armazenamento.getItem(this.chave);
      return texto ? validarDadosDeSave(JSON.parse(texto)) : null;
    } catch {
      return null;
    }
  }

  async salvar(dados: DadosDeSave): Promise<void> {
    this.armazenamento.setItem(this.chave, JSON.stringify(dados));
  }

  async limpar(): Promise<void> {
    this.armazenamento.removeItem(this.chave);
  }
}

export class RepositorioDeConfiguracoesEmMemoria implements RepositorioDeConfiguracoes {
  private dados: Configuracoes = CONFIGURACOES_PADRAO;

  async carregar(): Promise<Configuracoes> {
    return this.dados;
  }

  async salvar(configuracoes: Configuracoes): Promise<void> {
    this.dados = validarConfiguracoes(configuracoes);
  }
}

export class RepositorioDeConfiguracoesElectron implements RepositorioDeConfiguracoes {
  constructor(private readonly ponte: PonteDoJogo) {}

  async carregar(): Promise<Configuracoes> {
    return validarConfiguracoes(await this.ponte.configuracoes.carregar());
  }

  async salvar(configuracoes: Configuracoes): Promise<void> {
    await this.ponte.configuracoes.salvar(validarConfiguracoes(configuracoes));
  }
}

export class RepositorioDeConfiguracoesLocalStorage implements RepositorioDeConfiguracoes {
  constructor(
    private readonly armazenamento: Storage,
    private readonly chave = 'cronicas-da-cidadela:configuracoes',
  ) {}

  async carregar(): Promise<Configuracoes> {
    try {
      const texto = this.armazenamento.getItem(this.chave);
      return texto ? validarConfiguracoes(JSON.parse(texto)) : CONFIGURACOES_PADRAO;
    } catch {
      return CONFIGURACOES_PADRAO;
    }
  }

  async salvar(configuracoes: Configuracoes): Promise<void> {
    this.armazenamento.setItem(this.chave, JSON.stringify(validarConfiguracoes(configuracoes)));
  }
}

export interface Repositorios {
  readonly progresso: RepositorioDeProgresso;
  readonly configuracoes: RepositorioDeConfiguracoes;
  readonly origem: 'electron' | 'navegador' | 'memoria';
}

/** Composition root da persistência: escolhe a implementação conforme o ambiente. */
export function criarRepositorios(ambiente: { rpg?: PonteDoJogo; localStorage?: Storage }): Repositorios {
  if (ambiente.rpg) {
    return {
      progresso: new RepositorioDeProgressoElectron(ambiente.rpg),
      configuracoes: new RepositorioDeConfiguracoesElectron(ambiente.rpg),
      origem: 'electron',
    };
  }
  try {
    if (ambiente.localStorage) {
      ambiente.localStorage.getItem('teste');
      return {
        progresso: new RepositorioDeProgressoLocalStorage(ambiente.localStorage),
        configuracoes: new RepositorioDeConfiguracoesLocalStorage(ambiente.localStorage),
        origem: 'navegador',
      };
    }
  } catch {
    // armazenamento bloqueado: segue para memória
  }
  return {
    progresso: new RepositorioDeProgressoEmMemoria(),
    configuracoes: new RepositorioDeConfiguracoesEmMemoria(),
    origem: 'memoria',
  };
}
