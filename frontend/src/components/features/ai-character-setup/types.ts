export interface SetupStep {
  id: string;
  title: string;
  question: string;
  placeholder?: string;
  inputType: 'text' | 'date' | 'place' | 'time';
}

export interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

export interface SetupData {
  name: string;
  birthDate: string;
  birthPlace: string;
  birthTime: string | null;
  personality: string;
  style: string;
  processedPersonality?: {
    softness: number;
    energy: number;
    formality: number;
  };
  processedStyle?: string[];
}

export interface BirthDateData {
  year: number;
  month: number;
  day: number;
}

export interface BirthPlaceData {
  locationType: 'japan' | 'overseas';
  location: string;
}

export interface BirthTimeData {
  hasTime: boolean;
  hour?: number;
  minute?: number;
}