"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useContext, useEffect, useMemo, useRef, useState, createContext } from "react";
import Image from "next/image";

type ImageData = { src: string; alt: string };

type ImagePreviewContextValue = {
  open: (image: ImageData) => void;
  close: () => void;
  isOpen: boolean;
  activeImage: ImageData | null;
};

const ImagePreviewContext = createContext<ImagePreviewContextValue | undefined>(undefined);

export function useImagePreview() {
  const context = useContext(ImagePreviewContext);

  if (!context) {
    throw new Error("useImagePreview must be used inside ImagePreviewProvider");
  }

  return context;
}

export function ImagePreviewProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<ImageData | null>(null);

  const open = (image: ImageData) => {
    setActiveImage(image);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setActiveImage(null);
  };

  const value = useMemo(() => ({ open, close, isOpen, activeImage }), [isOpen, activeImage]);

  return (
    <ImagePreviewContext.Provider value={value}>
      {children}
      <ImagePreviewModal />
    </ImagePreviewContext.Provider>
  );
}

function ImagePreviewModal() {
  const { isOpen, activeImage, close } = useImagePreview();
  const prefersReducedMotion = useReducedMotion();
  const scale = useMotionValue(1);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
      scale.set(1);
      dragX.set(0);
      dragY.set(0);
      setIsDragging(false);
    };
  }, [close, isOpen, scale, dragX, dragY]);

  useEffect(() => {
    if (!isOpen) return;

    const onWheel = (event: WheelEvent) => {
      if (!activeImage || !frameRef.current) return;
      const delta = event.deltaY * 0.0015;
      const next = Math.min(3, Math.max(1, Number(scale.get()) + delta * (event.ctrlKey ? 2 : 1)));
      scale.set(next);
      event.preventDefault();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [activeImage, isOpen, scale]);

  const currentScale = Number(scale.get());
  const dragConstraints = useMemo(() => {
    if (!frameRef.current || currentScale <= 1) return { top: 0, left: 0, right: 0, bottom: 0 };

    const bounds = frameRef.current.getBoundingClientRect();
    const maxX = (bounds.width * (currentScale - 1)) / 2;
    const maxY = (bounds.height * (currentScale - 1)) / 2;
    return { top: -maxY, left: -maxX, right: maxX, bottom: maxY };
  }, [currentScale, isOpen]);

  const handleDoubleClick = () => {
    const nextScale = Number(scale.get()) > 1 ? 1 : 2;
    scale.set(nextScale);
    if (nextScale === 1) {
      dragX.set(0);
      dragY.set(0);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && activeImage ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={close}
        >
          <button
            type="button"
            aria-label="Close image preview"
            onClick={(event) => {
              event.stopPropagation();
              close();
            }}
            className="fixed right-5 top-5 z-[1210] flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface-soft"
          >
            <span aria-hidden="true">×</span>
            Close
          </button>

          <motion.div
            ref={frameRef}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-4 flex max-h-[90vh] max-w-[92vw] items-center justify-center overflow-hidden rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <motion.div
              style={{ scale, x: dragX, y: dragY }}
              drag={currentScale > 1}
              dragConstraints={dragConstraints}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              className="relative cursor-grab active:cursor-grabbing"
              whileTap={{ scale: currentScale > 1 ? 1.01 : 1 }}
            >
              <Image
                src={activeImage.src}
                alt={activeImage.alt}
                width={1600}
                height={1200}
                priority
                draggable={false}
                onDoubleClick={handleDoubleClick}
                onWheel={(event) => {
                  if (event.ctrlKey) {
                    event.preventDefault();
                    const next = Math.min(3, Math.max(1, Number(scale.get()) + (event.deltaY > 0 ? -0.12 : 0.12)));
                    scale.set(next);
                  }
                }}
                className="h-auto max-h-[90vh] w-auto max-w-[92vw] select-none object-contain"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
