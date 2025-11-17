export function Card({ children, className = '' }) {
  return <div className={`bg-white dark:bg-zinc-800 rounded-2xl shadow-lg ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
