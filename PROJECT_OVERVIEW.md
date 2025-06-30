# FastCampus NestJS 프로젝트 개요

## 🎯 프로젝트 소개

이 프로젝트는 **NestJS 기반의 비디오 플랫폼 백엔드 API**입니다. 사용자 인증, 비디오 업로드/다운로드, 분석 기능 등을 제공하는 완전한 웹 애플리케이션 백엔드입니다.

## 🏗️ 아키텍처 구조

### 📁 프로젝트 디렉터리 구조

```
src/
├── main.ts                    # 애플리케이션 진입점
├── app.module.ts             # 루트 모듈
├── ormconfig.ts              # TypeORM 설정
├── auth/                     # 인증 모듈
│   ├── auth.controller.ts    # 인증 API 엔드포인트
│   ├── auth.service.ts       # 인증 비즈니스 로직
│   ├── auth.module.ts        # 인증 모듈 설정
│   ├── jwt-auth.guard.ts     # JWT 인증 가드
│   ├── jwt.strategy.ts       # JWT 전략
│   ├── dto/                  # 데이터 전송 객체
│   └── entity/               # 데이터베이스 엔티티
├── user/                     # 사용자 모듈
│   ├── user.controller.ts    # 사용자 API 엔드포인트
│   ├── user.service.ts       # 사용자 비즈니스 로직
│   ├── user.module.ts        # 사용자 모듈 설정
│   ├── dto/                  # 데이터 전송 객체
│   ├── entity/               # 사용자 엔티티
│   └── enum/                 # 사용자 관련 열거형
├── video/                    # 비디오 모듈
│   ├── video.controller.ts   # 비디오 API 엔드포인트
│   ├── video.service.ts      # 비디오 비즈니스 로직
│   ├── video.module.ts       # 비디오 모듈 설정
│   ├── create-video.handler.ts  # CQRS 명령 핸들러
│   ├── find-videos.handler.ts   # CQRS 쿼리 핸들러
│   ├── video-created.handler.ts # 이벤트 핸들러
│   ├── dto/                  # 데이터 전송 객체
│   ├── entity/               # 비디오 엔티티
│   ├── command/              # CQRS 명령
│   ├── query/                # CQRS 쿼리
│   └── event/                # 도메인 이벤트
├── analytics/                # 분석 모듈
├── email/                    # 이메일 서비스 모듈
├── health/                   # 헬스 체크 모듈
├── common/                   # 공통 유틸리티
│   ├── decorator/            # 커스텀 데코레이터
│   ├── dto/                  # 공통 DTO
│   ├── guard/                # 커스텀 가드
│   ├── interceptor/          # 인터셉터
│   └── middleware/           # 미들웨어
├── config/                   # 설정 파일들
└── migrations/               # 데이터베이스 마이그레이션
```

## 🔧 주요 기술 스택

### Backend Framework

- **NestJS**: TypeScript 기반의 Node.js 프레임워크
- **TypeScript**: 정적 타입 언어

### 데이터베이스

- **PostgreSQL**: 관계형 데이터베이스
- **TypeORM**: Object-Relational Mapping

### 인증 & 보안

- **JWT (JSON Web Token)**: 인증 토큰
- **bcrypt**: 비밀번호 해시화
- **Passport**: 인증 미들웨어

### API 문서화

- **Swagger**: API 문서 자동 생성

### 기타

- **CQRS**: Command Query Responsibility Segregation 패턴
- **Winston**: 로깅 라이브러리
- **Sentry**: 에러 추적 서비스
- **Nodemailer**: 이메일 전송

## 📋 주요 기능

### 1. 사용자 인증 (Authentication)

- **회원가입**: 이메일과 비밀번호로 계정 생성
- **로그인**: JWT 토큰 기반 인증
- **토큰 갱신**: 리프레시 토큰을 이용한 액세스 토큰 갱신
- **비밀번호 보안**: bcrypt를 이용한 안전한 비밀번호 저장

### 2. 비디오 관리

- **업로드**: MP4 파일 업로드 (최대 5MB)
- **목록 조회**: 페이지네이션을 지원하는 비디오 목록
- **상세 조회**: 특정 비디오 정보 조회
- **다운로드**: 파일 스트리밍을 통한 다운로드
- **인기 비디오**: 다운로드 횟수 기준 TOP 5 조회

### 3. 사용자 관리

- **프로필 조회**: 사용자 정보 확인
- **권한 관리**: Role 기반 권한 시스템

### 4. 분석 기능

- **다운로드 통계**: 비디오 다운로드 횟수 추적
- **사용자 활동**: 사용자별 활동 분석

### 5. 기타 기능

- **이메일 서비스**: 알림 및 인증 메일 발송
- **헬스 체크**: 서비스 상태 모니터링
- **Rate Limiting**: API 호출 제한
- **로깅**: 모든 요청/응답 로그 기록

## 🔐 보안 기능

### 인증 보안

- JWT 토큰 기반 인증
- 액세스 토큰 (1일) + 리프레시 토큰 (30일)
- bcrypt를 이용한 비밀번호 해시화

### API 보안

- Rate Limiting (60초 동안 20회 제한)
- 파일 업로드 검증 (타입, 크기)
- SQL Injection 방지 (TypeORM 사용)

### 환경 보안

- 환경 변수를 통한 민감 정보 관리
- Swagger 문서에 기본 인증 적용

## 🎨 아키텍처 패턴

### 1. 모듈러 아키텍처

각 기능별로 독립적인 모듈로 구성되어 있어 유지보수성과 확장성이 뛰어납니다.

### 2. CQRS (Command Query Responsibility Segregation)

비디오 모듈에서 명령(Command)과 쿼리(Query)를 분리하여 복잡한 비즈니스 로직을 관리합니다.

### 3. 이벤트 기반 아키텍처

도메인 이벤트를 통해 모듈 간 느슨한 결합을 유지합니다.

### 4. 레이어드 아키텍처

- **Controller**: HTTP 요청 처리
- **Service**: 비즈니스 로직 처리
- **Repository**: 데이터 액세스
- **Entity**: 데이터 모델

## 🚀 시작하기

### 환경 요구사항

- Node.js 18+
- PostgreSQL 13+
- pnpm (패키지 매니저)

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 데이터베이스 마이그레이션
pnpm run typeorm migration:run

# 개발 서버 시작
pnpm run start:dev
```

### 환경 변수 설정

```env
# 데이터베이스
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=nestjs_db
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key

# Swagger
SWAGGER_USER=admin
SWAGGER_PASSWORD=password

# Sentry
SENTRY_DSN=your-sentry-dsn
```

## 📚 API 문서

개발 환경에서 `http://localhost:3000/docs`에서 Swagger API 문서를 확인할 수 있습니다.

## 🧪 테스트

```bash
# 유닛 테스트
pnpm run test

# E2E 테스트
pnpm run test:e2e

# 테스트 커버리지
pnpm run test:cov
```

## 📈 모니터링

- **로깅**: Winston을 통한 구조화된 로그
- **에러 추적**: Sentry를 통한 실시간 에러 모니터링
- **헬스 체크**: `/health` 엔드포인트를 통한 서비스 상태 확인

## 🤝 코드 컨벤션

- **TypeScript**: 엄격한 타입 체크
- **ESLint**: 코드 품질 관리
- **Prettier**: 코드 포맷팅
- **Husky**: Git 훅을 통한 코드 품질 검증

이 프로젝트는 초보자도 이해하기 쉽도록 상세한 주석과 함께 구성되어 있으며, 실제 운영 환경에서 사용할 수 있는 수준의 기능들을 포함하고 있습니다.
