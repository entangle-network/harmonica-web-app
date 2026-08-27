'use client'

import { useTranslations } from 'next-intl';
import { MagicWand } from "@/components/icons";
import { useEffect, useState } from "react";

export default function LoadingMessage() {
  const t = useTranslations('createLoading');
  const loadingMessages = t.raw('messages') as string[];
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)])
    let interval: NodeJS.Timeout;
    interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * loadingMessages.length);
        setLoadingMessage(loadingMessages[randomIndex]);
      }, 2500);
    return () => clearInterval(interval);
  }, []); // Add empty dependency array to run only once

  return (
    <div className="h-[50svh] m-4 flex flex-col items-center justify-center space-y-8">
      {/* Simple loading content */}
      <div className="flex items-center justify-center">
        <div className="mr-4">
          <MagicWand />
        </div>
        {loadingMessage && loadingMessage}
      </div>
    </div>
  );
}