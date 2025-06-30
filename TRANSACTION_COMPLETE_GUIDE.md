# 🔐 트랜잭션(Transaction) 완전 정복 가이드

> **"백엔드 개발자라면 반드시 알아야 할 데이터베이스 트랜잭션의 모든 것"**
> NestJS + TypeORM 환경에서의 실무 중심 학습 가이드

---

## 📚 목차

1. [트랜잭션이란 무엇인가?](#1-트랜잭션이란-무엇인가)
2. [ACID 원칙 완전 이해](#2-acid-원칙-완전-이해)
3. [실생활 예시로 이해하기](#3-실생활-예시로-이해하기)
4. [TypeORM 트랜잭션 구현 방법](#4-typeorm-트랜잭션-구현-방법)
5. [실무 예제 분석](#5-실무-예제-분석)
6. [트랜잭션 격리 수준](#6-트랜잭션-격리-수준)
7. [성능 최적화와 주의사항](#7-성능-최적화와-주의사항)
8. [디버깅과 모니터링](#8-디버깅과-모니터링)
9. [실습 문제](#9-실습-문제)

---

## 1. 트랜잭션이란 무엇인가?

### 🎯 기본 개념

**트랜잭션(Transaction)**은 데이터베이스에서 **여러 작업을 하나의 논리적 단위로 묶는 것**입니다.

```
💡 핵심 원칙: "모두 성공" 또는 "모두 실패" (All or Nothing)
```

### 🌟 왜 트랜잭션이 필요한가?

```typescript
// ❌ 트랜잭션 없는 위험한 코드
async dangerousTransfer() {
  await this.accountService.withdraw(accountA, 1000000); // 100만원 출금
  // 💥 여기서 서버가 크래시되면?
  await this.accountService.deposit(accountB, 1000000);  // 100만원 입금

  // 결과: accountA에서는 돈이 빠졌지만 accountB로는 들어가지 않음!
}

// ✅ 트랜잭션으로 보호된 안전한 코드
async safeTransfer() {
  const transaction = await this.dataSource.transaction(async manager => {
    await manager.save(this.createWithdrawal(accountA, 1000000));
    await manager.save(this.createDeposit(accountB, 1000000));
    // 모든 작업이 성공하면 한 번에 커밋
    // 하나라도 실패하면 모든 작업이 취소됨
  });
}
```

---

## 2. ACID 원칙 완전 이해

### 🔬 ACID 각 요소 상세 분석

#### **A - 원자성 (Atomicity)**

> "쪼갤 수 없는 하나의 단위"

```typescript
// 예시: 회원가입 과정
async signup(email: string, password: string) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    // 🔸 작업 1: 사용자 생성
    const user = await queryRunner.manager.save(User, {
      email,
      password: await bcrypt.hash(password, 10)
    });

    // 🔸 작업 2: 프로필 생성
    await queryRunner.manager.save(Profile, {
      userId: user.id,
      nickname: email.split('@')[0]
    });

    // 🔸 작업 3: 환영 이메일 로그 생성
    await queryRunner.manager.save(EmailLog, {
      userId: user.id,
      type: 'WELCOME'
    });

    // ✅ 모든 작업 성공 → 커밋
    await queryRunner.commitTransaction();

  } catch (error) {
    // ❌ 하나라도 실패 → 모든 작업 취소
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

#### **C - 일관성 (Consistency)**

> "데이터베이스 규칙과 제약 조건 유지"

```typescript
// 예시: 계좌 잔액은 항상 0 이상이어야 함
async transferWithConsistencyCheck(fromAccount: string, toAccount: string, amount: number) {
  return await this.dataSource.transaction(async manager => {
    const from = await manager.findOne(Account, { where: { id: fromAccount } });
    const to = await manager.findOne(Account, { where: { id: toAccount } });

    // 💡 일관성 체크: 잔액 부족 시 거래 불가
    if (from.balance < amount) {
      throw new BadRequestException('잔액이 부족합니다');
    }

    from.balance -= amount;
    to.balance += amount;

    await manager.save([from, to]);
    // ✅ 트랜잭션 종료 후에도 모든 계좌 잔액 >= 0 보장
  });
}
```

#### **I - 격리성 (Isolation)**

> "동시 실행되는 트랜잭션들의 간섭 방지"

```typescript
// 예시: 재고 관리에서의 격리성
async purchaseProduct(productId: string, quantity: number) {
  return await this.dataSource.transaction(async manager => {
    // 🔒 SELECT FOR UPDATE로 행 레벨 잠금
    const product = await manager
      .createQueryBuilder(Product, 'product')
      .where('product.id = :id', { id: productId })
      .setLock('pessimistic_write')  // 다른 트랜잭션의 접근 차단
      .getOne();

    if (product.stock < quantity) {
      throw new BadRequestException('재고가 부족합니다');
    }

    product.stock -= quantity;
    await manager.save(product);

    // ✅ 다른 사용자가 동시에 구매해도 재고가 음수가 되지 않음
  });
}
```

#### **D - 지속성 (Durability)**

> "성공한 트랜잭션의 결과는 영구적으로 보존"

```typescript
// 시스템이 갑자기 종료되어도 커밋된 데이터는 안전하게 보존됨
async criticalDataSave(data: CriticalData) {
  const result = await this.dataSource.transaction(async manager => {
    const saved = await manager.save(CriticalData, data);

    // 💾 커밋 시점에 데이터가 디스크에 영구 저장됨
    return saved;
  });

  // ✅ 이 시점 이후 서버가 크래시되어도 데이터는 안전함
  return result;
}
```

---

## 3. 실생활 예시로 이해하기

### 🏦 은행 이체 시스템

```typescript
/**
 * 🏦 실제 은행 이체 과정을 코드로 구현
 *
 * 과정:
 * 1. 송금자 계좌에서 금액 차감
 * 2. 수신자 계좌에 금액 추가
 * 3. 거래 내역 기록
 * 4. 수수료 처리
 * 5. 알림 로그 생성
 */
async bankTransfer(
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  fee: number
) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    // 📊 현재 계좌 상태 조회
    const fromAccount = await queryRunner.manager.findOne(Account, {
      where: { id: fromAccountId }
    });
    const toAccount = await queryRunner.manager.findOne(Account, {
      where: { id: toAccountId }
    });

    // 🔍 사전 검증
    if (fromAccount.balance < amount + fee) {
      throw new BadRequestException('잔액이 부족합니다');
    }

    if (fromAccount.status === 'FROZEN') {
      throw new BadRequestException('동결된 계좌입니다');
    }

    // 💸 1단계: 송금자 계좌 차감
    fromAccount.balance -= (amount + fee);
    await queryRunner.manager.save(fromAccount);

    // 💰 2단계: 수신자 계좌 입금
    toAccount.balance += amount;
    await queryRunner.manager.save(toAccount);

    // 📝 3단계: 거래 내역 기록
    const transaction = queryRunner.manager.create(TransactionHistory, {
      fromAccountId,
      toAccountId,
      amount,
      fee,
      type: 'TRANSFER',
      status: 'COMPLETED',
      timestamp: new Date()
    });
    await queryRunner.manager.save(transaction);

    // 💳 4단계: 은행 수수료 계좌에 수수료 추가
    const bankAccount = await queryRunner.manager.findOne(Account, {
      where: { type: 'BANK_FEE' }
    });
    bankAccount.balance += fee;
    await queryRunner.manager.save(bankAccount);

    // 🔔 5단계: 알림 로그 생성
    await queryRunner.manager.save(NotificationLog, [
      {
        userId: fromAccount.userId,
        type: 'TRANSFER_OUT',
        message: `${amount.toLocaleString()}원이 이체되었습니다.`
      },
      {
        userId: toAccount.userId,
        type: 'TRANSFER_IN',
        message: `${amount.toLocaleString()}원이 입금되었습니다.`
      }
    ]);

    // ✅ 모든 단계 성공 → 트랜잭션 커밋
    await queryRunner.commitTransaction();

    return {
      transactionId: transaction.id,
      fromBalance: fromAccount.balance,
      toBalance: toAccount.balance
    };

  } catch (error) {
    // ❌ 어느 단계에서든 실패 시 → 모든 작업 롤백
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

### 🛒 온라인 쇼핑몰 주문 시스템

```typescript
/**
 * 🛒 복잡한 주문 처리 과정
 *
 * 과정:
 * 1. 재고 확인 및 차감
 * 2. 주문 생성
 * 3. 결제 처리
 * 4. 포인트 적립
 * 5. 쿠폰 사용 처리
 * 6. 배송 정보 생성
 */
async processOrder(orderData: OrderCreateDto) {
  return await this.dataSource.transaction(async manager => {
    let totalAmount = 0;
    const orderItems = [];

    // 🔍 1단계: 상품별 재고 확인 및 차감
    for (const item of orderData.items) {
      const product = await manager
        .createQueryBuilder(Product, 'product')
        .where('product.id = :id', { id: item.productId })
        .setLock('pessimistic_write')  // 동시 주문 방지
        .getOne();

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `상품 "${product.name}"의 재고가 부족합니다 (현재 재고: ${product.stock})`
        );
      }

      // 재고 차감
      product.stock -= item.quantity;
      await manager.save(product);

      // 주문 상품 정보 계산
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemTotal
      });
    }

    // 🎫 2단계: 쿠폰 적용
    if (orderData.couponId) {
      const coupon = await manager.findOne(Coupon, {
        where: { id: orderData.couponId }
      });

      if (!coupon || coupon.isUsed || coupon.expiresAt < new Date()) {
        throw new BadRequestException('유효하지 않은 쿠폰입니다');
      }

      const discount = Math.min(coupon.discountAmount, totalAmount);
      totalAmount -= discount;

      // 쿠폰 사용 처리
      coupon.isUsed = true;
      coupon.usedAt = new Date();
      await manager.save(coupon);
    }

    // 📋 3단계: 주문 생성
    const order = await manager.save(Order, {
      userId: orderData.userId,
      totalAmount,
      status: 'PENDING',
      items: orderItems,
      shippingAddress: orderData.shippingAddress
    });

    // 💳 4단계: 결제 처리 (외부 API 호출)
    try {
      const paymentResult = await this.paymentService.processPayment({
        orderId: order.id,
        amount: totalAmount,
        paymentMethod: orderData.paymentMethod
      });

      order.paymentId = paymentResult.paymentId;
      order.status = 'PAID';
      await manager.save(order);

    } catch (paymentError) {
      throw new BadRequestException('결제 처리에 실패했습니다');
    }

    // 🎁 5단계: 포인트 적립
    const pointsToEarn = Math.floor(totalAmount * 0.01); // 1% 적립
    const user = await manager.findOne(User, {
      where: { id: orderData.userId }
    });
    user.points += pointsToEarn;
    await manager.save(user);

    // 📦 6단계: 배송 정보 생성
    await manager.save(Shipping, {
      orderId: order.id,
      address: orderData.shippingAddress,
      status: 'PREPARING',
      estimatedDelivery: this.calculateDeliveryDate()
    });

    // 📧 7단계: 주문 확인 이메일 로그
    await manager.save(EmailLog, {
      userId: orderData.userId,
      type: 'ORDER_CONFIRMATION',
      orderId: order.id,
      scheduledAt: new Date()
    });

    return {
      orderId: order.id,
      totalAmount,
      pointsEarned: pointsToEarn,
      estimatedDelivery: this.calculateDeliveryDate()
    };
  });
}
```

---

## 4. TypeORM 트랜잭션 구현 방법

### 🛠️ 3가지 구현 방식 비교

#### **방식 1: QueryRunner (고급/복잡한 로직용)**

```typescript
// ✅ 추천: 복잡한 비즈니스 로직, 세밀한 제어가 필요한 경우
async complexBusinessLogic() {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 복잡한 비즈니스 로직
    const step1 = await queryRunner.manager.save(Entity1, data1);

    // 조건부 로직
    if (step1.someCondition) {
      await queryRunner.manager.save(Entity2, data2);
    }

    // 중간 결과 기반 추가 작업
    const result = await queryRunner.manager
      .createQueryBuilder()
      .select('SUM(amount)', 'total')
      .from(Transaction, 'tx')
      .where('tx.userId = :userId', { userId: step1.userId })
      .getRawOne();

    if (result.total > 1000000) {
      await queryRunner.manager.save(Alert, {
        type: 'HIGH_AMOUNT',
        userId: step1.userId
      });
    }

    await queryRunner.commitTransaction();
    return step1;

  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();  // 중요: 연결 해제
  }
}
```

#### **방식 2: 람다 함수 (중간 복잡도)**

```typescript
// ✅ 추천: 중간 복잡도의 로직, 간결한 코드 선호
async mediumComplexLogic(userId: string, data: any) {
  return await this.dataSource.transaction(async manager => {
    // 자동으로 트랜잭션 시작/커밋/롤백 처리됨

    const user = await manager.findOne(User, { where: { id: userId } });
    user.lastActivity = new Date();
    await manager.save(user);

    const record = await manager.save(ActivityRecord, {
      userId,
      activity: data.activity,
      timestamp: new Date()
    });

    // 조건부 로직도 가능
    if (data.isImportant) {
      await manager.save(ImportantLog, {
        userId,
        recordId: record.id
      });
    }

    return record;
  });
}
```

#### **방식 3: @Transactional 데코레이터 (간단한 로직용)**

```typescript
import { Transactional } from 'typeorm-transactional';

// ✅ 추천: 단순한 로직, 최소한의 코드
@Injectable()
export class SimpleService {
  @Transactional()
  async simpleTransactionalMethod(data: CreateDto) {
    // 자동으로 트랜잭션으로 감싸짐
    const entity1 = await this.repository1.save(data.entity1);
    const entity2 = await this.repository2.save({
      ...data.entity2,
      entity1Id: entity1.id,
    });

    return { entity1, entity2 };
  }
}
```

### 🎯 어떤 방식을 선택해야 할까?

| 상황                  | 추천 방식      | 이유                          |
| --------------------- | -------------- | ----------------------------- |
| 복잡한 비즈니스 로직  | QueryRunner    | 세밀한 제어, 조건부 로직 용이 |
| 여러 테이블 연관 작업 | 람다 함수      | 간결함과 기능성의 균형        |
| 단순한 CRUD 작업      | @Transactional | 코드 간결성                   |
| 외부 API 호출 포함    | QueryRunner    | 롤백 시점 제어                |
| 테스트 코드           | 람다 함수      | 가독성과 유지보수성           |

---

## 5. 실무 예제 분석

### 📊 현재 프로젝트의 회원가입 트랜잭션 분석

```typescript
// 🔍 src/auth/auth.service.ts의 signup 메서드 분석
async signup(email: string, password: string) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  let error;
  try {
    // ✅ 단계 1: 중복 이메일 체크
    const user = await this.userService.findOneByEmail(email);
    if (user) throw new BadRequestException('이미 존재하는 이메일입니다.');

    // ✅ 단계 2: 비밀번호 해시화
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    // ✅ 단계 3: 사용자 생성 (트랜잭션 보호)
    const userEntity = queryRunner.manager.create(User, {
      email,
      password: hash
    });
    await queryRunner.manager.save(userEntity);

    // ✅ 단계 4: 액세스 토큰 생성
    const accessToken = this.genereateAccessToken(userEntity.id);

    // ✅ 단계 5: 리프레시 토큰 생성 및 저장 (트랜잭션 보호)
    const refreshTokenEntity = queryRunner.manager.create(RefreshToken, {
      user: { id: userEntity.id },
      token: this.genereateRefreshToken(userEntity.id),
    });
    await queryRunner.manager.save(refreshTokenEntity);

    // ✅ 모든 작업 성공 → 커밋
    await queryRunner.commitTransaction();

    return {
      id: userEntity.id,
      accessToken,
      refreshToken: refreshTokenEntity.token
    };

  } catch (e) {
    // ❌ 실패 시 → 롤백
    await queryRunner.rollbackTransaction();
    error = e;
  } finally {
    // 🔧 리소스 정리
    await queryRunner.release();
    if (error) throw error;
  }
}
```

### 💡 이 코드의 장점과 개선점

#### **✅ 잘된 점:**

1. **원자성 보장**: 사용자 생성과 토큰 저장이 하나의 단위
2. **적절한 에러 처리**: try-catch-finally 패턴 사용
3. **리소스 관리**: finally에서 QueryRunner 해제

#### **🔧 개선 가능한 점:**

```typescript
// 🚀 개선된 버전
async signupImproved(email: string, password: string) {
  return await this.dataSource.transaction(async manager => {
    // 🔍 중복 체크 (트랜잭션 밖에서도 가능하지만 일관성을 위해)
    const existingUser = await manager.findOne(User, {
      where: { email }
    });
    if (existingUser) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }

    // 🔐 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 👤 사용자 생성
    const user = await manager.save(User, {
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 🔑 토큰 생성
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // 💾 리프레시 토큰 저장
    await manager.save(RefreshToken, {
      user: { id: user.id },
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일
    });

    // 📧 환영 이메일 로그 생성 (비동기 처리)
    await manager.save(EmailLog, {
      userId: user.id,
      type: 'WELCOME',
      status: 'PENDING',
      scheduledAt: new Date()
    });

    return {
      id: user.id,
      email: user.email,
      accessToken,
      refreshToken
    };
  });
}
```

---

## 6. 트랜잭션 격리 수준

### 🔒 격리 수준의 이해

데이터베이스에서 동시에 실행되는 트랜잭션들이 서로 어느 정도까지 간섭할 수 있는지를 정의합니다.

#### **격리 수준 종류 (낮은 → 높은 순)**

```typescript
// TypeORM에서 격리 수준 설정 방법
enum IsolationLevel {
  READ_UNCOMMITTED = "READ UNCOMMITTED",
  READ_COMMITTED = "READ COMMITTED",
  REPEATABLE_READ = "REPEATABLE READ",
  SERIALIZABLE = "SERIALIZABLE"
}

// 격리 수준 적용 예시
async highSecurityOperation() {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();

  // 🔒 최고 격리 수준 적용
  await queryRunner.startTransaction(IsolationLevel.SERIALIZABLE);

  try {
    // 민감한 금융 거래
    await this.processFinancialTransaction(queryRunner.manager);
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

#### **실제 문제 상황과 해결책**

```typescript
/**
 * 💥 Dirty Read 문제 예시
 * READ_UNCOMMITTED 격리 수준에서 발생
 */
// 트랜잭션 A
async transactionA() {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.startTransaction(IsolationLevel.READ_UNCOMMITTED);

  try {
    // 계좌 잔액 변경
    await queryRunner.manager.update(Account,
      { id: 'account1' },
      { balance: 1000000 }
    );

    // 아직 커밋하지 않음!
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 롤백 발생!
    throw new Error('Something went wrong');

  } catch (error) {
    await queryRunner.rollbackTransaction();
  }
}

// 트랜잭션 B (동시 실행)
async transactionB() {
  // 💥 문제: 롤백될 데이터를 읽어버림!
  const account = await this.accountRepository.findOne({
    where: { id: 'account1' }
  });
  console.log(account.balance); // 1000000 (잘못된 값!)
}

/**
 * ✅ 해결책: READ_COMMITTED 이상 사용
 */
async safeTransactionB() {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.startTransaction(IsolationLevel.READ_COMMITTED);

  try {
    // 커밋된 데이터만 읽음
    const account = await queryRunner.manager.findOne(Account, {
      where: { id: 'account1' }
    });
    // 안전한 데이터만 반환
    return account;

  } finally {
    await queryRunner.release();
  }
}
```

---

## 7. 성능 최적화와 주의사항

### ⚡ 트랜잭션 성능 최적화

#### **1. 트랜잭션 범위 최소화**

```typescript
// ❌ 나쁜 예: 트랜잭션이 너무 큼
async badLongTransaction(orders: Order[]) {
  return await this.dataSource.transaction(async manager => {
    for (const order of orders) {
      // 🐌 각 주문마다 외부 API 호출 (매우 느림!)
      const paymentResult = await this.externalPaymentAPI.charge(order);

      await manager.save(Payment, {
        orderId: order.id,
        externalId: paymentResult.id
      });

      // 🐌 이메일 발송도 트랜잭션 내에서!
      await this.emailService.sendConfirmation(order.customerEmail);
    }
  });
}

// ✅ 좋은 예: 트랜잭션 범위 최소화
async goodShortTransaction(orders: Order[]) {
  const results = [];

  for (const order of orders) {
    // 🚀 외부 API 호출은 트랜잭션 밖에서
    const paymentResult = await this.externalPaymentAPI.charge(order);

    // 🚀 빠른 DB 작업만 트랜잭션 내에서
    const payment = await this.dataSource.transaction(async manager => {
      return await manager.save(Payment, {
        orderId: order.id,
        externalId: paymentResult.id,
        status: 'COMPLETED'
      });
    });

    // 🚀 이메일 발송은 백그라운드 작업으로
    this.emailQueue.add('confirmation', {
      customerEmail: order.customerEmail,
      paymentId: payment.id
    });

    results.push(payment);
  }

  return results;
}
```

#### **2. 데드락 방지**

```typescript
/**
 * 💀 데드락 발생 가능한 코드
 */
// 트랜잭션 A: Account1 → Account2 순서로 잠금
async transferA_to_B() {
  return await this.dataSource.transaction(async manager => {
    const accountA = await manager.findOne(Account, {
      where: { id: 'account1' },
      lock: { mode: 'pessimistic_write' }
    });

    await new Promise(resolve => setTimeout(resolve, 1000)); // 지연

    const accountB = await manager.findOne(Account, {
      where: { id: 'account2' },
      lock: { mode: 'pessimistic_write' }
    });

    // 이체 로직...
  });
}

// 트랜잭션 B: Account2 → Account1 순서로 잠금 (데드락!)
async transferB_to_A() {
  return await this.dataSource.transaction(async manager => {
    const accountB = await manager.findOne(Account, {
      where: { id: 'account2' },
      lock: { mode: 'pessimistic_write' }
    });

    await new Promise(resolve => setTimeout(resolve, 1000)); // 지연

    const accountA = await manager.findOne(Account, {
      where: { id: 'account1' },
      lock: { mode: 'pessimistic_write' }  // 💀 데드락 발생!
    });
  });
}

/**
 * ✅ 데드락 방지 해결책
 */
async safeTransfer(fromAccountId: string, toAccountId: string, amount: number) {
  return await this.dataSource.transaction(async manager => {
    // 🔑 핵심: 항상 동일한 순서로 잠금 획득
    const accountIds = [fromAccountId, toAccountId].sort();

    const accounts = await manager
      .createQueryBuilder(Account, 'account')
      .where('account.id IN (:...ids)', { ids: accountIds })
      .orderBy('account.id')  // 일관된 순서
      .setLock('pessimistic_write')
      .getMany();

    const fromAccount = accounts.find(acc => acc.id === fromAccountId);
    const toAccount = accounts.find(acc => acc.id === toAccountId);

    // 이체 로직 수행
    fromAccount.balance -= amount;
    toAccount.balance += amount;

    await manager.save([fromAccount, toAccount]);
  });
}
```

#### **3. 배치 처리 최적화**

```typescript
// ✅ 대용량 데이터 처리를 위한 배치 트랜잭션
async processBulkUpdate(userIds: string[]) {
  const BATCH_SIZE = 1000;
  const results = [];

  // 배치 단위로 나누어 처리
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);

    const batchResult = await this.dataSource.transaction(async manager => {
      // 🚀 배치 업데이트로 성능 향상
      const updateResult = await manager
        .createQueryBuilder()
        .update(User)
        .set({
          lastProcessed: new Date(),
          status: 'PROCESSED'
        })
        .where('id IN (:...ids)', { ids: batch })
        .execute();

      // 배치 로그 기록
      await manager.save(ProcessLog, {
        batchSize: batch.length,
        processedAt: new Date(),
        userIds: batch
      });

      return updateResult.affected;
    });

    results.push(batchResult);

    // 메모리 압박 방지를 위한 가비지 컬렉션 힌트
    if (i % (BATCH_SIZE * 10) === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }

  return results;
}
```

### ⚠️ 주의사항과 안티패턴

#### **1. 트랜잭션 중첩 문제**

```typescript
// ❌ 위험한 중첩 트랜잭션
async dangerousNestedTransaction() {
  return await this.dataSource.transaction(async outerManager => {
    const user = await outerManager.save(User, userData);

    // 💥 문제: 이미 트랜잭션 내에서 또 다른 트랜잭션 시작!
    await this.dataSource.transaction(async innerManager => {
      await innerManager.save(Profile, { userId: user.id });
    });
  });
}

// ✅ 올바른 해결책
async correctNestedLogic() {
  return await this.dataSource.transaction(async manager => {
    const user = await manager.save(User, userData);

    // 같은 트랜잭션 매니저 사용
    await manager.save(Profile, { userId: user.id });
  });
}
```

#### **2. 메모리 누수 방지**

```typescript
// ❌ 메모리 누수 위험
async memoryLeakRisk() {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    // 작업 수행
    await queryRunner.manager.save(SomeEntity, data);
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  }
  // 💥 문제: release() 호출하지 않음!
}

// ✅ 안전한 리소스 관리
async safeResourceManagement() {
  const queryRunner = this.dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    await queryRunner.manager.save(SomeEntity, data);
    await queryRunner.commitTransaction();

  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    // ✅ 반드시 finally 블록에서 리소스 해제
    await queryRunner.release();
  }
}
```

---

## 8. 디버깅과 모니터링

### 🔍 트랜잭션 로깅 설정

```typescript
// ormconfig.ts에 로깅 설정 추가
export const ormConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  // 🔍 트랜잭션 디버깅을 위한 로깅 설정
  logging: ['query', 'error', 'warn'],
  logger: 'advanced-console',
  maxQueryExecutionTime: 1000, // 1초 이상 걸리는 쿼리 로깅

  // 개발 환경에서만 상세 로그
  ...(process.env.NODE_ENV === 'development' && {
    logging: ['query', 'error', 'warn', 'info', 'log', 'schema'],
    synchronize: false, // 프로덕션에서는 절대 true로 설정하지 말 것!
  }),
};
```

### 📊 트랜잭션 모니터링 미들웨어

```typescript
// 트랜잭션 성능 모니터링을 위한 인터셉터
@Injectable()
export class TransactionMonitoringInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransactionMonitoringInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const className = context.getClass().name;
    const methodName = context.getHandler().name;

    return next.handle().pipe(
      tap({
        next: (result) => {
          const duration = Date.now() - startTime;

          // 🐌 느린 트랜잭션 감지
          if (duration > 1000) {
            this.logger.warn(`Slow transaction detected: ${className}.${methodName} took ${duration}ms`);
          }

          // 📊 성능 메트릭 수집
          this.recordMetrics(className, methodName, duration, 'success');
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          // ❌ 트랜잭션 실패 로깅
          this.logger.error(`Transaction failed: ${className}.${methodName} failed after ${duration}ms`, error.stack);

          this.recordMetrics(className, methodName, duration, 'error');
        },
      }),
    );
  }

  private recordMetrics(className: string, methodName: string, duration: number, status: string) {
    // Prometheus, DataDog 등으로 메트릭 전송
    // 실제 구현에서는 메트릭 수집 라이브러리 사용
  }
}
```

### 🚨 트랜잭션 알림 시스템

```typescript
// 중요한 트랜잭션 실패 시 알림을 보내는 서비스
@Injectable()
export class TransactionAlertService {
  constructor(private emailService: EmailService, private slackService: SlackService) {}

  async handleCriticalTransactionFailure(operation: string, error: Error, context: any) {
    const alertData = {
      timestamp: new Date().toISOString(),
      operation,
      error: error.message,
      stack: error.stack,
      context,
      severity: this.getSeverity(operation),
    };

    // 💰 금융 관련 트랜잭션 실패는 즉시 알림
    if (this.isFinancialOperation(operation)) {
      await this.sendImmediateAlert(alertData);
    }

    // 📊 모든 실패는 로그에 기록
    await this.logTransactionFailure(alertData);
  }

  private async sendImmediateAlert(alertData: any) {
    const message = `
🚨 **Critical Transaction Failure** 🚨
Operation: ${alertData.operation}
Time: ${alertData.timestamp}
Error: ${alertData.error}
Context: ${JSON.stringify(alertData.context, null, 2)}
    `;

    // Slack 알림
    await this.slackService.sendToChannel('#alerts', message);

    // 이메일 알림 (관리자에게)
    await this.emailService.sendAlert({
      to: process.env.ADMIN_EMAIL,
      subject: `Critical Transaction Failure: ${alertData.operation}`,
      content: message,
    });
  }

  private isFinancialOperation(operation: string): boolean {
    const financialOperations = ['transfer', 'payment', 'refund', 'withdrawal', 'deposit'];
    return financialOperations.some((op) => operation.toLowerCase().includes(op));
  }
}
```

---

## 9. 실습 문제

### 🎯 기초 실습

#### **문제 1: 간단한 포인트 시스템**

사용자가 상품을 구매할 때 다음 작업들이 트랜잭션으로 보호되어야 합니다:

1. 사용자 포인트 차감
2. 구매 내역 저장
3. 포인트 사용 내역 저장

```typescript
// TODO: 이 메서드를 트랜잭션으로 구현하세요
async purchaseWithPoints(userId: string, productId: string, pointsToUse: number) {
  // 여기에 구현하세요!
}
```

<details>
<summary>💡 해답 보기</summary>

```typescript
async purchaseWithPoints(userId: string, productId: string, pointsToUse: number) {
  return await this.dataSource.transaction(async manager => {
    // 1. 사용자 포인트 확인 및 차감
    const user = await manager.findOne(User, { where: { id: userId } });
    if (user.points < pointsToUse) {
      throw new BadRequestException('포인트가 부족합니다');
    }

    user.points -= pointsToUse;
    await manager.save(user);

    // 2. 상품 정보 조회
    const product = await manager.findOne(Product, { where: { id: productId } });

    // 3. 구매 내역 저장
    const purchase = await manager.save(Purchase, {
      userId,
      productId,
      productName: product.name,
      pointsUsed: pointsToUse,
      purchasedAt: new Date()
    });

    // 4. 포인트 사용 내역 저장
    await manager.save(PointHistory, {
      userId,
      type: 'USE',
      amount: -pointsToUse,
      description: `상품 구매: ${product.name}`,
      relatedId: purchase.id
    });

    return {
      purchaseId: purchase.id,
      remainingPoints: user.points
    };
  });
}
```

</details>

#### **문제 2: 배송비 계산 시스템**

주문 생성 시 다음과 같은 복잡한 로직이 필요합니다:

1. 상품 재고 확인 및 차감
2. 배송비 계산 (지역별, 무게별)
3. 쿠폰 할인 적용
4. 최종 주문 생성

```typescript
// TODO: 이 메서드를 트랜잭션으로 구현하세요
async createOrderWithShipping(orderData: CreateOrderDto) {
  // 여기에 구현하세요!
}
```

### 🚀 고급 실습

#### **문제 3: 동시성 제어**

여러 사용자가 동시에 같은 상품을 구매할 때 재고가 음수가 되지 않도록 보장하는 시스템을 구현하세요.

```typescript
// TODO: 동시성 문제를 해결하는 구매 시스템 구현
async concurrentSafePurchase(productId: string, quantity: number, userId: string) {
  // 여기에 구현하세요!
}
```

#### **문제 4: 복합 비즈니스 로직**

멤버십 등급 시스템을 구현하세요:

1. 구매 금액에 따른 포인트 적립
2. 적립된 포인트에 따른 등급 업데이트
3. 등급 변경 시 혜택 적용
4. 등급 변경 알림 생성

```typescript
// TODO: 복합 비즈니스 로직을 트랜잭션으로 구현
async processOrderAndUpdateMembership(orderData: OrderDto) {
  // 여기에 구현하세요!
}
```

---

## 📚 추가 학습 자료

### 🎓 심화 학습 주제

1. **분산 트랜잭션 (Distributed Transactions)**

   - 2PC (Two-Phase Commit)
   - Saga Pattern
   - 마이크로서비스에서의 트랜잭션 관리

2. **NoSQL에서의 트랜잭션**

   - MongoDB의 Multi-Document Transactions
   - Redis의 트랜잭션 명령어

3. **성능 최적화**
   - Connection Pooling
   - Query 최적화
   - 인덱스 전략

### 📖 권장 도서

1. "데이터베이스 트랜잭션 처리" - 김상형
2. "High Performance MySQL" - Baron Schwartz
3. "Designing Data-Intensive Applications" - Martin Kleppmann

### 🔗 유용한 링크

- [TypeORM Transaction 공식 문서](https://typeorm.io/transactions)
- [PostgreSQL Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [MySQL InnoDB Locking](https://dev.mysql.com/doc/refman/8.0/en/innodb-locking.html)

---

## 🎯 체크리스트

트랜잭션을 구현할 때 다음 항목들을 확인하세요:

### ✅ 설계 단계

- [ ] 어떤 작업들이 하나의 트랜잭션으로 묶여야 하는가?
- [ ] 트랜잭션 실패 시 롤백 전략은 무엇인가?
- [ ] 동시성 문제가 발생할 수 있는가?
- [ ] 외부 API 호출이 포함되어 있는가?

### ✅ 구현 단계

- [ ] 적절한 트랜잭션 구현 방식을 선택했는가?
- [ ] 에러 처리와 롤백이 제대로 구현되었는가?
- [ ] 리소스 해제(QueryRunner.release())가 보장되는가?
- [ ] 트랜잭션 범위가 최소화되었는가?

### ✅ 테스트 단계

- [ ] 정상 케이스가 제대로 동작하는가?
- [ ] 실패 케이스에서 롤백이 되는가?
- [ ] 동시성 테스트를 수행했는가?
- [ ] 성능 테스트를 수행했는가?

### ✅ 운영 단계

- [ ] 로깅과 모니터링이 설정되었는가?
- [ ] 알림 시스템이 구축되었는가?
- [ ] 성능 메트릭을 수집하고 있는가?
- [ ] 장애 대응 절차가 마련되었는가?

---

이 가이드를 통해 트랜잭션의 기본 개념부터 실무 적용까지 완전히 마스터하실 수 있을 것입니다! 🚀
