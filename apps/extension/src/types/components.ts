import type { Section } from './review';

export interface ReviewButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isDark?: boolean;
}

export interface ReviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  review: string | null;
  loading: boolean;
  error: string | null;
  loadingMessage?: string;
}

export interface SectionCardProps {
  section: Section;
}

export interface LoadingSpinnerProps {
  message?: string;
}

export interface CodeBlockProps {
  code: string;
  language?: string;
  inline?: boolean;
}
