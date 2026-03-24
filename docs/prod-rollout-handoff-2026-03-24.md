# Prod Rollout Handoff 2026-03-24

배포 담당: Claude

목적:
- 이번 dev 반영분을 prod에 안전하게 올린다.
- 특히 prod DB가 dev와 다른 점을 먼저 정리한다.
- `72`, `73`, `74` 적용 여부와 장르 충돌 리스크를 사전에 제거한다.

## 이번 반영 핵심

1. CP 연동 SSOT
- `tb_product.cp_user_id`
- 관련 DDL: `72-add-product-cp-user-id.sql`

2. 플랫폼 수수료 설정
- `tb_platform_service_rate_history`
- 관련 DDL: `73-create-platform-service-rate-history.sql`

3. 문피아식 장르 정리
- `정통판타지 -> 판타지`
- `퓨전판타지 -> 퓨전`
- 제외 장르 비활성화
- 1차/2차 공통 장르 16개 사용
- 관련 DDL: `74-adjust-major-genres-for-munpia-style.sql`

## prod 반영 전제

prod는 dev와 DB 상태가 다를 수 있다.

확인 필요:
- `tb_product.cp_user_id` 존재 여부
- `tb_platform_service_rate_history` 존재 여부
- `판타지`, `정통판타지`, `퓨전`, `퓨전판타지` 선존재 여부
- `정통판타지`, `퓨전판타지`를 참조하는 `tb_product.primary_genre_id`, `tb_product.sub_genre_id` 존재 여부

## 권장 반영 순서

1. prod DB preflight
2. 장르 충돌 있으면 prod DB 정리
3. 백엔드 prod 배포
4. `67`, `72`, `73`, `74` 적용 확인
5. 백엔드 smoke
6. 프론트 prod 반영

## 1. prod DB preflight SQL

```sql
-- 72 적용 여부
SHOW COLUMNS FROM tb_product LIKE 'cp_user_id';

-- 73 적용 여부
SHOW TABLES LIKE 'tb_platform_service_rate_history';

-- migration 이력
SELECT file_name, applied_at
FROM tb_schema_migration
WHERE file_name IN (
  '67-rename-genre-labels.sql',
  '72-add-product-cp-user-id.sql',
  '73-create-platform-service-rate-history.sql',
  '74-adjust-major-genres-for-munpia-style.sql'
)
ORDER BY applied_at;

-- 실제 제약 상태 확인
SHOW CREATE TABLE tb_standard_keyword;

-- 74 rename 충돌 후보
SELECT keyword_id, keyword_name, category_id, major_genre_yn, filter_yn, use_yn
FROM tb_standard_keyword
WHERE category_id = 1
  AND keyword_name IN ('판타지', '정통판타지', '퓨전', '퓨전판타지')
ORDER BY keyword_name, keyword_id;

-- legacy 장르 참조 작품
SELECT p.product_id,
       p.title,
       pg.keyword_name AS primary_genre_name,
       sg.keyword_name AS sub_genre_name
FROM tb_product p
LEFT JOIN tb_standard_keyword pg ON pg.keyword_id = p.primary_genre_id
LEFT JOIN tb_standard_keyword sg ON sg.keyword_id = p.sub_genre_id
WHERE pg.keyword_name IN ('정통판타지', '퓨전판타지')
   OR sg.keyword_name IN ('정통판타지', '퓨전판타지')
ORDER BY p.product_id;
```

## 2. prod 장르 정리 SQL

아래 SQL은 `74`를 안전하게 통과시키기 위한 사전 정리용이다.

원칙:
- target row가 이미 있으면 legacy row를 target으로 합친다.
- target row가 없으면 legacy row를 그대로 target 이름으로 rename해도 된다.
- `tb_product` 참조는 먼저 target id로 옮긴다.
- legacy row는 마지막에 `use_yn='N'`로 내린다.

```sql
START TRANSACTION;

-- 판타지 target / legacy id 확보
SET @fantasy_target_id = (
  SELECT keyword_id
  FROM tb_standard_keyword
  WHERE category_id = 1
    AND keyword_name = '판타지'
  ORDER BY keyword_id
  LIMIT 1
);

SET @orthodox_fantasy_id = (
  SELECT keyword_id
  FROM tb_standard_keyword
  WHERE category_id = 1
    AND keyword_name = '정통판타지'
  ORDER BY keyword_id
  LIMIT 1
);

-- target이 없고 legacy만 있으면 legacy를 target으로 승격
UPDATE tb_standard_keyword
SET keyword_name = '판타지',
    major_genre_yn = 'Y',
    filter_yn = 'Y',
    use_yn = 'Y',
    updated_date = NOW()
WHERE keyword_id = @orthodox_fantasy_id
  AND @fantasy_target_id IS NULL;

-- 다시 target id 확보
SET @fantasy_target_id = (
  SELECT keyword_id
  FROM tb_standard_keyword
  WHERE category_id = 1
    AND keyword_name = '판타지'
  ORDER BY keyword_id
  LIMIT 1
);

-- 작품 참조를 target으로 통합
UPDATE tb_product
SET primary_genre_id = @fantasy_target_id
WHERE primary_genre_id = @orthodox_fantasy_id
  AND @orthodox_fantasy_id IS NOT NULL
  AND @fantasy_target_id IS NOT NULL
  AND @orthodox_fantasy_id <> @fantasy_target_id;

UPDATE tb_product
SET sub_genre_id = @fantasy_target_id
WHERE sub_genre_id = @orthodox_fantasy_id
  AND @orthodox_fantasy_id IS NOT NULL
  AND @fantasy_target_id IS NOT NULL
  AND @orthodox_fantasy_id <> @fantasy_target_id;

-- target이 따로 존재하는 경우 legacy 비활성화
UPDATE tb_standard_keyword
SET use_yn = 'N',
    updated_date = NOW()
WHERE keyword_id = @orthodox_fantasy_id
  AND @orthodox_fantasy_id IS NOT NULL
  AND @fantasy_target_id IS NOT NULL
  AND @orthodox_fantasy_id <> @fantasy_target_id;


-- 퓨전 target / legacy id 확보
SET @fusion_target_id = (
  SELECT keyword_id
  FROM tb_standard_keyword
  WHERE category_id = 1
    AND keyword_name = '퓨전'
  ORDER BY keyword_id
  LIMIT 1
);

SET @fusion_legacy_id = (
  SELECT keyword_id
  FROM tb_standard_keyword
  WHERE category_id = 1
    AND keyword_name = '퓨전판타지'
  ORDER BY keyword_id
  LIMIT 1
);

-- target이 없고 legacy만 있으면 legacy를 target으로 승격
UPDATE tb_standard_keyword
SET keyword_name = '퓨전',
    major_genre_yn = 'Y',
    filter_yn = 'Y',
    use_yn = 'Y',
    updated_date = NOW()
WHERE keyword_id = @fusion_legacy_id
  AND @fusion_target_id IS NULL;

-- 다시 target id 확보
SET @fusion_target_id = (
  SELECT keyword_id
  FROM tb_standard_keyword
  WHERE category_id = 1
    AND keyword_name = '퓨전'
  ORDER BY keyword_id
  LIMIT 1
);

-- 작품 참조를 target으로 통합
UPDATE tb_product
SET primary_genre_id = @fusion_target_id
WHERE primary_genre_id = @fusion_legacy_id
  AND @fusion_legacy_id IS NOT NULL
  AND @fusion_target_id IS NOT NULL
  AND @fusion_legacy_id <> @fusion_target_id;

UPDATE tb_product
SET sub_genre_id = @fusion_target_id
WHERE sub_genre_id = @fusion_legacy_id
  AND @fusion_legacy_id IS NOT NULL
  AND @fusion_target_id IS NOT NULL
  AND @fusion_legacy_id <> @fusion_target_id;

-- target이 따로 존재하는 경우 legacy 비활성화
UPDATE tb_standard_keyword
SET use_yn = 'N',
    updated_date = NOW()
WHERE keyword_id = @fusion_legacy_id
  AND @fusion_legacy_id IS NOT NULL
  AND @fusion_target_id IS NOT NULL
  AND @fusion_legacy_id <> @fusion_target_id;

COMMIT;
```

정리 후 다시 아래를 확인한다.

```sql
SELECT sk.keyword_id, sk.keyword_name, sk.use_yn,
       SUM(p.primary_genre_id = sk.keyword_id) AS primary_refs,
       SUM(p.sub_genre_id = sk.keyword_id) AS sub_refs
FROM tb_standard_keyword sk
LEFT JOIN tb_product p
  ON p.primary_genre_id = sk.keyword_id
  OR p.sub_genre_id = sk.keyword_id
WHERE sk.category_id = 1
GROUP BY sk.keyword_id, sk.keyword_name, sk.use_yn
HAVING sk.use_yn = 'N' AND (primary_refs > 0 OR sub_refs > 0);
```

기대 결과:
- `use_yn='N'`인 장르를 참조하는 작품 `0건`

## 3. 백엔드 prod 배포 후 확인

아래를 반드시 확인한다.

```sql
SHOW COLUMNS FROM tb_product LIKE 'cp_user_id';
SHOW TABLES LIKE 'tb_platform_service_rate_history';

SELECT file_name, applied_at
FROM tb_schema_migration
WHERE file_name IN (
  '67-rename-genre-labels.sql',
  '72-add-product-cp-user-id.sql',
  '73-create-platform-service-rate-history.sql',
  '74-adjust-major-genres-for-munpia-style.sql'
)
ORDER BY applied_at;

SELECT keyword_name, major_genre_yn, use_yn
FROM tb_standard_keyword
WHERE category_id = 1
ORDER BY keyword_name;
```

기대 결과:
- `cp_user_id` 있음
- `tb_platform_service_rate_history` 있음
- `67`, `72`, `73`, `74` 이력 있음
- 최종 활성 장르 16개만 `use_yn='Y'`

최종 활성 장르:
- 무협
- 판타지
- 퓨전
- 게임
- 스포츠
- 로맨스
- 라이트노벨
- 현대판타지
- 대체역사
- 전쟁·밀리터리
- SF
- 추리
- 공포·미스테리
- 일반소설
- 드라마
- 팬픽·패러디

비활성 대상:
- 시·수필
- 중·단편
- 연극·시나리오
- 아동소설·동화
- BL

## 4. smoke 체크

1. service
- 작품 생성 화면에서 1차/2차 장르 목록이 같게 보이는지
- 제외 장르가 빠졌는지

2. partner
- 업로드 화면 1차/2차 장르 목록 확인

3. cms
- 배포/업로드 화면 1차/2차 장르 목록 확인
- 플랫폼 수수료 페이지 확인

4. backend
- `GET /v1/query/admins/platform-service-rate`
- 파트너 월매출/월정산 조회
- 기존 CP 연동 경로 조회

## Claude에게 전달할 핵심

1. prod는 dev와 DB 상태가 다르다.
2. `72`, `73` 자동 migration만 믿지 말고 실제 컬럼/테이블 생성 여부를 확인해야 한다.
3. `74`는 prod에서 `판타지`, `퓨전` 선존재 시 rename 충돌 가능성이 있다.
4. safest path는:
   - preflight
   - genre cleanup
   - backend prod deploy
   - migration applied 확인
   - smoke
   - frontend prod deploy
5. 프론트만 먼저 올리면 안 된다.
6. auto_migrate는 실패 시 앱이 떠도 혼합 상태를 남길 수 있으니, `74`는 preflight/cleanup 없이 바로 믿고 올리면 안 된다.
