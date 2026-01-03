import { ReactNode } from "react";

const PageWrapper = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <section
      className={`flex flex-col w-full max-w-[1120px] mx-auto ${
        className ?? ""
      }`}
    >
      {children}
    </section>
  );
};

export default PageWrapper;
