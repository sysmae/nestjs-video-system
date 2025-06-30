/**
 * JWT (JSON Web Token) 설정
 * JWT 토큰 생성 및 검증에 사용할 비밀키를 설정합니다.
 * 운영환경에서는 반드시 강력한 비밀키를 환경 변수로 설정해야 합니다.
 */

import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'temp secret', // JWT 서명용 비밀키
}));
