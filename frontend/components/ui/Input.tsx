import { InputHTMLAttributes, forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && (
                    <label className="text-sm font-medium text-gray-700 ml-1">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={cn(
                        "px-4 py-3 rounded-xl bg-white/50 backdrop-blur-sm border border-black/5 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all duration-300 placeholder:text-gray-400",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
                        className
                    )}
                    {...props}
                />
                {error && (
                    <span className="text-xs text-red-500 ml-1">{error}</span>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
