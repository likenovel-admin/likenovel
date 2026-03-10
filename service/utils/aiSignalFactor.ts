import { IProductAiMetadata } from "@/app/api/query/recommendation/dto";

type AiSignalEventType =
  | "episode_view"
  | "latest_episode_reached"
  | "next_episode_click"
  | string;

type AiFactorPayload = {
  factor_type: string;
  factor_key: string;
  signal_score: number;
};

const MAX_LABELS_PER_AXIS = 3;

const parseArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => !!item);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter((item) => !!item);
      }
    } catch {
      return [];
    }
  }
  return [];
};

const toUniqueLabels = (items: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= MAX_LABELS_PER_AXIS) break;
  }
  return result;
};

const pushCandidate = (
  bucket: AiFactorPayload[],
  seen: Set<string>,
  factorType: string,
  factorKey: string | null | undefined,
  signalScore: number
) => {
  const key = (factorKey || "").trim();
  if (!key) return;
  const dedupeKey = `${factorType}:${key}`;
  if (seen.has(dedupeKey)) return;
  seen.add(dedupeKey);
  bucket.push({
    factor_type: factorType,
    factor_key: key,
    signal_score: signalScore,
  });
};

export const pickAiSignalFactor = (
  eventType: AiSignalEventType,
  metadata: IProductAiMetadata | null | undefined,
  seed: number
): Partial<AiFactorPayload> => {
  if (!metadata) return {};

  const protagonistTypes = toUniqueLabels([
    ...parseArray(metadata.protagonist_type_tags),
    metadata.protagonist_type || "",
  ]);
  const jobs = toUniqueLabels(parseArray(metadata.protagonist_job_tags));
  const goals = toUniqueLabels([
    metadata.protagonist_goal_primary || "",
  ]);
  const materials = toUniqueLabels(parseArray(metadata.protagonist_material_tags));
  const worldviews = toUniqueLabels(parseArray(metadata.worldview_tags));
  const romances = toUniqueLabels([
    ...parseArray(metadata.axis_romance_tags),
    metadata.romance_chemistry_weight || "",
  ]);
  const styles = toUniqueLabels([
    ...parseArray(metadata.axis_style_tags),
    metadata.mood || "",
  ]);

  const candidates: AiFactorPayload[] = [];
  const seen = new Set<string>();

  if (eventType === "next_episode_click") {
    protagonistTypes.forEach((label) => pushCandidate(candidates, seen, "protagonist", label, 3.0));
    materials.forEach((label) => pushCandidate(candidates, seen, "material", label, 2.6));
    jobs.forEach((label) => pushCandidate(candidates, seen, "job", label, 2.4));
    goals.forEach((label) => pushCandidate(candidates, seen, "goal", label, 2.2));
  } else if (eventType === "episode_end") {
    protagonistTypes.forEach((label) => pushCandidate(candidates, seen, "protagonist", label, 2.4));
    materials.forEach((label) => pushCandidate(candidates, seen, "material", label, 2.1));
    worldviews.forEach((label) => pushCandidate(candidates, seen, "worldview", label, 1.9));
    styles.forEach((label) => pushCandidate(candidates, seen, "style", label, 1.7));
    jobs.forEach((label) => pushCandidate(candidates, seen, "job", label, 1.6));
    goals.forEach((label) => pushCandidate(candidates, seen, "goal", label, 1.5));
    romances.forEach((label) => pushCandidate(candidates, seen, "romance", label, 1.4));
  } else if (eventType === "latest_episode_reached") {
    goals.forEach((label) => pushCandidate(candidates, seen, "goal", label, 2.8));
    worldviews.forEach((label) => pushCandidate(candidates, seen, "worldview", label, 2.5));
    romances.forEach((label) => pushCandidate(candidates, seen, "romance", label, 2.3));
    styles.forEach((label) => pushCandidate(candidates, seen, "style", label, 2.1));
    protagonistTypes.forEach((label) => pushCandidate(candidates, seen, "protagonist", label, 1.8));
  } else {
    styles.forEach((label) => pushCandidate(candidates, seen, "style", label, 1.4));
    worldviews.forEach((label) => pushCandidate(candidates, seen, "worldview", label, 1.2));
    romances.forEach((label) => pushCandidate(candidates, seen, "romance", label, 1.1));
    materials.forEach((label) => pushCandidate(candidates, seen, "material", label, 1.0));
    jobs.forEach((label) => pushCandidate(candidates, seen, "job", label, 0.95));
    protagonistTypes.forEach((label) => pushCandidate(candidates, seen, "protagonist", label, 0.9));
    goals.forEach((label) => pushCandidate(candidates, seen, "goal", label, 0.85));
  }

  if (candidates.length === 0) return {};
  if (eventType !== "episode_view") {
    return candidates[0];
  }

  const normalizedSeed = Number.isFinite(seed) ? Math.abs(seed) : 0;
  return candidates[normalizedSeed % candidates.length];
};
