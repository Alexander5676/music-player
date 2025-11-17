export function Button({ children, onClick, className = '', variant = 'default' }) {
  const base = 'px-3 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center';
  const styles = {
    default: 'bg-blue-500 text-white hover:bg-blue-600',
    ghost: 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
  };
  return (
    <button onClick={onClick} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}
