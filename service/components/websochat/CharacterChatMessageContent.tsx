import Image from "next/image";

import { parseCharacterChatMessageBlocks } from "@/utils/characterChatMessageBlocks";

import WebsochatTypingDots from "./WebsochatTypingDots";

const DEFAULT_CHARACTER_AVATAR_PATH = "/images/avatar.svg";

interface CharacterChatMessageContentProps {
  content: string;
  primarySpeakerName: string;
  primaryAvatarPath: string | null;
  isLive: boolean;
  showTypingDots: boolean;
}

const CharacterAvatar = ({
  speakerName,
  imagePath,
}: {
  speakerName: string;
  imagePath: string | null;
}) => (
  <div className="relative h-[32px] w-[32px] shrink-0 overflow-hidden rounded-full border border-light-gray-300 bg-white">
    <Image
      src={imagePath || DEFAULT_CHARACTER_AVATAR_PATH}
      alt={`${speakerName} 프로필`}
      fill
      sizes="32px"
      className="object-cover object-top"
    />
  </div>
);

const DialogueBlock = ({
  speakerName,
  text,
  imagePath,
  showTypingDots = false,
}: {
  speakerName: string;
  text: string;
  imagePath: string | null;
  showTypingDots?: boolean;
}) => (
  <div className="flex items-start gap-10pxr" data-character-chat-block="dialogue">
    <CharacterAvatar speakerName={speakerName} imagePath={imagePath} />
    <div className="min-w-0 max-w-[calc(100%_-_42px)]">
      <div className="mb-4pxr px-2pxr text-12pxr font-semibold leading-[1.3] text-dark-gray-400">
        {speakerName}
      </div>
      <div className="w-fit max-w-full break-words whitespace-pre-wrap rounded-[14px] rounded-tl-[4px] border border-light-gray-300 bg-light-gray-100 px-14pxr py-10pxr text-14pxr leading-[1.65] text-black-100 shadow-sm">
        {showTypingDots ? <WebsochatTypingDots /> : text}
      </div>
    </div>
  </div>
);

export default function CharacterChatMessageContent({
  content,
  primarySpeakerName,
  primaryAvatarPath,
  isLive,
  showTypingDots,
}: CharacterChatMessageContentProps) {
  if (showTypingDots) {
    return (
      <DialogueBlock
        speakerName={primarySpeakerName}
        text=""
        imagePath={primaryAvatarPath}
        showTypingDots
      />
    );
  }

  const parsed = parseCharacterChatMessageBlocks({
    content,
    primarySpeakerName,
    allowIncompleteFinalDialogue: isLive,
  });

  return (
    <div className="flex flex-col gap-12pxr">
      {parsed.blocks.map((block, index) => {
        if (block.kind === "narration") {
          return (
            <div
              key={`narration-${index}`}
              data-character-chat-block="narration"
              className="whitespace-pre-wrap pl-[42px] text-14pxr leading-[1.65] text-dark-gray-500"
            >
              {block.text}
            </div>
          );
        }

        return (
          <DialogueBlock
            key={`dialogue-${index}`}
            speakerName={block.speakerName}
            text={block.text}
            imagePath={block.isPrimarySpeaker ? primaryAvatarPath : null}
          />
        );
      })}
    </div>
  );
}
