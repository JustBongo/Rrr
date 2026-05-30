import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store";
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff } from "lucide-react";
import { cn } from "../lib/utils";

export function CallOverlay({ 
    callData, 
    onEndCall, 
    setCallData 
}: { 
    callData: any, 
    onEndCall: () => void,
    setCallData: any 
}) {
  const { socket, currentUser, users } = useChatStore();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'incoming' | 'connected'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize WebRTC
  useEffect(() => {
    if (!socket || !currentUser) return;

    socket.on("call:incoming", async ({ callerId, type, offer }) => {
        if (callStatus !== 'idle') return; // Ignore if already in a call
        setCallData({ targetId: callerId, type, isIncoming: true, incomingData: { offer } });
        setCallStatus('incoming');
    });

    socket.on("call:answered", async ({ answer }) => {
        if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
            setCallStatus('connected');
        }
    });

    socket.on("call:ice-candidate", async ({ candidate }) => {
        if (peerConnection.current) {
            try {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error("Error adding ice candidate:", e);
            }
        }
    });

    socket.on("call:ended", () => {
        cleanupCall();
    });

    return () => {
        socket.off("call:incoming");
        socket.off("call:answered");
        socket.off("call:ice-candidate");
        socket.off("call:ended");
    };
  }, [socket, currentUser, callStatus, setCallData]);

  // Handle outgoing call
  useEffect(() => {
      if (callData && !callData.isIncoming && callStatus === 'idle') {
          initiateCall();
      }
  }, [callData, callStatus]);

  useEffect(() => {
      if (localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream;
      }
  }, [localStream]);

  useEffect(() => {
      if (remoteVideoRef.current && remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;
      }
  }, [remoteStream]);


  const getMedia = async (video: boolean) => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
          setLocalStream(stream);
          return stream;
      } catch (e) {
          console.error("Failed to get media", e);
          alert("Could not access microphone/camera.");
          return null;
      }
  };

  const createPeerConnection = (targetId: string) => {
      const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });

      pc.onicecandidate = (event) => {
          if (event.candidate) {
              socket?.emit("call:ice-candidate", { targetId, candidate: event.candidate });
          }
      };

      pc.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
      };

      peerConnection.current = pc;
      return pc;
  };

  const initiateCall = async () => {
      if (!callData) return;
      setCallStatus('calling');
      const stream = await getMedia(callData.type === 'video');
      if (!stream) {
          cleanupCall();
          return;
      }

      const pc = createPeerConnection(callData.targetId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket?.emit("call:initiate", { 
          targetId: callData.targetId, 
          callerId: currentUser?.id,
          type: callData.type,
          offer
      });
  };

  const acceptCall = async () => {
      if (!callData || !callData.incomingData) return;
      
      const stream = await getMedia(callData.type === 'video');
      if (!stream) {
          cleanupCall();
          return;
      }

      const pc = createPeerConnection(callData.targetId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(callData.incomingData.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket?.emit("call:answer", { 
          targetId: callData.targetId,
          answer
      });
      
      setCallStatus('connected');
  };

  const cleanupCall = () => {
      if (localStream) {
          localStream.getTracks().forEach(t => t.stop());
      }
      if (peerConnection.current) {
          peerConnection.current.close();
      }
      setLocalStream(null);
      setRemoteStream(null);
      peerConnection.current = null;
      setCallStatus('idle');
      onEndCall();
  };

  const handleEndCall = () => {
      if (callData?.targetId) {
          socket?.emit("call:end", { targetId: callData.targetId });
      }
      cleanupCall();
  };
  
  const toggleMute = () => {
      if (localStream) {
          localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
          setIsMuted(!isMuted);
      }
  };
  
  const toggleVideo = () => {
      if (localStream) {
          localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
          setIsVideoOff(!isVideoOff);
      }
  };

  if (!callData) return null;

  const otherUser = users[callData.targetId];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[80vh] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Main Video Area */}
        <div className="flex-1 relative flex items-center justify-center bg-black">
            {callData.type === 'video' ? (
                <>
                    <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover" 
                    />
                    <div className="absolute bottom-6 right-6 w-48 h-72 bg-gray-800 rounded-2xl overflow-hidden shadow-xl border-2 border-gray-700 z-10 hidden sm:block">
                        <video 
                            ref={localVideoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center gap-6">
                   <img src={otherUser?.pfp} className="w-32 h-32 rounded-full animate-pulse" />
                   <h2 className="text-2xl font-medium text-white">{otherUser?.username || 'Unknown'}</h2>
                   <p className="text-gray-400">Audio Call</p>
                </div>
            )}

            {/* Overlays for status */}
            {callStatus === 'incoming' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
                    <img src={otherUser?.pfp} className="w-24 h-24 rounded-full mb-6" />
                    <h2 className="text-3xl font-medium text-white mb-2">{otherUser?.username}</h2>
                    <p className="text-gray-300 mb-10">Incoming {callData.type} call...</p>
                    <div className="flex gap-6">
                        <button onClick={handleEndCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center shadow-lg transition-transform hover:scale-105 text-white">
                            <PhoneOff className="w-8 h-8" />
                        </button>
                        <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center shadow-lg transition-transform hover:scale-105 text-white">
                            {callData.type === 'video' ? <Video className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
                        </button>
                    </div>
                </div>
            )}
            
            {callStatus === 'calling' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
                    <img src={otherUser?.pfp} className="w-24 h-24 rounded-full mb-6" />
                    <h2 className="text-3xl font-medium text-white mb-2">{otherUser?.username}</h2>
                    <p className="text-gray-300 animate-pulse">Calling...</p>
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="h-24 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-6">
            <button onClick={toggleMute} className={cn("p-4 rounded-full transition-colors", isMuted ? "bg-gray-700 text-red-400" : "bg-gray-800 hover:bg-gray-700 text-white")}>
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            
            {callData.type === 'video' && (
                <button onClick={toggleVideo} className={cn("p-4 rounded-full transition-colors", isVideoOff ? "bg-gray-700 text-red-400" : "bg-gray-800 hover:bg-gray-700 text-white")}>
                    {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>
            )}

            <button onClick={handleEndCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg text-white">
                <PhoneOff className="w-8 h-8" />
            </button>
        </div>

      </div>
    </div>
  );
}
