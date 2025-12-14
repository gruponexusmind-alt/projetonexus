// Utilitários para validação e manipulação de arquivos anexados às tarefas

// Tipos de arquivo permitidos
export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
] as const;

export const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'] as const;

// Tamanho máximo: 10 MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB em bytes

/**
 * Valida se o arquivo é uma imagem permitida
 */
export function isValidImageFile(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type as any);
}

/**
 * Valida se o tamanho do arquivo está dentro do limite
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Valida se a extensão do arquivo é permitida
 */
export function hasValidExtension(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext as any);
}

/**
 * Formata o tamanho do arquivo para exibição (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Gera um nome único para o arquivo com sanitização completa
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);

  // Extrair extensão de forma segura
  const lastDotIndex = originalName.lastIndexOf('.');
  const ext = lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : '';
  const nameWithoutExt = lastDotIndex !== -1
    ? originalName.substring(0, lastDotIndex)
    : originalName;

  // Sanitizar nome: remove acentos, espaços e caracteres especiais
  const safeName = nameWithoutExt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9]/g, '_')   // Substitui caracteres especiais por _
    .replace(/_+/g, '_')              // Remove múltiplos underscores consecutivos
    .replace(/^_|_$/g, '')            // Remove underscores no início e fim
    .substring(0, 50);

  // Sanitizar extensão também
  const safeExt = ext
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '');

  return `${safeName || 'file'}_${timestamp}_${randomStr}${safeExt}`;
}

/**
 * Valida múltiplos arquivos de uma vez
 */
export interface FileValidationResult {
  valid: File[];
  invalid: {
    file: File;
    reason: string;
  }[];
}

export function validateFiles(files: File[]): FileValidationResult {
  const result: FileValidationResult = {
    valid: [],
    invalid: [],
  };

  files.forEach((file) => {
    if (!isValidImageFile(file)) {
      result.invalid.push({
        file,
        reason: 'Tipo de arquivo não permitido. Use apenas PNG, JPG, GIF ou WebP.',
      });
    } else if (!isValidFileSize(file)) {
      result.invalid.push({
        file,
        reason: `Arquivo muito grande. Tamanho máximo: ${formatFileSize(MAX_FILE_SIZE)}.`,
      });
    } else if (!hasValidExtension(file.name)) {
      result.invalid.push({
        file,
        reason: 'Extensão de arquivo não permitida.',
      });
    } else {
      result.valid.push(file);
    }
  });

  return result;
}

/**
 * Cria uma URL de preview para uma imagem
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Falha ao criar preview da imagem'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Obtém o ícone apropriado para o tipo de arquivo
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  return '📎';
}
