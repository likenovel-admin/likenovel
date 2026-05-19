type KeyboardEventLike = {
  key: string;
  keyCode?: number;
  isComposing?: boolean;
  nativeEvent?: {
    isComposing?: boolean;
  };
};

export function isConfirmedEnter(event: KeyboardEventLike) {
  return (
    event.key === "Enter" &&
    !(event.nativeEvent?.isComposing || event.isComposing) &&
    event.keyCode !== 229
  );
}
