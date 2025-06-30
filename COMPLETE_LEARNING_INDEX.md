# 📚 NestJS 프로젝트 완전 학습 가이드

## 🎯 환영합니다!

이 프로젝트는 **NestJS 초보자부터 고급 개발자까지 모든 수준**에서 활용할 수 있는 종합적인 학습 자료입니다. 실제 프로덕션 레벨의 코드와 상세한 주석, 그리고 체계적인 학습 가이드를 통해 NestJS 마스터가 되어보세요!

## 📖 학습 가이드 목차

### 🏗️ 1. 프로젝트 개요

- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - 프로젝트 전체 구조와 기술 스택 소개
- **[README.md](./README.md)** - 프로젝트 시작 가이드

### 🎓 2. 학습 로드맵

- **[LEARNING_GUIDE.md](./LEARNING_GUIDE.md)** - 단계별 학습 계획 (1-5주 과정)
- **[LEARNING_RESOURCES.md](./LEARNING_RESOURCES.md)** - 추천 도서, 강의, 커뮤니티 리소스

### 🏛️ 3. 아키텍처 이해

- **[ARCHITECTURE_PATTERNS.md](./ARCHITECTURE_PATTERNS.md)** - 적용된 아키텍처 패턴 상세 분석
- **[CODE_ANALYSIS_GUIDE.md](./CODE_ANALYSIS_GUIDE.md)** - 실제 코드 분석 및 실습 과제

### 🎮 4. 실습 워크샵

- **[WORKSHOP_GUIDE.md](./WORKSHOP_GUIDE.md)** - 5일 집중 워크샵 가이드

## 🗺️ 학습 여정 추천 순서

### 👶 **1단계: 프로젝트 파악** (1일)

```
1. PROJECT_OVERVIEW.md 읽기
   ↓
2. 프로젝트 실행해보기 (README.md 참고)
   ↓
3. Swagger 문서 확인 (http://localhost:3000/docs)
```

### 🌱 **2단계: 체계적 학습** (1-2주)

```
1. LEARNING_GUIDE.md의 1-2단계 진행
   ↓
2. 각 모듈별 코드 주석 읽어보기
   ↓
3. 간단한 CRUD API 직접 구현해보기
```

### 🌿 **3단계: 패턴 이해** (2-3주)

```
1. ARCHITECTURE_PATTERNS.md 심화 학습
   ↓
2. CQRS 패턴 실습 (Video 모듈 분석)
   ↓
3. 이벤트 기반 아키텍처 구현
```

### 🌳 **4단계: 고급 실습** (3-4주)

```
1. CODE_ANALYSIS_GUIDE.md 실습 진행
   ↓
2. WORKSHOP_GUIDE.md 5일 워크샵 완주
   ↓
3. 나만의 프로젝트 구현
```

### 🎯 **5단계: 전문가 되기** (4주+)

```
1. LEARNING_RESOURCES.md의 고급 자료 학습
   ↓
2. 오픈소스 기여 시작
   ↓
3. 커뮤니티 활동 및 지식 공유
```

## 🎨 주요 학습 포인트

### 🏗️ **아키텍처 패턴**

| 패턴                | 적용 모듈 | 학습 파일                    |
| ------------------- | --------- | ---------------------------- |
| **모듈러 아키텍처** | 전체      | `src/*/**.module.ts`         |
| **CQRS**            | Video     | `src/video/`                 |
| **이벤트 기반**     | Video     | `src/video/event/`           |
| **레이어드**        | User      | `src/user/`                  |
| **가드 패턴**       | Auth      | `src/auth/jwt-auth.guard.ts` |

### 🔧 **핵심 기능**

- ✅ **JWT 인증/인가** - 토큰 기반 보안
- ✅ **파일 업로드** - Multer 활용 비디오 업로드
- ✅ **데이터베이스** - TypeORM + PostgreSQL
- ✅ **API 문서화** - Swagger 자동 생성
- ✅ **테스팅** - Unit/Integration/E2E 테스트
- ✅ **모니터링** - Health Check + Metrics
- ✅ **이메일 발송** - Nodemailer + Gmail
- ✅ **스케줄링** - Cron Job 기반 분석

## 📋 학습 체크리스트

### 🎯 **기초 완료 체크**

- [ ] 프로젝트를 성공적으로 실행했다
- [ ] Swagger 문서에서 API를 테스트했다
- [ ] 각 모듈의 역할을 이해했다
- [ ] 간단한 CRUD API를 만들 수 있다
- [ ] 의존성 주입 개념을 이해했다

### 🚀 **중급 완료 체크**

- [ ] JWT 인증 시스템을 구현할 수 있다
- [ ] CQRS 패턴을 적용할 수 있다
- [ ] 이벤트 기반 로직을 작성할 수 있다
- [ ] 테스트 코드를 작성할 수 있다
- [ ] 데이터베이스 관계를 설계할 수 있다

### 🎖️ **고급 완료 체크**

- [ ] 마이크로서비스 아키텍처를 이해한다
- [ ] 성능 최적화를 할 수 있다
- [ ] 모니터링 시스템을 구축할 수 있다
- [ ] CI/CD 파이프라인을 구성할 수 있다
- [ ] 프로덕션 환경에 배포할 수 있다

## 🔍 모듈별 학습 가이드

### 🔐 **Auth 모듈** - 인증의 모든 것

```typescript
📁 src/auth/
├── 🎯 학습 목표: JWT 기반 인증 마스터
├── 📚 핵심 파일:
│   ├── auth.service.ts     # 인증 비즈니스 로직
│   ├── jwt.strategy.ts     # Passport JWT 전략
│   └── jwt-auth.guard.ts   # 인증 가드
└── 🧪 실습: 소셜 로그인, 2FA 구현
```

### 🎬 **Video 모듈** - CQRS 패턴의 정석

```typescript
📁 src/video/
├── 🎯 학습 목표: CQRS 패턴 완전 이해
├── 📚 핵심 파일:
│   ├── create-video.handler.ts  # Command Handler
│   ├── find-videos.handler.ts   # Query Handler
│   └── video-created.handler.ts # Event Handler
└── 🧪 실습: 복잡한 비즈니스 로직 CQRS 적용
```

### 👥 **User 모듈** - 레이어드 아키텍처

```typescript
📁 src/user/
├── 🎯 학습 목표: 계층화된 설계 이해
├── 📚 핵심 파일:
│   ├── user.controller.ts  # Presentation Layer
│   ├── user.service.ts     # Business Layer
│   └── user.entity.ts      # Data Layer
└── 🧪 실습: 도메인 로직 분리 설계
```

## 🛠️ 개발 환경 설정

### ⚡ **빠른 시작**

```bash
# 1. 저장소 클론
git clone <repository-url>
cd fastcampus-nestjs-main

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정
cp .env.example .env

# 4. 데이터베이스 실행 (Docker)
docker-compose up -d postgres

# 5. 마이그레이션 실행
pnpm run typeorm migration:run

# 6. 개발 서버 시작
pnpm run start:dev
```

### 🐳 **Docker로 전체 환경 실행**

```bash
# 모든 서비스 실행 (앱 + DB + Redis)
docker-compose up -d

# 로그 확인
docker-compose logs -f app
```

## 🎓 추천 학습 순서

### 📅 **Week 1-2: 기초 다지기**

1. `PROJECT_OVERVIEW.md` 정독
2. 프로젝트 실행 및 API 테스트
3. `src/main.ts`, `src/app.module.ts` 분석
4. User 모듈 코드 리딩

### 📅 **Week 3-4: 인증 마스터**

1. Auth 모듈 완전 분석
2. JWT 토큰 플로우 이해
3. 새로운 인증 기능 추가 실습
4. 테스트 코드 작성

### 📅 **Week 5-6: CQRS 패턴**

1. Video 모듈 CQRS 구조 분석
2. Command/Query/Event 분리 이해
3. 새로운 도메인에 CQRS 적용
4. 이벤트 기반 아키텍처 실습

### 📅 **Week 7-8: 고급 주제**

1. 성능 최적화 기법
2. 모니터링 및 로깅
3. 테스트 전략 수립
4. 배포 및 운영

## 🤝 커뮤니티 참여

### 💬 **질문 및 토론**

- GitHub Issues를 통한 질문
- Discord/Slack 커뮤니티 참여
- 블로그 포스팅으로 학습 내용 공유

### 🎁 **기여 방법**

- 오타 수정 및 문서 개선
- 새로운 실습 예제 추가
- 다른 언어로 번역
- 새로운 기능 구현 예제

## 🚀 다음 단계

이 프로젝트로 NestJS를 마스터한 후에는:

1. **🌟 오픈소스 기여** - NestJS 생태계에 기여
2. **📚 기술 블로그** - 학습 경험 공유
3. **🎤 기술 발표** - 컨퍼런스 및 밋업 참여
4. **👨‍🏫 멘토링** - 후배 개발자 지도
5. **🏢 리드 역할** - 팀의 기술적 리더십

---

## 📞 도움이 필요하다면?

- 📧 **이메일**: [문의 이메일]
- 💬 **Discord**: [NestJS Korea Discord 링크]
- 📱 **카카오톡**: [NestJS 오픈채팅방]
- 📝 **블로그**: [기술 블로그 링크]

**Happy Coding! 🎉**

_"한 번에 하나씩, 차근차근 배워나가면 반드시 NestJS 전문가가 될 수 있습니다!"_
