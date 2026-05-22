import { useEffect, useState, useRef } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, User, Clock } from "lucide-react";
import io from "socket.io-client";

interface ChatRequest {
  userId: string;
  name: string;
  email: string;
  timestamp: Date;
  unreadCount?: number;
}

interface Message {
  message: string;
  sender: "user" | "admin" | "ai";
  timestamp: Date;
}

const getSocketUrl = (apiUrl: string) => {
  try {
    if (!apiUrl.startsWith("http")) return "";
    const url = new URL(apiUrl);
    return `${url.protocol}//${url.host}`;
  } catch (e) {
    return "";
  }
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://boxcricket-booking.onrender.com/api";
const SOCKET_URL = getSocketUrl(API_BASE_URL);

export default function AdminLiveChat() {
  const { user } = useAdmin();
  const [socket, setSocket] = useState<any>(null);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [activeChat, setActiveChat] = useState<ChatRequest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep a ref to activeChat so the socket listener always has the current value
  const activeChatRef = useRef<ChatRequest | null>(null);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/chat/admin/requests`);
        const data = await response.json();
        if (data.success) {
          setChatRequests(data.chats.map((c: any) => ({
            userId: c.userId,
            name: c.userName || "Guest",
            email: c.userEmail || "",
            timestamp: new Date(c.lastActive),
            unreadCount: c.unreadCount || 0
          })));
        }
      } catch (e) {
        console.error("Failed to fetch chat requests", e);
      }
    };
    fetchRequests();

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Admin connected to socket");
      newSocket.emit("admin-join");
    });

    newSocket.on("user-needs-help", (data: any) => {
      console.log("User needs help:", data);
      setChatRequests((prev) => {
        // Avoid duplicates
        if (prev.find((r) => r.userId === data.userId)) return prev;
        const isCurrentActive = activeChatRef.current?.userId === data.userId;
        return [{
          userId: data.userId,
          name: data.name || "Guest",
          email: data.email || "",
          timestamp: new Date(),
          unreadCount: isCurrentActive ? 0 : 1
        }, ...prev];
      });
    });

    newSocket.on("chat-updated", (data: any) => {
      setChatRequests((prev) => {
        const isCurrentActive = activeChatRef.current?.userId === data.userId;
        const unreadCount = isCurrentActive ? 0 : (data.unreadCount || 0);
        const requestData = {
          userId: data.userId,
          name: data.name,
          email: data.email,
          timestamp: new Date(data.timestamp),
          unreadCount
        };
        const exists = prev.find((r) => r.userId === data.userId);
        if (exists) {
          return [requestData, ...prev.filter((r) => r.userId !== data.userId)];
        }
        return [requestData, ...prev];
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleJoinChat = async (request: ChatRequest) => {
    if (!socket) return;
    setActiveChat(request);
    setMessages([]);
    
    // Clear unread count locally
    setChatRequests(prev => prev.map(r => r.userId === request.userId ? { ...r, unreadCount: 0 } : r));

    try {
      const response = await fetch(`${API_BASE_URL}/chat/history/${request.userId}`);
      const data = await response.json();
      if (data.success && data.messages) {
        setMessages(data.messages.map((m: any) => ({
           message: m.content,
           sender: m.role,
           timestamp: new Date(m.timestamp)
        })));
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }

    // Join the user's chat room
    socket.emit("join-chat", request.userId);

    // Listen for messages in this room
    socket.off("new-message"); // Clear old listeners
    socket.on("new-message", (data: Message) => {
      setMessages((prev) => [...prev, data]);
      // Mark read if it's the active chat
      if (activeChatRef.current?.userId === request.userId) {
        // Clear unread count for this user in sidebar
        setChatRequests(prev => prev.map(r => r.userId === request.userId ? { ...r, unreadCount: 0 } : r));
      }
    });

    // Optionally send greeting if history is empty
    setMessages(prev => {
      if (prev.length === 0) {
        socket.emit("send-message", {
          room: `chat-${request.userId}`,
          message: `Hi ${request.name}! I'm ${user?.name || "Admin"}. How can I help you?`,
          sender: "admin",
        });
      }
      return prev;
    });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !socket || !activeChat) return;

    socket.emit("send-message", {
      room: `chat-${activeChat.userId}`,
      message: inputValue.trim(),
      sender: "admin",
    });

    setInputValue("");
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Live Chat Support</h1>
        <p className="text-sm text-gray-500">
          Respond to users who need human assistance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Chat Requests Sidebar */}
        <Card className="lg:col-span-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              Incoming Requests
              {chatRequests.length > 0 && (
                <Badge className="bg-red-500 text-white text-xs">
                  {chatRequests.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
            {chatRequests.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No pending requests</p>
                <p className="text-xs mt-1">
                  Waiting for users to request help...
                </p>
              </div>
            ) : (
              chatRequests.map((request) => (
                <div
                  key={request.userId}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                    activeChat?.userId === request.userId
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => handleJoinChat(request)}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                        {request.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {request.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {request.email}
                        </p>
                      </div>
                    </div>
                    {request.unreadCount && request.unreadCount > 0 ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white flex-shrink-0 animate-pulse">
                        {request.unreadCount}
                      </span>
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500 flex-shrink-0" title="Read" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(request.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          {activeChat ? (
            <>
              <CardHeader className="pb-3 border-b bg-blue-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {activeChat.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {activeChat.name}
                    </CardTitle>
                    <p className="text-xs text-gray-500">
                      {activeChat.email}
                    </p>
                  </div>
                  <Badge className="ml-auto bg-green-100 text-green-700 border border-green-200">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.sender === "admin" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                        msg.sender === "admin"
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : msg.sender === "ai"
                          ? "bg-emerald-50 border border-emerald-200 text-gray-900 rounded-bl-sm shadow-sm"
                          : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-1 text-[10px] opacity-70 mb-1 font-semibold">
                        {msg.sender === "admin" ? "ADMIN" : msg.sender === "ai" ? "AI ASSISTANT" : "USER"}
                      </div>
                      <span className="whitespace-pre-wrap">{msg.message}</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>
              <div className="p-3 border-t flex items-center gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleSendMessage()
                  }
                  placeholder="Type your reply..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700 rounded-full h-10 w-10"
                  disabled={!inputValue.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No chat selected</p>
                <p className="text-sm mt-1">
                  Select a user from the left to start chatting
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
