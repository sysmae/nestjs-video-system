# 🏗️ NestJS 아키텍처 패턴 가이드

## 📖 개요

이 문서는 프로젝트에 사용된 주요 아키텍처 패턴들을 상세히 설명합니다. 각 패턴의 개념, 사용 이유, 구현 방법을 실제 코드 예시와 함께 제공합니다.

## 🎯 적용된 아키텍처 패턴

### 1. 🏢 모듈러 아키텍처 (Modular Architecture)

#### 개념

애플리케이션을 기능별로 독립적인 모듈로 나누어 구성하는 패턴

#### 장점

- **높은 응집도**: 관련된 기능들이 함께 위치
- **낮은 결합도**: 모듈 간 의존성 최소화
- **재사용성**: 다른 프로젝트에서도 모듈 재사용 가능
- **유지보수성**: 특정 기능 수정 시 해당 모듈만 변경

#### 프로젝트 적용 예시

```typescript
// src/auth/auth.module.ts
@Module({
  imports: [UserModule, PassportModule, JwtModule.registerAsync({...})],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}

// src/video/video.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Video]), CqrsModule],
  providers: [VideoService, CreateVideoHandler, FindVideosQueryHandler],
  controllers: [VideoController],
  exports: [VideoService]
})
export class VideoModule {}
```

#### 모듈 설계 원칙

1. **단일 책임 원칙**: 각 모듈은 하나의 책임만 가짐
2. **의존성 역전**: 추상화에 의존, 구체적인 구현에 의존하지 않음
3. **명확한 경계**: 모듈 간 인터페이스 명확히 정의

---

### 2. 🎭 CQRS (Command Query Responsibility Segregation)

#### 개념

명령(Command)과 쿼리(Query)의 책임을 분리하는 패턴

#### 사용 이유

- **복잡성 분리**: 읽기와 쓰기 로직을 독립적으로 최적화
- **확장성**: 각각 다른 데이터베이스나 서버에서 처리 가능
- **성능**: 읽기는 빠른 조회에, 쓰기는 정합성에 최적화

#### 프로젝트 적용 예시

**명령 (Command) - 데이터 변경**

```typescript
// src/video/command/create-video.command.ts
export class CreateVideoCommand {
  constructor(
    public readonly userId: string,
    public readonly title: string,
    public readonly mimetype: string,
    public readonly extension: string,
    public readonly buffer: Buffer,
  ) {}
}

// src/video/create-video.handler.ts
@CommandHandler(CreateVideoCommand)
export class CreateVideoHandler {
  async execute(command: CreateVideoCommand): Promise<Video> {
    // 복잡한 비즈니스 로직 실행
    // 1. 트랜잭션 시작
    // 2. 파일 저장
    // 3. 데이터베이스 저장
    // 4. 이벤트 발행
  }
}
```

**쿼리 (Query) - 데이터 조회**

```typescript
// src/video/query/find-videos.query.ts
export class FindVideosQuery {
  constructor(public readonly page?: number, public readonly size?: number) {}
}

// src/video/find-videos.handler.ts
@QueryHandler(FindVideosQuery)
export class FindVideosQueryHandler {
  async execute(query: FindVideosQuery): Promise<PageResDto<Video>> {
    // 단순한 조회 로직
    // 페이지네이션과 함께 비디오 목록 반환
  }
}
```

**컨트롤러에서 사용**

```typescript
// src/video/video.controller.ts
@Controller('api/videos')
export class VideoController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Post()
  async create(@Body() dto: CreateVideoReqDto, @User() user: UserAfterAuth) {
    const command = new CreateVideoCommand(user.id, dto.title, ...);
    return this.commandBus.execute(command);
  }

  @Get()
  async findAll(@Query() query: FindVideoReqDto) {
    const findQuery = new FindVideosQuery(query.page, query.size);
    return this.queryBus.execute(findQuery);
  }
}
```

#### CQRS 적용 가이드라인

- **언제 사용할까?**
  - 복잡한 비즈니스 로직이 있을 때
  - 읽기와 쓰기 성능 요구사항이 다를 때
  - 이벤트 소싱과 함께 사용할 때

---

### 3. 🎪 이벤트 기반 아키텍처 (Event-Driven Architecture)

#### 개념

시스템 컴포넌트들이 이벤트를 통해 소통하는 패턴

#### 장점

- **느슨한 결합**: 모듈 간 직접적인 의존성 제거
- **확장성**: 새로운 이벤트 핸들러 쉽게 추가
- **비동기 처리**: 시간이 오래 걸리는 작업을 백그라운드에서 처리

#### 프로젝트 적용 예시

**이벤트 정의**

```typescript
// src/video/event/video-created.event.ts
export class VideoCreatedEvent {
  constructor(public readonly videoId: string) {}
}
```

**이벤트 발행**

```typescript
// src/video/create-video.handler.ts
@CommandHandler(CreateVideoCommand)
export class CreateVideoHandler {
  constructor(private eventBus: EventBus) {}

  async execute(command: CreateVideoCommand): Promise<Video> {
    const video = await this.saveVideo(command);

    // 이벤트 발행
    this.eventBus.publish(new VideoCreatedEvent(video.id));

    return video;
  }
}
```

**이벤트 처리**

```typescript
// src/video/video-created.handler.ts
@EventsHandler(VideoCreatedEvent)
export class VideoCreatedHandler {
  async handle(event: VideoCreatedEvent) {
    // 1. 썸네일 생성
    // 2. 알림 발송
    // 3. 통계 업데이트
    console.log(`Video created: ${event.videoId}`);
  }
}
```

#### 이벤트 설계 원칙

1. **이벤트는 과거형**: VideoCreated, UserRegistered
2. **불변성**: 이벤트 데이터는 변경되지 않음
3. **최소 정보**: 이벤트에는 필요한 최소 정보만 포함

---

### 4. 🏗️ 레이어드 아키텍처 (Layered Architecture)

#### 개념

애플리케이션을 계층별로 나누어 구성하는 패턴

#### 계층 구조

```
┌─────────────────────┐
│    Presentation     │  ← Controllers (HTTP 요청/응답)
├─────────────────────┤
│      Business       │  ← Services (비즈니스 로직)
├─────────────────────┤
│    Data Access      │  ← Repositories (데이터 접근)
├─────────────────────┤
│      Database       │  ← Entities (데이터 모델)
└─────────────────────┘
```

#### 프로젝트 적용 예시

**Presentation Layer - Controller**

```typescript
// src/user/user.controller.ts
@Controller('api/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOneById(id);
  }
}
```

**Business Layer - Service**

```typescript
// src/user/user.service.ts
@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  async findOneById(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
```

**Data Access Layer - Repository**

```typescript
// TypeORM Repository 자동 제공
@InjectRepository(User) private userRepository: Repository<User>
```

**Database Layer - Entity**

```typescript
// src/user/entity/user.entity.ts
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;
}
```

---

### 5. 🛡️ 가드 패턴 (Guard Pattern)

#### 개념

요청이 라우트 핸들러에 도달하기 전에 인증/인가를 검사하는 패턴

#### 프로젝트 적용 예시

**JWT 인증 가드**

```typescript
// src/auth/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // @Public() 데코레이터가 있으면 인증 생략
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [context.getHandler(), context.getClass()]);

    if (isPublic) return true;

    return super.canActivate(context);
  }
}
```

**역할 기반 가드**

```typescript
// src/common/guard/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

**사용 예시**

```typescript
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('users')
  @Roles(Role.ADMIN) // 관리자만 접근 가능
  getAllUsers() {
    return this.userService.findAll();
  }
}
```

---

### 6. 🎨 데코레이터 패턴 (Decorator Pattern)

#### 개념

클래스나 메서드에 메타데이터를 추가하여 기능을 확장하는 패턴

#### 프로젝트 적용 예시

**커스텀 데코레이터**

```typescript
// src/common/decorator/user.decorator.ts
export const User = createParamDecorator((data: unknown, ctx: ExecutionContext): UserAfterAuth => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

// src/common/decorator/roles.decorator.ts
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// src/common/decorator/public.decorator.ts
export const PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(PUBLIC_KEY, true);
```

**Swagger 데코레이터**

```typescript
// src/common/decorator/swagger.decorator.ts
export const ApiGetResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiOkResponse({
      schema: { allOf: [{ $ref: getSchemaPath(model) }] },
    }),
  );
};
```

**사용 예시**

```typescript
@Controller('api/auth')
export class AuthController {
  @Post('signup')
  @Public() // 인증 없이 접근 가능
  @ApiPostResponse(SignupResDto) // Swagger 문서화
  async signup(@Body() dto: SignupReqDto) {
    return this.authService.signup(dto);
  }

  @Get('profile')
  @ApiGetResponse(UserResDto)
  async getProfile(@User() user: UserAfterAuth) {
    // 현재 사용자 정보 주입
    return user;
  }
}
```

---

### 7. 🔌 의존성 주입 패턴 (Dependency Injection)

#### 개념

객체가 필요한 의존성을 직접 생성하지 않고 외부에서 주입받는 패턴

#### 장점

- **테스트 용이성**: Mock 객체로 쉽게 교체 가능
- **느슨한 결합**: 구체적인 구현에 의존하지 않음
- **재사용성**: 동일한 인터페이스를 구현한 다른 객체로 교체 가능

#### 프로젝트 적용 예시

**서비스 주입**

```typescript
// src/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private dataSource: DataSource,
    private userService: UserService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}
}
```

**설정 주입**

```typescript
// src/email/email.module.ts
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          auth: {
            user: configService.get('email.user'),
            pass: configService.get('email.pass'),
          },
        },
      }),
    }),
  ],
})
export class EmailModule {}
```

**테스트에서의 의존성 주입**

```typescript
// src/user/user.service.spec.ts
beforeEach(async () => {
  const module = await Test.createTestingModule({
    providers: [
      UserService,
      {
        provide: getRepositoryToken(User),
        useClass: MockRepository, // 실제 Repository 대신 Mock 사용
      },
    ],
  }).compile();

  userService = module.get<UserService>(UserService);
});
```

---

## 🎯 패턴 선택 가이드

### 언제 어떤 패턴을 사용할까?

| 상황                 | 추천 패턴            | 이유                         |
| -------------------- | -------------------- | ---------------------------- |
| 복잡한 비즈니스 로직 | CQRS                 | 읽기/쓰기 분리로 복잡성 관리 |
| 모듈 간 통신         | Event-Driven         | 느슨한 결합 유지             |
| 인증/인가            | Guard Pattern        | 횡단 관심사 분리             |
| 코드 재사용          | Decorator Pattern    | 메타데이터 기반 기능 확장    |
| 테스트 용이성        | Dependency Injection | Mock 객체 활용               |

### 패턴 조합 예시

**비디오 업로드 기능**

```
1. Layered Architecture: Controller → Service → Repository
2. CQRS: CreateVideoCommand로 복잡한 업로드 로직 처리
3. Event-Driven: VideoCreated 이벤트로 후속 처리
4. Guard Pattern: JWT 인증으로 접근 제어
5. Decorator Pattern: @User()로 현재 사용자 정보 주입
```

## 🚀 다음 단계

1. **마이크로서비스**: 각 모듈을 독립적인 서비스로 분리
2. **이벤트 소싱**: 상태 변경을 이벤트 스트림으로 저장
3. **도메인 주도 설계**: 비즈니스 도메인 중심의 설계
4. **헥사고날 아키텍처**: 포트와 어댑터 패턴 적용

## 📚 추가 학습 자료

- [Martin Fowler - Enterprise Application Patterns](https://martinfowler.com/eaaCatalog/)
- [Microsoft - .NET Application Architecture Guides](https://docs.microsoft.com/en-us/dotnet/architecture/)
- [Patterns of Enterprise Application Architecture](https://www.amazon.com/Patterns-Enterprise-Application-Architecture-Martin/dp/0321127420)

이 가이드를 통해 각 패턴의 목적과 사용법을 이해하고, 실제 프로젝트에 적용해보세요! 🎯
