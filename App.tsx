import React, { useState } from 'react';
import { ImageProcessor } from './components/ImageProcessor';
import { ZipEditor } from './components/ZipEditor';

type View = 'mainMenu' | 'imageEditor' | 'zipEditor';

const ImageEditorHeader = () => (
  <header className="text-center my-8">
    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
      Editor de Imagens WSC
    </h1>
    <p className="text-gray-400 mt-2">Ferramentas rápidas para criar logos para seu Data-Pack</p>
  </header>
);

const MainMenu = ({ onNavigate }: { onNavigate: (view: View) => void }) => (
    <div className="bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700">
        <div className="flex flex-col items-center justify-center text-center gap-6 w-full">
            <div className="relative">
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
                    Ferramentas de datapack para WSC
                </h1>
                <span className="absolute -top-2 -right-12 text-xs font-bold bg-purple-600 text-white py-1 px-2 rounded-full transform rotate-12">
                    v2.0
                </span>
            </div>
            <div className="space-y-4 w-full max-w-sm">
                <div>
                    <button
                        disabled
                        className="w-full bg-gray-600 text-gray-400 font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
                        aria-label="Editor de Ficheiro ZIP (Em breve)"
                    >
                        Editor de Ficheiro ZIP
                    </button>
                    <p className="text-xs text-gray-500 mt-1">Em breve, na versão 3.0</p>
                </div>
                <button
                    onClick={() => onNavigate('imageEditor')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                    aria-label="Navegar para o Editor de Imagens WSC"
                >
                    Editor de Imagens WSC
                </button>
                <a
                    href="https://criador-de-data-pack.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                    Editor de arquivos de texto
                </a>
                <a
                    href="https://www.monkeyibrowstudios.com/worldsoccerchamps-dp-instructions/v70/instructions.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                    Baixar datapack PRO e RETROLEGENDS
                </a>
            </div>
            <div className="mt-8 text-center text-sm text-gray-500">
                <p>Criado por: Asil e thesussyboy</p>
            </div>
        </div>
    </div>
);

const ImageEditorView = ({ onBack }: { onBack: () => void }) => (
  <>
    <ImageEditorHeader />
    <ImageProcessor onSave={() => {}} onCancel={onBack} mode="standalone" />
    <div className="text-center my-8">
       <button
        onClick={onBack}
        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        aria-label="Voltar"
      >
        &larr; Voltar
      </button>
    </div>
  </>
);

const ZipEditorView = ({ onBack }: { onBack: () => void }) => (
  <ZipEditor onBack={onBack} />
);

const renderView = (currentView: View, history: View[], setHistory: React.Dispatch<React.SetStateAction<View[]>>) => {
    const goBack = () => {
        if (history.length > 1) {
          setHistory(prev => prev.slice(0, -1));
        }
    };
    
    // Special navigation to reset history stack
    const navigateFromMenu = (view: View) => {
        setHistory(['mainMenu', view]);
    };

    switch(currentView) {
      case 'imageEditor':
        return <ImageEditorView onBack={goBack} />;
      case 'zipEditor':
        return <ZipEditorView onBack={() => setHistory(['mainMenu'])} />;
      case 'mainMenu':
      default:
        return <MainMenu onNavigate={navigateFromMenu} />;
    }
}


function App() {
  const [history, setHistory] = useState<View[]>(['mainMenu']);
  const currentView = history[history.length - 1];

  return (
    <div className="min-h-screen text-gray-100 flex flex-col p-4">
      <main className="flex-grow flex flex-col items-center justify-center">
        {renderView(currentView, history, setHistory)}
      </main>
    </div>
  );
}

export default App;