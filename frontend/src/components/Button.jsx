import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

const variants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.25)]',
  secondary: 'border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 focus-visible:ring-slate-400',
  outline: 'border border-white/10 bg-transparent text-slate-200 hover:bg-white/5 focus-visible:ring-indigo-400',
  ghost: 'bg-transparent text-slate-300 hover:bg-white/5 focus-visible:ring-indigo-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-400'
};

const sizes = {
  sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
  md: 'h-10 px-4 text-sm rounded-lg gap-2',
  lg: 'h-12 px-6 text-base rounded-lg gap-2.5'
};

export const Button = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  icon: Icon,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="h-4 w-4 text-current" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
