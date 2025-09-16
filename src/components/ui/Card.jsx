// src/components/ui/Card.jsx
export const Card = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn('bg-white rounded-lg shadow border border-gray-200', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }) => {
  return (
    <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
      {children}
    </div>
  );
};

export const CardContent = ({ children, className }) => {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className }) => {
  return (
    <div className={cn('px-6 py-4 border-t border-gray-200', className)}>
      {children}
    </div>
  );
};