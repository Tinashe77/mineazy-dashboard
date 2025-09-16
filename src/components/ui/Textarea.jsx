// src/components/ui/Textarea.jsx
export const Textarea = React.forwardRef(({ 
  className, 
  error,
  label,
  required,
  ...props 
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        className={cn(
          'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';