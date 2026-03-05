
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  Clock,
  MessageSquarePlus,
  Loader2,
  Smartphone,
  Zap,
  FilterX
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useDoc, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking,
  setDocumentNonBlocking 
} from "@/firebase";
import { collection, query, orderBy, doc, serverTimestamp, where, getDocs } from "firebase/firestore";
import { Customer, ChatThread, Message } from "@/lib/types"; 

export default function MessagesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [newChatPhoneNumber, setNewChatPhoneNumber] = useState("");
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);
  const tenantId = profile?.tenantId;

  // Fetch chat threads
  const threadsQuery = useMemoFirebase(() => {
    if (!tenantId) return null;
    return query(
      collection(firestore, 'tenants', tenantId, 'chats'),
      orderBy('updatedAt', 'desc')
    );
  }, [firestore, tenantId]);
  const { data: threads, isLoading: areThreadsLoading } = useCollection<ChatThread>(threadsQuery);

  const activeThread = useMemo(() => 
    threads?.find(t => t.id === activeThreadId), 
  [activeThreadId, threads]);

  // Fetch messages
  const messagesQuery = useMemoFirebase(() => {
    if (!tenantId || !activeThreadId) return null;
    return query(
      collection(firestore, 'tenants', tenantId, 'chats', activeThreadId, 'messages'),
      orderBy('timestamp', 'asc')
    );
  }, [firestore, tenantId, activeThreadId]);
  const { data: activeMessages, isLoading: areMessagesLoading } = useCollection<Message>(messagesQuery);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [activeMessages]);

  // Mark as read
  useEffect(() => {
    if (tenantId && activeThreadId && activeThread && activeThread.unreadCount > 0) {
      const chatDocRef = doc(firestore, 'tenants', tenantId, 'chats', activeThreadId);
      updateDocumentNonBlocking(chatDocRef, { unreadCount: 0, updatedAt: serverTimestamp() });
    }
  }, [tenantId, activeThreadId, activeThread, firestore]);

  const filteredThreads = useMemo(() => {
    if (!searchQuery || !threads) return threads || [];
    const lowerCaseQuery = searchQuery.toLowerCase();
    return threads.filter(t => 
      t.customerName.toLowerCase().includes(lowerCaseQuery) ||
      (t.customerPhone && t.customerPhone.includes(lowerCaseQuery))
    ); 
  }, [searchQuery, threads]);

  const safeFormat = (dateValue: any, formatStr: string) => {
    if (!dateValue) return '---';
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    if (isNaN(date.getTime())) return '---';
    return format(date, formatStr);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !tenantId || !activeThreadId || !user) return;

    const textToSend = inputText;
    setInputText("");

    const messageColRef = collection(firestore, 'tenants', tenantId, 'chats', activeThreadId, 'messages');
    addDocumentNonBlocking(messageColRef, {
      senderId: user.uid, 
      text: textToSend,
      timestamp: serverTimestamp(),
      status: 'sent'
    });

    const chatDocRef = doc(firestore, 'tenants', tenantId, 'chats', activeThreadId);
    updateDocumentNonBlocking(chatDocRef, {
      lastMessage: textToSend,
      lastTimestamp: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const handleNewChatByPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user) return;

    setIsCreatingChat(true);
    const phone = newChatPhoneNumber.trim();
    if (!phone) {
      toast({ title: "Invalid Phone", variant: "destructive" });
      setIsCreatingChat(false);
      return;
    }

    try {
      const customersColRef = collection(firestore, 'tenants', tenantId, 'customers');
      const q = query(customersColRef, where('phone', '==', phone));
      const customerSnap = await getDocs(q);
      
      let customerId = "";
      let customerName = "";

      if (!customerSnap.empty) {
        customerId = customerSnap.docs[0].id;
        customerName = customerSnap.docs[0].data().name;
      } else {
        const newCustomerRef = doc(customersColRef);
        customerId = newCustomerRef.id;
        customerName = `New Client ${phone.slice(-4)}`;
        setDocumentNonBlocking(newCustomerRef, {
          tenantId,
          name: customerName,
          phone,
          pipelineStage: 'LEAD',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      const chatsColRef = collection(firestore, 'tenants', tenantId, 'chats');
      const chatQ = query(chatsColRef, where('customerId', '==', customerId));
      const chatSnap = await getDocs(chatQ);
      
      if (!chatSnap.empty) {
        setActiveThreadId(chatSnap.docs[0].id);
      } else {
        const newChatRef = doc(chatsColRef);
        setDocumentNonBlocking(newChatRef, {
          tenantId,
          customerId,
          customerName,
          customerPhone: phone,
          lastMessage: "Conversation started.",
          unreadCount: 0,
          online: false, 
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastTimestamp: serverTimestamp()
        }, { merge: true });
        setActiveThreadId(newChatRef.id);
      }

      setNewChatPhoneNumber("");
      toast({ title: "Messenger Ready" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsCreatingChat(false);
    }
  };

  const renderMessageStatus = (message: Message) => {
    if (message.senderId !== user?.uid) return null;
    switch (message.status) {
      case 'sent': return <Check className="h-3 w-3" />; 
      case 'delivered': return <CheckCheck className="h-3 w-3" />; 
      case 'read': return <CheckCheck className="h-3 w-3 text-primary" />; 
      default: return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-xl border bg-background shadow-sm">
      {/* Sidebar: Threads */}
      <div className="w-80 flex flex-col border-r bg-slate-50/50">
        <div className="p-4 border-b bg-background space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Inbound Channel</h2>
            <Badge variant="outline" className="gap-1.5 font-bold text-[10px] uppercase text-green-600 border-green-200">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Connected
            </Badge>
          </div>
          
          <form onSubmit={handleNewChatByPhone} className="space-y-2">
            <div className="flex gap-2">
              <Input 
                placeholder="Lookup phone #..." 
                className="flex-1 h-9 text-xs" 
                value={newChatPhoneNumber}
                onChange={(e) => setNewChatPhoneNumber(e.target.value)}
                disabled={isCreatingChat}
              />
              <Button type="submit" size="sm" variant="secondary" className="h-9 w-9 p-0" disabled={isCreatingChat}>
                {isCreatingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}
              </Button>
            </div>
          </form>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter conversations..." 
              className="pl-9 h-9 text-xs bg-slate-50 border-none" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {areThreadsLoading ? (
            <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : filteredThreads.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={cn(
                    "w-full p-4 flex gap-3 text-left hover:bg-slate-100 transition-colors relative",
                    activeThreadId === thread.id && "bg-white shadow-sm z-10"
                  )}
                >
                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarImage src={`https://picsum.photos/seed/${thread.customerId}/100`} />
                    <AvatarFallback>{thread.customerName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm truncate">{thread.customerName}</span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {safeFormat(thread.lastTimestamp, 'h:mm a')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate leading-snug">
                      {thread.lastMessage}
                    </p>
                  </div>
                  {thread.unreadCount > 0 && (
                    <Badge className="absolute top-4 right-4 h-5 w-5 flex items-center justify-center p-0 rounded-full bg-primary text-white">
                      {thread.unreadCount}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <FilterX className="h-8 w-8 text-slate-200" />
              <p className="text-xs text-muted-foreground font-medium">No threads found.</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col bg-background">
        <div className="p-4 border-b flex items-center justify-between bg-background">
          {activeThread ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`https://picsum.photos/seed/${activeThread.customerId}/100`} />
                <AvatarFallback>{activeThread.customerName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-sm">{activeThread.customerName}</h3>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Smartphone className="h-2.5 w-2.5" /> {activeThread.customerPhone || 'In-App Message'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Smartphone className="h-5 w-5" />
              <h3 className="font-bold text-sm">Select a Conversation</h3>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500" disabled={!activeThread}><Phone className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500" disabled={!activeThread}><Info className="h-4 w-4" /></Button>
          </div>
        </div>

        <ScrollArea ref={scrollRef} className="flex-1 p-6 bg-slate-50/30">
          {areMessagesLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin opacity-20" /></div>
          ) : activeMessages && activeMessages.length > 0 ? (
            <div className="space-y-6">
              {activeMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex w-full",
                    msg.senderId === user?.uid ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[75%] space-y-1",
                    msg.senderId === user?.uid ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "p-3 rounded-2xl text-sm shadow-sm leading-relaxed",
                      msg.senderId === user?.uid 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-white text-slate-900 rounded-tl-none border"
                    )}>
                      {msg.text}
                    </div>
                    <div className={cn(
                      "flex items-center gap-1.5 text-[10px] text-muted-foreground",
                      msg.senderId === user?.uid ? "justify-end" : "justify-start"
                    )}>
                      {safeFormat(msg.timestamp, 'h:mm a')}
                      {renderMessageStatus(msg)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : activeThread ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-12 gap-4">
              <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center text-secondary-foreground">
                <Smartphone className="h-8 w-8" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Secure Channel Ready</p>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto mt-1">Start messaging {activeThread.customerName} below. Messages are encrypted and logged.</p>
              </div>
            </div>
          ) : null}
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-slate-500" disabled={!activeThreadId}>
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Input 
                placeholder="Type a message..." 
                className="h-11 pr-10 bg-slate-50 border-none focus-visible:ring-1"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={!activeThreadId}
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-600" disabled={!activeThreadId}>
                <Smile className="h-5 w-5" />
              </Button>
            </div>
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0 shadow-lg" disabled={!inputText.trim() || !activeThreadId}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
