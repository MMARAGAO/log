import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

/**
 * Componente de imagem que carrega arquivos do Supabase Storage
 * com autenticação, mesmo quando o bucket não é público.
 */
export default function AuthenticatedImage({
  src,
  alt,
  className = "",
  onLoad,
  onError,
}: AuthenticatedImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        // Se a URL já é pública (não precisa de auth), usa direto
        if (!src.includes("storage/v1/object/public")) {
          setImageUrl(src);
          setLoading(false);
          return;
        }

        // Extrai bucket e path da URL pública
        const urlParts = src.split("/storage/v1/object/public/");
        if (urlParts.length !== 2) {
          setImageUrl(src);
          setLoading(false);
          return;
        }

        const [, pathWithBucket] = urlParts;
        const [bucket, ...pathParts] = pathWithBucket.split("/");
        const path = pathParts.join("/");

        console.log("🔐 Carregando imagem autenticada:", { bucket, path });

        // Baixa o arquivo com autenticação
        const { data, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(path);

        if (downloadError) {
          console.error("❌ Erro ao baixar imagem autenticada:", downloadError);
          throw downloadError;
        }

        // Cria uma URL local do blob
        const url = URL.createObjectURL(data);
        setImageUrl(url);
        setLoading(false);

        if (onLoad) onLoad();

        // Cleanup: revoga a URL quando o componente for desmontado
        return () => URL.revokeObjectURL(url);
      } catch (err) {
        console.error("❌ Erro ao carregar imagem:", err);
        setError(true);
        setLoading(false);
        if (onError) onError(err);
      }
    };

    loadImage();
  }, [src, onLoad, onError]);

  if (loading) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gray-100`}
      >
        <div className="animate-pulse">
          <DevicePhoneMobileIcon className="w-12 h-12 text-gray-300" />
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gray-100`}
      >
        <DevicePhoneMobileIcon className="w-12 h-12 text-gray-300" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={(e) => {
        console.error("❌ Erro ao renderizar imagem:", e);
        setError(true);
        if (onError) onError(e);
      }}
    />
  );
}
