# UserService 실전 가이드 및 함수 설계/문서화 전략

> NestJS + TypeORM 기반 사용자 서비스(UserService) 구현 및 주석/문서화 실무 가이드

---

## 1. UserService란?

- 사용자 계정과 관련된 모든 비즈니스 로직(조회, 생성, 수정, 권한 체크 등)을 담당하는 서비스 계층입니다.
- 데이터베이스와 직접 통신하지 않고, TypeORM의 Repository를 통해 엔티티를 조작합니다.
- 컨트롤러, 핸들러 등에서 주입받아 사용합니다.

---

## 2. 주요 함수 설계 및 구현 예시

### 2.1 전체 사용자 목록 조회 (페이지네이션)

```typescript
/**
 * 전체 사용자 목록을 페이지네이션으로 조회
 * @param page 페이지 번호 (1부터 시작)
 * @param size 페이지당 항목 수
 * @returns 사용자 목록
 */
async findAll(page: number, size: number) {
  return this.userRepository.find({
    skip: (page - 1) * size,
    take: size,
  });
}
```

- **실무 팁:**
  - 대량 데이터는 반드시 페이지네이션 적용
  - 정렬 옵션(order), 검색 조건(where) 추가 가능

### 2.2 사용자 ID로 단일 사용자 조회

```typescript
/**
 * 특정 사용자 ID로 사용자 정보 조회
 * @param id 사용자 ID
 * @returns 사용자 정보 (없으면 null)
 */
async findOne(id: string) {
  return this.userRepository.findOneBy({ id });
}
```

- **실무 팁:**
  - 존재하지 않을 경우 null 반환 또는 예외 처리
  - select 옵션으로 민감 정보 제외 가능

### 2.3 이메일로 사용자 조회

```typescript
/**
 * 이메일로 사용자 조회 (로그인/중복체크 등)
 * @param email 사용자 이메일
 * @returns 사용자 정보 (없으면 null)
 */
async findOneByEmail(email: string) {
  return this.userRepository.findOneBy({ email });
}
```

- **실무 팁:**
  - unique 인덱스가 걸린 컬럼에 최적화
  - select: false 옵션 컬럼은 명시적으로 포함해야 조회됨

### 2.4 사용자 권한(관리자) 체크

```typescript
/**
 * 특정 사용자가 관리자 권한을 가지고 있는지 확인
 * @param id 사용자 ID
 * @returns true: 관리자, false: 일반 사용자
 */
async checkUserIsAdmin(id: string) {
  const user = await this.userRepository.findOneBy({ id });
  return user?.role === Role.Admin;
}
```

- **실무 팁:**
  - 권한 기반 접근 제어(Authorization)에서 활용
  - user가 null일 경우 예외 처리 필요

---

## 3. 함수 주석/문서화 전략

- **함수 상단에 JSDoc 스타일 주석 사용**

  - 무엇을 하는 함수인지, 파라미터/반환값/예외를 명확히 기술
  - 실무에서는 예시, 주의사항, 활용 팁도 함께 작성

- **비즈니스 로직/쿼리의 의도 설명**

  - 복잡한 쿼리, 조건문, 트랜잭션 등은 코드 내 인라인 주석으로 추가 설명

- **실제 반환값/예외 케이스 명시**

  - null 반환, 예외 throw 등 실제 동작을 주석에 명확히 남김

- **API 문서 자동화 연계**
  - Swagger 등과 연동 시 DTO, 반환 타입, 예외 케이스를 명확히 주석화

---

## 4. 실무 확장/고도화 예시

- **검색/정렬/필터 기능 추가**
- **트랜잭션 처리(여러 엔티티 동시 갱신)**
- **Soft Delete(논리 삭제) 구현**
- **이메일/닉네임 중복 체크 함수 분리**
- **관리자/일반 사용자 권한 분리 및 정책화**

---

## 5. 참고 자료

- [NestJS 공식 서비스 가이드](https://docs.nestjs.com/providers)
- [TypeORM Repository 공식 문서](https://typeorm.io/repository-api)
- [JSDoc 공식 문서](https://jsdoc.app/)

---

궁금한 점이나 실전 예제, 고급 패턴이 필요하면 언제든 문의하세요!
