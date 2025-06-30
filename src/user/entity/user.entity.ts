/**
 * 사용자 정보를 저장하는 데이터베이스 엔티티
 * TypeORM을 사용하여 PostgreSQL 데이터베이스의 user 테이블과 매핑됩니다.
 *
 * ===== 🚀 초보자를 위한 엔티티 & 인덱스 개념 가이드 =====
 *
 * **엔티티(Entity)란?**
 * - 데이터베이스 테이블과 1:1로 대응되는 클래스
 * - 각 속성(필드)은 테이블의 컬럼과 매핑됨
 * - TypeORM이 자동으로 SQL 쿼리 생성
 *
 * **인덱스(Index)란?**
 * - 데이터베이스에서 검색 속도를 향상시키는 데이터 구조
 * - 책의 목차와 같은 역할 (페이지를 빠르게 찾기)
 * - 조회는 빨라지지만 저장/수정/삭제는 약간 느려짐
 *
 * **언제 인덱스를 사용해야 할까?**
 * ✅ 자주 검색되는 컬럼 (이메일, 사용자명 등)
 * ✅ WHERE 절에 자주 사용되는 컬럼
 * ✅ JOIN 조건에 사용되는 컬럼
 * ✅ ORDER BY에 사용되는 컬럼
 *
 * ❌ 거의 검색하지 않는 컬럼
 * ❌ 자주 변경되는 컬럼
 * ❌ 데이터가 매우 적은 테이블
 *
 * **인덱스 종류:**
 * 1. **단일 인덱스**: 하나의 컬럼에만 적용
 * 2. **복합 인덱스**: 여러 컬럼을 조합하여 적용
 * 3. **고유 인덱스**: 중복을 허용하지 않는 인덱스
 * 4. **부분 인덱스**: 특정 조건을 만족하는 행만 인덱싱
 */

import { RefreshToken } from 'src/auth/entity/refresh-token.entity';
import { Video } from 'src/video/entity/video.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../enum/user.enum';

/**
 * 🏗️ 엔티티 레벨 데코레이터 설명
 *
 * @Entity() - 이 클래스가 데이터베이스 테이블임을 선언
 * @Index() - 테이블 레벨에서 복합 인덱스를 정의할 때 사용
 */
@Entity('users') // 💡 테이블명을 명시적으로 지정 (기본값: 클래스명의 소문자)
@Index('idx_user_email_role', ['email', 'role']) // 🚀 복합 인덱스: 이메일 + 역할 조합 검색 최적화
@Index('idx_user_created_at', ['createdAt']) // 📅 생성일 기준 정렬/검색 최적화
@Index('idx_user_role_created', ['role', 'createdAt']) // 👥 역할별 + 최신순 조회 최적화
export class User {
  /**
   * 🔑 기본 키 (Primary Key)
   *
   * @PrimaryGeneratedColumn 데코레이터 상세 설명:
   * - 'uuid': UUID v4 형태로 자동 생성 (예: 550e8400-e29b-41d4-a716-446655440000)
   * - 'increment': 숫자 자동 증가 (1, 2, 3, ...)
   * - 'rowid': 행 ID 사용 (특정 DB에서만)
   *
   * 🤔 UUID vs 숫자 ID 비교:
   *
   * **UUID 장점:**
   * ✅ 전역적으로 고유 (분산 시스템에 유리)
   * ✅ 추측하기 어려움 (보안상 유리)
   * ✅ 여러 데이터베이스 병합 시 충돌 없음
   *
   * **UUID 단점:**
   * ❌ 저장 공간 더 필요 (36바이트 vs 4바이트)
   * ❌ 인덱스 성능 약간 느림
   * ❌ 사람이 읽기 어려움
   *
   * **언제 UUID를 사용할까?**
   * - 마이크로서비스 환경
   * - 보안이 중요한 시스템
   * - 외부에 ID가 노출되는 경우
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 📧 이메일 - 가장 중요한 검색 조건
   *
   * @Column 데코레이터 옵션들:
   * - unique: true → 중복 불허 (자동으로 고유 인덱스 생성)
   * - nullable: false (기본값) → NULL 값 불허
   * - length: 255 (기본값) → 최대 문자 길이
   * - type: 'varchar' (기본값) → 데이터 타입
   *
   * 💡 왜 unique 인덱스가 필요한가?
   * - 로그인 시 이메일로 사용자 검색
   * - 회원가입 시 중복 이메일 체크
   * - unique 제약조건은 자동으로 인덱스 생성
   */
  @Column({
    unique: true,
    length: 320, // 💡 이메일 표준 최대 길이 (64@255 = 320자)
    comment: '사용자 이메일 주소 (로그인 ID)',
  })
  @Index('idx_user_email_lower', { synchronize: false }) // 🔍 대소문자 구분 없는 검색용 (PostgreSQL 전용)
  email: string;

  /**
   * 🔒 비밀번호 - 해시화된 값 저장
   *
   * 💡 비밀번호 보안 원칙:
   * 1. 절대 평문(원본) 저장 금지
   * 2. bcrypt 등 단방향 해시 함수 사용
   * 3. Salt 값 포함하여 레인보우 테이블 공격 방지
   * 4. 충분한 라운드 수 설정 (10-12 권장)
   */
  @Column({
    length: 60, // 💡 bcrypt 해시 결과 길이 (60자 고정)
    comment: 'bcrypt로 해시화된 비밀번호',
    select: false, // 🔒 기본 조회 시 제외 (보안상 중요!)
  })
  password: string;

  /**
   * 👥 사용자 권한 - 열거형(Enum) 타입
   *
   * @Column enum 옵션 설명:
   * - PostgreSQL에서는 실제 ENUM 타입 생성
   * - MySQL에서는 ENUM 컬럼 타입 사용
   * - 다른 DB에서는 CHECK 제약조건으로 구현
   *
   * 🎯 인덱스가 필요한 이유:
   * - 관리자 페이지에서 역할별 사용자 조회
   * - 권한 체크 시 빠른 검색 필요
   */
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.User,
    comment: '사용자 권한 레벨',
  })
  @Index('idx_user_role') // 🚀 역할별 검색 최적화
  role: Role = Role.User;

  /**
   * 📅 생성 시간 - 자동 타임스탬프
   *
   * @CreateDateColumn 특징:
   * - INSERT 시 자동으로 현재 시간 설정
   * - 한 번 설정되면 변경되지 않음
   * - timezone 정보 포함 권장
   *
   * 💡 인덱스가 필요한 이유:
   * - 최신 가입자 조회 (ORDER BY created_at DESC)
   * - 특정 기간 가입자 통계
   * - 페이지네이션에서 커서 기반 조회
   */
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz', // 💡 timezone 포함 타입 (PostgreSQL)
    comment: '계정 생성 시각',
  })
  createdAt: Date;

  /**
   * 🔄 수정 시간 - 자동 업데이트 타임스탬프
   *
   * @UpdateDateColumn 특징:
   * - INSERT와 UPDATE 시 자동으로 현재 시간 설정
   * - 엔티티가 변경될 때마다 자동 갱신
   *
   * 💡 활용 용도:
   * - 최근 활동한 사용자 조회
   * - 데이터 동기화 시 변경 감지
   * - 캐시 무효화 판단 기준
   */
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    comment: '계정 정보 마지막 수정 시각',
  })
  updatedAt: Date;

  /**
   * 🎬 비디오 관계 - 일대다(1:N) 관계
   *
   * @OneToMany 데코레이터 설명:
   * - 첫 번째 인자: () => Video → 관련 엔티티 타입
   * - 두 번째 인자: (video) => video.user → 역방향 관계 지정
   *
   * 💡 관계형 데이터베이스 설계 원칙:
   * - 한 사용자는 여러 비디오를 업로드 가능
   * - 각 비디오는 하나의 사용자에게만 속함
   * - Video 테이블에 user_id 외래키 존재
   *
   * 🚀 성능 최적화 팁:
   * - videos 조회 시 필요할 때만 로드 (지연 로딩)
   * - 대량 데이터는 페이지네이션 적용
   * - N+1 문제 방지를 위한 JOIN 쿼리 사용
   */
  @OneToMany(() => Video, (video) => video.user, {
    cascade: ['soft-remove'], // 💡 사용자 삭제 시 비디오는 소프트 삭제
    lazy: true, // 🚀 지연 로딩으로 성능 최적화
  })
  videos: Video[];

  /**
   * 🔄 리프레시 토큰 - 일대일(1:1) 관계
   *
   * @OneToOne 데코레이터 설명:
   * - 한 사용자는 하나의 활성 리프레시 토큰만 보유
   * - 로그인 시 기존 토큰 교체 또는 새로 생성
   *
   * 💡 보안 고려사항:
   * - 토큰 탈취 방지를 위한 짧은 수명
   * - 로그아웃 시 토큰 즉시 무효화
   * - 의심스러운 활동 감지 시 모든 토큰 무효화
   */
  @OneToOne(() => RefreshToken, (refreshToken) => refreshToken.user, {
    cascade: ['remove'], // 💡 사용자 삭제 시 토큰도 함께 삭제
    nullable: true, // 💡 토큰이 없는 상태도 허용
  })
  refreshToken: RefreshToken;

  // ===== 🛠️ 가상 필드와 메서드들 =====

  /**
   * 📊 비디오 개수 - 계산된 필드
   * 실제 DB 컬럼이 아닌 런타임에서 계산되는 값
   */
  videoCount?: number;

  /**
   * 🕐 마지막 로그인 시간 - 추가 필드 예시
   * 실제 프로젝트에서 필요 시 추가할 수 있는 필드
   */
  // @Column({
  //   type: 'timestamptz',
  //   nullable: true,
  //   comment: '마지막 로그인 시간'
  // })
  // @Index('idx_user_last_login') // 휴면 계정 조회용
  // lastLoginAt?: Date;

  /**
   * ✅ 계정 활성화 상태 - 추가 필드 예시
   */
  // @Column({
  //   type: 'boolean',
  //   default: true,
  //   comment: '계정 활성화 상태'
  // })
  // @Index('idx_user_active') // 활성 사용자만 조회용
  // isActive: boolean = true;

  // ===== 🔧 비즈니스 로직 메서드들 =====

  /**
   * 비밀번호 검증 메서드
   * 엔티티 내부에 비즈니스 로직을 포함할 수 있음
   */
  // async validatePassword(plainPassword: string): Promise<boolean> {
  //   const bcrypt = await import('bcrypt');
  //   return bcrypt.compare(plainPassword, this.password);
  // }

  /**
   * 사용자 정보 마스킹 메서드
   * 민감한 정보를 숨기고 안전한 정보만 반환
   */
  // toSafeObject() {
  //   const { password, ...safeUser } = this;
  //   return safeUser;
  // }
}
