# 🔍 NestJS 코드 분석 및 실습 가이드

## 📖 개요

이 문서는 프로젝트의 각 컴포넌트를 실제 코드와 함께 분석하고, 초보자가 따라할 수 있는 실습 과제를 제공합니다.

## 🎯 모듈별 상세 분석

### 1. 🔐 Auth 모듈 - 인증 시스템 완전 분석

#### 핵심 파일 구조

```
src/auth/
├── auth.controller.ts     # 인증 API 엔드포인트
├── auth.service.ts        # 인증 비즈니스 로직
├── auth.module.ts         # 모듈 설정 및 의존성
├── jwt-auth.guard.ts      # JWT 인증 가드
├── jwt.strategy.ts        # Passport JWT 전략
├── dto/
│   ├── req.dto.ts        # 요청 DTO
│   └── res.dto.ts        # 응답 DTO
└── entity/
    └── refresh-token.entity.ts  # 리프레시 토큰 엔티티
```

#### 🔄 인증 플로우 분석

**1. 회원가입 과정**

```typescript
// 1. 클라이언트 요청
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "password123"
}

// 2. AuthController에서 요청 수신
@Post('signup')
@Public() // JWT 인증 제외
async signup(@Body() signupReqDto: SignupReqDto) {
  return this.authService.signup(signupReqDto);
}

// 3. AuthService에서 비즈니스 로직 처리
async signup({ email, password }: SignupReqDto): Promise<SignupResDto> {
  // 3-1. 이메일 중복 체크
  const existingUser = await this.userService.findOneByEmail(email);
  if (existingUser) throw new BadRequestException('이미 존재하는 이메일');

  // 3-2. 트랜잭션 시작
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    // 3-3. 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3-4. 사용자 생성
    const user = await queryRunner.manager.save(
      queryRunner.manager.create(User, { email, password: hashedPassword })
    );

    // 3-5. JWT 토큰 생성
    const accessToken = this.jwtService.sign({ sub: user.id, email });
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '30d' }
    );

    // 3-6. 리프레시 토큰 저장
    await queryRunner.manager.save(
      queryRunner.manager.create(RefreshToken, { user, token: refreshToken })
    );

    await queryRunner.commitTransaction();
    return { accessToken, refreshToken };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  }
}
```

**2. 로그인 과정**

```typescript
// 클라이언트 요청
POST /api/auth/signin
{
  "email": "user@example.com",
  "password": "password123"
}

// AuthService 로그인 로직
async signin({ email, password }: SigninReqDto): Promise<SigninResDto> {
  // 1. 사용자 조회
  const user = await this.userService.findOneByEmail(email);
  if (!user) throw new BadRequestException('Invalid credentials');

  // 2. 비밀번호 검증
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new BadRequestException('Invalid credentials');

  // 3. 토큰 생성 및 반환
  const accessToken = this.jwtService.sign({ sub: user.id, email });
  const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '30d' });

  // 4. 리프레시 토큰 업데이트
  await this.refreshTokenRepository.upsert([{ user, token: refreshToken }], ['user']);

  return { accessToken, refreshToken };
}
```

**3. JWT 인증 과정**

```typescript
// 1. 클라이언트가 요청 헤더에 토큰 포함
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// 2. JwtAuthGuard가 요청 인터셉트
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // @Public() 데코레이터 체크
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true; // 인증 생략
    return super.canActivate(context); // JWT 검증 진행
  }
}

// 3. JwtStrategy가 토큰 검증
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: any): Promise<UserAfterAuth> {
    // 토큰 페이로드에서 사용자 정보 추출
    return { id: payload.sub, email: payload.email };
  }
}

// 4. 컨트롤러에서 인증된 사용자 정보 사용
@Get('profile')
async getProfile(@User() user: UserAfterAuth) {
  return user; // JwtStrategy.validate()에서 반환한 객체
}
```

#### 🧪 Auth 모듈 실습 과제

**초급 과제:**

1. 새로운 엔드포인트 `POST /api/auth/check-email` 만들어 이메일 중복 체크 API 구현
2. 비밀번호 변경 API `PUT /api/auth/change-password` 구현
3. 로그아웃 API `POST /api/auth/logout`에서 리프레시 토큰 삭제 구현

**중급 과제:**

1. 이메일 인증 기능 추가 (가입 시 인증 메일 발송)
2. 비밀번호 재설정 기능 (임시 토큰 발급)
3. 소셜 로그인 (Google OAuth) 추가

**고급 과제:**

1. Rate Limiting을 로그인 실패 시에만 적용
2. 2FA (Two-Factor Authentication) 구현
3. JWT 토큰 블랙리스트 기능 구현

---

### 2. 🎬 Video 모듈 - CQRS 패턴 완전 분석

#### CQRS 아키텍처 흐름

```
Client Request
     ↓
VideoController
     ↓
CommandBus/QueryBus
     ↓
Handler (Command/Query)
     ↓
Database + EventBus
     ↓
Event Handlers
```

#### 🎯 비디오 업로드 (Command) 분석

**1. 클라이언트 요청**

```typescript
// multipart/form-data로 파일 업로드
POST /api/videos
Content-Type: multipart/form-data

title: "My Video"
video: [binary file data]
```

**2. Controller에서 Command 생성**

```typescript
@Post()
@UseInterceptors(FileInterceptor('video'))
async create(
  @UploadedFile(new ParseFilePipeBuilder()
    .addFileTypeValidator({ fileType: 'mp4' })
    .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 }) // 5MB
    .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })
  ) file: Express.Multer.File,
  @Body() createVideoReqDto: CreateVideoReqDto,
  @User() user: UserAfterAuth,
) {
  // Command 객체 생성
  const command = new CreateVideoCommand(
    user.id,
    createVideoReqDto.title,
    file.mimetype,
    file.originalname.split('.').pop(),
    file.buffer,
  );

  // CommandBus를 통해 Handler에게 전달
  return this.commandBus.execute(command);
}
```

**3. CreateVideoHandler에서 복잡한 비즈니스 로직 처리**

```typescript
@CommandHandler(CreateVideoCommand)
export class CreateVideoHandler {
  async execute(command: CreateVideoCommand): Promise<Video> {
    const { userId, title, mimetype, extension, buffer } = command;

    // 트랜잭션 시작
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // 1. 사용자 정보 조회
      const user = await queryRunner.manager.findOneBy(User, { id: userId });

      // 2. 비디오 엔티티 생성 및 저장
      const video = await queryRunner.manager.save(queryRunner.manager.create(Video, { title, mimetype, user }));

      // 3. 파일 시스템에 저장
      const filename = `${video.id}.${extension}`;
      const filePath = join(process.cwd(), 'videos', filename);
      await writeFile(filePath, buffer);

      // 4. 파일 경로 업데이트
      video.path = filePath;
      await queryRunner.manager.save(video);

      await queryRunner.commitTransaction();

      // 5. 이벤트 발행 (비동기 후처리)
      this.eventBus.publish(new VideoCreatedEvent(video.id));

      return video;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }
}
```

**4. 이벤트 기반 후처리**

```typescript
@EventsHandler(VideoCreatedEvent)
export class VideoCreatedHandler {
  async handle(event: VideoCreatedEvent) {
    console.log(`Video created: ${event.videoId}`);

    // 여기서 다양한 후처리 작업 수행:
    // - 썸네일 생성
    // - 인코딩 작업 큐에 추가
    // - 사용자에게 알림 발송
    // - 분석 데이터 업데이트
  }
}
```

#### 🔍 비디오 조회 (Query) 분석

**1. 목록 조회 요청**

```typescript
// 페이지네이션과 함께 비디오 목록 조회
GET /api/videos?page=1&size=10
```

**2. Controller에서 Query 생성**

```typescript
@Get()
async findAll(@Query() { page, size }: FindVideoReqDto) {
  const query = new FindVideosQuery(page, size);
  return this.queryBus.execute(query);
}
```

**3. QueryHandler에서 최적화된 조회**

```typescript
@QueryHandler(FindVideosQuery)
export class FindVideosQueryHandler {
  async execute(query: FindVideosQuery): Promise<PageResDto<Video>> {
    const { page = 1, size = 20 } = query;

    // 최적화된 쿼리 (페이지네이션 + 관계 로딩)
    const [videos, total] = await this.videoRepository.findAndCount({
      relations: ['user'], // 사용자 정보 함께 로딩
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });

    return {
      page,
      size: videos.length,
      items: videos,
    };
  }
}
```

#### 🧪 Video 모듈 실습 과제

**초급 과제:**

1. 비디오 삭제 Command 구현 (`DeleteVideoCommand`, `DeleteVideoHandler`)
2. 인기 비디오 조회 Query 구현 (다운로드 횟수 기준)
3. 사용자별 비디오 목록 조회 Query 구현

**중급 과제:**

1. 비디오 좋아요/싫어요 기능 (Command + Event)
2. 비디오 태그 시스템 구현
3. 비디오 검색 기능 (제목, 태그 기반)

**고급 과제:**

1. 비디오 스트리밍 최적화 (청크 단위 전송)
2. 비디오 인코딩 큐 시스템 (Bull Queue 사용)
3. CDN 연동 (AWS S3 + CloudFront)

---

### 3. 👥 User 모듈 - 레이어드 아키텍처 분석

#### 레이어드 구조 분석

```
UserController (Presentation Layer)
      ↓
UserService (Business Layer)
      ↓
Repository (Data Access Layer)
      ↓
User Entity (Database Layer)
```

#### 🔄 사용자 조회 플로우

**1. Controller (Presentation Layer)**

```typescript
@Controller('api/users')
export class UserController {
  constructor(private userService: UserService) {}

  // 1. HTTP 요청 수신 및 파라미터 검증
  @Get(':id')
  @ApiGetResponse(FindUserResDto)
  async findOne(@Param('id') id: string): Promise<FindUserResDto> {
    // 2. Service Layer로 요청 위임
    return this.userService.findOneById(id);
  }

  // 관리자 전용 - 모든 사용자 조회
  @Get()
  @Roles(Role.ADMIN) // 관리자만 접근 가능
  @ApiGetItemsResponse(FindUserResDto)
  async findAll(@Query() { page, size }: PageReqDto) {
    return this.userService.findAll(page, size);
  }
}
```

**2. Service (Business Layer)**

```typescript
@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  // 비즈니스 로직: ID로 사용자 조회
  async findOneById(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });

    // 비즈니스 규칙: 사용자가 없으면 예외 발생
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  // 비즈니스 로직: 페이지네이션과 함께 모든 사용자 조회
  async findAll(page = 1, size = 20): Promise<PageResDto<User>> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * size,
      take: size,
      order: { createdAt: 'DESC' },
    });

    return {
      page,
      size: users.length,
      items: users,
    };
  }

  // 이메일로 사용자 찾기 (Auth 모듈에서 사용)
  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }
}
```

**3. Repository (Data Access Layer)**

```typescript
// TypeORM에서 자동 제공
@InjectRepository(User) private userRepository: Repository<User>

// 제공되는 주요 메서드들:
// - findOneBy(criteria): 조건에 맞는 하나의 엔티티 조회
// - findAndCount(): 엔티티 목록과 전체 개수 함께 조회
// - save(entity): 엔티티 저장/업데이트
// - remove(entity): 엔티티 삭제
// - createQueryBuilder(): 복잡한 쿼리 작성
```

**4. Entity (Database Layer)**

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 관계 설정: 사용자가 업로드한 비디오들
  @OneToMany(() => Video, (video) => video.user)
  videos: Video[];

  // 관계 설정: 사용자의 리프레시 토큰들
  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];
}
```

#### 🧪 User 모듈 실습 과제

**초급 과제:**

1. 사용자 프로필 업데이트 API 구현
2. 사용자별 통계 정보 조회 (업로드한 비디오 수, 가입일 등)
3. 사용자 역할(Role) 변경 API (관리자 전용)

**중급 과제:**

1. 사용자 팔로우/언팔로우 시스템
2. 사용자 활동 로그 기록 및 조회
3. 사용자 차단/신고 시스템

**고급 과제:**

1. 사용자 데이터 GDPR 준수 (개인정보 export/delete)
2. 사용자 행동 분석 및 추천 시스템
3. 사용자 세션 관리 (동시 로그인 제한)

---

### 4. 📊 Analytics 모듈 - 스케줄링 및 이메일 연동

#### 스케줄링 기반 분석 시스템

**1. 정기적인 분석 작업**

```typescript
@Injectable()
export class AnalyticsService {
  constructor(private videoService: VideoService, private emailService: EmailService) {}

  // 매일 오전 9시에 일간 리포트 생성
  @Cron('0 9 * * *', { timeZone: 'Asia/Seoul' })
  async generateDailyReport() {
    console.log('Generating daily analytics report...');

    // 1. 어제 데이터 수집
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // 2. 통계 데이터 계산
    const stats = await this.calculateDailyStats(yesterday);

    // 3. 이메일 리포트 발송
    await this.emailService.sendAnalyticsReport(stats);
  }

  // 매주 월요일 오전 10시에 주간 리포트 생성
  @Cron('0 10 * * 1', { timeZone: 'Asia/Seoul' })
  async generateWeeklyReport() {
    console.log('Generating weekly analytics report...');

    const weeklyStats = await this.calculateWeeklyStats();
    await this.emailService.sendWeeklyReport(weeklyStats);
  }

  private async calculateDailyStats(date: Date) {
    // 실제 분석 로직 구현
    return {
      date: date.toISOString(),
      totalUploads: 0,
      totalDownloads: 0,
      newUsers: 0,
      // ... 기타 통계
    };
  }
}
```

#### 🧪 Analytics 모듈 실습 과제

**초급 과제:**

1. 인기 비디오 TOP 10 조회 API
2. 사용자별 업로드/다운로드 통계
3. 일간/주간/월간 통계 조회 API

**중급 과제:**

1. 실시간 대시보드 데이터 API
2. 사용자 활동 패턴 분석
3. 비디오 카테고리별 통계

**고급 과제:**

1. 머신러닝 기반 사용자 행동 예측
2. A/B 테스트 시스템 구현
3. 실시간 스트리밍 데이터 분석

---

## 🎯 종합 실습 프로젝트

### 프로젝트: "미니 유튜브 만들기"

#### 1단계: 기본 기능 구현 (1-2주)

- [x] 사용자 인증 (회원가입, 로그인)
- [x] 비디오 업로드/조회
- [ ] 비디오 좋아요/싫어요
- [ ] 댓글 시스템

#### 2단계: 고급 기능 구현 (2-3주)

- [ ] 구독/알림 시스템
- [ ] 비디오 재생목록
- [ ] 검색 및 필터링
- [ ] 사용자 채널 페이지

#### 3단계: 운영 기능 구현 (3-4주)

- [ ] 관리자 대시보드
- [ ] 콘텐츠 신고 시스템
- [ ] 수익화 시스템
- [ ] 라이브 스트리밍

### 학습 체크리스트

#### NestJS 핵심 개념

- [ ] 모듈 시스템 이해
- [ ] 의존성 주입 원리
- [ ] 데코레이터 패턴 활용
- [ ] 가드와 인터셉터 구현

#### 아키텍처 패턴

- [ ] CQRS 패턴 구현
- [ ] 이벤트 기반 아키텍처
- [ ] 레이어드 아키텍처
- [ ] 마이크로서비스 기초

#### 데이터베이스

- [ ] TypeORM 관계 매핑
- [ ] 마이그레이션 관리
- [ ] 쿼리 최적화
- [ ] 트랜잭션 처리

#### 보안 & 운영

- [ ] JWT 인증/인가
- [ ] Rate Limiting
- [ ] 로깅 및 모니터링
- [ ] 테스트 작성

## 🚀 다음 단계 학습 로드맵

1. **GraphQL**: REST API 대신 GraphQL 구현
2. **Microservices**: 모듈을 독립적인 서비스로 분리
3. **Event Sourcing**: 상태 변경을 이벤트로 저장
4. **Kubernetes**: 컨테너 오케스트레이션
5. **Monitoring**: Prometheus, Grafana 연동

이 가이드를 통해 실제 프로덕션 레벨의 NestJS 애플리케이션을 구축하는 경험을 쌓아보세요! 🎯
