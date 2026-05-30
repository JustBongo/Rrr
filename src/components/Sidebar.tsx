import React, { useState } from "react";
import { useChatStore } from "../store";
import { Users, Hash, UserPlus, Settings, LogOut, MessageSquare, Upload, Globe, Copy, Link } from "lucide-react";
import { cn } from "../lib/utils";

export function Sidebar({ activeChatId, onSelectChat }: { activeChatId: string | null; onSelectChat: (id: string) => void }) {
  const { currentUser, users, friends, groups, addFriend, createGroup, logout, updateTheme, updateProfile } = useChatStore();
  const [newFriendId, setNewFriendId] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [editUsername, setEditUsername] = useState(currentUser?.username || "");
  const [editPfp, setEditPfp] = useState(currentUser?.pfp || "");

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFriendId.trim()) {
      addFriend(newFriendId.trim());
      setNewFriendId("");
    }
  };
  
  const handleUpdateProfile = (e: React.FormEvent) => {
      e.preventDefault();
      if (editUsername.trim() || editPfp.trim()) {
          updateProfile(editUsername.trim() || (currentUser?.username as string), editPfp.trim() || (currentUser?.pfp as string));
          alert("Profile updated!");
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                  const canvas = document.createElement("canvas");
                  const MAX_SIZE = 128;
                  let width = img.width;
                  let height = img.height;
                  
                  if (width > height) {
                      if (width > MAX_SIZE) {
                          height *= MAX_SIZE / width;
                          width = MAX_SIZE;
                      }
                  } else {
                      if (height > MAX_SIZE) {
                          width *= MAX_SIZE / height;
                          height = MAX_SIZE;
                      }
                  }
                  
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext("2d");
                  ctx?.drawImage(img, 0, 0, width, height);
                  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                  
                  setEditPfp(dataUrl);
                  updateProfile(editUsername.trim() || (currentUser?.username as string), dataUrl);
              };
              img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
      }
  };

  if (showSettings) {
      return (
          <div className="w-80 h-full border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <h2 className="font-semibold text-lg">Settings</h2>
                  <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                      Close
                  </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto space-y-6">
                  <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Profile</h3>
                      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 mb-4">
                          <label className="relative group shrink-0 cursor-pointer block w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                              <img src={currentUser?.pfp} alt="avatar" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Upload className="w-4 h-4" />
                              </div>
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          </label>
                          <div className="overflow-hidden">
                              <p className="font-semibold truncate">{currentUser?.username}</p>
                              <p className="text-xs text-gray-500 font-mono truncate w-full">ID: {currentUser?.id}</p>
                          </div>
                      </div>
                      
                      <form onSubmit={handleUpdateProfile} className="space-y-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                          <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Username</label>
                              <input 
                                type="text"
                                value={editUsername}
                                onChange={e => setEditUsername(e.target.value)}
                                placeholder={currentUser?.username}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Avatar URL</label>
                              <input 
                                type="text"
                                value={editPfp}
                                onChange={e => setEditPfp(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                              />
                          </div>
                          <button type="submit" className="w-full rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-indigo-500 transition-colors">
                              Save Changes
                          </button>
                      </form>
                  </div>
                  <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Theme</h3>
                      <div className="space-y-2">
                          {["light", "dark", "cosmic"].map((theme) => (
                              <button
                                  key={theme}
                                  onClick={() => updateTheme(theme)}
                                  className={cn(
                                      "w-full text-left px-4 py-2 rounded-lg capitalize border border-transparent",
                                      currentUser?.theme === theme 
                                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" 
                                        : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700" 
                                  )}
                              >
                                  {theme}
                              </button>
                          ))}
                      </div>
                  </div>
                  <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">App Link</h3>
                      <button
                          onClick={() => {
                              navigator.clipboard.writeText(window.location.href);
                              // Optional: visual feedback could be added, but minimal is fine
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors group"
                      >
                          <div className="flex items-center gap-3">
                              <Link className="w-4 h-4 text-gray-500 group-hover:text-indigo-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Copy Website URL</span>
                          </div>
                          <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                      </button>
                  </div>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                  <button
                      onClick={logout}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 font-medium hover:bg-red-100 dark:hover:bg-red-900/40"
                  >
                      <LogOut className="w-4 h-4" />
                      Logout
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="w-80 h-full border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-gray-50 dark:bg-gray-900/50 z-10">
        <div className="flex items-center gap-3">
          <img src={currentUser?.pfp} alt="avatar" className="w-10 h-10 rounded-full bg-gray-200" />
          <h2 className="font-bold text-lg">Buzzer</h2>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Global Chat */}
        <div>
          <button
            onClick={() => onSelectChat("global")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all mb-2",
              activeChatId === "global"
                ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100"
                : "hover:bg-gray-200 dark:hover:bg-gray-800"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Globe className="w-4 h-4" />
            </div>
            <span className="font-bold">Global Chat</span>
          </button>
        </div>

        {/* Friends */}
        <div>
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3 h-3" /> Friends ({friends.length}/15)
            </h3>
          </div>
          <ul className="space-y-1">
            {friends.map(friendId => {
              const friend = users[friendId];
              if (!friend) return null;
              return (
                <li key={friendId}>
                  <button
                    onClick={() => onSelectChat(friendId)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all",
                      activeChatId === friendId
                        ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100"
                        : "hover:bg-gray-200 dark:hover:bg-gray-800"
                    )}
                  >
                    <img src={friend.pfp} className="w-8 h-8 rounded-full bg-gray-300" />
                    <span className="font-medium truncate">{friend.username}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          
          {friends.length < 15 && (
            <form onSubmit={handleAddFriend} className="mt-2 flex items-center gap-2 px-2">
              <input 
                type="text" 
                placeholder="Friend Username or ID" 
                value={newFriendId}
                onChange={e => setNewFriendId(e.target.value)}
                className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 flex-shrink-0">
                <UserPlus className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Groups */}
        <div>
           <div className="flex items-center justify-between mb-2 px-2">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
               <Hash className="w-3 h-3" /> Groups
             </h3>
             <button 
                onClick={() => {
                   const name = prompt("Enter group name:");
                   if (name) createGroup(name, friends);
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
             >
                + New
             </button>
           </div>
           <ul className="space-y-1">
            {groups.map(group => (
                <li key={group.id}>
                  <button
                    onClick={() => onSelectChat(group.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all",
                      activeChatId === group.id
                        ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100"
                        : "hover:bg-gray-200 dark:hover:bg-gray-800"
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Hash className="w-4 h-4" />
                    </div>
                    <span className="font-medium truncate">{group.name}</span>
                  </button>
                </li>
            ))}
            {groups.length === 0 && (
                <p className="text-xs text-gray-500 px-2">No groups yet.</p>
            )}
           </ul>
        </div>
      </div>
    </div>
  );
}
