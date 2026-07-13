interface WebsochatTypingDotsProps {
  label?: string;
}

const WebsochatTypingDots = ({
  label = "답변을 준비하고 있습니다",
}: WebsochatTypingDotsProps) => (
  <span
    role="status"
    aria-label={label}
    className="flex h-[20px] items-center gap-4pxr"
  >
    {[0, 150, 300].map((delay) => (
      <span
        key={delay}
        aria-hidden="true"
        className="h-[6px] w-[6px] animate-bounce rounded-full bg-dark-gray-300 motion-reduce:animate-none"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </span>
);

export default WebsochatTypingDots;
