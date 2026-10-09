/**
 * Códigos de ação inválida. São chaves de tradução: a interface exibe a
 * mensagem no idioma atual, e o domínio não conhece texto algum.
 */
export type CodigoDeAcaoInvalida =
  | 'error.battleOver'
  | 'error.notYourTurn'
  | 'error.actorDefeated'
  | 'error.invalidTarget'
  | 'error.noAbility'
  | 'error.insufficientResource'
  | 'error.itemUnavailable'
  | 'error.itemNotConsumable'
  | 'error.itemCannotTarget'
  | 'error.assaultUsed'
  | 'error.weaponNotAllowed'
  | 'error.characterDefeated'
  | 'error.invalidAmount'
  | 'error.nothingEquipped'
  | 'error.notInBattle'
  | 'error.inBattle'
  | 'error.sameCharacter'
  | 'error.unknownCharacter';

export class AcaoInvalidaError extends Error {
  constructor(readonly codigo: CodigoDeAcaoInvalida) {
    super(codigo);
    this.name = 'AcaoInvalidaError';
  }
}
