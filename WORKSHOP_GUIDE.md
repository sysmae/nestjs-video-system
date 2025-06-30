# 🎮 NestJS 실습 워크샵

## 📚 개요

이 워크샵은 NestJS 초보자가 단계별로 실습하며 학습할 수 있도록 구성된 실전 가이드입니다. 각 단계별로 구체적인 과제와 해답을 제공합니다.

## 🏆 워크샵 목표

- NestJS의 핵심 개념 실습을 통한 이해
- 실제 프로덕션 레벨의 코드 작성 경험
- 아키텍처 패턴의 실전 적용
- 테스트 주도 개발(TDD) 경험

## 📋 워크샵 일정 (5일 과정)

### 🌅 Day 1: NestJS 기초 마스터

#### 🎯 학습 목표

- NestJS 프로젝트 구조 이해
- 모듈, 컨트롤러, 서비스 개념 습득
- 의존성 주입 패턴 실습

#### 📝 실습 과제 1-1: 간단한 Todo 모듈 만들기

**목표**: 기본적인 CRUD API 구현

**단계별 구현:**

1. **모듈 생성**

```bash
nest g module todo
nest g controller todo
nest g service todo
```

2. **Todo 엔티티 정의**

```typescript
// src/todo/entity/todo.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Todo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

3. **DTO 클래스 작성**

```typescript
// src/todo/dto/create-todo.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateTodoDto {
  @ApiProperty({ description: '할 일 제목' })
  @IsString()
  title: string;

  @ApiProperty({ description: '할 일 설명', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateTodoDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
```

4. **서비스 구현**

```typescript
// src/todo/todo.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './entity/todo.entity';
import { CreateTodoDto, UpdateTodoDto } from './dto/create-todo.dto';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    const todo = this.todoRepository.create(createTodoDto);
    return this.todoRepository.save(todo);
  }

  async findAll(): Promise<Todo[]> {
    return this.todoRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Todo> {
    const todo = await this.todoRepository.findOneBy({ id });
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }
    return todo;
  }

  async update(id: string, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.findOne(id);
    Object.assign(todo, updateTodoDto);
    return this.todoRepository.save(todo);
  }

  async remove(id: string): Promise<void> {
    const todo = await this.findOne(id);
    await this.todoRepository.remove(todo);
  }

  async toggleCompleted(id: string): Promise<Todo> {
    const todo = await this.findOne(id);
    todo.completed = !todo.completed;
    return this.todoRepository.save(todo);
  }
}
```

5. **컨트롤러 구현**

```typescript
// src/todo/todo.controller.ts
import { Controller, Get, Post, Put, Delete, Patch, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TodoService } from './todo.service';
import { CreateTodoDto, UpdateTodoDto } from './dto/create-todo.dto';
import { Todo } from './entity/todo.entity';

@ApiTags('Todo')
@Controller('api/todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  @ApiOperation({ summary: '새 할 일 생성' })
  @ApiResponse({ status: 201, description: '할 일이 성공적으로 생성됨' })
  async create(@Body() createTodoDto: CreateTodoDto): Promise<Todo> {
    return this.todoService.create(createTodoDto);
  }

  @Get()
  @ApiOperation({ summary: '모든 할 일 조회' })
  async findAll(): Promise<Todo[]> {
    return this.todoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 할 일 조회' })
  async findOne(@Param('id') id: string): Promise<Todo> {
    return this.todoService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '할 일 수정' })
  async update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto): Promise<Todo> {
    return this.todoService.update(id, updateTodoDto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: '할 일 완료 상태 토글' })
  async toggleCompleted(@Param('id') id: string): Promise<Todo> {
    return this.todoService.toggleCompleted(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '할 일 삭제' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.todoService.remove(id);
  }
}
```

**💡 실습 포인트:**

- 각 계층의 역할 이해하기
- 의존성 주입이 어떻게 작동하는지 관찰하기
- Swagger 문서가 자동으로 생성되는 과정 확인하기

#### 📝 실습 과제 1-2: 커스텀 데코레이터 만들기

**목표**: NestJS 데코레이터 패턴 이해

```typescript
// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // 인증된 사용자 정보 반환
  },
);

// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// 사용 예시
@Get('admin-only')
@RequireRoles('admin')
async getAdminData(@CurrentUser() user: any) {
  return { message: 'Admin data', user };
}
```

---

### 🌤️ Day 2: 인증 시스템 구축

#### 🎯 학습 목표

- JWT 기반 인증 시스템 구현
- Guard와 Strategy 패턴 이해
- 보안 모범 사례 적용

#### 📝 실습 과제 2-1: JWT 인증 시스템 확장

**목표**: 기존 Auth 모듈에 추가 기능 구현

1. **이메일 인증 기능 추가**

```typescript
// src/auth/dto/verify-email.dto.ts
export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  token: string;
}

// src/auth/auth.service.ts
async sendEmailVerification(email: string): Promise<void> {
  const token = this.jwtService.sign(
    { email, type: 'email-verification' },
    { expiresIn: '1h' }
  );

  await this.emailService.sendVerificationEmail(email, token);
}

async verifyEmail(token: string): Promise<{ message: string }> {
  try {
    const payload = this.jwtService.verify(token);
    if (payload.type !== 'email-verification') {
      throw new BadRequestException('Invalid token type');
    }

    await this.userService.markEmailAsVerified(payload.email);
    return { message: 'Email verified successfully' };
  } catch (error) {
    throw new BadRequestException('Invalid or expired token');
  }
}
```

2. **비밀번호 재설정 기능**

```typescript
// src/auth/dto/reset-password.dto.ts
export class ResetPasswordRequestDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  @Length(8, 20)
  newPassword: string;
}

// src/auth/auth.service.ts
async requestPasswordReset(email: string): Promise<void> {
  const user = await this.userService.findOneByEmail(email);
  if (!user) {
    // 보안상 이메일이 존재하지 않아도 성공 메시지 반환
    return;
  }

  const token = this.jwtService.sign(
    { userId: user.id, type: 'password-reset' },
    { expiresIn: '1h' }
  );

  await this.emailService.sendPasswordResetEmail(email, token);
}

async resetPassword(token: string, newPassword: string): Promise<void> {
  const payload = this.jwtService.verify(token);
  if (payload.type !== 'password-reset') {
    throw new BadRequestException('Invalid token type');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await this.userService.updatePassword(payload.userId, hashedPassword);
}
```

#### 📝 실습 과제 2-2: Role-based Access Control (RBAC)

**목표**: 세밀한 권한 관리 시스템 구현

```typescript
// src/auth/decorators/permissions.decorator.ts
export enum Permission {
  CREATE_POST = 'create:post',
  READ_POST = 'read:post',
  UPDATE_POST = 'update:post',
  DELETE_POST = 'delete:post',
  MANAGE_USERS = 'manage:users',
}

export const RequirePermissions = (...permissions: Permission[]) => SetMetadata('permissions', permissions);

// src/auth/guards/permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredPermissions.every((permission) => user.permissions?.includes(permission));
  }
}

// 사용 예시
@Controller('api/admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  @Delete('users/:id')
  @RequirePermissions(Permission.MANAGE_USERS)
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
```

---

### ⛅ Day 3: CQRS 패턴 마스터

#### 🎯 학습 목표

- CQRS 패턴 심화 이해
- Event Sourcing 기초
- 복잡한 비즈니스 로직 구현

#### 📝 실습 과제 3-1: 블로그 시스템 CQRS 구현

**목표**: 복잡한 도메인 로직을 CQRS로 구현

1. **Post 도메인 설계**

```typescript
// src/blog/entity/post.entity.ts
@Entity()
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ default: 'draft' })
  status: 'draft' | 'published' | 'archived';

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @ManyToOne(() => User, (user) => user.posts)
  author: User;

  @ManyToMany(() => Tag)
  @JoinTable()
  tags: Tag[];

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  publishedAt?: Date;
}
```

2. **명령 구현**

```typescript
// src/blog/commands/create-post.command.ts
export class CreatePostCommand {
  constructor(
    public readonly authorId: string,
    public readonly title: string,
    public readonly content: string,
    public readonly tags: string[],
    public readonly shouldPublish: boolean = false,
  ) {}
}

// src/blog/handlers/create-post.handler.ts
@CommandHandler(CreatePostCommand)
export class CreatePostHandler implements ICommandHandler<CreatePostCommand> {
  constructor(private dataSource: DataSource, private eventBus: EventBus) {}

  async execute(command: CreatePostCommand): Promise<Post> {
    const { authorId, title, content, tags, shouldPublish } = command;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // 1. 작성자 조회
      const author = await queryRunner.manager.findOneBy(User, { id: authorId });
      if (!author) throw new NotFoundException('Author not found');

      // 2. 태그 처리
      const tagEntities = await this.processTags(tags, queryRunner.manager);

      // 3. 포스트 생성
      const post = queryRunner.manager.create(Post, {
        title,
        content,
        author,
        tags: tagEntities,
        status: shouldPublish ? 'published' : 'draft',
        publishedAt: shouldPublish ? new Date() : null,
      });

      const savedPost = await queryRunner.manager.save(post);
      await queryRunner.commitTransaction();

      // 4. 이벤트 발행
      if (shouldPublish) {
        this.eventBus.publish(new PostPublishedEvent(savedPost.id));
      } else {
        this.eventBus.publish(new PostCreatedEvent(savedPost.id));
      }

      return savedPost;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async processTags(tagNames: string[], manager: EntityManager): Promise<Tag[]> {
    const tags = [];
    for (const tagName of tagNames) {
      let tag = await manager.findOneBy(Tag, { name: tagName });
      if (!tag) {
        tag = manager.create(Tag, { name: tagName });
        tag = await manager.save(tag);
      }
      tags.push(tag);
    }
    return tags;
  }
}
```

3. **쿼리 구현**

```typescript
// src/blog/queries/find-posts.query.ts
export class FindPostsQuery {
  constructor(
    public readonly filters: {
      authorId?: string;
      tags?: string[];
      status?: string;
      search?: string;
    },
    public readonly pagination: {
      page: number;
      limit: number;
    },
    public readonly sorting: {
      field: 'createdAt' | 'publishedAt' | 'viewCount' | 'likeCount';
      order: 'ASC' | 'DESC';
    } = { field: 'publishedAt', order: 'DESC' },
  ) {}
}

// src/blog/handlers/find-posts.handler.ts
@QueryHandler(FindPostsQuery)
export class FindPostsHandler implements IQueryHandler<FindPostsQuery> {
  constructor(@InjectRepository(Post) private postRepository: Repository<Post>) {}

  async execute(query: FindPostsQuery): Promise<PageResDto<Post>> {
    const { filters, pagination, sorting } = query;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.tags', 'tags');

    // 필터 적용
    this.applyFilters(queryBuilder, filters);

    // 정렬 적용
    queryBuilder.orderBy(`post.${sorting.field}`, sorting.order);

    // 페이지네이션 적용
    const offset = (pagination.page - 1) * pagination.limit;
    queryBuilder.skip(offset).take(pagination.limit);

    const [posts, total] = await queryBuilder.getManyAndCount();

    return {
      items: posts,
      page: pagination.page,
      size: posts.length,
      total,
    };
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<Post>, filters: any) {
    if (filters.authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId: filters.authorId });
    }

    if (filters.status) {
      queryBuilder.andWhere('post.status = :status', { status: filters.status });
    }

    if (filters.tags?.length > 0) {
      queryBuilder.andWhere('tags.name IN (:...tags)', { tags: filters.tags });
    }

    if (filters.search) {
      queryBuilder.andWhere('(post.title ILIKE :search OR post.content ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }
  }
}
```

4. **이벤트 핸들러**

```typescript
// src/blog/events/post-published.event.ts
export class PostPublishedEvent {
  constructor(public readonly postId: string) {}
}

// src/blog/handlers/post-published.handler.ts
@EventsHandler(PostPublishedEvent)
export class PostPublishedHandler implements IEventHandler<PostPublishedEvent> {
  constructor(private emailService: EmailService, private notificationService: NotificationService) {}

  async handle(event: PostPublishedEvent) {
    console.log(`Post published: ${event.postId}`);

    // 1. 구독자들에게 알림 발송
    await this.notificationService.notifySubscribers(event.postId);

    // 2. SEO 인덱싱 요청
    await this.submitToSearchEngines(event.postId);

    // 3. 소셜 미디어 자동 포스팅
    await this.shareOnSocialMedia(event.postId);
  }

  private async submitToSearchEngines(postId: string) {
    // 검색 엔진에 새 글 인덱싱 요청 로직
  }

  private async shareOnSocialMedia(postId: string) {
    // 소셜 미디어 자동 공유 로직
  }
}
```

#### 📝 실습 과제 3-2: 읽기 모델 최적화

**목표**: CQRS의 읽기 모델 최적화 기법 학습

```typescript
// src/blog/read-models/post-summary.view.ts
@ViewEntity({
  expression: `
    SELECT
      p.id,
      p.title,
      p.status,
      p.view_count,
      p.like_count,
      p.published_at,
      u.email as author_email,
      u.id as author_id,
      string_agg(t.name, ',') as tags
    FROM post p
    LEFT JOIN "user" u ON p.author_id = u.id
    LEFT JOIN post_tags_tag pt ON p.id = pt.post_id
    LEFT JOIN tag t ON pt.tag_id = t.id
    GROUP BY p.id, u.id, u.email
  `,
})
export class PostSummaryView {
  @ViewColumn()
  id: string;

  @ViewColumn()
  title: string;

  @ViewColumn()
  status: string;

  @ViewColumn()
  viewCount: number;

  @ViewColumn()
  likeCount: number;

  @ViewColumn()
  publishedAt: Date;

  @ViewColumn()
  authorEmail: string;

  @ViewColumn()
  authorId: string;

  @ViewColumn()
  tags: string;
}

// 최적화된 쿼리 핸들러
@QueryHandler(FindPostSummariesQuery)
export class FindPostSummariesHandler {
  constructor(
    @InjectRepository(PostSummaryView)
    private postSummaryRepository: Repository<PostSummaryView>,
  ) {}

  async execute(query: FindPostSummariesQuery): Promise<PostSummaryView[]> {
    return this.postSummaryRepository.find({
      where: query.filters,
      order: { publishedAt: 'DESC' },
      take: query.limit,
      skip: query.offset,
    });
  }
}
```

---

### 🌥️ Day 4: 테스팅 및 품질 관리

#### 🎯 학습 목표

- 단위 테스트 및 통합 테스트 작성
- Test-Driven Development (TDD) 실습
- 코드 품질 관리 도구 활용

#### 📝 실습 과제 4-1: 종합적인 테스트 작성

**목표**: 실제 프로덕션 코드의 테스트 커버리지 달성

1. **단위 테스트 (Unit Test)**

```typescript
// src/blog/handlers/create-post.handler.spec.ts
describe('CreatePostHandler', () => {
  let handler: CreatePostHandler;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreatePostHandler,
        {
          provide: DataSource,
          useFactory: () => ({
            createQueryRunner: jest.fn(),
          }),
        },
        {
          provide: EventBus,
          useFactory: () => ({
            publish: jest.fn(),
          }),
        },
      ],
    }).compile();

    handler = module.get<CreatePostHandler>(CreatePostHandler);
    mockDataSource = module.get(DataSource);
    mockEventBus = module.get(EventBus);

    mockQueryRunner = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOneBy: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      },
    } as any;

    mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
  });

  describe('execute', () => {
    it('should create a draft post successfully', async () => {
      // Given
      const command = new CreatePostCommand(
        'user-id',
        'Test Title',
        'Test Content',
        ['tag1', 'tag2'],
        false, // draft
      );

      const mockAuthor = { id: 'user-id', email: 'test@test.com' };
      const mockPost = { id: 'post-id', title: 'Test Title', status: 'draft' };

      mockQueryRunner.manager.findOneBy.mockResolvedValue(mockAuthor);
      mockQueryRunner.manager.create.mockReturnValue(mockPost);
      mockQueryRunner.manager.save.mockResolvedValue(mockPost);

      // When
      const result = await handler.execute(command);

      // Then
      expect(result).toEqual(mockPost);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalledWith(expect.any(PostCreatedEvent));
    });

    it('should publish post and trigger PublishedEvent', async () => {
      // Given
      const command = new CreatePostCommand(
        'user-id',
        'Test Title',
        'Test Content',
        [],
        true, // publish
      );

      const mockAuthor = { id: 'user-id', email: 'test@test.com' };
      const mockPost = { id: 'post-id', status: 'published' };

      mockQueryRunner.manager.findOneBy.mockResolvedValue(mockAuthor);
      mockQueryRunner.manager.create.mockReturnValue(mockPost);
      mockQueryRunner.manager.save.mockResolvedValue(mockPost);

      // When
      await handler.execute(command);

      // Then
      expect(mockEventBus.publish).toHaveBeenCalledWith(expect.any(PostPublishedEvent));
    });

    it('should rollback transaction on error', async () => {
      // Given
      const command = new CreatePostCommand('user-id', 'Title', 'Content', [], false);
      mockQueryRunner.manager.findOneBy.mockRejectedValue(new Error('DB Error'));

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow('DB Error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
```

2. **통합 테스트 (Integration Test)**

```typescript
// test/blog.e2e-spec.ts
describe('Blog (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 테스트용 사용자 생성 및 로그인
    const response = await request(app.getHttpServer()).post('/api/auth/signup').send({
      email: 'test@test.com',
      password: 'password123',
    });

    authToken = response.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/blog/posts', () => {
    it('should create a new post', async () => {
      const createPostDto = {
        title: 'Test Post',
        content: 'This is a test post content',
        tags: ['test', 'nestjs'],
        shouldPublish: false,
      };

      const response = await request(app.getHttpServer())
        .post('/api/blog/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPostDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(createPostDto.title);
      expect(response.body.status).toBe('draft');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).post('/api/blog/posts').send({ title: 'Test' }).expect(401);
    });
  });

  describe('GET /api/blog/posts', () => {
    it('should return paginated posts', async () => {
      const response = await request(app.getHttpServer()).get('/api/blog/posts?page=1&limit=10').expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });
});
```

3. **성능 테스트**

```typescript
// test/performance/blog-load.test.ts
describe('Blog Performance Tests', () => {
  it('should handle 100 concurrent post creations', async () => {
    const startTime = Date.now();

    const promises = Array.from({ length: 100 }, (_, i) =>
      request(app.getHttpServer())
        .post('/api/blog/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: `Performance Test Post ${i}`,
          content: 'Content for performance testing',
          tags: ['performance', 'test'],
        }),
    );

    const results = await Promise.all(promises);
    const endTime = Date.now();

    expect(results.every((r) => r.status === 201)).toBe(true);
    expect(endTime - startTime).toBeLessThan(10000); // 10초 이내
  });
});
```

#### 📝 실습 과제 4-2: TDD로 새 기능 구현

**목표**: Test-First 개발 방법론 실습

**시나리오**: 포스트 좋아요 기능 구현

1. **먼저 테스트 작성**

```typescript
// src/blog/handlers/like-post.handler.spec.ts
describe('LikePostHandler', () => {
  let handler: LikePostHandler;

  beforeEach(async () => {
    // 테스트 모듈 설정
  });

  it('should like a post successfully', async () => {
    // Given
    const command = new LikePostCommand('post-id', 'user-id');

    // When
    const result = await handler.execute(command);

    // Then
    expect(result.isLiked).toBe(true);
    expect(result.likeCount).toBe(1);
  });

  it('should unlike a post if already liked', async () => {
    // Given - 이미 좋아요한 상태
    const command = new LikePostCommand('post-id', 'user-id');

    // When
    const result = await handler.execute(command);

    // Then
    expect(result.isLiked).toBe(false);
    expect(result.likeCount).toBe(0);
  });

  it('should throw error if post not found', async () => {
    // Given
    const command = new LikePostCommand('invalid-id', 'user-id');

    // When & Then
    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });
});
```

2. **테스트를 통과시키는 최소 구현**

```typescript
// src/blog/commands/like-post.command.ts
export class LikePostCommand {
  constructor(public readonly postId: string, public readonly userId: string) {}
}

// src/blog/handlers/like-post.handler.ts
@CommandHandler(LikePostCommand)
export class LikePostHandler implements ICommandHandler<LikePostCommand> {
  constructor(
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(PostLike) private likeRepository: Repository<PostLike>,
    private eventBus: EventBus,
  ) {}

  async execute(command: LikePostCommand): Promise<{ isLiked: boolean; likeCount: number }> {
    const { postId, userId } = command;

    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.likeRepository.findOneBy({
      postId,
      userId,
    });

    if (existingLike) {
      // Unlike
      await this.likeRepository.remove(existingLike);
      await this.postRepository.decrement({ id: postId }, 'likeCount', 1);

      this.eventBus.publish(new PostUnlikedEvent(postId, userId));

      return { isLiked: false, likeCount: post.likeCount - 1 };
    } else {
      // Like
      const like = this.likeRepository.create({ postId, userId });
      await this.likeRepository.save(like);
      await this.postRepository.increment({ id: postId }, 'likeCount', 1);

      this.eventBus.publish(new PostLikedEvent(postId, userId));

      return { isLiked: true, likeCount: post.likeCount + 1 };
    }
  }
}
```

3. **리팩토링 및 최적화**

```typescript
// 성능 최적화된 버전
@CommandHandler(LikePostCommand)
export class LikePostHandler implements ICommandHandler<LikePostCommand> {
  async execute(command: LikePostCommand): Promise<{ isLiked: boolean; likeCount: number }> {
    const { postId, userId } = command;

    return this.dataSource.transaction(async (manager) => {
      const post = await manager.findOneBy(Post, { id: postId });
      if (!post) throw new NotFoundException('Post not found');

      const existingLike = await manager.findOneBy(PostLike, { postId, userId });

      if (existingLike) {
        await manager.remove(existingLike);
        post.likeCount--;
        await manager.save(post);

        this.eventBus.publish(new PostUnlikedEvent(postId, userId));
        return { isLiked: false, likeCount: post.likeCount };
      } else {
        const like = manager.create(PostLike, { postId, userId });
        await manager.save(like);

        post.likeCount++;
        await manager.save(post);

        this.eventBus.publish(new PostLikedEvent(postId, userId));
        return { isLiked: true, likeCount: post.likeCount };
      }
    });
  }
}
```

---

### 🌦️ Day 5: 운영 환경 준비

#### 🎯 학습 목표

- 모니터링 및 로깅 시스템 구축
- 성능 최적화
- 배포 전략 수립

#### 📝 실습 과제 5-1: 종합 모니터링 시스템

**목표**: 프로덕션 레벨의 모니터링 구축

1. **헬스 체크 시스템 확장**

```typescript
// src/health/custom-health-indicators.ts
@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private dataSource: DataSource) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.dataSource.query('SELECT 1');
      return this.getStatus(key, true);
    } catch (error) {
      return this.getStatus(key, false, { message: error.message });
    }
  }
}

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Redis 연결 상태 확인 로직
      return this.getStatus(key, true);
    } catch (error) {
      return this.getStatus(key, false, { message: error.message });
    }
  }
}

// src/health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: DatabaseHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.isHealthy('database'), () => this.redis.isHealthy('redis')]);
  }

  @Get('detailed')
  @HealthCheck()
  detailedCheck() {
    return this.health.check([
      () => this.db.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
      () => this.checkDiskSpace(),
      () => this.checkMemoryUsage(),
    ]);
  }

  private async checkDiskSpace(): Promise<HealthIndicatorResult> {
    // 디스크 공간 확인 로직
  }

  private async checkMemoryUsage(): Promise<HealthIndicatorResult> {
    // 메모리 사용량 확인 로직
  }
}
```

2. **성능 메트릭 수집**

```typescript
// src/common/interceptors/metrics.interceptor.ts
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'],
  });

  private readonly httpRequestTotal = new prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
  });

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, route } = request;

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const duration = (Date.now() - start) / 1000;

        this.httpRequestDuration.labels(method, route?.path || 'unknown', response.statusCode).observe(duration);

        this.httpRequestTotal.labels(method, route?.path || 'unknown', response.statusCode).inc();
      }),
    );
  }
}

// src/monitoring/monitoring.controller.ts
@Controller('metrics')
export class MonitoringController {
  @Get()
  async getMetrics(@Res() response: Response) {
    response.set('Content-Type', prometheus.register.contentType);
    response.end(await prometheus.register.metrics());
  }
}
```

#### 📝 실습 과제 5-2: 최종 프로젝트 통합

**목표**: 모든 학습 내용을 통합한 완성된 애플리케이션

```typescript
// src/app.module.ts - 최종 통합 설정
@Module({
  imports: [
    // 설정 관리
    ConfigModule.forRoot({ isGlobal: true }),

    // 데이터베이스
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),

    // 스케줄링
    ScheduleModule.forRoot(),

    // CQRS
    CqrsModule,

    // 기능 모듈들
    AuthModule,
    UserModule,
    BlogModule,
    TodoModule,
    HealthModule,
    MonitoringModule,
  ],
  providers: [
    // 글로벌 인터셉터
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // 글로벌 필터
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
```

## 🎉 워크샵 완료 체크리스트

### ✅ 기술적 성취

- [ ] NestJS 모듈 시스템 완전 이해
- [ ] JWT 기반 인증 시스템 구현
- [ ] CQRS 패턴 적용
- [ ] 종합적인 테스트 작성
- [ ] 모니터링 시스템 구축

### ✅ 아키텍처 이해

- [ ] 레이어드 아키텍처 구현
- [ ] 이벤트 기반 아키텍처 적용
- [ ] 의존성 주입 패턴 활용
- [ ] 데코레이터 패턴 구현

### ✅ 운영 준비

- [ ] 로깅 및 모니터링 설정
- [ ] 성능 최적화 적용
- [ ] 보안 모범 사례 구현
- [ ] 테스트 커버리지 80% 이상

## 🚀 다음 단계 학습 계획

1. **고급 패턴**: Event Sourcing, Saga Pattern
2. **마이크로서비스**: Module Federation, Service Mesh
3. **클라우드**: AWS/GCP 배포, Container Orchestration
4. **데브옵스**: CI/CD Pipeline, Infrastructure as Code

축하합니다! 이제 여러분은 프로덕션 레벨의 NestJS 애플리케이션을 구축할 수 있는 역량을 갖추었습니다! 🎊
