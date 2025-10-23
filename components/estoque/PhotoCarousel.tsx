/**
 * PhotoCarousel - Componente de carrossel de fotos
 * Navegação entre múltiplas fotos com indicadores
 */

import { useState } from "react";
import { Button } from "@heroui/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
} from "@heroicons/react/24/solid";

interface PhotoCarouselProps {
  photos: string[];
  alt?: string;
  size?: "sm" | "md" | "lg";
}

export default function PhotoCarousel({
  photos,
  alt = "Foto do produto",
  size = "md",
}: PhotoCarouselProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-default-100 rounded-lg ${
          size === "sm" ? "h-20" : size === "lg" ? "h-96" : "h-40"
        }`}
      >
        <PhotoIcon className="w-8 h-8 text-default-400" />
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      className={`relative rounded-lg bg-default-100 flex items-center justify-center ${
        size === "sm" ? "h-20" : size === "lg" ? "h-96" : "h-40"
      }`}
    >
      <img
        src={photos[currentPhotoIndex]}
        alt={`${alt} - foto ${currentPhotoIndex + 1}`}
        className="max-h-full max-w-full object-contain rounded-md"
      />

      {photos.length > 1 && (
        <>
          {/* Botões de navegação */}
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white"
            onPress={handlePrevious}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white"
            onPress={handleNext}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Button>

          {/* Indicadores */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPhotoIndex(index)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentPhotoIndex ? "bg-white" : "bg-white/50"
                }`}
                aria-label={`Ver foto ${index + 1}`}
              />
            ))}
          </div>

          {/* Contador */}
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {currentPhotoIndex + 1} / {photos.length}
          </div>
        </>
      )}
    </div>
  );
}
