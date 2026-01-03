"use client";

import dynamic from "next/dynamic";

type Props = { children: JSX.Element };

const WithNoSSR = ({ children }: Props) => {
  return children;
};

export default dynamic(() => Promise.resolve(WithNoSSR), {
  ssr: false,
});
