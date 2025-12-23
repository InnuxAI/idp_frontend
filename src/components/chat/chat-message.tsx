import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from './types';
import { cn } from '@/lib/utils';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatMessageProps {
    message: Message;
    isLast?: boolean;
}

export function ChatMessage({ message, isLast }: ChatMessageProps) {
    const isUser = message.role === 'user';
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn(
            "group w-full text-foreground border-b last:border-0 py-6 px-4",
            isUser ? "bg-background" : "bg-muted/30"
        )}>
            <div className="max-w-3xl mx-auto flex items-start gap-4">
                {/* Avatar */}
                <Avatar className={cn(
                    "h-8 w-8 border shadow-sm",
                    isUser ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
                )}>
                    {isUser ? (
                        <AvatarImage src="/user-avatar.png" />
                    ) : (
                        <AvatarImage src="/bot-avatar.png" />
                    )}
                    <AvatarFallback className={cn(
                        isUser ? "bg-secondary" : "bg-primary text-primary-foreground"
                    )}>
                        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 space-y-2 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{isUser ? 'You' : 'Assistant'}</span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={handleCopy}
                            >
                                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                        </div>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:rounded-lg prose-pre:border">
                        {message.content ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                            </ReactMarkdown>
                        ) : (
                            <span className="italic text-muted-foreground">Thinking...</span>
                        )}
                        {message.isStreaming && (
                            <span className="inline-block w-2 h-4 ml-1 align-middle bg-primary animate-pulse" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
