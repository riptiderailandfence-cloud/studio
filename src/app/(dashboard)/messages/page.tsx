"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { SAMPLE_CUSTOMERS } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Send, 
  Phone, 
  Video, 
  Info, 
  MoreVertical,
  Check,
  CheckCheck,
  Paperclip,
  Smile,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatThread {
  id: string;
  customerId: string;
  customerName: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  online: boolean;
}

const INITIAL_THREADS: ChatThread[] = [
  {
    id: "thread_1",
    customerId: "cust_1",
    customerName: "John Doe",
    lastMessage: "The cedar style looks great. When can we start?",
    lastTimestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unreadCount: 2,
    online: true,
  },
  {
    id: "thread_2",
    customerId: "cust_2",
    customerName: "Jane Smith",
    lastMessage: "I just paid the deposit via the portal link. Thanks!",
    lastTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unreadCount: 0,
    online: false,
  },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  thread_1: [
    { id: "m1", senderId: "cust_1", text: "Hi, I received the estimate for the cedar fence.", timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), isMe: false, status: 'read' },
    { id: "m2", senderId: "me", text: "Great! Did you have a chance to look over the material list?", timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(), isMe: true, status: 'read' },
    { id: "m3", senderId: "cust_1", text: "Yes, the cedar style looks great. When can we start?", timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), isMe: false, status: 'delivered' },
  ],
  thread_2: [
    { id: "m4", senderId: "me", text: "The vinyl panels for your backyard have arrived.", timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), isMe: true, status: 'read' },
    { id: "m5", senderId: "cust_2", text: "Wonderful! I just paid the deposit via the portal link. Thanks!", timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(), isMe: false, status: 'read' },
  ]
};

export default function MessagesPage() {
  const [activeThreadId, setActiveThreadId] = useState<string>(INITIAL_THREADS[0].id);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeThread = useMemo(() => 
    INITIAL_THREADS.find(t => t.id === activeThreadId), 
  [activeThreadId]);

  const activeMessages = useMemo(() => 
    messages[activeThreadId] || [], 
  [messages, activeThreadId]);

  const filteredThreads = useMemo(() => 
    INITIAL_THREADS.filter(t => t.customerName.toLowerCase().includes(searchQuery.toLowerCase())), 
  [searchQuery]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const safeFormat = (dateValue: any, formatStr: string) => {
    if (!dateValue) return '---';
    try {
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return '---';
      return format(d, formatStr);
    } catch {
      return '---';
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      senderId: "me",
      text: inputText,
      timestamp: new Date().toISOString(),
      isMe: true,
      status: 'sent'
    };

    setMessages(prev => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), newMessage]
    }));
    setInputText("");
  };

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-xl border bg-background shadow-sm">
      {/* Sidebar: Threads List */}
      <div className="w-80 flex flex-col border-r bg-slate-50/50">
        <div className="p-4 border-b bg-background">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search clients..." 
              className="pl-9 bg-slate-50 border-none" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {filteredThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                className={cn(
                  "w-full p-4 flex gap-3 text-left hover:bg-slate-100 transition-colors relative",
                  activeThreadId === thread.id && "bg-white shadow-sm z-10"
                )}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarImage src={`https://picsum.photos/seed/${thread.customerId}/100`} />
                    <AvatarFallback>{thread.customerName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {thread.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm truncate">{thread.customerName}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {safeFormat(thread.lastTimestamp, 'h:mm a')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {thread.lastMessage}
                  </p>
                </div>
                {thread.unreadCount > 0 && (
                  <Badge className="absolute top-4 right-4 h-5 w-5 flex items-center justify-center p-0 rounded-full">
                    {thread.unreadCount}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center justify-between bg-background">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://picsum.photos/seed/${activeThread?.customerId}/100`} />
              <AvatarFallback>{activeThread?.customerName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-sm">{activeThread?.customerName}</h3>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                {activeThread?.online ? (
                  <><span className="h-1.5 w-1.5 bg-green-500 rounded-full" /> Active Now</>
                ) : (
                  <><Clock className="h-2 w-2" /> Away</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500"><Phone className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500"><Video className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500"><Info className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500"><MoreVertical className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Message History */}
        <ScrollArea ref={scrollRef} className="flex-1 p-6 bg-slate-50/30">
          <div className="space-y-6">
            <div className="flex justify-center">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Today
              </span>
            </div>
            
            {activeMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex w-full",
                  msg.isMe ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "max-w-[70%] space-y-1",
                  msg.isMe ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm shadow-sm",
                    msg.isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-white text-slate-900 rounded-tl-none border"
                  )}>
                    {msg.text}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5 text-[10px] text-muted-foreground",
                    msg.isMe ? "justify-end" : "justify-start"
                  )}>
                    {safeFormat(msg.timestamp, 'h:mm a')}
                    {msg.isMe && (
                      <span>
                        {msg.status === 'read' ? (
                          <CheckCheck className="h-3 w-3 text-primary" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-slate-500 shrink-0">
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Input 
                placeholder="Type your message..." 
                className="h-11 pr-10 bg-slate-50 border-none focus-visible:ring-1"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-600">
                <Smile className="h-5 w-5" />
              </Button>
            </div>
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0 shadow-lg" disabled={!inputText.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground text-center mt-3 uppercase tracking-widest font-bold">
            All communications are logged for quality assurance
          </p>
        </div>
      </div>
    </div>
  );
}
