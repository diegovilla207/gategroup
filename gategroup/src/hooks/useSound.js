import { useState, useEffect } from 'react';

/**
 * Hook personalizado para reproducir sonidos de UI de forma eficiente.
 * @param {string} soundFile - La ruta al archivo de sonido (importado).
 * @param {object} options - Opciones como volumen.
 */
export const useSound = (soundFile, { volume = 0.5 } = {}) => {
  const [audio] = useState(() => {
    const aud = new Audio(soundFile);
    aud.volume = volume;
    return aud;
  });

  useEffect(() => {
    // Limpieza por si el componente se desmonta
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);

  const play = () => {
    // Reinicia el sonido en cada clic para permitir clics rápidos
    audio.currentTime = 0;
    
    // Reproducir el sonido y asegurarnos que termine antes de la navegación
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        console.error("No se pudo reproducir el sonido:", e);
      });
    }
    
    // Retornamos una promesa que se resuelve cuando el sonido termina
    return new Promise((resolve) => {
      audio.onended = resolve;
      // También resolvemos después de 300ms por si acaso
      setTimeout(resolve, 300);
    });
  };

  return play;
};