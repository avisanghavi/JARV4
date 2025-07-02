import { cn } from "@/lib/utils";

interface AgentAvatarProps {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "offline";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12"
};

const statusSizeClasses = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-3.5 h-3.5"
};

export function AgentAvatar({ 
  src, 
  alt, 
  size = "md", 
  status,
  className 
}: AgentAvatarProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      <img
        src={src}
        alt={alt}
        className={cn(
          "rounded-full bg-gray-700 object-cover",
          sizeClasses[size]
        )}
      />
      {status && (
        <span 
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-gray-900",
            statusSizeClasses[size],
            status === "online" ? "bg-green-400" : "bg-gray-500"
          )} 
        />
      )}
    </div>
  );
} 