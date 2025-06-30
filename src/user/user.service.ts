/**
 * 사용자(User) 서비스
 * 사용자 계정과 관련된 모든 비즈니스 로직을 처리합니다.
 * 데이터베이스에서 사용자 정보를 조회, 생성, 수정하는 기능을 제공합니다.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { Role } from './enum/user.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>, // User 엔티티 레포지토리 주입
  ) {}

  /**
   * 전체 사용자 목록을 페이지네이션으로 조회
   * 관리자가 사용자 목록을 확인할 때 사용됩니다.
   *
   * @param page 페이지 번호 (1부터 시작)
   * @param size 페이지당 항목 수
   * @returns 사용자 목록
   */
  async findAll(page: number, size: number) {
    return this.userRepository.find({
      skip: (page - 1) * size, // 건너뛸 레코드 수 계산
      take: size, // 가져올 레코드 수
    });
  }

  /**
   * 특정 사용자 ID로 사용자 정보 조회
   * 현재는 구현되지 않은 상태입니다.
   *
   * @param id 사용자 ID
   * @returns 사용자 정보 (미구현)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findOne(id: string) {
    // TODO: 실제 사용자 조회 로직 구현 필요
    return 'find user';
  }

  /**
   * 이메일로 사용자 조회
   * 로그인 시 사용자 인증에 사용됩니다.
   *
   * @param email 사용자 이메일 주소
   * @returns 해당 이메일의 사용자 정보 (없으면 null)
   */
  async findOneByEmail(email: string) {
    const user = await this.userRepository.findOneBy({ email });
    return user;
  }

  /**
   * 특정 사용자가 관리자 권한을 가지고 있는지 확인
   * 권한 기반 접근 제어에 사용됩니다.
   *
   * @param id 사용자 ID
   * @returns 관리자 권한 여부 (true: 관리자, false: 일반 사용자)
   */
  async checkUserIsAdmin(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    return user.role === Role.Admin;
  }
}
