import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { getScoreColor, getScoreLabel, getScoreGradient } from '@/lib/vibeService';

interface VibrancyScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

const VibrancyScore: React.FC<VibrancyScoreProps> = ({ 
  score, 
  size = 'md', 
  showLabel = true,
  animated = false 
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  const radius = size === 'sm' ? 28 : size === 'md' ? 40 : 56;
  const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 6 : 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${sizeClasses[size]}`}>
        <svg
          className={`${sizeClasses[size]} transform -rotate-90 ${animated ? 'animate-scale-in' : ''}`}
          width={radius * 2}
          height={radius * 2}
        >
          {/* Background circle */}
          <circle
            stroke="hsl(var(--muted))"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke={`hsl(var(--${score >= 85 ? 'score-excellent' : score >= 70 ? 'score-good' : score >= 55 ? 'score-fair' : score >= 40 ? 'score-poor' : 'score-critical'}))`}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${textSizes[size]} font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="text-center">
          <div className={`font-semibold ${getScoreColor(score)}`}>
            {getScoreLabel(score)}
          </div>
          <div className="text-xs text-muted-foreground">Vibrancy Score</div>
        </div>
      )}
    </div>
  );
};

export default VibrancyScore;
