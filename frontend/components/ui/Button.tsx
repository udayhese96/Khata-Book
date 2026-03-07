import { ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
    isLoading?: boolean;
}

export function Button({ children, className, variant = 'primary', isLoading, ...props }: ButtonProps) {
    const baseStyles = "px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-black text-white hover:bg-gray-900 shadow-lg hover:shadow-xl",
        secondary: "bg-white/20 text-black backdrop-blur-md hover:bg-white/30 border border-white/20",
        outline: "border-2 border-black/10 hover:border-black/30 text-black bg-transparent"
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(baseStyles, variants[variant], className)}
            disabled={isLoading || props.disabled}
            {...props as any}
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : children}
        </motion.button>
    );
}
