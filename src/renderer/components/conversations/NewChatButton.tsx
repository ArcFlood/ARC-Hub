import { useConversationStore } from '../../stores/conversationStore'

export default function NewChatButton() {
  const createConversation = useConversationStore((s) => s.createConversation)
  return (
    <button
      onClick={() => createConversation()}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
    >
      <span className="text-base leading-none">+</span>
      <span>New Chat</span>
    </button>
  )
}
