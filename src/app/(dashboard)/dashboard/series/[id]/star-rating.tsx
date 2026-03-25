"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number | null;
  onChange?: (rating: number | null) => void;
  readonly?: boolean;
}

export function StarRating({ value, onChange, readonly = false }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="flex gap-0.5" role="group" aria-label="Bewertung">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`p-0 h-5 w-5 transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(null)}
          onClick={() => {
            if (!readonly && onChange) {
              onChange(value === star ? null : star);
            }
          }}
          aria-label={`${star} Stern${star > 1 ? "e" : ""}`}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              (hover !== null ? star <= hover : star <= (value ?? 0))
                ? "fill-warning text-warning"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
