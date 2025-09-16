// src/components/ui/Alert.jsx
export const Alert = ({ 
  children, 
  variant = 'info', 
  className,
  onClose
}) => {
  const variants = {
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    error: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className={cn(
      'border rounded-md p-4',
      variants[variant],
      className
    )}>
      <div className="flex justify-between">
        <div>{children}</div>
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-2 text-current hover:text-current/80"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export { Button };