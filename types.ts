export interface QuestionAnswer {
  question: string;
  answer: string;
}

export interface DominoCard {
  id: string;
  index: number; // original index from 0 to N
  answer: string; // Vế trái
  question: string; // Vế phải
  isStart?: boolean;
  isEnd?: boolean;
  // Background positioning for image slice
  bgPositionX: string;
  bgPositionY: string;
  bgWidth: string;
  bgHeight: string;
}

export interface ChemistryTopic {
  id: string;
  title: string;
  description: string;
  iconName: string;
  color: string;
  data: QuestionAnswer[];
}

export interface GradeTemplate {
  grade: number;
  subject: string;
  topics: ChemistryTopic[];
}
