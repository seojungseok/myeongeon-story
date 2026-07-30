# CLAUDE.md — 명언이야기 작업 가이드

이 저장소에서 작업할 때 따르는 규칙입니다. **다른 컴퓨터에서 열면 먼저 [`PROJECT_STATUS.md`](PROJECT_STATUS.md)를 읽고 현황을 파악한 뒤 이어서 작업하세요.**

## 프로젝트 한 줄 요약
명언 한 줄을 옛날이야기로 풀어내는 감성 콘텐츠 사이트. Next.js 14 App Router · TypeScript · Tailwind · Vercel(https://myeongeon.kr). 콘텐츠는 `src/content/stories/`의 JSON/MD 파일.

## ⭐ 필수 규칙: PROJECT_STATUS.md 자동 갱신
**큰 변경이 있을 때마다 커밋 전에 `PROJECT_STATUS.md`를 갱신한다.** "큰 변경"의 예:
- 기능 추가/삭제, 페이지·라우트 추가/삭제
- 폴더 구조 변경, 컴포넌트 대량 추가/정리
- `package.json` scripts 변경, 환경변수 추가/삭제
- 배포 설정·도메인 변경
- 콘텐츠 대량 추가(이야기 수 변동), 스크립트 동작 변경

갱신 시 최소한 다음을 최신화한다:
1. **2번(완료 기능)** / **3번(미완료·TODO)** 목록
2. **5번 명령어** / **6번 환경변수** (scripts·env가 바뀐 경우)
3. **8번 "마지막 업데이트 날짜"**(오늘 날짜)와 **최근 커밋 요약**(최신 5개)

> 목표: 다른 환경에서 `PROJECT_STATUS.md`만 읽으면 바로 이어서 작업 가능한 상태 유지.

## 개발 명령어
- `npm run dev` — 개발 서버. `npm run build` — 빌드(prebuild가 이미지 캐싱).
- `npm run gen:story -- --file scripts/quotes.txt` — AI 글 생성.
- `npm run fetch:youtube` — 유튜브 노래 수집(키 없으면 RSS 폴백).
- 전체 명령어·환경변수는 `PROJECT_STATUS.md` 5·6번 참고.

## 주의사항
- **비밀 키(.env.local)는 절대 커밋하지 않는다.** `.env.local.example`(값 없는 템플릿)만 커밋.
- 콘텐츠는 `src/content/stories/`에 파일 추가만으로 반영된다(코드 수정 불필요). 필수 필드: `id/title/quote/story`.
- 카테고리·사이트 설정은 `src/config/`에서 관리. 카테고리 추가는 `categories.ts` 한 줄.
- **로컬 Windows(F: 드라이브) 주의**: `readlink` 이슈로 `scripts/patch-fs.cjs` 프리로드를 dev/build에 걸어둠. 건드리지 말 것. Vercel(리눅스)에선 무관.
- OG 이미지는 로컬 한글 경로에서 `@vercel/og`가 막혀 건너뛰도록 가드돼 있음 — **Vercel에선 정상 생성**. 정상 동작이니 "OG가 dynamic(ƒ)로 보인다"고 놀라지 말 것.
- 커밋은 `main`에 push하면 Vercel 자동 배포. 환경변수 변경 시 Vercel 대시보드에도 반영 후 Redeploy.

## 커밋 컨벤션
- 명확한 영어 제목 + 필요한 본문. 커밋 전 `npm run build`로 통과 확인.
- push 전 `.env.local`이 스테이징에 없는지 확인(`git ls-files | grep .env.local`은 비어야 함).
