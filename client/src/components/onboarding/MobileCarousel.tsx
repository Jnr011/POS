import { useState } from 'react';
import {
  Dialog, DialogContent,
} from '../ui/dialog';
import { Button } from '../ui/button';
import {
  LayoutDashboard, BarChart3, ShoppingCart, Receipt, Package,
  TrendingUp, Users, Settings, User, ChevronLeft, ChevronRight,
  X,
} from 'lucide-react';
import type { MobileSlide } from '../../types/onboarding';
import { cn } from '../../lib/utils';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, BarChart3, ShoppingCart, Receipt, Package,
  TrendingUp, Users, Settings, User,
};

interface MobileCarouselProps {
  open: boolean;
  slides: MobileSlide[];
  onComplete: () => void;
  onSkip: () => void;
}

export function MobileCarousel({ open, slides, onComplete, onSkip }: MobileCarouselProps) {
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;
  const slide = slides[index];
  const Icon = iconMap[slide.icon] || LayoutDashboard;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setIndex(i => i + 1);
    }
  };

  const handlePrev = () => {
    setIndex(i => Math.max(0, i - 1));
  };

  return (
    <Dialog open={open} onOpenChange={() => onSkip()}>
      <DialogContent className="sm:max-w-sm p-0 gap-0 overflow-hidden rounded-2xl border-0">
        <div className="relative">
          <div className={cn(
            'flex flex-col items-center text-center p-8 pb-6 bg-gradient-to-br text-white',
            slide.color,
          )}>
            <div className="size-16 rounded-2xl bg-white/20 flex items-center justify-center mb-5 backdrop-blur-sm">
              <Icon className="size-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold mb-1.5 text-white">{slide.title}</h2>
            <p className="text-sm text-white/85 leading-relaxed max-w-xs">{slide.description}</p>
          </div>

          <button
            onClick={onSkip}
            className="absolute top-3 right-3 size-7 rounded-full bg-black/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/25 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 py-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                'size-2 rounded-full transition-all duration-300',
                i === index
                  ? 'bg-primary w-6'
                  : 'bg-muted-foreground/25 hover:bg-muted-foreground/40',
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 pb-6 gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={index === 0}
            className="gap-1 text-muted-foreground text-xs"
          >
            <ChevronLeft className="size-3.5" /> Back
          </Button>

          <span className="text-[11px] text-muted-foreground tabular-nums">
            {index + 1} of {slides.length}
          </span>

          <Button
            size="sm"
            onClick={handleNext}
            className="gap-1 text-xs"
          >
            {isLast ? 'Done' : 'Next'} <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
