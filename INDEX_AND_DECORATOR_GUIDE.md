# TypeORM 인덱스와 데코레이터 완전 가이드

> NestJS + TypeORM 실무에서 꼭 알아야 할 인덱스와 데코레이터(@) 사용법

---

## 1. TypeORM의 주요 데코레이터(@) 설명

### @Entity()

- 이 클래스가 데이터베이스 테이블과 매핑됨을 선언합니다.
- 예시: `@Entity('users')` → users 테이블과 연결

### @PrimaryGeneratedColumn()

- 기본 키(Primary Key) 컬럼을 자동 생성합니다.
- `'uuid'` 옵션을 주면 UUID 형식의 고유 ID가 생성됩니다.

### @Column()

- 일반 컬럼을 정의합니다.
- 다양한 옵션(길이, 타입, unique, nullable 등)으로 세부 설정 가능

### @CreateDateColumn() / @UpdateDateColumn()

- 생성/수정 시각을 자동으로 기록하는 특수 컬럼입니다.

### @OneToMany(), @OneToOne(), @ManyToOne(), @ManyToMany()

- 엔티티 간의 관계(연관관계)를 정의합니다.
- 예: 한 사용자는 여러 비디오를 가질 수 있으므로 `@OneToMany(() => Video, video => video.user)`

### @Index()

- 인덱스를 생성하여 검색 성능을 높입니다.
- 단일 컬럼, 복합 컬럼, 유니크 인덱스 등 다양한 형태로 사용 가능

---

## 2. 인덱스(Index)란?

- **정의:** 데이터베이스에서 특정 컬럼(혹은 컬럼 조합)에 대해 빠른 검색을 가능하게 해주는 데이터 구조입니다.
- **효과:** WHERE, JOIN, ORDER BY 등에 자주 사용되는 컬럼에 인덱스를 걸면 조회 속도가 매우 빨라집니다.
- **주의:** 인덱스가 많아질수록 INSERT/UPDATE/DELETE 성능은 약간 저하될 수 있습니다.

---

## 3. 실전 예시 (user.entity.ts)

```typescript
@Entity('users')
@Index('idx_user_email_role', ['email', 'role']) // 복합 인덱스
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index('idx_user_email_lower', { synchronize: false }) // 대소문자 구분 없는 검색용
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.User })
  @Index('idx_user_role')
  role: Role;

  @CreateDateColumn()
  @Index('idx_user_created_at')
  createdAt: Date;
}
```

---

## 4. 언제 인덱스를 추가해야 할까?

- 로그인, 회원가입 등에서 자주 검색되는 컬럼
- 관리자 페이지에서 필터링/정렬에 자주 쓰이는 컬럼
- JOIN, WHERE, ORDER BY에 자주 등장하는 컬럼

---

## 5. 실무 팁

- 인덱스는 너무 많이 걸면 오히려 쓰기 성능이 저하될 수 있으니 꼭 필요한 컬럼에만!
- 복합 인덱스는 컬럼 순서에 따라 성능이 달라질 수 있음
- unique: true 옵션은 자동으로 고유 인덱스를 생성

---

## 6. 참고 자료

- [TypeORM 공식 문서 - Decorators](https://typeorm.io/decorator-reference)
- [TypeORM 공식 문서 - Indexes](https://typeorm.io/indices)
- [PostgreSQL Index 공식 문서](https://www.postgresql.org/docs/current/indexes.html)
