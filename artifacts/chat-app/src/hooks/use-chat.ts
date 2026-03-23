import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMessages,
  useSendMessage,
  useClearMessages,
  getGetMessagesQueryKey,
} from "@workspace/api-client-react";
import type { Message } from "@workspace/api-client-react";

export function useChat() {
  const queryClient = useQueryClient();
  const queryKey = getGetMessagesQueryKey();

  const messagesQuery = useGetMessages({
    query: { refetchInterval: 5000, staleTime: 2000 },
  });

  const clearMutation = useClearMessages({
    mutation: {
      onMutate: async () => {
        await queryClient.cancelQueries({ queryKey });
        queryClient.setQueryData<Message[]>(queryKey, []);
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey }),
    },
  });

  const sendMutation = useSendMessage({
    mutation: {
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey });
        const previousMessages = queryClient.getQueryData<Message[]>(queryKey);
        const optimisticMsg: Message = {
          id: `opt-${Date.now()}`,
          role: "user",
          content: variables.data.content,
          timestamp: new Date().toISOString(),
        };
        queryClient.setQueryData<Message[]>(queryKey, (old = []) => [...old, optimisticMsg]);
        return { previousMessages };
      },
      onError: (_err, _variables, context) => {
        if (context?.previousMessages) queryClient.setQueryData(queryKey, context.previousMessages);
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey }),
    },
  });

  const sendMessage = (
    content: string,
    imageData?: string,
    mimeType?: string,
    pdfData?: string,
    pdfName?: string
  ) => {
    sendMutation.mutate({
      data: {
        content,
        ...(imageData ? { imageData, mimeType } : {}),
        ...(pdfData ? { pdfData, pdfName } : {}),
      },
    });
  };

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading && !messagesQuery.data,
    isSending: sendMutation.isPending,
    isClearing: clearMutation.isPending,
    sendMessage,
    clearMessages: () => clearMutation.mutate(),
  };
}
