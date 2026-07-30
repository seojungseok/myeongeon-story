# 프로젝트 현황 — 명언이야기

> 이 파일만 읽으면 다른 컴퓨터(집 등)에서도 바로 이어서 작업할 수 있도록 정리한 문서입니다.
> **큰 변경이 있을 때마다 갱신합니다** (규칙은 `CLAUDE.md` 참고).

---

## 0. 지금 상태 & 바로 다음 할 일 ⭐ (집에서 열면 여기부터)

**오늘(2026-07-30) 어디까지 했나**
- 사이트 전체 구축 → **Vercel 배포 완료** (https://myeongeon.kr), Google 서치콘솔 인증 완료
- 홈을 mwohaji 스타일로 만들었다가 → **간결하게 최적화**: 카테고리 바(끝 화살표) · **추천 랜덤 배너** · **오늘의 명언 1개** · **최신글 슬라이더 + 더보기(`/stories`)**
- 이미지 중복 회피(이야기 id별 파일 + Pexels dedup) 적용
- `PROJECT_STATUS.md` / `CLAUDE.md` 문서화
- **[말투·주제·노래·SEO 5대 개선]** 완료:
  1. **말투 전면 수정**: `prompt-template.txt`의 톤 규칙을 담백한 구어체로 재작성(번역체·설교조 표현 전면 금지, `~한 채`/`~하리라` 등), 기존 3편의 교훈·실천·제목을 자연스러운 구어체로 다듬음. 실천 문구는 짧고 구체적으로.
  2. **콘텐츠 방향 전환**: `scripts/quotes.txt`를 유명 철학자·현자(니체·쇼펜하우어·노자·공자 등) + 심리/인간관계 실용 주제로 재구성.
  3. **유튜브 노래 자동 연동**: 노래를 글에 고정하지 않고 **빌드 시 카테고리로 매칭**(`src/lib/songs.ts`). `npm run fetch:youtube`만 다시 돌리면 기존 글까지 자동 갱신. 분류기 키워드 보강(부부·아내·남편→인연 등), 미매칭 곡은 사랑으로.
  4. **SEO**: 명언 페이지에 **Quotation JSON-LD** 추가(기존 Article/Breadcrumb/WebSite/Organization 유지), 제목을 인물/키워드 앞세움.
  5. 로컬 빌드·타입체크·브라우저 렌더 확인 후 커밋·push.

**지금 멈춘 지점 / 미해결 (다음에 이어서)**
- 🔴 **실제 이야기가 3편뿐** → 홈 배너·최신글이 같은 글로 반복돼 보임. **콘텐츠 대량 생성이 최우선 다음 작업.**
- 🟡 로컬 `.env.local` 부분 설정: `NEXT_PUBLIC_SITE_URL`·`AI_PROVIDER`·`NEXT_PUBLIC_AD_PREVIEW`만 채워짐. **글 생성/이미지 캐싱하려면 `GEMINI_API_KEY`·`PEXELS_API_KEY`가 비어 있어 추가 입력 필요.** (집 컴퓨터면 `.env.local`을 새로 만들어 6번 표대로 입력.)
- 자세한 미완료는 아래 **3번** 참고.

**집 컴퓨터에서 열면 바로 이 순서로**
```bash
git clone https://github.com/seojungseok/myeongeon-story.git
cd myeongeon-story
npm install
cp .env.local.example .env.local     # 그리고 키 입력 (6번 표의 '발급처' 참고)
npm run dev                          # http://localhost:3000 에서 확인
```
> 💡 가능하면 **로컬 디스크(C:)의 영문 경로**에 clone하세요. 그러면 한글 경로 드라이브(예: 현재 이 작업 PC는 `D:\명언`, 이전엔 `F:\명언`)에서 겪은 `readlink`/OG 이미지 이슈가 아예 없습니다.

**그다음 첫 작업 = 콘텐츠 늘리기. 바로 칠 첫 명령어:**
```bash
npm run gen:story -- --file scripts/quotes.txt
```
> 실행 전 `.env.local`에 `GEMINI_API_KEY` 필요. `scripts/quotes.txt`에 명언을 더 채운 뒤 실행 → 생성물 검토 → `npm run cache:images` → commit·push. (상세는 7번)

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

**방문자 카운터** (푸터)
- `전체 방문 · 오늘` 표시. `src/app/api/visit/route.ts` + `src/components/VisitCounter.tsx`.
- 저장은 무료 카운터 서비스 **abacus**(무가입, namespace `myeongeon-kr-v1`) 사용 — 별도 DB 불필요. 서버 라우트가 카운트, **httpOnly 쿠키로 브라우저·하루 1회만** 증가(중복 방지). 서비스 불통 시 위젯 자동 숨김.
- 더 튼튼하게 하려면 Vercel KV(Upstash)로 교체 가능(route만 수정).

**부가 기능**
- 즐겨찾기(localStorage), 진행률 바, 이전/다음, 랜덤 추천, 인기글(viewWeight)
- 유튜브 노래 **주제(theme) 기반 매칭**: `fetch-youtube.ts`가 곡 제목·설명·**해시태그**를 분석해 주제 태그(부모/부부/인연/이별/고향/사랑/희망/인생/친구)를 붙여 `data/youtube-songs.json`에 저장. `src/lib/songs.ts`가 빌드 시 **이야기의 카테고리·태그에서 주제를 뽑아, 가장 identity 있는 주제 우선순위로 곡을 매칭**(부모>부부>인연>…). 어머니 글엔 부모 곡, 이별 글엔 이별 곡만 붙고 **엉뚱한 매칭 없음**. 주제·카테고리 모두 안 맞으면 기본곡 **"당신이란사람"(eOso7tUWwB0)** 으로 대체. 글별 `youtubeId`에 값을 넣으면 그 곡으로 고정 override.
  - `fetch:youtube` 재실행만으로 새 곡이 자동 분류·재매칭됨. **API 키 있으면 전체 카탈로그**(현재 80편), 없으면 RSS 최신 15편. (키는 Vercel Sensitive라 로컬 실행 시 `.env.local`에 직접 입력 필요. `--raw <file>`로 외부에서 받은 목록을 분류만 할 수도 있음.)
- 이미지 중복 회피: 이야기 id별 파일명 + Pexels 후보 중 전역 dedup 선택

**디자인**: 미색 배경·명조체·세피아 감성 톤, 모바일 우선 반응형, 부드러운 캐러셀

**배포/운영**: Vercel 자동 배포, Google 서치콘솔 인증 파일(`public/google...html`), `NEXT_PUBLIC_SITE_URL=https://myeongeon.kr`

---

## 3. 미완료 / TODO

- [ ] **콘텐츠 4편** (`courage-mandela`, `effort-cheonrigil`, `longing-eomma-son`, `nietzsche-pain-stronger`) → 아직 적음, **계속 추가 필요.**
  - ⚠️ **Gemini(`gen:story`) 자동 생성은 품질 미달**: flash·pro 모두 추상적 철학 명언을 옛날이야기로 풀 때 명언을 딴 교훈으로 바꾸고 제목에 가짜 인물을 지어냄(검증 완료). → **자동 생성분은 반드시 사람이 검토, 또는 손으로 집필 권장.**
  - `nietzsche-pain-stronger`는 손으로 집필한 발행 품질 표본(명언 착지·작가·말투 정확). 이 방식으로 늘리는 걸 권장.
- [ ] 로컬 환경변수 미설정: `GEMINI_API_KEY`, `YOUTUBE_API_KEY`, `PEXELS_API_KEY` 비어 있음 (Vercel엔 `PEXELS_API_KEY`, `NEXT_PUBLIC_SITE_URL` 설정됨)
- [ ] `data/youtube-songs.json`은 **RSS 최신 15편만** → API 키 넣고 전체 수집 권장
- [ ] `coupangUrl` 전부 비어 있음 → 상품 링크 넣어야 배너 노출
- [ ] 애드센스 미설정(`NEXT_PUBLIC_ADSENSE_CLIENT` 비어 있음, 승인 후 입력)
- [ ] 카카오 공유 키 미설정(`NEXT_PUBLIC_KAKAO_JS_KEY`) → 현재 링크복사로 폴백
- [ ] **미사용 컴포넌트 정리**: `src/components/TodayCards.tsx` (홈 재설계로 현재 미사용)
- [ ] (로컬 Windows 전용) 한글 경로 드라이브(F:/D: 등)의 `readlink` 이슈 → `scripts/patch-fs.cjs`로 우회 중. **Vercel(리눅스)에선 무관**

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
> dev/build/lint는 `cross-env NODE_OPTIONS=--require=./scripts/patch-fs.cjs`로 감싸져 있음(로컬 한글 경로 드라이브 우회, Vercel 무해).

---

## 6. 환경변수 (`.env.local.example` 기준 — 값은 제외, **발급처 포함**)

`.env.local`에 입력. `NEXT_PUBLIC_*`은 브라우저에 노출되는 공개값.

| 변수 | 용도 | 값을 어디서 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | 배포 주소(canonical/OG/sitemap) | 직접 지정 = `https://myeongeon.kr` |
| `PEXELS_API_KEY` | 이미지 캐싱 | https://www.pexels.com/api/ (무료 가입 → API 키) |
| `AI_PROVIDER` | 글 생성 제공자 선택 | 직접 지정 = `gemini` (기본) |
| `GEMINI_API_KEY` | 글 생성(기본) | https://aistudio.google.com/apikey (Google AI Studio) |
| `OPENAI_API_KEY` | 글 생성(선택) | https://platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY` | 글 생성(선택) | https://console.anthropic.com/ |
| `YOUTUBE_API_KEY` | 유튜브 전체 수집(없으면 RSS 폴백) | https://console.cloud.google.com/ → "YouTube Data API v3" 사용 설정 → 사용자 인증정보 → API 키 |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 카카오 공유(선택) | https://developers.kakao.com/ → 내 앱 → 앱 키 → **JavaScript 키** |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | 애드센스(승인 후) | https://www.google.com/adsense → 게시자 ID `ca-pub-...` |
| `NEXT_PUBLIC_AD_PREVIEW` | 광고 자리 미리보기 | 직접 지정 = `true`/`false` (기본 false) |

> **Vercel 배포용 키**는 코드가 아니라 **Vercel 대시보드 → 프로젝트 → Settings → Environment Variables**에 넣습니다.
> 현재 Vercel엔 `PEXELS_API_KEY`, `NEXT_PUBLIC_SITE_URL`이 설정돼 있음(이미지·SEO 정상). 변수 바꾸면 **Redeploy** 필요.

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
- **날짜별 작업 메모는 [`WORKLOG.md`](WORKLOG.md) 참고** (회사 등 다른 PC에서 이어작업용).
- **최근 커밋** (최신 5개):
  - `8fa69de` Add visitor counter (전체 방문 / 오늘) in the footer
  - `b2965e1` Theme-based song↔story matching (fix mismatches) + add Tolstoy story
  - `c8782f2` Add hand-written Nietzsche story; note Gemini auto-gen quality limits
  - `2b2e2a3` Add Naver site verification meta tag
  - `6161b98` Improve tone, content direction, song auto-linking, and SEO
