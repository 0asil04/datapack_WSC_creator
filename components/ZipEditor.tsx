import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { CsvEditor } from './CsvEditor';
import { ActionButton } from './ActionButton';
import { ImageProcessor } from './ImageProcessor';

interface ZipEditorProps {
    onBack: () => void;
}

interface FileTreeNode {
    path: string;
    name: string;
    isDir: boolean;
    children: FileTreeNode[];
}

// --- Icons ---
const FolderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;


export const ZipEditor: React.FC<ZipEditorProps> = ({ onBack }) => {
    const [step, setStep] = useState(1);
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [datapackName, setDatapackName] = useState('');
    const [zipInstance, setZipInstance] = useState<JSZip | null>(null);
    const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
    const [editedContent, setEditedContent] = useState<Record<string, string | ArrayBuffer>>({});
    const [activePath, setActivePath] = useState<string | null>(null);
    const [rawContent, setRawContent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // State for image folder view
    const [imageFolderContent, setImageFolderContent] = useState<Record<string, string>>({});
    const [isThumbnailsHidden, setIsThumbnailsHidden] = useState(false);
    
    // State for image editor modal
    const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
    const [editingImage, setEditingImage] = useState<{path: string; url: string | null} | null>(null);


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
    
    const buildFileTree = (zip: JSZip): FileTreeNode[] => {
        const nodes: { [path: string]: FileTreeNode } = {};
    
        // Pass 1: Create all nodes for files and their parent directories
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
                 // Ensure isDir is correctly set if a file is later found inside it
                if (isDir) {
                    nodes[currentPath].isDir = true;
                }
            }
        });
    
        // Pass 2: Link children to parents
        const tree: FileTreeNode[] = [];
        Object.values(nodes).forEach(node => {
            const path = node.path.endsWith('/') ? node.path.slice(0, -1) : node.path;
            const lastSlash = path.lastIndexOf('/');
    
            if (lastSlash === -1) {
                tree.push(node); // Root node
            } else {
                const parentPath = path.substring(0, lastSlash);
                if (nodes[parentPath]) {
                    if (!nodes[parentPath].children.some(child => child.path === node.path)) {
                        nodes[parentPath].children.push(node);
                    }
                }
            }
        });
    
        // Pass 3: Sort all children arrays
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
            const tree = buildFileTree(zip);
            setFileTree(tree);
            // Automatically expand root folders
            const rootFolders = tree.filter(node => node.isDir).map(node => node.path);
            setExpandedFolders(new Set(rootFolders));
            setStep(3);
        } catch (e) {
            console.error(e);
            setError('Falha ao ler o arquivo ZIP. Verifique se o arquivo está corrompido.');
            setStep(1);
        } finally {
            setIsLoading(false);
        }
    }, [zipFile]);

    const handleNodeClick = async (node: FileTreeNode) => {
        setActivePath(node.path);
        setRawContent(null);
        setImageFolderContent({});

        if (node.isDir) {
            // Toggle folder expansion
            setExpandedFolders(p => {
                const newSet = new Set(p);
                if (newSet.has(node.path)) {
                    newSet.delete(node.path);
                } else {
                    newSet.add(node.path);
                }
                return newSet;
            });

            if (['adboards/', 'club_logos/', 'competition_logos/'].some(p => node.path.endsWith(p))) {
                await openImageFolder(node.path);
            }
        } else {
            await openFile(node.path);
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
        
        // Revoke old blob URLs
        Object.values(imageFolderContent).forEach(URL.revokeObjectURL);
        
        setImageFolderContent(newImageFolderContent);
        setIsLoading(false);
    };

    const handleContentChange = (path: string, newContent: string) => {
        setEditedContent(prev => ({ ...prev, [path]: newContent }));
        setRawContent(newContent);
    };

    const handleImageSave = async (path: string, dataUrl: string) => {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        setEditedContent(prev => ({ ...prev, [path]: arrayBuffer }));
        
        // Update thumbnail
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
        setLoadingMessage('Preparando o download...');

        const zipToSave = new JSZip();
        const allFilePaths = new Set(Object.keys(zipInstance.files));
        Object.keys(editedContent).forEach(p => allFilePaths.add(p));

        for (const path of Array.from(allFilePaths)) {
             if (path.endsWith('/')) {
                zipToSave.folder(path);
                continue;
            };

            if (editedContent[path]) {
                 zipToSave.file(path, editedContent[path] as any);
            } else if (zipInstance.files[path]) {
                 zipToSave.file(path, await zipInstance.files[path].async('arraybuffer'));
            }
        }
       
        const blob = await zipToSave.generateAsync({ type: 'blob' });
        saveAs(blob, `${datapackName}.zip`);
        setIsLoading(false);
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
                        className={`w-full flex items-center p-1.5 rounded cursor-pointer truncate ${activePath === node.path ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
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
            <div className="bg-gray-800 p-8 rounded-lg border-2 border-dashed border-gray-600">
                <input id="zip-upload" type="file" accept=".zip" onChange={handleFileChange} className="hidden" />
                <label htmlFor="zip-upload" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg cursor-pointer transition-colors">
                    Selecionar Arquivo ZIP
                </label>
                {error && <p className="text-red-400 mt-4">{error}</p>}
            </div>
            <a href="https://www.monkeyibrowstudios.com/worldsoccerchamps-dp-instructions/v70/instructions.html" target="_blank" rel="noopener noreferrer" className="inline-block mt-6 text-purple-400 hover:text-purple-300">
                Baixar datapack PRO e RETROLEGENDS
            </a>
        </div>
    );

    const renderStep2 = () => (
        <div className="bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">2. Escolha o nome do seu datapack</h2>
            <input type="text" value={datapackName} onChange={(e) => setDatapackName(e.target.value)} placeholder="Nome do Datapack"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 mb-4 focus:ring-blue-500 focus:border-blue-500" />
            <ActionButton onClick={processZipFile} disabled={!datapackName}>
                Continuar
            </ActionButton>
        </div>
    );
    
    const renderContentPanel = () => {
        if (isLoading) return <div className="m-auto text-center"><p className="text-xl">{loadingMessage}</p></div>
        if (!activePath) return <div className="m-auto text-center"><p className="text-gray-400">Selecione um arquivo ou pasta para começar.</p></div>

        if (Object.keys(imageFolderContent).length > 0) {
            return (
                <div className="h-full flex flex-col">
                    <div className="p-2 border-b border-gray-700 flex gap-2">
                        <ActionButton onClick={() => { setEditingImage({ path: activePath, url: null }); setIsImageEditorOpen(true); }} className="bg-green-600 hover:bg-green-700">Adicionar Nova Imagem</ActionButton>
                        <ActionButton onClick={() => setIsThumbnailsHidden(p => !p)} className="bg-gray-600 hover:bg-gray-500">{isThumbnailsHidden ? 'Mostrar' : 'Ocultar'} Miniaturas</ActionButton>
                    </div>
                    {!isThumbnailsHidden && (
                        <div className="flex-grow p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {Object.entries(imageFolderContent).map(([path, url]) => (
                                <div key={path} className="text-center cursor-pointer group" onClick={() => { setEditingImage({ path, url }); setIsImageEditorOpen(true); }}>
                                    <div className="bg-gray-900/50 rounded-lg p-2 aspect-square flex items-center justify-center border-2 border-transparent group-hover:border-blue-500 transition-all">
                                        <img src={url} alt={path} className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <p className="text-xs mt-1 truncate text-gray-400">{path.split('/').pop()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                     {isThumbnailsHidden && <div className="m-auto text-center"><p className="text-gray-400">Miniaturas ocultas.</p></div>}
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
        <div className="w-full h-full flex flex-col bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
            <header className="p-4 bg-gray-900/50 border-b border-gray-700">
                 <h2 className="text-xl font-bold text-center">3. Edite seu datapack</h2>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                    <ActionButton onClick={handleDownload} isLoading={isLoading && loadingMessage.includes('download')} className="bg-green-600 hover:bg-green-700 flex-grow">Baixar Datapack</ActionButton>
                    <ActionButton onClick={onBack} className="bg-red-600 hover:bg-red-700 flex-grow">Sair</ActionButton>
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