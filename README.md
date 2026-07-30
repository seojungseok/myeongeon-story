# 명언이야기 (myeongeon-iyagi)

명언 한 줄을 옛날이야기로 풀어내고 교훈으로 마무리하는 감성 콘텐츠 사이트.
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Vercel 배포.

## 빠른 시작

```bash
# 1) 의존성 설치
npm install

# 2) 환경변수 설정 (.env.local)
cp .env.local.example .env.local
#   PEXELS_API_KEY, NEXT_PUBLIC_SITE_URL 등을 채웁니다.

# 3) 이미지 미리 캐싱 (선택 — 키 없으면 그라데이션으로 대체됨)
npm run cache:images

# 4) 개발 서버
npm run dev        # http://localhost:3000

# 5) 프로덕션 빌드 (prebuild가 이미지 캐싱을 자동 실행)
npm run build && npm run start
```

## 콘텐츠 추가하는 법 (가장 중요)

`src/content/stories/` 안에 파일을 하나 넣으면 끝입니다. 코드 수정 불필요.

- **JSON** (AI 대량 생성용): `src/content/stories/my-story.json`
  - 한 파일에 이야기 하나(객체) 또는 여러 개(배열) 모두 가능.
- **Markdown** (손으로 쓰는 대표 글): `src/content/stories/my-story.md`
  - frontmatter에 필드, 본문에 `story`를 씁니다.

필드 정의는 [`src/lib/types.ts`](src/lib/types.ts) 참고. 필수: `id, title, quote, story`.
`읽는 시간`은 글자 수로 자동 계산되고, `description`은 없으면 본문에서 자동 생성됩니다.

## AI로 이야기 생성 (관리자용)

```bash
# 한 편
npm run gen:story -- --quote "천 리 길도 한 걸음부터." --category effort

# 여러 편 (scripts/quotes.txt: 한 줄에 "명언 | 카테고리")
npm run gen:story -- --file scripts/quotes.txt
```

- 카테고리는 선택입니다. `--category`(또는 배치 파일의 `| 카테고리`)를 주면 그 값을, 없으면 **AI가 15개 중 알맞은 것을 직접 고릅니다**. `quote`는 항상 입력 원문 그대로 저장됩니다.
- 제공자 교체: `.env.local`의 `AI_PROVIDER=gemini|openai|anthropic` (기본 gemini, 가장 저렴).
- 톤 수정: [`scripts/prompt-template.txt`](scripts/prompt-template.txt).
- 생성물은 **검토용**입니다. 열어 다듬은 뒤 커밋하세요 (자동 배포 아님).

## 카테고리 추가

[`src/config/categories.ts`](src/config/categories.ts)에 한 줄 추가하면 홈·메뉴·사이트맵에 자동 반영됩니다.

## 광고 / 쿠팡

- **애드센스**: 상세 페이지에 광고 자리 5곳(①~⑤)이 [`AdSlot`](src/components/AdSlot.tsx) 빈 컴포넌트로 잡혀 있습니다. 승인 후 그 안에 코드만 붙여넣으세요.
- **쿠팡**: 각 글 데이터의 `coupangUrl`을 채우면 배너가 뜨고, 파트너스 문구는 자동 표시됩니다.

## 배포 (Vercel)

1. GitHub 새 저장소에 푸시.
2. Vercel에서 Import → 환경변수(`PEXELS_API_KEY`, `NEXT_PUBLIC_SITE_URL`) 등록.
3. 빌드 명령은 기본값(`next build`)이면 됩니다. `prebuild`가 이미지 캐싱을 먼저 실행합니다.

## 구조 요약

- `src/lib/content.ts` — JSON+Markdown 통합 콘텐츠 로더 (핵심)
- `src/lib/related.ts` — 관련글: 태그 유사도 → 카테고리 → 랜덤
- `src/lib/today.ts` — 날짜 기반 '오늘의' 4카드
- `src/lib/seo.ts` — meta/OG/JSON-LD
- `src/lib/sitemap.ts` + `src/app/sitemaps/**` — 자동 분할 사이트맵
- `src/app/story/[id]/opengraph-image.tsx` — 글별 OG 이미지 자동 생성
- `src/components/AdSlot.tsx` — 광고 자리(빈 컴포넌트)

## SEO 산출물

- `/sitemap.xml` (인덱스) → `/sitemaps/static.xml`, `/sitemaps/category.xml`, `/sitemaps/tag.xml`, `/sitemaps/story/<n>`
- `/robots.txt`, `/rss.xml`
- 페이지별 JSON-LD (Article, BreadcrumbList, WebSite, Organization)
