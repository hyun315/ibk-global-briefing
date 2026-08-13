# IBK Global Wire

기업은행 해외지점·해외법인 소재국의 경제/정치 동향을 국내 언론 제외하고 수집·요약하고,
은행 경영(여신·수신·환리스크·컴플라이언스) 관점에서 영향도를 분석해 대시보드로 보여주는 앱입니다.

- 뉴스 수집: Google News RSS (무료, API키 불필요)
- 요약/영향도 분석: Anthropic Claude API
- 저장: Firebase Firestore
- 자동 실행: Vercel Cron

---

## 1. Firebase 준비

1. https://console.firebase.google.com 에서 새 프로젝트 생성
2. **Firestore Database** 활성화 (프로덕션 모드로 시작해도 무방 — 아래 규칙 적용)
3. **프로젝트 설정 → 일반 → 웹 앱 추가**로 웹 앱 등록 후 나오는 설정값을
   `.env` 의 `NEXT_PUBLIC_FIREBASE_*` 항목에 채워 넣기
4. **프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성**을 눌러 JSON 파일 다운로드 후,
   그 안의 `project_id`, `client_email`, `private_key` 값을
   `.env` 의 `FIREBASE_ADMIN_*` 항목에 채워 넣기 (private_key는 줄바꿈이 `\n`으로 되어 있는 그대로 붙여넣기)

**Firestore 보안 규칙** (콘솔의 Firestore → 규칙 탭에 붙여넣기):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /briefings/{doc} {
      allow read: if true;   // 대시보드 조회는 사내 URL 공유 전제로 공개 읽기
      allow write: if false; // 쓰기는 서버(Admin SDK)만 가능 — 규칙을 우회하므로 항상 false
    }
    match /runLogs/{doc} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

> 사내 전용으로 더 제한하고 싶다면 Vercel 배포에 사내 IP 제한/사내 SSO(예: Vercel Password Protection,
> 또는 별도 로그인)를 추가하는 것을 권장합니다. 이 저장소 자체는 인증 로직을 포함하고 있지 않습니다.

## 2. Anthropic API 키

https://console.anthropic.com 에서 API 키를 발급받아 `.env`의 `ANTHROPIC_API_KEY`에 입력합니다.

## 3. Cron 보안 키

`.env`의 `CRON_SECRET`에 임의의 긴 문자열을 정합니다. (예: 32자 이상 랜덤 문자열)

## 4. GitHub → Vercel 배포

1. 이 폴더를 새 GitHub 레포에 push
2. https://vercel.com 에서 **Add New → Project → Import Git Repository**로 해당 레포 선택
3. **Environment Variables**에 `.env`에 채운 모든 값 등록 (Production/Preview 모두 체크 권장)
4. Deploy

## 5. 최초 데이터 채우기 & Cron 동작 확인

배포가 끝나면 브라우저에서 아래 주소로 한 번 접속해 첫 데이터를 채웁니다 (18개 지역 순차 처리라 30~60초 정도 걸릴 수 있습니다):

```
https://YOUR-APP.vercel.app/api/cron/update?secret=CRON_SECRET에_넣은_값
```

`{"ok":true, "successCount":18, ...}` 응답이 오면 대시보드(`/`)를 새로고침해서 확인하세요.

## 6. 자동 업데이트 주기 (하루 1~2회)

`vercel.json`에 매일 08:00(KST, UTC 23:00) 1회 자동 실행이 설정되어 있습니다.

**Vercel Hobby(무료) 플랜은 Cron이 하루 1회로 제한**됩니다. 하루 2회를 원하시면:

- Vercel **Pro 플랜**으로 올려 `vercel.json`에 두 번째 스케줄 항목을 추가하거나,
- 무료 외부 스케줄러(예: https://cron-job.org )에서 아래 주소를 하루 1회 더 호출하도록 등록하세요.
  ```
  https://YOUR-APP.vercel.app/api/cron/update?secret=CRON_SECRET에_넣은_값
  ```

## 7. 지역 목록 수정

`lib/locations.js`에서 지점/법인 추가·삭제·검색어(queryCity) 조정이 가능합니다.
현재 목록: 중국(쑤저우·우한·톈진·칭다오·선전·베이징·선양·옌타이), 인도네시아, 폴란드, 미얀마,
마닐라, 뉴욕, 홍콩, 런던, 프놈펜, 도쿄, 뉴델리 — 총 18개 지역.

## 8. 참고 사항

- 국내 언론 배제는 (1) 각 지역별 로케일 검색(hl/gl/ceid)로 애초에 한국 언론 노출을 최소화하고,
  (2) `lib/locations.js`의 `KOREAN_DOMAIN_BLOCKLIST`로 이중 필터링합니다.
  새로운 한국 매체가 섞여 들어오면 이 블록리스트에 도메인을 추가하세요.
- 지역이 늘어나 처리 시간이 60초를 넘으면 `app/api/cron/update/route.js`의 `BATCH_SIZE`를 줄이거나
  Vercel Pro의 `maxDuration`을 늘려주세요.
- 로컬에서 테스트하려면 `npm install` 후 `npm run dev`, `.env.local` 파일에 `.env.example` 내용을 채워 사용하세요.
