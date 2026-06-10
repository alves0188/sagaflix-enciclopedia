import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

// Chaves públicas do Supabase (Seguras para o frontend)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://guecsoghyqvssdvednnv.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YWwu5Pu5JcVoDJ0fwiZn8A_vQfwaHN3';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Faz validação de tamanho, compressão e upload para o Supabase
 * @param {File} file Arquivo de imagem
 * @returns {Promise<string>} URL pública da imagem upada
 */
export async function uploadImage(file) {
  if (!file) throw new Error('Nenhum arquivo fornecido.');

  // Validação de Limite de 5MB
  const MAX_MB = 5;
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`A imagem é muito pesada (Limite de ${MAX_MB}MB).`);
  }

  let fileToUpload = file;
  if (file.type.startsWith('image/')) {
    const options = {
      maxSizeMB: 1, // Tenta comprimir para menos de 1MB
      maxWidthOrHeight: 1920, // Reduz dimensões gigantes para max 1080p
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      fileToUpload = compressedFile;
    } catch (error) {
      console.error('Erro ao comprimir imagem, enviando original:', error);
    }
  }

  // Define um nome único para o arquivo
  const fileExt = fileToUpload.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `images/${fileName}`;

  // Upload para o bucket "uploads"
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(filePath, fileToUpload, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Falha no upload: ${error.message}`);
  }

  // Retorna a URL pública
  const { data: publicData } = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath);

  return publicData.publicUrl;
}
