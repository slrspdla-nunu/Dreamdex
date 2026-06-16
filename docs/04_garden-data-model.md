# Dream Garden — 성장 구조 & 데이터 모델 (개정판)

> 원칙: 저장은 `dreams[]` + `settings` 뿐. 정원/식물/성장은 **전부 파생**.

## 1. 파생 함수 `buildGarden(dreams)`

기존 `buildDex`와 형제. 키워드별로 집계해 **식물(plant) 목록**을 만든다.

```
plant = {
  cat,            // 'place' | 'person' | 'situation'  → 형태
  id, name,       // 키워드
  tier,           // 'common' | 'rare' | 'hidden'      → 희귀도(종 등급)
  count,          // 누적 등장 횟수                      → 성장 단계
  stage,          // 0 seed / 1 sprout / 2 seedling / 3 bloom / 4 ancient
  emotion,        // 대표(최빈) 감정                      → 외형 색·분위기
  emotionCount,   // 감정별 분포 (동률 처리용)
  firstSeen,      // 첫 등장일
  dreamIds[],     // 등장한 꿈
  region,         // 배치 지역 (아래 규칙)
  discoverable    // tier 해금 여부 (꿈 도감과 동일 규칙)
}
```

가든 집계 결과:
```
garden = {
  regions: { nursery:[plants], greenhouse:[...], forest:[...], library:[...], abyss:[...] },
  plantDex: { common:{found,total}, rare:{...}, hidden:{...}, overall:{...} },
  unlock: { greenhouse:bool, forest:bool, library:bool, abyss:bool },
  recentGrowth: [...]   // 최근 성장 이벤트(피드백용, 선택)
}
```

## 2. 성장 단계 (stage) — count 기준

| count | stage | 라벨 | 식물 도감 |
|---|---|---|---|
| 1 | 0 | 씨앗 | 미등록 |
| 2 | 1 | 새싹 | **등록(발견)** |
| 3–4 | 2 | 자란 식물 | 등록 |
| 5–7 | 3 | 만개 | 등록 |
| 8+ | 4 | 고목/광휘 | 등록 |

- `discovered`(식물 도감) = `stage >= 1` 이고 `discoverable`인 식물.
- tier가 잠겨 있으면(rare<30, hidden<50) 식물도 미발견 처리(꿈 도감 규칙과 동일).

## 3. 외형 = 형태(카테고리) × 색(감정)

- 형태: `place→나무` · `person→꽃` · `situation→덩굴`
- 색/분위기: `emotion`의 색 토큰(기존 Store.EMOTIONS 색) 사용
  - 행복=금빛꽃 · 신기함=청록꽃 · 불안=가시덩굴 · 공포=검은장미 · 슬픔=푸른꽃 · 그리움=보랏빛꽃
- 대표 감정 = `dreamIds`가 가리키는 꿈들의 감정 최빈값(동률 시 최근 우선).
- 렌더: 형태별 베이스 SVG + 단계별 변형(높이/꽃 수) + 감정 색. **전부 커스텀 SVG**.

## 4. 희귀도 (종 등급) = 사전 tier

| 등급 | tier | 대략 종 수 | 발견 가능 |
|---|---|---|---|
| 일반 식물 | common | ~92 | 항상 |
| 희귀 식물 | rare | ~19 | 꿈 30개+ |
| 전설 식물 | hidden | ~9 | 꿈 50개+ |

식물 도감 진행 = 등급별 `발견/총`. (사전 = 분모, 기존 dictionary.js 그대로)

## 5. 지역 배치 규칙 (region)

| 지역 | 해금(꿈 수) | 들어오는 식물 |
|---|---|---|
| nursery 씨앗밭 | 0 | 아직 지역 미해금이거나 씨앗(stage 0) |
| greenhouse 달빛 온실 | 10 | person(꽃) 식물 |
| forest 기억의 숲 | 30 | place(나무) 식물 |
| library 잊힌 도서관 | 50 | situation(덩굴) 식물 |
| abyss 심연의 정원 | 100 | rare·hidden 식물 + 고목(stage 4) |

배치 로직(우선순위):
1. rare/hidden tier → abyss (해금 시) — 없으면 nursery
2. stage 0(씨앗) → nursery
3. 카테고리별 지역(해금 시) — 미해금이면 nursery

→ 해금 전엔 묘목장에 모이고, 해금되면 각자의 지역으로 "이주"한다.

## 6. 마일스톤 / 해금 (기존 classify.unlockState 확장)

```
unlock(count) = {
  greenhouse: count>=10,
  forest:     count>=30,  rareUnlocked:   count>=30,
  library:    count>=50,  hiddenUnlocked: count>=50,
  abyss:      count>=100,
  mapOpen:    count>=10        // 꿈 지도(기존)
}
```

기존 10/30/50 + **100** 추가. rare/hidden 키워드 발견 규칙은 그대로 유지(꿈 도감·식물 도감 공통).

## 7. 구현 영향 요약 (다음 단계)

| 파일 | 작업 |
|---|---|
| `js/classify.js` | `buildGarden(dreams)` 추가, `unlockState`에 greenhouse/forest/library/abyss/100 추가 |
| `js/icons.js` | 식물 글리프(형태×단계) + 지역 아이콘 추가 |
| `js/views.js` | **정원(홈)** 화면, **식물 도감** 탭, **식물 상세**, 저장 시 성장 피드백, 도감 2탭화 |
| `js/app.js` | 라우트 `#/`=garden, `#/garden/:region`, `#/codex/...`, `#/plant/:cat/:kw` |
| `css/styles.css` | 정원 레이아웃(지역·식물 배치), 식물/성장 스타일, 해금 연출 |
| `js/sampledata.js` | 성장·지역·희귀 식물까지 보이도록 예시 확장(반복 키워드 포함) |
| (유지) | 꿈 기록·목록·상세·통계·꿈 지도 — 로직 변경 없음, 진입 경로만 조정 |

> 저장 스키마 변경 없음 → 기존 데이터·백업과 호환.
