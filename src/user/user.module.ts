/**
 * 사용자(User) 모듈
 * 사용자 계정 관리, 프로필 조회, 권한 확인 등의 기능을 제공합니다.
 * 다른 모듈에서 사용자 정보가 필요할 때 UserService를 통해 접근할 수 있습니다.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // User 엔티티를 이 모듈에서 사용할 수 있도록 등록
  ],
  exports: [UserService], // 다른 모듈에서 UserService를 사용할 수 있도록 내보내기
  controllers: [UserController], // 사용자 관련 API 엔드포인트
  providers: [UserService], // 사용자 비즈니스 로직 서비스
})
export class UserModule {}
