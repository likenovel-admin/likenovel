export interface IAlgorithmUser {
  id: number;
  user_id: number;
  feature_basic: string;
  feature_1: string;
  feature_2: string;
  feature_3: string;
  feature_4: string;
  feature_5: string;
  feature_6: string;
  feature_7: string;
  feature_8: string;
  feature_9: string;
  feature_10: string;
  created_date: string;
  updated_date: string;
}

export interface IAlgorithmUser {
  id: number;
  user_id: number;
  feature_basic: string;
  feature_1: string;
  feature_2: string;
  feature_3: string;
  feature_4: string;
  feature_5: string;
  feature_6: string;
  feature_7: string;
  feature_8: string;
  feature_9: string;
  feature_10: string;
  created_date: string;
  updated_date: string;
}

export interface IAlgorithmSetTopic {
  id: number;
  feature: string;
  target: string;
  title: string;
  novel_list: string;
  created_date: string;
  updated_date: string;
}

export interface IAlgorithmSection {
  id: number;
  position: string;
  feature: string;
  created_date: string;
  updated_date: string;
}

export interface IAlgorithmSimilar {
  id: number;
  type: string;
  product_id: number;
  similar_subject_ids: string;
  created_date: string;
  updated_date: string;
}
