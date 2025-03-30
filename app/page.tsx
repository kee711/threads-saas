"use client";

import { useState } from "react";
import { ThreadsContent as Content, ThreadsUser } from "@/components/threads/types";
import { initializeThreadsClient } from "@/lib/services/threads";


export default function Home() {
  const [threadsUser, setThreadsUser] = useState<ThreadsUser>({
    username: "",
    password: "",
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 인증 처리 함수
  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!threadsUser.username || !threadsUser.password) {
      alert("사용자명과 비밀번호를 입력해주세요.");
      return;
    }

    setIsAuthenticating(true);

    try {
      await initializeThreadsClient(threadsUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("인증 실패:", error);
      alert("인증에 실패했습니다. 사용자명과 비밀번호를 확인해주세요.");
    } finally {
      setIsAuthenticating(false);
    }
  };
  ;
}
