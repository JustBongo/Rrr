import React, { useState } from "react";
import { useChatStore } from "../store";
import { Zap, Upload, Image as ImageIcon } from "lucide-react";

export function LogIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pfp, setPfp] = useState("");
  const connect = useChatStore((s) => s.connect);

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
                  setPfp(canvas.toDataURL("image/jpeg", 0.8));
              };
              img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      connect(username.trim(), password.trim(), pfp);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 text-gray-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5">
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <label className="relative group cursor-pointer block mb-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-indigo-600 text-white shadow-lg overflow-hidden transition-all group-hover:scale-105">
              {pfp ? (
                <img src={pfp} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <Zap className="h-10 w-10" />
              )}
              <div className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Upload PFP</span>
              </div>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Buzzer</h1>
          <p className="mt-2 text-sm text-gray-500">Unfiltered real-time communication.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:scale-[0.98] transition-transform"
          >
            Enter Chat
          </button>
        </form>
      </div>
    </div>
  );
}
