"use client";

import { useEffect, useState } from "react";
import { site } from "@/config/site";

/**
 * Share buttons: KakaoTalk, Facebook, and copy-link.
 * - Facebook & copy work with zero setup.
 * - KakaoTalk uses the Kakao JS SDK only if NEXT_PUBLIC_KAKAO_JS_KEY is set;
 *   otherwise it falls back to copying the link.
 */
export function ShareButtons({
  path,
  title,
  quote,
}: {
  path: string;
  title: string;
  quote: string;
}) {
  const url = `${site.url}${path}`;
  const [copied, setCopied] = useState(false);
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

  useEffect(() => {
    if (!kakaoKey) return;
    if (document.getElementById("kakao-sdk")) return;
    const s = document.createElement("script");
    s.id = "kakao-sdk";
    s.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";
    s.async = true;
    s.onload = () => {
      // @ts-expect-error Kakao is injected globally by the SDK
      if (window.Kakao && !window.Kakao.isInitialized()) window.Kakao.init(kakaoKey);
    };
    document.head.appendChild(s);
  }, [kakaoKey]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("링크를 복사하세요:", url);
    }
  }

  function shareKakao() {
    // @ts-expect-error injected global
    const Kakao = window.Kakao;
    if (!Kakao || !Kakao.isInitialized()) {
      copyLink();
      return;
    }
    Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description: quote,
        imageUrl: `${site.url}/story-og-fallback.png`,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        {
          title: "이야기 보기",
          link: { mobileWebUrl: url, webUrl: url },
        },
      ],
    });
  }

  function shareFacebook() {
    const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(fb, "_blank", "noopener,noreferrer,width=600,height=500");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-subtle">이 이야기 나누기</span>
      <button type="button" onClick={shareKakao} className="btn-ghost text-sm">
        카카오톡
      </button>
      <button type="button" onClick={shareFacebook} className="btn-ghost text-sm">
        페이스북
      </button>
      <button type="button" onClick={copyLink} className="btn-ghost text-sm">
        {copied ? "복사됨!" : "링크 복사"}
      </button>
    </div>
  );
}
