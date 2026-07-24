export type CharacterChatRole = "main_protagonist" | "major_character";

const CHARACTER_CHAT_ROLE_META = {
  main_protagonist: {
    gridLabel: "주인공",
    modalLabel: "메인 주인공",
    isProtagonist: true,
  },
  major_character: {
    gridLabel: "주요인물",
    modalLabel: "주요 인물",
    isProtagonist: false,
  },
} as const;

export const getCharacterChatRoleMeta = (role: CharacterChatRole) =>
  CHARACTER_CHAT_ROLE_META[role];
