import { parseAssistantBlocks } from "@/lib/assistantBlocks";

interface WebsochatRpMessageBodyProps {
  content: string;
  isStreamingEmpty?: boolean;
}

const BUBBLE_CLASS =
  "rounded-[16px] px-16pxr py-12pxr text-16pxr leading-[1.6] whitespace-pre-wrap border border-light-gray-500 bg-white text-dark-gray-500";

/**
 * 웹소챗 어시스턴트(RP) 응답을 지문/대사로 분리 렌더한다.
 * - 따옴표 대사가 없는 단일 블록(QA/설명형 답변)은 기존처럼 단일 버블 유지.
 * - 대사가 섞인 RP 응답만 지문(흐린 이탤릭)/대사(말풍선)로 분리.
 */
export default function WebsochatRpMessageBody({
  content,
  isStreamingEmpty,
}: WebsochatRpMessageBodyProps) {
  if (isStreamingEmpty) {
    return <div className={BUBBLE_CLASS}>...</div>;
  }

  const blocks = parseAssistantBlocks(content);

  if (blocks.length <= 1) {
    return <div className={BUBBLE_CLASS}>{content}</div>;
  }

  return (
    <div className="flex flex-col gap-6pxr">
      {blocks.map((block, index) =>
        block.kind === "narration" ? (
          <p
            key={index}
            className="px-12pxr text-16pxr leading-[1.6] text-dark-gray-400 whitespace-pre-wrap"
          >
            {block.text}
          </p>
        ) : (
          <div key={index} className={`w-fit ${BUBBLE_CLASS}`}>
            {block.text}
          </div>
        )
      )}
    </div>
  );
}
