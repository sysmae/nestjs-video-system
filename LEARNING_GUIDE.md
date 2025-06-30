# 🎓 NestJS 프로젝트 학습 가이드

## 📖 개요

이 문서는 NestJS 초보자가 이 프로젝트를 통해 체계적으로 학습할 수 있도록 구성된 가이드입니다. 단계별로 진행하며 각 패턴과 개념을 실습과 함께 이해할 수 있습니다.

## 🗺️ 학습 로드맵

### 1단계: 기초 이해 (1-2주)

- NestJS 기본 개념
- TypeScript 문법
- 데코레이터 패턴
- 의존성 주입(DI)

### 2단계: 핵심 패턴 (2-3주)

- 모듈 시스템
- 컨트롤러와 서비스
- DTO와 유효성 검증
- 데이터베이스 연동 (TypeORM)

### 3단계: 고급 패턴 (3-4주)

- 인증과 인가 (JWT)
- CQRS 패턴
- 이벤트 기반 아키텍처
- 미들웨어와 인터셉터

### 4단계: 운영 환경 (4-5주)

- 로깅과 모니터링
- 테스팅
- 배포와 DevOps
- 성능 최적화

## 📚 단계별 학습 내용

### 🏗️ 1단계: NestJS 기초

#### 1.1 프로젝트 구조 이해

**학습 파일:**

- `src/main.ts` - 애플리케이션 시작점
- `src/app.module.ts` - 루트 모듈
- `package.json` - 프로젝트 설정

**핵심 개념:**

```typescript
// 모듈: 관련된 기능들을 그룹화
@Module({
  imports: [],    // 다른 모듈을 가져오기
  controllers: [], // HTTP 요청 처리
  providers: [],  // 서비스와 기타 프로바이더
  exports: []     // 다른 모듈에서 사용할 수 있도록 내보내기
})
```

**실습 과제:**

1. `src/app.module.ts`에서 각 모듈의 역할 파악하기
2. `src/main.ts`에서 애플리케이션 부트스트랩 과정 이해하기
3. 새로운 간단한 모듈 만들어보기

#### 1.2 의존성 주입(Dependency Injection) 이해

**학습 파일:**

- `src/user/user.service.ts`
- `src/user/user.controller.ts`
- `src/user/user.module.ts`

**핵심 개념:**

```typescript
// 서비스에 다른 서비스 주입
@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}
}

// 컨트롤러에 서비스 주입
@Controller()
export class UserController {
  constructor(private userService: UserService) {}
}
```

**실습 과제:**

1. UserController가 UserService를 어떻게 사용하는지 분석하기
2. 의존성 주입의 장점 이해하기
3. 새로운 서비스를 만들고 다른 서비스에 주입해보기

### 🎯 2단계: 핵심 패턴

#### 2.1 컨트롤러와 라우팅

**학습 파일:**

- `src/auth/auth.controller.ts`
- `src/video/video.controller.ts`
- `src/user/user.controller.ts`

**핵심 개념:**

```typescript
@Controller('api/auth') // 기본 경로 설정
export class AuthController {
  @Post('signup') // POST /api/auth/signup
  @ApiPostResponse(SignupResDto) // Swagger 문서화
  async signup(@Body() signupReqDto: SignupReqDto) {
    // 요청 본문 자동 검증 및 변환
  }
}
```

**실습 과제:**

1. 각 컨트롤러의 엔드포인트 매핑 이해하기
2. HTTP 메서드별 용도 파악하기
3. 새로운 API 엔드포인트 추가해보기

#### 2.2 DTO와 유효성 검증

**학습 파일:**

- `src/auth/dto/req.dto.ts`
- `src/video/dto/req.dto.ts`
- `src/common/dto/req.dto.ts`

**핵심 개념:**

```typescript
export class SignupReqDto {
  @ApiProperty({ required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ required: true })
  @IsString()
  @Length(8, 20)
  password: string;
}
```

**실습 과제:**

1. class-validator 데코레이터들의 역할 이해하기
2. Swagger 자동 문서화 메커니즘 파악하기
3. 새로운 DTO 클래스 만들고 유효성 검증 추가하기

#### 2.3 데이터베이스 연동 (TypeORM)

**학습 파일:**

- `src/user/entity/user.entity.ts`
- `src/video/entity/video.entity.ts`
- `src/ormconfig.ts`

**핵심 개념:**

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @OneToMany(() => Video, (video) => video.user)
  videos: Video[];
}
```

**실습 과제:**

1. 엔티티 관계 매핑 이해하기 (OneToMany, ManyToOne)
2. 마이그레이션 시스템 이해하기
3. 새로운 엔티티 만들고 관계 설정하기

### 🔐 3단계: 고급 패턴

#### 3.1 JWT 인증 시스템

**학습 파일:**

- `src/auth/auth.service.ts`
- `src/auth/jwt.strategy.ts`
- `src/auth/jwt-auth.guard.ts`

**핵심 개념:**

```typescript
// JWT 전략
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  validate(payload: any) {
    return { id: payload.sub, email: payload.email };
  }
}

// 가드를 통한 보호
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@User() user: UserAfterAuth) {
  return user;
}
```

**실습 과제:**

1. JWT 토큰 생성과 검증 과정 이해하기
2. Guard의 동작 원리 파악하기
3. 커스텀 인증 데코레이터 만들어보기

#### 3.2 CQRS 패턴

**학습 파일:**

- `src/video/create-video.handler.ts`
- `src/video/find-videos.handler.ts`
- `src/video/command/create-video.command.ts`
- `src/video/query/find-videos.query.ts`

**핵심 개념:**

```typescript
// 명령 (데이터 변경)
@CommandHandler(CreateVideoCommand)
export class CreateVideoHandler {
  async execute(command: CreateVideoCommand): Promise<Video> {
    // 비즈니스 로직 실행
  }
}

// 쿼리 (데이터 조회)
@QueryHandler(FindVideosQuery)
export class FindVideosQueryHandler {
  async execute(query: FindVideosQuery): Promise<PageResDto<Video>> {
    // 조회 로직 실행
  }
}
```

**실습 과제:**

1. 명령과 쿼리 분리의 이점 이해하기
2. 이벤트 기반 통신 메커니즘 파악하기
3. 새로운 Command/Query 핸들러 만들어보기

#### 3.3 이벤트 기반 아키텍처

**학습 파일:**

- `src/video/video-created.handler.ts`
- `src/video/event/video-created.event.ts`

**핵심 개념:**

```typescript
// 이벤트 발행
this.eventBus.publish(new VideoCreatedEvent(video.id));

// 이벤트 처리
@EventsHandler(VideoCreatedEvent)
export class VideoCreatedHandler {
  handle(event: VideoCreatedEvent) {
    // 이벤트 처리 로직
  }
}
```

**실습 과제:**

1. 도메인 이벤트의 개념 이해하기
2. 느슨한 결합의 장점 파악하기
3. 새로운 이벤트 핸들러 만들어보기

### 🛠️ 4단계: 운영 환경

#### 4.1 미들웨어와 인터셉터

**학습 파일:**

- `src/common/middleware/logger.middleware.ts`
- `src/common/interceptor/transform.interceptor.ts`
- `src/common/interceptor/sentry.interceptor.ts`

**핵심 개념:**

```typescript
// 미들웨어 (요청 전처리)
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 로깅 로직
    next();
  }
}

// 인터셉터 (응답 후처리)
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => ({ data })));
  }
}
```

**실습 과제:**

1. 미들웨어와 인터셉터의 차이점 이해하기
2. 요청/응답 생명주기 파악하기
3. 커스텀 미들웨어 또는 인터셉터 만들어보기

#### 4.2 테스팅

**학습 파일:**

- `src/user/user.service.spec.ts`
- `src/video/create-video.handler.spec.ts`
- `test/` 디렉터리

**핵심 개념:**

```typescript
describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, { provide: getRepositoryToken(User), useClass: MockRepository }],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should find user by email', async () => {
    // 테스트 로직
  });
});
```

**실습 과제:**

1. 단위 테스트와 통합 테스트 차이 이해하기
2. Mock 객체 사용법 파악하기
3. 새로운 테스트 케이스 작성해보기

## 🎯 실습 프로젝트 제안

### 초급: 게시판 시스템

- 사용자 인증
- 게시글 CRUD
- 댓글 기능

### 중급: 블로그 플랫폼

- 카테고리 관리
- 태그 시스템
- 검색 기능
- 파일 업로드

### 고급: 전자상거래 시스템

- 상품 관리
- 주문 처리 (CQRS 적용)
- 결제 시스템 연동
- 재고 관리

## 📚 추천 학습 자료

### 공식 문서

- [NestJS 공식 문서](https://docs.nestjs.com/)
- [TypeORM 공식 문서](https://typeorm.io/)

### 추가 학습 자료

- Clean Architecture
- Domain-Driven Design (DDD)
- Microservices 패턴

## 🤔 자주 묻는 질문 (FAQ)

### Q: 언제 CQRS 패턴을 사용해야 하나요?

**A:** 복잡한 비즈니스 로직이 있고, 읽기와 쓰기 요구사항이 다를 때 사용합니다. 이 프로젝트에서는 비디오 업로드(복잡한 비즈니스 로직)와 목록 조회(단순한 읽기)가 다르기 때문에 적용했습니다.

### Q: Guard와 Middleware의 차이점은 무엇인가요?

**A:**

- **Middleware**: Express의 미들웨어처럼 요청/응답 사이클에서 실행되며, 모든 요청에 적용 가능
- **Guard**: NestJS의 고유 기능으로 라우트 핸들러 실행 전에 인증/인가를 담당

### Q: 언제 EventBus를 사용하나요?

**A:** 모듈 간 결합도를 낮추고 싶을 때 사용합니다. 예를 들어, 비디오가 생성되었을 때 여러 모듈에서 각각 다른 작업을 수행해야 하는 경우에 유용합니다.

## 🎊 마무리

이 프로젝트는 실제 운영 환경에서 사용할 수 있는 수준의 기능들을 포함하고 있습니다. 각 패턴과 개념을 단계별로 학습하며, 실습을 통해 깊이 있는 이해를 쌓아가세요.

학습 중 궁금한 점이 있다면 각 파일의 상세한 주석을 참고하거나, 커뮤니티에서 질문해보세요. 화이팅! 🚀
