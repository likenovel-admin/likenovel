export type EditableBillingRoute = "openrouter" | "hive" | "river";
export type BillingRoute = EditableBillingRoute | "gemini" | "anthropic";

export interface AiModelSetting {
  feature_key: string;
  title: string;
  category: string;
  model_id: string;
  billing_route: BillingRoute;
  revision: number;
  default_model_id: string;
  default_billing_route: BillingRoute;
  required_capabilities: string[];
  job_boundary: string;
  updated_date?: string | null;
}

export interface AiModelProvider {
  id: EditableBillingRoute;
  label: string;
  account_count: number;
  configured: boolean;
}

export interface AiModelSettingsResponse {
  data: {
    items: AiModelSetting[];
    providers: AiModelProvider[];
    apply_policy: "next_job";
  };
}

export interface UpdateAiModelRequest {
  model_id: string;
  billing_route: EditableBillingRoute;
  expected_revision: number;
}

export interface UpdateAiModelResponse {
  data: AiModelSetting & { apply_policy: "next_job" };
}

export interface ValidateAiModelRequest {
  feature_key: string;
  model_id: string;
  billing_route: EditableBillingRoute;
}

export interface ValidateAiModelResponse {
  data: {
    valid: true;
    model_id: string;
    billing_route: EditableBillingRoute;
    validation_level: "metadata";
    warnings: string[];
  };
}
