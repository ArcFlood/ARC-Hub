import { Message } from '../../stores/types'

export default function SystemMessage({ message }: { message: Message }) {
  return (
    <div className="flex justify-center">
      <div className="bg-surface-elevated border border-border rounded-full px-4 py-1.5 text-xs text-text-muted italic max-w-[90%] text-center">
        {message.content}
      </div>
    </div>
  )
}
