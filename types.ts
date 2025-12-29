
export interface CardType {
  id: number;
  content: string; // Image URL or Emoji
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface GameTheme {
  name: string;
  items: string[];
  emoji: string;
}

export enum GameStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  WON = 'WON'
}
