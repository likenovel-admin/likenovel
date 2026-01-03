export interface IQuest {
  quest_id: number;
  title: string;
  reward_id: number;
  end_date: string;
  goal_stage: number;
  use_yn: "Y" | "N";
  created_date: string;
  updated_date: string;
}

export interface Step {
  useYn: "Y" | "N";
  count_process: number;
  count_ticket: number;
}

export interface IQuestDetail {
  quest_id: number;
  title: string;
  reward_id: number;
  end_date: string; // ISO date string
  goal_stage: number;
  use_yn: "Y" | "N";
  renewal: {
    MON: "Y" | "N";
    TUE: "Y" | "N";
    WED: "Y" | "N";
    THU: "Y" | "N";
    FRI: "Y" | "N";
    SAT: "Y" | "N";
    SUN: "Y" | "N";
  };
  step1: Step;
  step2: Step;
  step3: Step;
  created_id: number;
  created_date: string; // ISO date string
  updated_id: number;
  updated_date: string; // ISO date string
}
