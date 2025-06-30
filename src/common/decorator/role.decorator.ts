/**
 * 권한 기반 접근 제어 데코레이터
 * @Roles 데코레이터로 특정 권한이 필요한 엔드포인트를 지정할 수 있습니다.
 * JwtAuthGuard에서 사용자의 권한을 확인하여 접근을 제어합니다.
 */

import { SetMetadata } from '@nestjs/common';
import { Role } from '../../user/enum/user.enum';

// 메타데이터 키 - JwtAuthGuard에서 이 키로 필요한 권한을 확인
export const ROLES_KEY = 'roles';

/**
 * 권한 기반 접근 제어 데코레이터
 * 사용법: @Roles(Role.Admin) 또는 @Roles(Role.Admin, Role.User)
 * 지정된 권한을 가진 사용자만 해당 엔드포인트에 접근할 수 있습니다.
 *
 * @param roles 접근 가능한 권한 목록
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
