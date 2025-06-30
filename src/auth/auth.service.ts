/**
 * 인증 관련 비즈니스 로직을 처리하는 서비스
 * 회원가입, 로그인, 토큰 갱신 등의 인증 기능을 제공합니다.
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
    private dataSource: DataSource, // 데이터베이스 트랜잭션 관리용
    private userService: UserService, // 사용자 관련 서비스
    private jwtService: JwtService, // JWT 토큰 생성/검증 서비스
    @InjectRepository(RefreshToken) private refreshTokenRepository: Repository<RefreshToken>, // 리프레시 토큰 레포지토리
  ) {}

  /**
   * 새로운 사용자 회원가입
   * 이메일 중복 체크, 비밀번호 해시화, 사용자 생성, 토큰 발급을 트랜잭션으로 처리합니다.
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
