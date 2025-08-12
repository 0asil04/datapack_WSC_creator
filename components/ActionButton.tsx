import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export const ActionButton: React.FC<ActionButtonProps> = ({ onClick, disabled, children, className = '', isLoading = false }) => {
  const finalDisabled = disabled || isLoading;

  // Base classes are always applied.
  const baseClasses = 'w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center';
  
  // Default color classes for the enabled state. These can be overridden by `className`.
  const defaultEnabledClasses = 'bg-blue-600 hover:bg-blue-700';

  // Disabled classes. These will override any custom colors in `className` because they are applied last.
  const disabledClasses = 'bg-gray-600 cursor-not-allowed';

  return (
    <button
      onClick={onClick}
      disabled={finalDisabled}
      className={`${baseClasses} ${!finalDisabled ? defaultEnabledClasses : ''} ${className} ${finalDisabled ? disabledClasses : ''}`}
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span>Processando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};