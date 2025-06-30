/**
 * 인증 관련 비즈니스 로직을 처리하는 서비스
 *
 * ===== 🚀 초보자를 위한 인증 서비스 개념 설명 =====
 *
 * **인증(Authentication) vs 인가(Authorization):**
 * - 인증: "당신이 누구인지 확인" (로그인)
 * - 인가: "당신이 무엇을 할 수 있는지 확인" (권한 체크)
 *
 * **JWT 토큰 시스템:**
 * - Access Token: 짧은 유효기간 (1일), API 요청 시 사용
 * - Refresh Token: 긴 유효기간 (30일), Access Token 갱신용
 *
 * **보안 원칙:**
 * 1. 비밀번호는 절대 평문 저장 금지 → bcrypt 해시 사용
 * 2. 토큰은 안전한 곳에 저장 (httpOnly 쿠키 권장)
 * 3. 민감한 작업은 트랜잭션으로 보호
 *
 * ===== 🔐 트랜잭션(Transaction) 완전 이해 가이드 =====
 *
 * **트랜잭션이란?**
 * - 여러 데이터베이스 작업을 하나의 논리적 단위로 묶는 것
 * - "모두 성공" 또는 "모두 실패" (All or Nothing 원칙)
 * - 데이터 일관성과 무결성을 보장하는 핵심 메커니즘
 *
 * **ACID 원칙:**
 * 1. **원자성(Atomicity)**: 트랜잭션의 작업들은 모두 성공하거나 모두 실패
 * 2. **일관성(Consistency)**: 트랜잭션 전후로 데이터 일관성 유지
 * 3. **격리성(Isolation)**: 동시 실행되는 트랜잭션들은 서로 간섭하지 않음
 * 4. **지속성(Durability)**: 성공한 트랜잭션 결과는 영구적으로 저장
 *
 * **실제 사례로 이해하기:**
 * ```
 * 은행 계좌 이체 예시:
 * 1. A 계좌에서 100만원 차감  ← 트랜잭션 시작
 * 2. B 계좌에 100만원 추가     ←
 * 3. 거래 내역 기록           ← 트랜잭션 끝
 *
 * 만약 2번에서 에러 발생 시:
 * → 1번 작업도 함께 취소됨 (롤백)
 * → 돈이 사라지는 일 방지!
 * ```
 *
 * **회원가입에서 트랜잭션이 필요한 이유:**
 * 1. 사용자 생성
 * 2. 토큰 생성 및 저장
 * → 하나라도 실패하면 모두 취소되어야 함!
 */

import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { RefreshToken } from './entity/refresh-token.entity';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/user/entity/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private dataSource: DataSource, // 🔧 트랜잭션 관리의 핵심! QueryRunner 생성용
    private userService: UserService, // 👤 사용자 관련 서비스
    private jwtService: JwtService, // 🔑 JWT 토큰 생성/검증 서비스
    @InjectRepository(RefreshToken) private refreshTokenRepository: Repository<RefreshToken>, // 🔄 리프레시 토큰 저장소
  ) {}

  /**
   * 새로운 사용자 회원가입 - 트랜잭션 적용 예시
   *
   * ===== 🎯 이 메서드에서 트랜잭션이 필요한 이유 =====
   *
   * **수행하는 작업들:**
   * 1. 이메일 중복 체크
   * 2. 비밀번호 해시화
   * 3. 사용자 정보 데이터베이스 저장    ← 트랜잭션 보호 대상
   * 4. 액세스 토큰 생성
   * 5. 리프레시 토큰 생성 및 저장       ← 트랜잭션 보호 대상
   *
   * **만약 트랜잭션이 없다면?**
   * 3번에서 사용자는 생성되었는데 5번에서 에러 발생 시:
   * → 사용자는 DB에 있지만 리프레시 토큰이 없음
   * → 로그인 불가능한 좀비 계정 생성!
   * → 데이터 일관성 파괴 💥
   *
   * **트랜잭션의 3단계 흐름:**
   * ```
   * 1. BEGIN Transaction    ← 트랜잭션 시작
   * 2. 여러 DB 작업 수행
   * 3-A. COMMIT             ← 모든 작업 성공 시 확정
   * 3-B. ROLLBACK           ← 하나라도 실패 시 모든 작업 취소
   * ```
   *
   * ===== 🔧 TypeORM 트랜잭션 구현 패턴 =====
   *
   * **QueryRunner 방식의 장점:**
   * - 세밀한 트랜잭션 제어 가능
   * - 복잡한 비즈니스 로직에 적합
   * - 명시적인 시작/커밋/롤백 관리
   *
   * **다른 트랜잭션 방식들:**
   * ```typescript
   * // 1. @Transaction 데코레이터 (간단한 경우)
   * @Transaction()
   * async simpleMethod(@TransactionManager() manager: EntityManager) {}
   *
   * // 2. 람다 함수 방식 (중간 복잡도)
   * await this.dataSource.transaction(async manager => {
   *   // 트랜잭션 내 작업들
   * });
   *
   * // 3. QueryRunner 방식 (복잡한 경우) ← 현재 사용 중
   * ```
   *
   * @param email 사용자 이메일
   * @param password 사용자 비밀번호 (평문)
   * @returns 사용자 ID, 액세스 토큰, 리프레시 토큰
   */
  async signup(email: string, password: string) {
    // 데이터베이스 트랜잭션을 시작합니다
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let error;
    try {
      // 이미 존재하는 이메일인지 확인
      const user = await this.userService.findOneByEmail(email);
      if (user) throw new BadRequestException('이미 존재하는 이메일입니다.');

      // 비밀번호를 bcrypt로 해시화 (보안을 위해)
      const saltRounds = 10; // 해시 복잡도 설정
      const hash = await bcrypt.hash(password, saltRounds);

      // 새 사용자 엔티티 생성 및 저장
      const userEntity = queryRunner.manager.create(User, { email, password: hash });
      await queryRunner.manager.save(userEntity);

      // 액세스 토큰 생성
      const accessToken = this.genereateAccessToken(userEntity.id);

      // 리프레시 토큰 엔티티 생성 및 저장
      const refreshTokenEntity = queryRunner.manager.create(RefreshToken, {
        user: { id: userEntity.id },
        token: this.genereateRefreshToken(userEntity.id),
      });
      queryRunner.manager.save(refreshTokenEntity);

      // 모든 작업이 성공하면 트랜잭션을 커밋
      await queryRunner.commitTransaction();
      return { id: userEntity.id, accessToken, refreshToken: refreshTokenEntity.token };
    } catch (e) {
      // 에러 발생 시 트랜잭션을 롤백
      await queryRunner.rollbackTransaction();
      error = e;
    } finally {
      // 트랜잭션 연결 해제
      await queryRunner.release();
      if (error) throw error;
    }
  }

  /**
   * 사용자 로그인
   * 이메일과 비밀번호를 검증하고 토큰을 발급합니다.
   *
   * @param email 사용자 이메일
   * @param password 사용자 비밀번호
   * @returns 액세스 토큰과 리프레시 토큰
   */
  async signin(email: string, password: string) {
    // 사용자 인증 (이메일과 비밀번호 검증)
    const user = await this.validateUser(email, password);

    // 새로운 리프레시 토큰 생성
    const refreshToken = this.genereateRefreshToken(user.id);

    // 데이터베이스에 리프레시 토큰 저장 또는 업데이트
    await this.createRefreshTokenUsingUser(user.id, refreshToken);

    return {
      accessToken: this.genereateAccessToken(user.id),
      refreshToken,
    };
  }

  /**
   * 액세스 토큰 갱신
   * 유효한 리프레시 토큰을 사용하여 새로운 액세스 토큰과 리프레시 토큰을 발급합니다.
   *
   * @param token 현재 리프레시 토큰
   * @param userId 사용자 ID
   * @returns 새로운 액세스 토큰과 리프레시 토큰
   */
  async refresh(token: string, userId: string) {
    // 데이터베이스에서 리프레시 토큰을 찾습니다
    const refreshTokenEntity = await this.refreshTokenRepository.findOneBy({ token });
    if (!refreshTokenEntity) throw new BadRequestException('유효하지 않은 리프레시 토큰입니다.');

    // 새로운 토큰들을 생성합니다
    const accessToken = this.genereateAccessToken(userId);
    const refreshToken = this.genereateRefreshToken(userId);

    // 데이터베이스의 리프레시 토큰을 새로운 토큰으로 업데이트
    refreshTokenEntity.token = refreshToken;
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return { accessToken, refreshToken };
  }

  /**
   * 액세스 토큰 생성 (private 메서드)
   * 사용자 ID를 포함한 JWT 액세스 토큰을 생성합니다. (유효기간: 1일)
   *
   * @param userId 사용자 ID
   * @returns JWT 액세스 토큰
   */
  private genereateAccessToken(userId: string) {
    const payload = { sub: userId, tokenType: 'access' };
    return this.jwtService.sign(payload, { expiresIn: '1d' });
  }

  /**
   * 리프레시 토큰 생성 (private 메서드)
   * 사용자 ID를 포함한 JWT 리프레시 토큰을 생성합니다. (유효기간: 30일)
   *
   * @param userId 사용자 ID
   * @returns JWT 리프레시 토큰
   */
  private genereateRefreshToken(userId: string) {
    const payload = { sub: userId, tokenType: 'refresh' };
    return this.jwtService.sign(payload, { expiresIn: '30d' });
  }

  /**
   * 사용자의 리프레시 토큰을 생성하거나 업데이트하는 메서드 (private)
   * 기존 토큰이 있으면 업데이트하고, 없으면 새로 생성합니다.
   *
   * @param userId 사용자 ID
   * @param refreshToken 새로운 리프레시 토큰
   */
  private async createRefreshTokenUsingUser(userId: string, refreshToken: string) {
    // 해당 사용자의 기존 리프레시 토큰을 찾습니다
    let refreshTokenEntity = await this.refreshTokenRepository.findOneBy({ user: { id: userId } });

    if (refreshTokenEntity) {
      // 기존 토큰이 있으면 업데이트
      refreshTokenEntity.token = refreshToken;
    } else {
      // 기존 토큰이 없으면 새로 생성
      refreshTokenEntity = this.refreshTokenRepository.create({ user: { id: userId }, token: refreshToken });
    }

    // 데이터베이스에 저장
    await this.refreshTokenRepository.save(refreshTokenEntity);
  }

  /**
   * 사용자 인증 검증 메서드 (private)
   * 이메일과 비밀번호를 확인하여 사용자를 인증합니다.
   *
   * @param email 사용자 이메일
   * @param password 사용자 비밀번호 (평문)
   * @returns 인증된 사용자 정보
   * @throws UnauthorizedException 인증 실패 시
   */
  private async validateUser(email: string, password: string): Promise<User> {
    // 이메일로 사용자를 찾습니다
    const user = await this.userService.findOneByEmail(email);
    if (!user) throw new UnauthorizedException('존재하지 않는 사용자입니다.');

    // 입력된 비밀번호와 저장된 해시 비밀번호를 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');

    return user;
  }
}
