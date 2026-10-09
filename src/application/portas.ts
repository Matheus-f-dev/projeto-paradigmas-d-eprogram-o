import type { Configuracoes, DadosDeSave } from '../shared/contratosDePersistencia';

// #region lab:portas
/**
 * Portas de persistência (DIP). Os casos de uso dependem destas
 * abstrações; as implementações concretas (Electron, localStorage,
 * memória) ficam na camada de infraestrutura.
 */
export interface RepositorioDeProgresso {
  carregar(): Promise<DadosDeSave | null>;
  salvar(dados: DadosDeSave): Promise<void>;
  limpar(): Promise<void>;
}

export interface RepositorioDeConfiguracoes {
  carregar(): Promise<Configuracoes>;
  salvar(configuracoes: Configuracoes): Promise<void>;
}
// #endregion
