import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { CsvEditor } from './CsvEditor';
import { ActionButton } from './ActionButton';
import { ImageProcessor } from './ImageProcessor';
import { CLUBS } from '../constants';

interface ZipEditorProps {
    onBack: () => void;
}

interface FileTreeNode {
    path: string;
    name: string;
    isDir: boolean;
    children: FileTreeNode[];
}

const IMAGES_PER_PAGE = 48;

// --- Icons ---
const FolderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

const parseCsvForEditor = (text: string): { id: string, values: string }[] => {
    if (!text) return [];
    return text.split('\n').filter(line => line.trim()).map(line => {
        const firstCommaIndex = line.indexOf(',');
        if (firstCommaIndex === -1) {
            return { id: line.trim(), values: '' };
        }
        return {
            id: line.substring(0, firstCommaIndex).trim(),
            values: line.substring(firstCommaIndex + 1)
        };
    }).filter(row => row.id !== '');
};


export const ZipEditor: React.FC<ZipEditorProps> = ({ onBack }) => {
    const [step, setStep] = useState(1);
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [datapackName, setDatapackName] = useState('');
    const [zipInstance, setZipInstance] = useState<JSZip | null>(null);
    const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
    const [rootFolderPath, setRootFolderPath] = useState<string | null>(null);
    const [editedContent, setEditedContent] = useState<Record<string, string | ArrayBuffer>>({});
    const [activePath, setActivePath] = useState<string | null>(null);
    const [rawContent, setRawContent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [progress, setProgress] = useState(0);

    // State for image folder view
    const [imageFolderContent, setImageFolderContent] = useState<Record<string, string>>({});
    const [isThumbnailsHidden, setIsThumbnailsHidden] = useState(false);
    const [imageSearchTerm, setImageSearchTerm] = useState('');
    const [imageCurrentPage, setImageCurrentPage] = useState(1);
    
    // State for image editor modal
    const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
    const [editingImage, setEditingImage] = useState<{path: string; url: string | null} | null>(null);

    const [clubIdToNameMap, setClubIdToNameMap] = useState<Record<string, string>>({});

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.name.toLowerCase().endsWith('.zip')) {
            setZipFile(file);
            setDatapackName(file.name.replace(/\.zip$/i, ''));
            setError('');
            setStep(2);
        } else {
            setError('Por favor, selecione um arquivo .zip válido.');
        }
    };
    
    const handleBackToStep1 = () => {
        setZipFile(null);
        setDatapackName('');
        setError('');
        // Reset editor state
        setZipInstance(null);
        setFileTree([]);
        setRootFolderPath(null);
        setEditedContent({});
        setActivePath(null);
        setRawContent(null);
        setExpandedFolders(new Set());
        setImageFolderContent({});
        setClubIdToNameMap({});
        setStep(1);
        setProgress(0);
    };

    const buildFileTree = (zip: JSZip): FileTreeNode[] => {
        const nodes: { [path: string]: FileTreeNode } = {};
    
        zip.forEach((relativePath, zipObject) => {
            const pathParts = relativePath.replace(/\/$/, "").split('/');
            let currentPath = '';
            for (let i = 0; i < pathParts.length; i++) {
                const part = pathParts[i];
                currentPath += (i > 0 ? '/' : '') + part;
                const isDir = i < pathParts.length - 1 || zipObject.dir;
    
                if (!nodes[currentPath]) {
                    nodes[currentPath] = {
                        name: part,
                        path: isDir && !currentPath.endsWith('/') ? `${currentPath}/` : currentPath,
                        isDir: isDir,
                        children: [],
                    };
                }
                if (isDir) {
                    nodes[currentPath].isDir = true;
                }
            }
        });
    
        const tree: FileTreeNode[] = [];
        Object.values(nodes).forEach(node => {
            const path = node.path.endsWith('/') ? node.path.slice(0, -1) : node.path;
            const lastSlash = path.lastIndexOf('/');
    
            if (lastSlash === -1) {
                tree.push(node);
            } else {
                const parentPath = path.substring(0, lastSlash);
                if (nodes[parentPath] && !nodes[parentPath].children.some(child => child.path === node.path)) {
                    nodes[parentPath].children.push(node);
                }
            }
        });
    
        const sortChildren = (nodesToSort: FileTreeNode[]) => {
            nodesToSort.sort((a, b) => {
                if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
            nodesToSort.forEach(node => sortChildren(node.children));
        };
    
        sortChildren(tree);
        return tree;
    };

    const processZipFile = useCallback(async () => {
        if (!zipFile) return;
        setIsLoading(true);
        setLoadingMessage('Processando ZIP...');
        try {
            const zip = await JSZip.loadAsync(zipFile);
            setZipInstance(zip);
            
            // Parse teams.csv or clubs.csv for name mapping
            const teamsFile = zip.file('teams.csv') || zip.file('clubs.csv');
            let idToNameMap: Record<string, string> = {};
            if (teamsFile) {
                try {
                    const content = await teamsFile.async('string');
                    const parsed = parseCsvForEditor(content);
                    idToNameMap = parsed.reduce((acc, team) => {
                        acc[team.id] = team.values.split(',')[0]?.trim() || '';
                        return acc;
                    }, {} as Record<string, string>);
                } catch (e) {
                    console.error("Could not read teams/clubs file, falling back to constants", e);
                }
            }

            if (Object.keys(idToNameMap).length === 0) {
                idToNameMap = CLUBS.reduce((acc, club) => {
                    acc[club.id] = club.name;
                    return acc;
                }, {} as Record<string, string>);
            }
            setClubIdToNameMap(idToNameMap);

            let initialTree = buildFileTree(zip);
            let finalTree = initialTree;
            const rootNode = initialTree.length === 1 && initialTree[0].isDir ? initialTree[0] : null;

            if (rootNode) {
                setRootFolderPath(rootNode.path);
                if (datapackName && rootNode.name !== datapackName) {
                    const newRootNode = { ...rootNode, name: datapackName };
                    finalTree = [newRootNode];
                }
            } else {
                setRootFolderPath(null);
            }

            setFileTree(finalTree);
            const rootFolders = finalTree.filter(node => node.isDir).map(node => node.path);
            setExpandedFolders(new Set(rootFolders));
            setStep(3);
        } catch (e) {
            console.error(e);
            setError('Falha ao ler o arquivo ZIP. Verifique se o arquivo está corrompido.');
            setStep(1);
        } finally {
            setIsLoading(false);
            setProgress(0);
        }
    }, [zipFile, datapackName]);

    const handleNodeClick = async (node: FileTreeNode) => {
        let originalPath = node.path;
        if (rootFolderPath && node.path === `${datapackName}/`) {
            originalPath = rootFolderPath;
        }

        setActivePath(originalPath);
        setRawContent(null);
        setImageFolderContent({});
        setImageSearchTerm('');
        setImageCurrentPage(1);

        if (node.isDir) {
            setExpandedFolders(p => {
                const newSet = new Set(p);
                newSet.has(node.path) ? newSet.delete(node.path) : newSet.add(node.path);
                return newSet;
            });

            if (['adboards/', 'club_logos/', 'competition_logos/'].some(p => originalPath.endsWith(p))) {
                await openImageFolder(originalPath);
            }
        } else {
            await openFile(originalPath);
        }
    };

    const openFile = async (path: string) => {
        if (!zipInstance) return;
        setIsLoading(true);
        setLoadingMessage('Abrindo arquivo...');
        
        try {
            const content = editedContent[path] || await zipInstance.file(path)?.async('string');
            if (typeof content === 'string') {
                setRawContent(content);
            }
        } catch(e) {
            setError(`Não foi possível ler o arquivo: ${path}`);
            setRawContent(null);
        } finally {
            setIsLoading(false);
        }
    };

    const openImageFolder = async (folderPath: string) => {
        if (!zipInstance) return;
        setIsLoading(true);
        setLoadingMessage('Carregando imagens...');
        const folder = zipInstance.folder(folderPath);
        if (!folder) {
            setIsLoading(false);
            return;
        }

        const promises: Promise<{ path: string; url: string }>[] = [];
        folder.forEach((relativePath, file) => {
            if (!file.dir && /\.(png|jpg|jpeg|webp)$/i.test(file.name)) {
                const promise = (async () => {
                    const fullPath = file.name;
                    const content = editedContent[fullPath] || await file.async('blob');
                    const blob = content instanceof Blob ? content : new Blob([content as ArrayBuffer]);
                    return { path: fullPath, url: URL.createObjectURL(blob) };
                })();
                promises.push(promise);
            }
        });
        
        const results = await Promise.all(promises);
        const newImageFolderContent = results.reduce((acc, {path, url}) => ({ ...acc, [path]: url }), {});
        
        Object.values(imageFolderContent).forEach(URL.revokeObjectURL);
        setImageFolderContent(newImageFolderContent);
        setIsLoading(false);
    };

    const handleContentChange = (path: string, newContent: string) => {
        setEditedContent(prev => ({ ...prev, [path]: newContent }));
        setRawContent(newContent);

        if (path.endsWith('teams.csv') || path.endsWith('clubs.csv')) {
            const parsed = parseCsvForEditor(newContent);
            const idToNameMap = parsed.reduce((acc, team) => {
                acc[team.id] = team.values.split(',')[0]?.trim() || '';
                return acc;
            }, {} as Record<string, string>);
            setClubIdToNameMap(idToNameMap);
        }
    };

    const handleImageSave = async (path: string, dataUrl: string) => {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        setEditedContent(prev => ({ ...prev, [path]: arrayBuffer }));
        
        const oldUrl = imageFolderContent[path];
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        setImageFolderContent(prev => ({ ...prev, [path]: URL.createObjectURL(blob) }));

        setIsImageEditorOpen(false);
        setEditingImage(null);
    };

    const handleAddNewImage = (path: string, dataUrl: string, format: 'png' | 'webp') => {
        const clubId = prompt("Digite o ID do clube para o novo logo:");
        if (!clubId) return;

        const newPath = `${path}${clubId}.${format}`;
        handleImageSave(newPath, dataUrl);
    };
    
    const handleDownload = async () => {
        if (!zipInstance) return;
    
        setIsLoading(true);
        setProgress(0);
        setLoadingMessage('Preparando arquivos...');
    
        await new Promise(resolve => setTimeout(resolve, 50));
    
        const zipToSave = new JSZip();
        const allFilePathsSet = new Set([
            ...Object.keys(zipInstance.files),
            ...Object.keys(editedContent),
        ]);
        const allFilePaths = Array.from(allFilePathsSet);
    
        const shouldRename = rootFolderPath && datapackName && rootFolderPath !== `${datapackName}/`;
    
        // Preparation loop
        for (let i = 0; i < allFilePaths.length; i++) {
            const path = allFilePaths[i];
            const currentProgress = ((i + 1) / allFilePaths.length) * 100;
            setProgress(currentProgress);
            const filename = path.split('/').pop();
            if(filename) {
                setLoadingMessage(`Preparando: ${filename}`);
            }
    
            let finalPath = path;
            if (shouldRename && path.startsWith(rootFolderPath!)) {
                finalPath = path.replace(rootFolderPath!, `${datapackName}/`);
            }
    
            if (path.endsWith('/')) {
                zipToSave.folder(finalPath);
                continue;
            }
    
            if (editedContent[path]) {
                zipToSave.file(finalPath, editedContent[path] as any);
            } else if (zipInstance.files[path]) {
                zipToSave.file(finalPath, await zipInstance.files[path].async('arraybuffer'));
            }
            
            if (i % 20 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
    
        // Compression stage
        setLoadingMessage('Compactando arquivos...');
        setProgress(0); 
           
        try {
            const blob = await zipToSave.generateAsync(
                { type: 'blob', streamFiles: true },
                (metadata) => {
                    setProgress(metadata.percent);
                    if (metadata.currentFile) {
                        setLoadingMessage(`Compactando: ${metadata.currentFile.split('/').pop()}`);
                    }
                }
            );
            setProgress(100);
            setLoadingMessage('Download concluído!');
            saveAs(blob, `${datapackName}.zip`);
        } catch (e) {
            console.error("Error generating zip:", e);
            setError("Ocorreu um erro ao gerar o arquivo ZIP.");
        } finally {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsLoading(false);
            setProgress(0);
        }
    };
    
    useEffect(() => {
        if (step === 3 && zipFile && !zipInstance) {
            processZipFile();
        }
    }, [step, zipFile, zipInstance, processZipFile]);

    const FileTreeRenderer: React.FC<{ nodes: FileTreeNode[], level: number }> = ({ nodes, level }) => (
        <ul className={level > 0 ? "pl-4" : ""}>
            {nodes.map(node => (
                <li key={node.path}>
                    <div
                        onClick={() => handleNodeClick(node)}
                        className={`w-full flex items-center p-1.5 rounded cursor-pointer truncate ${activePath === node.path || (rootFolderPath === node.path && activePath?.startsWith(rootFolderPath)) ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                    >
                         <span className="w-4 mr-1 text-center">
                            {node.isDir && (expandedFolders.has(node.path) ? <ChevronDownIcon/> : <ChevronRightIcon/>)}
                         </span>
                        {node.isDir ? <FolderIcon /> : <FileIcon />}
                        <span className="flex-1 truncate">{node.name}</span>
                    </div>
                    {node.isDir && expandedFolders.has(node.path) && <FileTreeRenderer nodes={node.children} level={level + 1} />}
                </li>
            ))}
        </ul>
    );
    
    const renderStep1 = () => (
        <div className="bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">1. Coloque o ficheiro ZIP do seu datapack</h2>
            <div className="bg-gray-800 p-8 rounded-lg border-2 border-dashed border-gray-600 mb-6">
                <input id="zip-upload" type="file" accept=".zip" onChange={handleFileChange} className="hidden" />
                <label htmlFor="zip-upload" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg cursor-pointer transition-colors">
                    Selecionar Arquivo ZIP
                </label>
                {error && <p className="text-red-400 mt-4">{error}</p>}
            </div>
            <div className="flex flex-col gap-4">
                <a href="https://www.monkeyibrowstudios.com/worldsoccerchamps-dp-instructions/v70/instructions.html" target="_blank" rel="noopener noreferrer" className="inline-block text-purple-400 hover:text-purple-300">
                    Baixar datapack PRO e RETROLEGENDS
                </a>
                <ActionButton onClick={onBack} className="bg-gray-600 hover:bg-gray-500">
                    Voltar
                </ActionButton>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">2. Escolha o nome do seu datapack</h2>
            <p className="text-gray-400 text-sm mb-4">Este será o nome do arquivo .zip final e da pasta principal dentro dele.</p>
            <input type="text" value={datapackName} onChange={(e) => setDatapackName(e.target.value)} placeholder="Nome do Datapack"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 mb-6 focus:ring-blue-500 focus:border-blue-500" />
            <div className="flex gap-4 justify-center">
                <ActionButton onClick={handleBackToStep1} className="bg-gray-600 hover:bg-gray-500">
                    Voltar
                </ActionButton>
                <ActionButton onClick={processZipFile} disabled={!datapackName}>
                    Continuar
                </ActionButton>
            </div>
        </div>
    );
    
    const renderContentPanel = () => {
        if (isLoading && !activePath) return <div className="m-auto text-center"><p className="text-xl">{loadingMessage}</p></div>
        if (!activePath && !isLoading) return <div className="m-auto text-center"><p className="text-gray-400">Selecione um arquivo ou pasta para começar.</p></div>

        if (Object.keys(imageFolderContent).length > 0) {
            const filteredImages = Object.entries(imageFolderContent).filter(([path]) => {
                const searchTermLower = imageSearchTerm.toLowerCase();
                if (!searchTermLower.trim()) return true;

                const filename = path.split('/').pop()?.toLowerCase() || '';

                if (filename.includes(searchTermLower)) {
                    return true;
                }

                if (activePath?.includes('club_logos')) {
                    const fileId = filename.replace(/\.(webp|png|jpg|jpeg)$/i, '');
                    const clubName = clubIdToNameMap[fileId]?.toLowerCase();
                    if (clubName && clubName.includes(searchTermLower)) {
                        return true;
                    }
                }
                
                return false;
            });

            const totalPages = Math.ceil(filteredImages.length / IMAGES_PER_PAGE);
            const paginatedImages = filteredImages.slice((imageCurrentPage - 1) * IMAGES_PER_PAGE, imageCurrentPage * IMAGES_PER_PAGE);

            return (
                <div className="h-full flex flex-col">
                    <div className="p-2 border-b border-gray-700 flex flex-wrap gap-2 items-center">
                         <div className="flex-grow min-w-[250px]">
                            <input
                                type="text"
                                placeholder={`Pesquisar em ${Object.keys(imageFolderContent).length} imagens...`}
                                value={imageSearchTerm}
                                onChange={(e) => { 
                                    setImageSearchTerm(e.target.value);
                                    setImageCurrentPage(1);
                                }}
                                className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>
                        <ActionButton onClick={() => { setEditingImage({ path: activePath, url: null }); setIsImageEditorOpen(true); }} className="!w-auto flex-shrink-0 bg-green-600 hover:bg-green-700">Adicionar Nova Imagem</ActionButton>
                        <ActionButton onClick={() => setIsThumbnailsHidden(p => !p)} className="!w-auto flex-shrink-0 bg-gray-600 hover:bg-gray-500">{isThumbnailsHidden ? 'Mostrar' : 'Ocultar'} Miniaturas</ActionButton>
                    </div>
                    {!isThumbnailsHidden && (
                        <div className="flex-grow p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 gap-4">
                            {isLoading ? (
                                <div className="col-span-full text-center text-gray-400 mt-10">
                                    {loadingMessage}
                                </div>
                            ) : paginatedImages.length > 0 ? paginatedImages.map(([path, url]) => (
                                <div key={path} className="text-center cursor-pointer group" onClick={() => { setEditingImage({ path, url }); setIsImageEditorOpen(true); }}>
                                    <div className="bg-gray-900/50 rounded-lg p-2 aspect-square flex items-center justify-center border-2 border-transparent group-hover:border-blue-500 transition-all">
                                        <img src={url} alt={path} className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <p className="text-xs mt-1 truncate text-gray-400">{path.split('/').pop()}</p>
                                </div>
                            )) : (
                                <div className="col-span-full text-center text-gray-400 mt-10">
                                    Nenhuma imagem encontrada para "{imageSearchTerm}".
                                </div>
                            )}
                        </div>
                    )}
                     {isThumbnailsHidden && <div className="m-auto text-center"><p className="text-gray-400">Miniaturas ocultas.</p></div>}
                    {totalPages > 1 && !isThumbnailsHidden && (
                        <div className="p-2 border-t border-gray-700 flex justify-center items-center gap-4">
                            <ActionButton onClick={() => setImageCurrentPage(p => p - 1)} disabled={imageCurrentPage === 1} className="!w-auto !py-1 !px-4">Anterior</ActionButton>
                            <span className="text-sm font-semibold">Página {imageCurrentPage} de {totalPages}</span>
                            <ActionButton onClick={() => setImageCurrentPage(p => p + 1)} disabled={imageCurrentPage === totalPages} className="!w-auto !py-1 !px-4">Próxima</ActionButton>
                        </div>
                    )}
                </div>
            )
        }

        if (rawContent !== null && activePath?.endsWith('.csv')) {
            return <CsvEditor key={activePath} filePath={activePath} content={rawContent} onContentChange={(newContent) => handleContentChange(activePath, newContent)} zipInstance={zipInstance} />
        }
        
        if (rawContent !== null) {
            return <textarea value={rawContent} onChange={(e) => handleContentChange(activePath!, e.target.value)} className="w-full h-full bg-transparent text-gray-200 rounded-lg p-4 font-mono text-sm outline-none" />
        }
        
         return <div className="m-auto text-center"><p className="text-gray-400">Selecione um arquivo para editar.</p></div>;
    }


    const renderStep3 = () => (
        <div className="w-full h-full flex flex-col bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700 overflow-hidden relative">
            {isLoading && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-xl font-semibold mb-4 text-white">{loadingMessage}</p>
                    {progress > 0 && (
                         <div className="w-full max-w-md bg-gray-600 rounded-full h-4 overflow-hidden">
                            <div
                                className="bg-blue-500 h-4 rounded-full transition-all duration-150"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    )}
                    {progress > 0 && <p className="mt-2 text-lg text-white">{Math.round(progress)}%</p>}
                </div>
            )}
            <header className="p-4 bg-gray-900/50 border-b border-gray-700">
                 <h2 className="text-xl font-bold text-center">3. Editando: <span className="text-blue-400">{datapackName}</span></h2>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                    <ActionButton onClick={handleDownload} disabled={isLoading} className="bg-green-600 hover:bg-green-700 flex-grow">Baixar Datapack</ActionButton>
                    <ActionButton onClick={onBack} disabled={isLoading} className="bg-red-600 hover:bg-red-700 flex-grow">Sair</ActionButton>
                </div>
            </header>

            <div className="flex flex-grow overflow-hidden">
                <aside className="w-1/3 min-w-64 max-w-sm p-2 border-r border-gray-700 overflow-y-auto">
                    <FileTreeRenderer nodes={fileTree} level={0} />
                </aside>
                <main className="flex-grow flex flex-col overflow-hidden bg-black/20">
                    {renderContentPanel()}
                </main>
            </div>
             {isImageEditorOpen && editingImage && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-5xl">
                         <ImageProcessor
                            key={editingImage.path}
                            initialImageURL={editingImage.url}
                            onSave={(dataUrl, format) => editingImage.url ? handleImageSave(editingImage.path, dataUrl) : handleAddNewImage(editingImage.path, dataUrl, format)}
                            onCancel={() => setIsImageEditorOpen(false)}
                            mode="modal"
                            clubIdForNewFile={editingImage.url ? undefined : editingImage.path}
                        />
                    </div>
                </div>
            )}
        </div>
    );

    if (isLoading && step < 3) return <div className="text-center"><h2 className="text-2xl">{loadingMessage}</h2></div>;

    return (
        <div className="w-full h-[85vh] max-w-7xl mx-auto flex items-center justify-center">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
        </div>
    );
};