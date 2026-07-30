# 작업 일지 (WORKLOG)

> 날짜별 작업 메모. 다른 PC(회사 등)에서 `git pull` 후 이 파일 맨 위부터 읽으면 바로 이어서 작업 가능.
> 전체 현황은 [`PROJECT_STATUS.md`](PROJECT_STATUS.md), 규칙은 [`CLAUDE.md`](CLAUDE.md).

---

## 2026-07-30

### 오늘 한 일 (커밋 순)
1. **`6161b98` 말투·주제·노래·SEO 개선**
   - `scripts/prompt-template.txt`: 톤 규칙을 담백한 구어체로 재작성(`~한 채`/`~하리라` 등 번역체·설교조 금지, todayAction 짧고 구체적으로).
   - `scripts/quotes.txt`: 유명 철학자(니체·쇼펜하우어·노자·공자 등) + 심리/인간관계 주제로 재구성.
   - 기존 3편(courage/effort/longing) 교훈·실천·제목을 자연스러운 말투로 다듬음.
   - SEO: 명언 페이지에 **Quotation JSON-LD** 추가.
2. **`2b2e2a3` 네이버 사이트 소유확인 메타태그** 추가(`app/layout.tsx` metadata.verification).
3. **API 키 서버 실측 완료** (임시 엔드포인트로 확인 후 제거, git엔 없음):
   - YOUTUBE / GEMINI / PEXELS **전부 정상**.
   - ⚠️ Vercel 키는 전부 **Sensitive** → `vercel env pull` 해도 값이 `[SENSITIVE]`로만 나옴. **로컬에서 값 못 가져옴.** 로컬 실행하려면 Google Cloud/Pexels/AI Studio에서 키를 직접 복사해 `.env.local`에 넣어야 함.
4. **`c8782f2` 니체 이야기(손글씨) 추가** + Gemini 자동생성 한계 기록:
   - Gemini flash·**pro 둘 다** 추상적 철학 명언을 옛날이야기로 풀 때 **다른 교훈으로 새고 제목에 가짜 인물**(김지수·유재석·헬렌켈러 등) 지어냄 → **자동생성 발행 부적합**. 손글씨 또는 강한 사람 검토 필요.
   - `nietzsche-pain-stronger.json` = 발행 품질 손글씨 표본.
5. **`b2965e1` 유튜브 노래↔이야기 주제 매칭 전면 개편** (+ 톨스토이 이야기):
   - 문제: 어머니 글에 이별 노래가 붙던 오매칭.
   - `fetch-youtube.ts`: 곡 제목·설명·**해시태그**로 **주제 태그**(부모/부부/인연/이별/고향/사랑/희망/인생/친구) 부여. `--raw <file>` 모드 추가(외부에서 받은 목록 분류).
   - `src/lib/songs.ts`: 이야기 카테고리·태그→주제로, **우선순위(부모>부부>인연>…)** 매칭. 안 맞으면 카테고리 대분류, 그래도 없으면 기본곡 **"당신이란사람"(eOso7tUWwB0)**.
   - `data/youtube-songs.json`: 서버 키로 **전체 80편** 받아 분류해 넣음.
   - 결과: 어머니 글→부모 곡, 이별 글→이별 곡. 라이브 검증 완료.
6. **`8fa69de` 방문자 카운터(전체/오늘)** 푸터에 추가:
   - `src/app/api/visit/route.ts` + `src/components/VisitCounter.tsx`.
   - 무료 abacus 서비스(무가입, ns `myeongeon-kr-v1`), 쿠키로 브라우저·하루 1회 카운트. 라이브 검증 완료.

### 지금 상태
- 배포: https://myeongeon.kr (커밋 `8fa69de`까지 반영). working tree 깨끗(설정 파일 제외).
- 이야기 **5편**: courage-mandela, effort-cheonrigil, longing-eomma-son, **nietzsche-pain-stronger**, **tolstoy-now-beside-you**.

### 추가: 매일 자동 글 생성 파이프라인 구축
- **모델 확인**: 서버 키로 사용 가능 모델 조회 → gemini-3.x pro/flash, `gemini-flash-latest` 등 존재. 어제 2.5-pro보다 몇 세대 위.
- **가성비 결정**: `gemini-3-flash-preview` (pro는 비쌈). 품질 테스트: 구체 명언(부처)=명언 그대로 착지·작가 정확 ✅ / 추상 명언(쇼펜하우어)=드리프트 ❌ → **검증 게이트로 자동 스킵**.
- **`scripts/generate-story.ts` 개편**: 검증(명언 착지·작가·길이)+재시도3+실패시 스킵, 이미 쓴 명언 skip, `--count N`, 작가 포함 프롬프트. `scripts/prompt-template.txt` 강한 충실도 규칙. `scripts/quotes.txt` = `명언|카테고리|작가` 형식.
- **`.github/workflows/daily-stories.yml`**: 매일 06:00 KST 크론(+수동 실행). GitHub 서버 실행 → 커밋 → Vercel 배포.
- ⚠️ **해야 할 1회 설정**: GitHub repo Settings → Secrets → Actions → **`GEMINI_API_KEY`** 등록해야 실제로 돎. 그 전엔 안 돌아감.

### 내일(회사에서) 이어서 할 일 ⭐
1. **손글씨 이야기 계속 쓰기** — 철학자·인간관계 주제. 다음 예정 3편:
   - 마르쿠스 아우렐리우스 "가장 좋은 복수는 그들처럼 되지 않는 것" (무례한 사람 대처)
   - 공자 "이로운 벗 셋, 해로운 벗 셋" (곁에 둘 사람)
   - 헤르만 헤세 "누구도 다른 사람이 될 수 없다, 자기 자신이 되면 된다" (남과 비교로 지칠 때)
   - ※ Gemini 자동생성은 품질 미달이니 **손글씨 우선**. (형식은 `nietzsche-pain-stronger.json` 참고)
2. 콘텐츠 더 늘리기(홈 반복感 해소).
3. (선택) 방문자 카운터: 테스트 접속 포함돼 숫자 ~9에서 시작 → 원하면 namespace 바꿔 리셋. 튼튼하게 하려면 Vercel KV(Upstash)로 교체.
4. (선택) 네이버 서치어드바이저에서 소유확인 완료 + 사이트맵 제출.
5. 남은 TODO: 쿠팡 링크, 애드센스, 카카오 공유 키 (PROJECT_STATUS 3번).

### 회사 PC 세팅 메모
- `git pull` (또는 clone) → `npm install` → `npm run dev`.
- 가능하면 **C: 영문 경로**에 두기(한글 경로 드라이브의 readlink/OG 이슈 회피).
- 로컬에서 `gen:story`/`fetch:youtube`(전체)/`cache:images` 돌리려면 `.env.local`에 키 직접 입력 필요(위 3번 참고). 키 없이 `fetch:youtube`는 RSS 15편만.
- 노래 데이터 갱신: 키 있으면 `npm run fetch:youtube` → 전체 재분류·재매칭. 키 없으면 나(클로드)한테 "서버로 받아와" 하면 처리.
