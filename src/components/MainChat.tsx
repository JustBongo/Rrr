import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";
import { CallOverlay } from "./CallOverlay";
import { useChatStore } from "../store";

export function MainChat() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [callData, setCallData] = useState<{ targetId: string, type: 'video' | 'audio', isIncoming: boolean, incomingData?: any } | null>(null);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar 
        activeChatId={activeChatId} 
        onSelectChat={setActiveChatId} 
      />
      <div className="flex-1 flex flex-col relative bg-white dark:bg-gray-950">
        {activeChatId ? (
          <ChatArea 
            chatId={activeChatId} 
            onCall={(type) => setCallData({ targetId: activeChatId, type, isIncoming: false })} 
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600">
            <p>Select a friend or group to start chatting.</p>
          </div>
        )}
      </div>
      
      {/* Call System */}
      <CallOverlay callData={callData} onEndCall={() => setCallData(null)} setCallData={setCallData} />
    </div>
  );
}
