"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";
import useMutationError from "./useMutationError";
import { ICustomError } from "@/types/error";

const ReactQueryProvider = ({ children }: PropsWithChildren) => {
  const { defaultMutationHandler } = useMutationError();
  const [client] = useState(
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5000,
          throwOnError: true,
        },
        mutations: {
          onError: (err: unknown) =>
            defaultMutationHandler(err as unknown as ICustomError),
        },
      },
    })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

export default ReactQueryProvider;
