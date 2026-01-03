"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PropsWithChildren, useState } from "react";
import useMutationError from "./useMutationError";
import { ICustomError } from "@/types";

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
          onError: (err) =>
            defaultMutationHandler(err as unknown as ICustomError),
        },
      },
    })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={true} />
    </QueryClientProvider>
  );
};

export default ReactQueryProvider;
