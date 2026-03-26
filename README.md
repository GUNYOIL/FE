# 근요일

교내 헬스장 환경에 맞춘 학생용 운동 루틴, 잔디, 단백질 관리 서비스 프론트엔드 MVP입니다.

## 포함된 화면

- 회원가입 및 초기 목표 설정
- 주간 운동 루틴 편집
- 오늘의 운동 기록 및 달성도 계산
- 잔디 기반 습관 시각화
- 급식 + 보충 단백질 관리
- 마이페이지 및 알림 상태

## 실행

```bash
npm install
npm run dev
```

## 기술 구성

- Next.js App Router
- TypeScript
- Tailwind CSS
- TanStack Query
- PWA 기본 설정

## 브랜치 전략

- `main`: Vercel 프로덕션 배포 브랜치
- `develop`: 일상 개발과 통합 확인 브랜치
- `feature/<issue-number>-<summary>`: 이슈 단위 작업 브랜치

## 협업 플로우

1. GitHub에서 이슈를 생성합니다.
2. `develop`에서 `feature/<issue-number>-<summary>` 브랜치를 생성합니다.
3. 작업 후 PR을 `develop`으로 보냅니다.
4. 배포할 시점에 `develop`을 `main`으로 병합합니다.
5. Vercel은 `main` 브랜치를 프로덕션으로 배포합니다.

예시:

```bash
git switch develop
git pull origin develop
git switch -c feature/123-onboarding-ux
```

## 메모

- 현재는 더미 데이터와 로컬 상태 기반 MVP입니다.
- 추후 Django REST API, PostgreSQL, FCM 연동을 붙이기 쉽게 폴더를 나누어 두었습니다.
