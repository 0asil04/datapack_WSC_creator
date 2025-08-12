import React, { useState, useCallback, ChangeEvent, useRef, useEffect } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { CLUBS, TARGET_DIMENSION } from '../constants';
import { ActionButton } from './ActionButton';
import { Club } from '../types';

interface ImageProcessorProps {
    initialImageURL?: string | null;
    onSave: (imageDataUrl: string, format: 'png' | 'webp') => void;
    onCancel: () => void;
    mode: 'standalone' | 'modal';
    clubIdForNewFile?: string;
}

const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const ImageProcessor: React.FC<ImageProcessorProps> = ({ initialImageURL = null, onSave, onCancel, mode, clubIdForNewFile }) => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImageDisplayURL, setOriginalImageDisplayURL] = useState<string | null>(initialImageURL);
  const [processedImageURL, setProcessedImageURL] = useState<string | null>(null);
  const [finalImageFormat, setFinalImageFormat] = useState<'png' | 'webp'>('png');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [selectedClubId, setSelectedClubId] = useState<string>(clubIdForNewFile || CLUBS[0]?.id || '1');
  const [clubSearch, setClubSearch] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [activeAction, setActiveAction] = useState<string | null>(null);
  
  useEffect(() => {
      const club = CLUBS.find(c => c.id === selectedClubId);
      if (club) setClubSearch(club.name);
  }, [selectedClubId]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      if (originalImageDisplayURL && !initialImageURL) { // Revoke only if it's a blob URL
        URL.revokeObjectURL(originalImageDisplayURL);
      }
      if (processedImageURL) {
          URL.revokeObjectURL(processedImageURL);
      }
      setOriginalImageDisplayURL(URL.createObjectURL(file));
      setProcessedImageURL(null);
      setError(null);
    }
  };
  
  const processImage = useCallback(<T,>(
    operation: (img: HTMLImageElement) => Promise<string>,
    loadingMsg: string,
    actionName: string
  ) => {
    const sourceUrl = processedImageURL || originalImageDisplayURL;
    if (!sourceUrl) return;
    
    setError(null);
    setIsLoading(true);
    setLoadingMessage(loadingMsg);
    setActiveAction(actionName);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = sourceUrl;
    img.onload = async () => {
      try {
        const resultDataUrl = await operation(img);
        if (processedImageURL) {
            URL.revokeObjectURL(processedImageURL);
        }
        setProcessedImageURL(resultDataUrl);
      } catch (e: any) {
        setError(e.message || 'Ocorreu um erro desconhecido.');
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
        setActiveAction(null);
      }
    };
    img.onerror = () => {
        setError('Não foi possível carregar a imagem para processamento.');
        setIsLoading(false);
        setLoadingMessage('');
        setActiveAction(null);
    };
  }, [originalImageDisplayURL, processedImageURL]);

  const handleRemoveBackground = useCallback(async () => {
    const sourceFile = originalFile;
    if (!sourceFile) {
        setError("Por favor, carregue uma imagem primeiro.");
        return;
    };

    setError(null);
    setIsLoading(true);
    setLoadingMessage('Removendo o fundo... (isso pode levar um momento)');
    setActiveAction('removeBg');

    try {
        const imageBlob = await removeBackground(sourceFile);
        if (processedImageURL) {
            URL.revokeObjectURL(processedImageURL);
        }
        const imageUrl = URL.createObjectURL(imageBlob);
        setProcessedImageURL(imageUrl);
        setFinalImageFormat('png');
    } catch (e: any) {
        const message = e?.message || 'Falha ao remover o fundo. Tente uma imagem diferente.';
        setError(`Erro no processamento: ${message}`);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
        setActiveAction(null);
    }
  }, [originalFile, processedImageURL]);

  const handleProcessAll = useCallback(() => {
    processImage(async (img) => {
      const canvas = document.createElement('canvas');
      canvas.width = TARGET_DIMENSION;
      canvas.height = TARGET_DIMENSION;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível obter o contexto do canvas.');
      ctx.drawImage(img, 0, 0, TARGET_DIMENSION, TARGET_DIMENSION);
      setFinalImageFormat('webp');
      return canvas.toDataURL('image/webp', 0.9);
    }, 'Redimensionando e Convertendo...', 'processAll');
  }, [processImage]);

  const handleConvertToWebP = useCallback(() => {
    processImage(async (img) => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(img, 0, 0);
      setFinalImageFormat('webp');
      return canvas.toDataURL('image/webp', 0.9);
    }, 'Convertendo para .webp...', 'toWebp');
  }, [processImage]);

  const handleResize = useCallback(() => {
    processImage(async (img) => {
      const canvas = document.createElement('canvas');
      canvas.width = TARGET_DIMENSION;
      canvas.height = TARGET_DIMENSION;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(img, 0, 0, TARGET_DIMENSION, TARGET_DIMENSION);
      setFinalImageFormat('png');
      return canvas.toDataURL('image/png');
    }, `Redimensionando para ${TARGET_DIMENSION}x${TARGET_DIMENSION}...`, 'resize');
  }, [processImage]);

  const filteredClubs = CLUBS.filter(club => 
    club.name.toLowerCase().includes(clubSearch.toLowerCase())
  );

  const handleClubSelect = (club: Club) => {
    setSelectedClubId(club.id);
    setClubSearch(club.name);
    setIsDropdownOpen(false);
  };
  
  const handleSaveClick = async () => {
    const urlToSave = processedImageURL || originalImageDisplayURL;
    if (!urlToSave) return;

    // Convert blob URL to data URL if needed, as blob URLs are temporary
    if (urlToSave.startsWith('blob:')) {
        const response = await fetch(urlToSave);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            if (mode === 'standalone') {
              downloadImage(dataUrl, `${selectedClubId}.${finalImageFormat}`);
            } else {
              onSave(dataUrl, finalImageFormat);
            }
        };
        reader.readAsDataURL(blob);
    } else {
       if (mode === 'standalone') {
          downloadImage(urlToSave, `${selectedClubId}.${finalImageFormat}`);
       } else {
         onSave(urlToSave, finalImageFormat);
       }
    }
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    return () => {
      if (originalImageDisplayURL && !initialImageURL) {
        URL.revokeObjectURL(originalImageDisplayURL);
      }
      if (processedImageURL) {
        URL.revokeObjectURL(processedImageURL);
      }
    };
  }, [originalImageDisplayURL, processedImageURL, initialImageURL]);

  const ImageBox = ({ src, label }: { src: string | null; label: string }) => (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-300 mb-2 text-center">{label}</h3>
      <div className="w-full h-48 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
        {src ? (
          <img src={src} alt={label} className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-gray-500">Aguardando imagem</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-800/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="image-upload" className="w-full text-center block bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg cursor-pointer transition-colors duration-200">
              {originalFile ? "Trocar Imagem" : "Carregar Imagem"}
            </label>
            <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          {(mode === 'standalone' || clubIdForNewFile) && (
            <div ref={dropdownRef} className="relative">
              <label htmlFor="club-search" className="block text-sm font-medium text-gray-300 mb-1">Selecione o Clube</label>
              <p className="text-xs text-gray-400 mb-2">Esta opção vai mudar o nome do seu arquivo para o ID do clube que escolheu</p>
              <input
                  id="club-search" type="text" value={clubSearch}
                  onChange={(e) => { setClubSearch(e.target.value); if (!isDropdownOpen) setIsDropdownOpen(true); }}
                  onFocus={() => setIsDropdownOpen(true)} placeholder="Pesquisar clube..."
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="off" />
              {isDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                      {filteredClubs.length > 0 ? (
                          filteredClubs.map(club => (
                              <div key={club.id} onClick={() => handleClubSelect(club)} className="px-4 py-2 text-white hover:bg-blue-600 cursor-pointer">
                                  {club.name}
                              </div>
                          ))
                      ) : <div className="px-4 py-2 text-gray-400">Nenhum clube encontrado</div> }
                  </div>
              )}
            </div>
          )}
          
          <div className="space-y-3 pt-2">
            <ActionButton onClick={handleProcessAll} disabled={!originalImageDisplayURL || isLoading} isLoading={activeAction === 'processAll'} className="bg-green-600 hover:bg-green-700">
              Redimensionar e Converter para .webp
            </ActionButton>
            <ActionButton onClick={handleRemoveBackground} disabled={!originalFile || isLoading} isLoading={activeAction === 'removeBg'}>
                Remover Fundo
              </ActionButton>
            <ActionButton onClick={handleConvertToWebP} disabled={!originalImageDisplayURL || isLoading} isLoading={activeAction === 'toWebp'}>
              Transformar em formato .webp
            </ActionButton>
            <ActionButton onClick={handleResize} disabled={!originalImageDisplayURL || isLoading} isLoading={activeAction === 'resize'}>
              Redimensionar a sua logo (120x120)
            </ActionButton>
          </div>
        </div>

        <div className="flex flex-col gap-6 items-center">
          <div className="grid grid-cols-1 gap-6 w-full">
            <ImageBox src={originalImageDisplayURL} label="Original" />
            <ImageBox src={processedImageURL} label="Resultado" />
          </div>
          
          {isLoading && <p className="text-blue-400 font-semibold">{loadingMessage}</p>}
          {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg text-center">{error}</p>}
          
          <div className="w-full max-w-xs flex flex-col gap-3">
             {(processedImageURL || originalImageDisplayURL) && !isLoading && (
              <button onClick={handleSaveClick} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200">
                {mode === 'standalone' ? 'Baixar Imagem' : 'Salvar Alterações'}
              </button>
            )}
             {mode === 'modal' && (
                <button onClick={onCancel} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                    Cancelar
                </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};