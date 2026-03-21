import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetMessages, 
  useSendMessage, 
  useClearMessages, 
  getGetMessagesQueryKey 
} from "@workspace/api-client-react";
import type { Message } from "@workspace/api-client-react";

export function useChat() {
  const queryClient = useQueryClient();
  const queryKey = getGetMessagesQueryKey();

  // Fetch messages - polling occasionally ensures multiple clients stay synced
  const messagesQuery = useGetMessages({
    query: {
      refetchInterval: 5000, 
      staleTime: 2000,
    }
  });

  const clearMutation = useClearMessages({
    mutation: {
      onMutate: async () => {
        await queryClient.cancelQueries({ queryKey });
        queryClient.setQueryData<Message[]>(queryKey, []);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      }
    }
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
      onError: (err, variables, context) => {
        if (context?.previousMessages) {
          queryClient.setQueryData(queryKey, context.previousMessages);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      }
    }
  });

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading && !messagesQuery.data,
    isSending: sendMutation.isPending,
    isClearing: clearMutation.isPending,
    sendMessage: (content: string) => sendMutation.mutate({ data: { content } }),
    clearMessages: () => clearMutation.mutate()
  };
}
