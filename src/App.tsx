import React, { useEffect, useState } from "react";
import { useChatStore } from "./store";
import { LogIn } from "./components/LogIn";
import { MainChat } from "./components/MainChat";
import { cn } from "./lib/utils";

export default function App() {
  const { currentUser, connect } = useChatStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem("buzzer_auth");
    if (auth) {
        try {
            const { username, password } = JSON.parse(auth);
            if (username && password) {
               connect(username, password);
            }
        } catch (e) {}
    }
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    if (currentUser?.theme) {
      document.documentElement.className = currentUser.theme;
      // Default dark/light for Tailwind based on theme setting
      if (currentUser.theme === "dark" || currentUser.theme === "cosmic") {
         document.documentElement.classList.add("dark");
      } else {
         document.documentElement.classList.remove("dark");
      }
    }
  }, [currentUser?.theme]);

  // If no user is logged in, show the login screen
  if (!currentUser) {
    if (isInitializing) return null; // Or a loading spinner
    return <LogIn />;
  }

  return (
    <div className={cn(
        "h-screen w-full flex flex-col font-sans transition-colors duration-300", 
        "bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100",
        currentUser.theme === "cosmic" && "bg-gradient-to-br from-indigo-950 via-purple-950 to-black text-indigo-100"
    )}>
      <MainChat />
    </div>
  );
}
