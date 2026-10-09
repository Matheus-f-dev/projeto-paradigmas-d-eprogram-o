import { AnimatePresence, motion } from 'framer-motion';
import { useAvisos } from '../store/ContextoDoJogo';
import { Icone } from './Icone';

/** Notificações curtas (salvamento, equipamentos, erros de validação). */
export function Avisos() {
  const { avisos } = useAvisos();
  return (
    <div className="avisos" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {avisos.map((aviso) => (
          <motion.div
            key={aviso.id}
            className={`aviso aviso--${aviso.tipo}`}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <Icone nome={aviso.tipo === 'erro' ? 'fechar' : aviso.tipo === 'sucesso' ? 'check' : 'runa'} tamanho={18} />
            <span>{aviso.texto}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
