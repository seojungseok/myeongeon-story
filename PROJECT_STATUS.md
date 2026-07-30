# 프로젝트 현황 — 명언이야기

> 이 파일만 읽으면 다른 컴퓨터(집 등)에서도 바로 이어서 작업할 수 있도록 정리한 문서입니다.
> **큰 변경이 있을 때마다 갱신합니다** (규칙은 `CLAUDE.md` 참고).

---

## 1. 프로젝트 기본 정보

| 항목 | 값 |
|---|---|
| 이름 | 명언이야기 (`myeongeon-story`) |
| 배포 주소 | https://myeongeon.kr (Vercel, `main` 푸시 시 자동 배포) |
| GitHub | https://github.com/seojungseok/myeongeon-story |
| 기술 스택 | Next.js 14.2.35 (App Router) · TypeScript · Tailwind CSS · Vercel |
| 콘텐츠 | 별도 DB 없음 — `src/content/stories/`의 JSON/Markdown 파일 |
| 폰트 | `next/font` — Nanum Myeongjo(명조, 본문/제목/명언) · Noto Sans KR(고딕, UI) |
| 이미지 | Pexels API를 **빌드 전** 캐싱 → 런타임 API 호출 0회 |
| 렌더링 | SSG 위주(정적) + 홈만 하루 1회 ISR → Vercel 무료 한도 절약 |

---

## 2. 완료된 기능 (실제 코드 확인)

**페이지** (`src/app/`)
- 홈 `/` — mwohaji 스타일: 카테고리 바(끝 화살표) → 검색 → **추천 랜덤 배너** → **오늘의 명언 1개** → **최신글 슬라이더 + 더보기**
- 이야기 상세 `/story/[id]` — 히어로(제목 오버레이) · 진행률 바 · 읽는 시간 · 북마크 · 태그 · **유튜브 음악(상단, 무자동재생)** · 명언 블록 · 본문(드롭캡) · 교훈/실천 · 이전·다음 · 비슷한 명언 5 · 관련 이야기 · 공유(카톡/페북/링크) · 쿠팡 배너(조건부) · 광고 슬롯 5곳
- 카테고리 `/category/[category]` · 태그 `/tag/[tag]` · 검색 `/search` · 즐겨찾기 `/bookmarks` · 전체 최신글 `/stories`
- SEO 라우트: `/sitemap.xml`(분할 인덱스) + `/sitemaps/{static,category,tag,story/[chunk]}` · `/robots.txt` · `/rss.xml`

**콘텐츠 시스템**
- JSON + Markdown 통합 로더 `src/lib/content.ts` (필수: id/title/quote/story)
- 관련글 추천 `src/lib/related.ts` (태그 유사도 → 카테고리 → 랜덤)
- 읽는 시간 자동 계산, 날짜 기반 '오늘의' 선택 `src/lib/today.ts`

**SEO / 수익**
- 페이지별 meta(title/description)·OG, JSON-LD(Article/Breadcrumb/WebSite/Organization)
- 글별 OG 이미지 자동 생성 + 사이트 기본 OG (`opengraph-image.tsx`)
- 광고: `AdSlot` 5곳 — 기본 미표시, `NEXT_PUBLIC_ADSENSE_CLIENT` 넣으면 렌더, `NEXT_PUBLIC_AD_PREVIEW=true`로 위치 확인
- 쿠팡: `coupangUrl` 있을 때만 배너 + 파트너스 문구 자동
- 푸터에 광고·제휴/기타 문의 메일(tjwjdtjr11@naver.com)

**부가 기능**
- 즐겨찾기(localStorage), 진행률 바, 이전/다음, 랜덤 추천, 인기글(viewWeight)
- 유튜브 노래 자동 매칭: `fetch-youtube.ts`(API 키 없으면 **공개 RSS 폴백**) → `data/youtube-songs.json` → 생성 시 카테고리별 `youtubeId` 자동 배정
- 이미지 중복 회피: 이야기 id별 파일명 + Pexels 후보 중 전역 dedup 선택

**디자인**: 미색 배경·명조체·세피아 감성 톤, 모바일 우선 반응형, 부드러운 캐러셀

**배포/운영**: Vercel 자동 배포, Google 서치콘솔 인증 파일(`public/google...html`), `NEXT_PUBLIC_SITE_URL=https://myeongeon.kr`

---

## 3. 미완료 / TODO

- [ ] **콘텐츠가 3편뿐** (`courage-mandela`, `effort-cheonrigil`, `longing-eomma-son`) → 홈이 반복돼 보임. **대량 생성 필요** (`npm run gen:story`)
- [ ] 로컬 환경변수 미설정: `GEMINI_API_KEY`, `YOUTUBE_API_KEY`, `PEXELS_API_KEY` 비어 있음 (Vercel엔 `PEXELS_API_KEY`, `NEXT_PUBLIC_SITE_URL` 설정됨)
- [ ] `data/youtube-songs.json`은 **RSS 최신 15편만** → API 키 넣고 전체 수집 권장
- [ ] `coupangUrl` 전부 비어 있음 → 상품 링크 넣어야 배너 노출
- [ ] 애드센스 미설정(`NEXT_PUBLIC_ADSENSE_CLIENT` 비어 있음, 승인 후 입력)
- [ ] 카카오 공유 키 미설정(`NEXT_PUBLIC_KAKAO_JS_KEY`) → 현재 링크복사로 폴백
- [ ] **미사용 컴포넌트 정리**: `src/components/TodayCards.tsx` (홈 재설계로 현재 미사용)
- [ ] (로컬 Windows 전용) F: 드라이브 `readlink` 이슈 → `scripts/patch-fs.cjs`로 우회 중. **Vercel(리눅스)에선 무관**

---

## 4. 폴더 구조 요약

```
myeongeon-story/
├─ src/
│  ├─ app/                      # 페이지 · 라우트 (App Router)
│  │  ├─ page.tsx               # 홈
│  │  ├─ story/[id]/            # 상세 + opengraph-image
│  │  ├─ category/ tag/ search/ bookmarks/ stories/
│  │  ├─ sitemap.xml/ sitemaps/ robots.ts rss.xml/ opengraph-image.tsx icon.svg
│  │  ├─ layout.tsx globals.css not-found.tsx
│  ├─ components/               # 공통 UI (AdSlot, StoryCard, ShareButtons, YouTubeEmbed …)
│  │  └─ home/                  # Carousel, CategoryBar, ScrollRow
│  ├─ config/                   # site.ts, categories.ts (설정)
│  ├─ lib/                      # content, related, today, seo, sitemap, bookmarks, types …
│  └─ content/stories/          # ★ 이야기 파일(JSON/MD) — 여기에 추가하면 자동 반영
├─ scripts/                     # cache-images, generate-story, fetch-youtube, patch-fs.cjs, prompt-template.txt, quotes.txt
├─ data/youtube-songs.json      # fetch:youtube 결과 (카테고리별 노래)
├─ public/                      # 정적 파일 (google 인증 파일 등; images/pexels는 빌드 생성·gitignore)
├─ .env.local(.example)         # 환경변수
└─ PROJECT_STATUS.md / CLAUDE.md / README.md
```

---

## 5. 주요 명령어 (`package.json` scripts)

```bash
npm run dev            # 개발 서버 (localhost:3000)
npm run build          # 프로덕션 빌드 (prebuild가 cache:images 자동 실행)
npm run start          # 빌드 결과 실행
npm run lint           # 린트
npm run cache:images   # Pexels 이미지 빌드 전 캐싱 (--force 로 재캐싱)
npm run gen:story      # AI 글 생성 (예: -- --file scripts/quotes.txt)
npm run fetch:youtube  # 유튜브 노래 수집 → data/youtube-songs.json (키 없으면 RSS)
```
> dev/build/lint는 `cross-env NODE_OPTIONS=--require=./scripts/patch-fs.cjs`로 감싸져 있음(로컬 F: 드라이브 우회, Vercel 무해).

---

## 6. 환경변수 (`.env.local.example` 기준 — 값 제외)

```
NEXT_PUBLIC_SITE_URL        # 배포 주소 (https://myeongeon.kr)
PEXELS_API_KEY              # 이미지 캐싱
AI_PROVIDER                # gemini | openai | anthropic (기본 gemini)
GEMINI_API_KEY             # 글 생성 (기본 제공자)
OPENAI_API_KEY             # (선택)
ANTHROPIC_API_KEY          # (선택)
YOUTUBE_API_KEY            # 유튜브 전체 수집 (없으면 RSS 폴백)
NEXT_PUBLIC_KAKAO_JS_KEY   # 카카오 공유 (선택)
NEXT_PUBLIC_ADSENSE_CLIENT # 애드센스 (승인 후)
NEXT_PUBLIC_AD_PREVIEW     # 광고 자리 미리보기 (true/false)
```

---

## 7. 다음에 이어서 작업할 때 순서

**새 컴퓨터에서 처음 열 때**
1. `git clone https://github.com/seojungseok/myeongeon-story.git`
2. `npm install`
3. `cp .env.local.example .env.local` → 키 값 입력 (최소 `PEXELS_API_KEY`, `NEXT_PUBLIC_SITE_URL`; 글 생성하려면 `GEMINI_API_KEY`)
4. `npm run dev` → http://localhost:3000

**콘텐츠 늘리기 (가장 우선 TODO)**
1. `scripts/quotes.txt`에 명언 추가 (한 줄에 `명언 | 카테고리`)
2. (선택) `npm run fetch:youtube` — 키 있으면 전체 곡 수집
3. `npm run gen:story -- --file scripts/quotes.txt` → `src/content/stories/`에 JSON 생성
4. 생성물 검토·수정 → `npm run cache:images`(로컬 키 있을 때) → `git add . && git commit && git push`
5. push하면 Vercel 자동 재배포 (이미지 캐싱도 빌드 때 자동)

**배포**: `main`에 push = 자동 배포. 환경변수 변경 시 Vercel 대시보드에도 반영 후 Redeploy.

---

## 8. 마지막 업데이트 · 최근 커밋

- **마지막 업데이트**: 2026-07-30
- **현재 브랜치**: `main` (배포와 동기화됨)
- **최근 커밋**:
  - `d7812d6` Optimize home: lean layout per feedback (추천 랜덤·오늘의 명언 1개·최신글+더보기·/stories)
  - `f6d3091` Redesign home in mwohaji style (carousels + horizontal rows)
  - `8170298` Move song player to top, clean embed, improve image matching
  - `07d3ed7` Assign K.HYUN songs to stories, add RSS fallback, tidy share/footer
  - `6e8b33e` Add category-matching YouTube song embed + fetch script
