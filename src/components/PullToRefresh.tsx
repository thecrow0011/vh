import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 60,
  disabled = false,
}) => {
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const isEligibleRef = useRef<boolean>(false);
  const hasTriggeredHapticRef = useRef<boolean>(false);

  // Détection du conteneur défilable actif
  const getActiveScrollElement = useCallback((target: EventTarget | null): HTMLElement | null => {
    if (!target || !(target instanceof HTMLElement)) {
      return containerRef.current?.querySelector('.overflow-y-auto') || null;
    }
    const closestScrollable = target.closest('.overflow-y-auto');
    if (closestScrollable instanceof HTMLElement) {
      return closestScrollable;
    }
    return containerRef.current?.querySelector('.overflow-y-auto') || null;
  }, []);

  // Début du contact tactile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;

    const scrollEl = getActiveScrollElement(e.target);
    const scrollTop = scrollEl ? scrollEl.scrollTop : 0;

    // Éligible au rafraîchissement UNIQUEMENT si le défilement est tout en haut
    if (scrollTop <= 2) {
      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      isEligibleRef.current = true;
      hasTriggeredHapticRef.current = false;
    } else {
      isEligibleRef.current = false;
    }
  };

  // Déplacement du doigt
  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || !isEligibleRef.current) return;

    const scrollEl = getActiveScrollElement(e.target);
    const scrollTop = scrollEl ? scrollEl.scrollTop : 0;

    if (scrollTop > 2) {
      isEligibleRef.current = false;
      setPullDistance(0);
      setIsPulling(false);
      return;
    }

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = currentY - startYRef.current;
    const deltaX = Math.abs(currentX - startXRef.current);

    // Si le geste est plus horizontal que vertical au début, annuler
    if (deltaX > deltaY && pullDistance === 0) {
      isEligibleRef.current = false;
      return;
    }

    // Glissement vers le bas tout en haut
    if (deltaY > 0) {
      // Formule d'amortissement exponentiel pour une sensation élastique naturelle
      const damping = 0.42;
      const distance = Math.min(Math.round(deltaY * damping), 85);

      if (distance > 4) {
        setIsPulling(true);
        setPullDistance(distance);

        // Feedback haptique léger lors du passage du seuil de déclenchement
        if (distance >= threshold && !hasTriggeredHapticRef.current) {
          hasTriggeredHapticRef.current = true;
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate(12);
            } catch {
              // Ignore haptic errors on unsupported platforms
            }
          }
        } else if (distance < threshold) {
          hasTriggeredHapticRef.current = false;
        }

        // Empêche le rebond indésirable du navigateur
        if (e.cancelable && distance > 10) {
          e.preventDefault();
        }
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  // Fin du contact tactile
  const handleTouchEnd = async () => {
    if (disabled || isRefreshing || !isEligibleRef.current) return;

    isEligibleRef.current = false;
    setIsPulling(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(52); // Maintient l'indicateur visible pendant le chargement

      try {
        await onRefresh();
      } catch (err) {
        console.error('Erreur lors du pull-to-refresh:', err);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 500);
      }
    } else {
      setPullDistance(0);
    }
  };

  // Support optionnel du glisser à la souris (pour tester facilement sur ordinateur)
  const isMouseDownRef = useRef<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isRefreshing) return;
    const scrollEl = getActiveScrollElement(e.target);
    const scrollTop = scrollEl ? scrollEl.scrollTop : 0;

    if (scrollTop <= 2) {
      startYRef.current = e.clientY;
      startXRef.current = e.clientX;
      isMouseDownRef.current = true;
      isEligibleRef.current = true;
    }
  };

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current || !isEligibleRef.current || isRefreshing) return;

      const deltaY = e.clientY - startYRef.current;
      if (deltaY > 0) {
        const distance = Math.min(Math.round(deltaY * 0.35), 85);
        if (distance > 4) {
          setIsPulling(true);
          setPullDistance(distance);
        }
      }
    };

    const handleWindowMouseUp = async () => {
      if (!isMouseDownRef.current) return;
      isMouseDownRef.current = false;
      isEligibleRef.current = false;
      setIsPulling(false);

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(52);
        try {
          await onRefresh();
        } catch (err) {
          console.error('Erreur pull-to-refresh souris:', err);
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 500);
        }
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const rotationDeg = isRefreshing ? 0 : Math.min(pullDistance * 4.5, 360);
  const isReadyToRelease = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col overflow-hidden relative min-h-0 w-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      {/* Indicateur de rafraîchissement au tirage */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex justify-center pointer-events-none transition-all"
        style={{
          transform: `translateY(${pullDistance > 0 ? pullDistance - 44 : -50}px)`,
          opacity: pullDistance > 8 || isRefreshing ? 1 : 0,
          transition: isPulling ? 'none' : 'transform 0.25s ease-out, opacity 0.2s ease-out',
        }}
      >
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full shadow-2xl border backdrop-blur-md transition-colors ${
            isReadyToRelease || isRefreshing
              ? 'bg-[#181818] border-[#D4AF37] text-[#D4AF37] ring-2 ring-[#D4AF37]/20'
              : 'bg-[#141414] border-[#333] text-[#AAA]'
          }`}
        >
          <RefreshCw
            className={`w-4 h-4 shrink-0 transition-transform ${
              isRefreshing ? 'animate-spin text-[#D4AF37]' : ''
            }`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${rotationDeg}deg)`,
            }}
          />

          <span className="text-[11px] font-medium tracking-wide">
            {isRefreshing
              ? 'Actualisation de la page...'
              : isReadyToRelease
              ? 'Relâcher pour actualiser'
              : 'Glisser vers le bas pour actualiser'}
          </span>

          {!isRefreshing && !isReadyToRelease && (
            <ArrowDown className="w-3 h-3 text-[#777] animate-bounce" />
          )}
        </div>
      </div>

      {/* Contenu principal de l'application avec légère translation élastique */}
      <div
        className="flex-1 flex flex-col overflow-hidden min-h-0 w-full"
        style={{
          transform: pullDistance > 0 ? `translateY(${Math.round(pullDistance * 0.4)}px)` : undefined,
          transition: isPulling ? 'none' : 'transform 0.25s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};
