import { ReerguerUmaVez } from '../rules/politicasDeDerrota';
import { Inimigo, type OpcoesDeInimigo } from './Inimigo';

/**
 * Zumbi — exemplo do PDF para o OCP: "um Zumbi que não morre na primeira
 * vez que a vida zera". Nenhuma linha de Personagem.receberDano foi
 * alterada; basta uma nova política de derrota.
 */
export class Zumbi extends Inimigo {
  static readonly FRACAO_AO_REERGUER = 0.5;
  override readonly classe = 'zumbi';

  constructor(nome: string, vida: number, ataque: number, opcoes: OpcoesDeInimigo = {}) {
    super(nome, vida, ataque, {
      tipoCriatura: 'morto-vivo',
      politicaDeDerrota: new ReerguerUmaVez(Zumbi.FRACAO_AO_REERGUER),
      ...opcoes,
    });
  }
}
