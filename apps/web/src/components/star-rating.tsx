"use client";

import { cn } from "@arcle/ui/lib/utils";
import { Star, StarHalf } from "@phosphor-icons/react";
import { useState } from "react";

const SIZE_CLASSES = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
} as const;

interface StarRatingProps {
  value: number | null;
  onChange?: (score: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  showValue?: boolean;
}

export function StarRating({
  value,
  onChange,
  size = "md",
  disabled = false,
  showValue = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const isInteractive = !!onChange && !disabled;
  const displayValue = hoverValue ?? value ?? 0;
  const starValue = displayValue / 2;

  const handleClick = (starIndex: number, isHalf: boolean) => {
    if (!isInteractive) return;
    const score = isHalf ? starIndex * 2 - 1 : starIndex * 2;
    onChange(score);
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLButtonElement>,
    starIndex: number,
  ) => {
    if (!isInteractive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isHalf = e.clientX - rect.left < rect.width / 2;
    const score = isHalf ? starIndex * 2 - 1 : starIndex * 2;
    setHoverValue(score);
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const renderStar = (index: number) => {
    const starNumber = index + 1;
    const filled = starValue >= starNumber;
    const halfFilled = !filled && starValue >= starNumber - 0.5;
    const sizeClass = SIZE_CLASSES[size];

    if (isInteractive) {
      return (
        <button
          key={index}
          type="button"
          className={cn(
            "relative text-amber-400 transition-transform hover:scale-110 focus:outline-none",
            disabled && "cursor-not-allowed opacity-50",
          )}
          onMouseMove={(e) => handleMouseMove(e, starNumber)}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const isHalf = e.clientX - rect.left < rect.width / 2;
            handleClick(starNumber, isHalf);
          }}
          disabled={disabled}
        >
          {filled ? (
            <Star weight="fill" className={sizeClass} />
          ) : halfFilled ? (
            <StarHalf weight="fill" className={sizeClass} />
          ) : (
            <Star
              weight="regular"
              className={cn(sizeClass, "text-muted-foreground/40")}
            />
          )}
        </button>
      );
    }

    return (
      <span key={index} className="text-amber-400">
        {filled ? (
          <Star weight="fill" className={sizeClass} />
        ) : halfFilled ? (
          <StarHalf weight="fill" className={sizeClass} />
        ) : (
          <Star
            weight="regular"
            className={cn(sizeClass, "text-muted-foreground/40")}
          />
        )}
      </span>
    );
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map(renderStar)}
      </div>
      {showValue && value !== null && (
        <span className="ml-1.5 text-sm text-muted-foreground">{value}/10</span>
      )}
    </div>
  );
}
