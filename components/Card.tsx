
import React from 'react';
import { CardType } from '../types';

interface CardProps {
  card: CardType;
  onClick: (id: number) => void;
  disabled: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, disabled }) => {
  const isRevealed = card.isFlipped || card.isMatched;

  return (
    <div 
      className="relative w-full aspect-square perspective-1000 cursor-pointer group"
      onClick={() => !disabled && !isRevealed && onClick(card.id)}
    >
      <div 
        className={`w-full h-full transition-all duration-500 preserve-3d ${isRevealed ? 'rotate-y-180' : ''}`}
      >
        {/* Front Face (Hidden) */}
        <div className="absolute inset-0 backface-hidden flex items-center justify-center bg-indigo-600 rounded-xl shadow-lg border-2 border-indigo-400 group-hover:bg-indigo-500 transition-colors">
          <div className="text-4xl text-indigo-200">
            <i className="fas fa-question-circle"></i>
          </div>
        </div>

        {/* Back Face (Revealed) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center bg-slate-800 rounded-xl shadow-xl border-2 border-emerald-500 overflow-hidden">
           <img 
            src={card.content} 
            alt={card.label}
            className="w-full h-full object-cover opacity-90"
            loading="lazy"
          />
          {card.isMatched && (
            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
               <i className="fas fa-check-circle text-emerald-400 text-3xl drop-shadow-md"></i>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
