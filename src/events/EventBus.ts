/**
 * Barramento de eventos tipado (publicar/assinar). Permite que módulos
 * reajam a acontecimentos do jogo sem conhecer quem os produziu.
 */
export type Assinante<T> = (carga: T) => void;

export class EventBus<Mapa extends object> {
  private readonly assinantes = new Map<keyof Mapa, Set<Assinante<never>>>();

  on<K extends keyof Mapa>(tipo: K, assinante: Assinante<Mapa[K]>): () => void {
    const conjunto = this.assinantes.get(tipo) ?? new Set();
    conjunto.add(assinante as Assinante<never>);
    this.assinantes.set(tipo, conjunto);
    return () => {
      conjunto.delete(assinante as Assinante<never>);
    };
  }

  emit<K extends keyof Mapa>(tipo: K, carga: Mapa[K]): void {
    const conjunto = this.assinantes.get(tipo);
    if (!conjunto) return;
    for (const assinante of [...conjunto]) {
      try {
        (assinante as Assinante<Mapa[K]>)(carga);
      } catch (erro) {
        // Um assinante com defeito não pode interromper os demais nem o jogo.
        console.error(`Falha em assinante de "${String(tipo)}"`, erro);
      }
    }
  }

  quantidadeDeAssinantes<K extends keyof Mapa>(tipo: K): number {
    return this.assinantes.get(tipo)?.size ?? 0;
  }
}
