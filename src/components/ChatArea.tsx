import React, { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store";
import { Send, Phone, Video, MoreVertical, SmilePlus } from "lucide-react";
import { cn } from "../lib/utils";

export function ChatArea({ chatId, onCall }: { chatId: string, onCall: (type: 'video'|'audio') => void }) {
  const { messages, currentUser, sendMessage, reactToMessage, users, groups } = useChatStore();
  const [text, setText] = useState("");
  const [reactionMsgId, setReactionMsgId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  
  const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
  
  const chatMessages = messages[chatId] || [];
  
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      sendMessage(chatId, text.trim());
      setText("");
    }
  };

  const isGlobal = chatId === "global";
  const isGroup = chatId.startsWith("group_");
  const entity = isGlobal ? { name: "Global Chat", id: "global" } : (isGroup ? groups.find(g => g.id === chatId) : users[chatId]);

  // We can only Call individuals for simplicity, though group calls are possible.
  const canCall = !isGroup && !isGlobal && entity;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          {!isGroup && !isGlobal && entity && (
             <img src={(entity as any).pfp} alt="avatar" className="w-10 h-10 rounded-full" />
          )}
          <h3 className="font-bold text-lg">
            {entity ? (isGlobal || isGroup ? (entity as any).name : (entity as any).username) : "Unknown"}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
            {canCall && (
                <>
                    <button onClick={() => onCall('audio')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-indigo-600 transition-colors">
                        <Phone className="w-5 h-5" />
                    </button>
                    <button onClick={() => onCall('video')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-indigo-600 transition-colors">
                        <Video className="w-5 h-5" />
                    </button>
                </>
            )}
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors ml-2">
                <MoreVertical className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
             <div className="w-24 h-24 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <span className="text-4xl text-gray-300">👋</span>
             </div>
             <p className="font-medium">Say hello!</p>
          </div>
        ) : (
          chatMessages.map(msg => {
            const isMe = msg.senderId === currentUser?.id;
            const sender = users[msg.senderId];
            return (
              <div key={msg.id} className={cn("flex flex-col gap-1 w-full", isMe ? "items-end" : "items-start")}>
                {!isMe && sender && (
                    <span className="text-xs text-gray-500 font-medium ml-12 mb-0.5">{sender.username}</span>
                )}
                <div className={cn("flex items-end gap-2 max-w-[75%] relative group", isMe ? "flex-row-reverse" : "flex-row")}>
                    {!isMe && sender && (
                        <img src={sender.pfp} className="w-8 h-8 rounded-full mb-1 flex-shrink-0" />
                    )}
                    
                    <div className={cn("flex flex-col gap-1 max-w-full", isMe ? "items-end" : "items-start")}>
                        <div className={cn(
                            "px-4 py-3 rounded-2xl break-words whitespace-pre-wrap text-sm",
                            isMe 
                                ? "bg-indigo-600 text-white rounded-br-none" 
                                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none"
                        )}>
                            {msg.text}
                        </div>

                        {/* Display Reactions */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className={cn("flex flex-wrap gap-1 mt-0.5", isMe ? "justify-end" : "justify-start")}>
                                {Object.entries(msg.reactions).map(([emoji, usersArr]) => (
                                    <button 
                                      key={emoji}
                                      onClick={() => reactToMessage(chatId, msg.id, emoji)}
                                      className={cn(
                                          "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] shadow-sm border transition-colors",
                                          usersArr.includes(currentUser?.id as string)
                                            ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/60 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                                            : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                      )}
                                    >
                                        <span className="text-[14px] leading-none">{emoji}</span>
                                        <span className="font-semibold">{usersArr.length}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reaction Button & Picker */}
                    <div className="relative flex-shrink-0">
                        <button 
                            onClick={() => setReactionMsgId(reactionMsgId === msg.id ? null : msg.id)}
                            className={cn(
                                "p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all opacity-0 group-hover:opacity-100 mb-1",
                                reactionMsgId === msg.id && "opacity-100 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                            )}
                        >
                            <SmilePlus className="w-4 h-4" />
                        </button>

                        {/* Picker popup */}
                        {reactionMsgId === msg.id && (
                            <div className={cn(
                                "absolute bottom-full mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg p-1.5 flex items-center gap-1 z-20",
                                isMe ? "right-0" : "left-0"
                            )}>
                                {REACTION_EMOJIS.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => {
                                            reactToMessage(chatId, msg.id, emoji);
                                            setReactionMsgId(null);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg focus:outline-none"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <span 
                    className="text-[10px] text-gray-400 mx-2 mt-1 cursor-default"
                    title={new Date(msg.timestamp).toLocaleString(undefined, {
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 bg-gray-100 dark:bg-gray-900 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-full px-5 py-3 focus:outline-none transition-colors border shadow-inner"
          />
          <button 
            type="submit" 
            disabled={!text.trim()}
            className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
