/**
 * Test page for the new AssistantChat component.
 * Route: /test-chat
 */
import { AssistantChat } from '@/components/chat';

export default function TestChatPage() {
    return (
        <div className="h-screen">
            <AssistantChat showSidebar={true} />
        </div>
    );
}
