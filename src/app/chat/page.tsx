/**
 * Chat Route Landing Page.
 * Redirects to /chat/v2 (new UI) by default.
 */
import { redirect } from 'next/navigation'

export default function ChatPage() {
    redirect('/chat/v2')
}
