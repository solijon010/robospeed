export interface Evaluation {
  id: string;
  participant_id: string;
  time_seconds: number;
  red_line_hits: number;
  technical_score: number;
  design_score: number;
}

export interface ParticipantWithEval {
  id: string;
  full_name: string;
  group_name: string;
  custom_number?: string | null;
  evaluation: Evaluation | null;
}
