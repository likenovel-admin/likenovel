import { ReactNode } from "react";

const MessageBubble = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`flex w-fit px-2 pt-[2px] pb-2 bg-[url('/images/message-bubble.svg')] bg-no-repeat bg-contain text-10pxr text-white break-keep ${className}`}
    >
      {children}
    </div>
  );
};

export const RecentSignInTypeBubble = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`flex w-fit px-2 pt-[2px] pb-2 bg-[url('/images/recent-sign-in-type.svg')] bg-no-repeat bg-contain text-10pxr text-white break-keep ${className}`}
    >
      {children}
    </div>
  );
};

export default MessageBubble;
