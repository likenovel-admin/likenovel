import type {
  IWebsochatModelOption,
  WebsochatModelKey,
} from "../app/api/query/websochat/dto";

export const DEFAULT_WEBSOCHAT_MODEL_KEY: WebsochatModelKey = "speed";

export const resolveWebsochatModelOptions = ({
  modelOptions,
  cashCostPerMessage,
  freeRemainingMessages,
  dailyFreeMessageLimit,
}: {
  modelOptions?: IWebsochatModelOption[] | null;
  cashCostPerMessage?: number | null;
  freeRemainingMessages?: number | null;
  dailyFreeMessageLimit?: number | null;
}): IWebsochatModelOption[] => {
  if (modelOptions?.length) return modelOptions;

  return [
    {
      modelKey: DEFAULT_WEBSOCHAT_MODEL_KEY,
      displayName: "스피드",
      cashCostPerMessage: Math.max(Number(cashCostPerMessage ?? 0), 0),
      freeRemainingMessages: Math.max(Number(freeRemainingMessages ?? 0), 0),
      dailyFreeMessageLimit: Math.max(Number(dailyFreeMessageLimit ?? 0), 0),
    },
  ];
};

export const resolveWebsochatModelOption = (
  modelOptions: IWebsochatModelOption[],
  selectedModelKey?: WebsochatModelKey | null
) =>
  modelOptions.find((option) => option.modelKey === selectedModelKey)
  ?? modelOptions.find((option) => option.modelKey === DEFAULT_WEBSOCHAT_MODEL_KEY)
  ?? modelOptions[0];

export const buildWebsochatModelUsageHint = (
  option?: IWebsochatModelOption | null
) => {
  if (!option) return "";
  const freeRemainingMessages = Math.max(
    Number(option.freeRemainingMessages || 0),
    0
  );
  if (freeRemainingMessages > 0) {
    return `무료 ${freeRemainingMessages}회`;
  }
  return `${Math.max(Number(option.cashCostPerMessage || 0), 0)}C`;
};
