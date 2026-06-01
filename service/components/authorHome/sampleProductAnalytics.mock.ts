import type {
  IAuthorProductDetailFunnelRow,
  IAuthorProductEpisodeDropoffRow,
  IAuthorProductInflowDropoffResponse,
  IAuthorProductInflowDropoffSourceGroup,
  IAuthorProductRecent24hResponse,
} from "@/app/api/query/author/statistics/dto";

/**
 * 작품별분석 목업/empty-state 데모용 샘플 데이터.
 * 작가에게 보여줄 "이 페이지가 뭔지 한눈에 아는" 풍부한 예시 작품.
 * 장르: 현대판타지 회귀 헌터물(통쾌) — AI 진단이 장르에 맞춰 나오는 걸 보여주기 위함.
 * prod DB에는 적재하지 않는다.
 */

export const SAMPLE_PRODUCT_ID = 9001;
export const SAMPLE_PRODUCT_SELECT_VALUE = "__sample_product_analytics__";
export const SAMPLE_PRODUCT_TITLE = "회귀한 폐급 헌터";
export const SAMPLE_RANGE = { startDate: "2026-05-01", endDate: "2026-05-30" };
export const SAMPLE_EPISODE_COUNT = 45;
const CLIFF_EPISODE = 23; // 독자가 많이 빠지는 회차

export const sampleProductMeta = {
  productId: SAMPLE_PRODUCT_ID,
  title: SAMPLE_PRODUCT_TITLE,
  genreLabel: "현대판타지 · 회귀/헌터",
  styleTags: ["통쾌", "성장", "먼치킨"],
  episodeCount: SAMPLE_EPISODE_COUNT,
  cumulativeView: 428000,
  bookmarkCount: 3120,
  recommendCount: 8940,
  freeRank: 7,
  previousFreeRank: 11,
  premise: "10년 차 최약체 헌터가 첫 각성의 날로 회귀해, 미래 지식으로 폐급 낙인을 뒤집는다.",
  hook: "모두가 쓰레기 취급한 'F급' 각성, 사실은 회차마다 능력을 훔치는 유일 등급이었다.",
};

const EPISODE_TITLES: Record<number, string> = {
  1: "회귀, 그리고 F급",
  5: "숨겨진 등급",
  10: "각성자 길드",
  17: "균열 너머",
  23: "10년 전의 진실",
  31: "복수의 칼끝",
  38: "정상에서",
  45: "두 번째 각성",
};

// ── 회차별 읽기시작 수 곡선 (완만한 감소 + 23화 절벽) ──
const buildReadStart = (n: number) => {
  let v = 2130 * Math.pow(0.962, n - 1);
  if (n >= CLIFF_EPISODE) v *= 0.62;
  return Math.max(60, Math.round(v / 5) * 5);
};

const buildDropoffRow = (n: number): IAuthorProductEpisodeDropoffRow => {
  const readStart = buildReadStart(n);
  const isCliff = n === CLIFF_EPISODE;
  const dropoffRate = isCliff ? 0.58 : 0.1 + ((n * 7) % 9) / 100; // 0.10~0.18
  const dropoffCount = Math.round(readStart * dropoffRate);
  const b0 = Math.round(dropoffCount * (isCliff ? 0.08 : 0.4));
  const b1 = Math.round(dropoffCount * (isCliff ? 0.24 : 0.34));
  const b2 = Math.round(dropoffCount * (isCliff ? 0.5 : 0.18));
  const b3 = Math.round(dropoffCount * (isCliff ? 0.13 : 0.06));
  const b4 = Math.max(0, dropoffCount - b0 - b1 - b2 - b3);
  return {
    product_id: SAMPLE_PRODUCT_ID,
    episode_id: 90000 + n,
    episode_no: n,
    episode_title: EPISODE_TITLES[n] ?? null,
    read_start_count: readStart,
    episode_dropoff_count: dropoffCount,
    episode_dropoff_rate: readStart ? dropoffCount / readStart : 0,
    avg_dropoff_progress_ratio: isCliff ? 0.46 : 0.21,
    near_complete_count: readStart - dropoffCount,
    dropoff_0_10_count: b0,
    dropoff_10_30_count: b1,
    dropoff_30_60_count: b2,
    dropoff_60_90_count: b3,
    dropoff_90_plus_count: b4,
  };
};

export const sampleEpisodeDropoffs: IAuthorProductEpisodeDropoffRow[] = Array.from(
  { length: SAMPLE_EPISODE_COUNT },
  (_, i) => buildDropoffRow(i + 1)
);

// ── 유입 경로별 전환 (6개 그룹, 구좌가 최다 유입·최저 전환 = 핵심 누수) ──
const sourceGroup = (
  entry_source_group: string,
  source_label: string,
  detail: number,
  visitor: number,
  reader: number
): IAuthorProductInflowDropoffSourceGroup => {
  const exit = detail - reader;
  return {
    product_id: SAMPLE_PRODUCT_ID,
    entry_source_group,
    source_label,
    detail_view_count: Math.round(detail * 1.18),
    detail_session_count: detail,
    detail_visitor_count: visitor,
    login_user_count: Math.round(visitor * 0.62),
    reader_session_count: reader,
    detail_exit_session_count: exit,
    read_conversion_rate: detail ? reader / detail : 0,
    detail_exit_rate: detail ? exit / detail : 0,
  };
};

export const sampleSourceGroups: IAuthorProductInflowDropoffSourceGroup[] = [
  sourceGroup("recommend_slot", "구좌유입", 1980, 1820, 540),
  sourceGroup("search", "검색유입", 1320, 1240, 790),
  sourceGroup("ranking", "랭킹유입", 760, 720, 430),
  sourceGroup("social", "소셜유입", 410, 390, 250),
  sourceGroup("direct", "직접유입", 210, 205, 90),
  sourceGroup("other", "기타", 140, 135, 30),
];

// ── 일별 흐름 ──
const funnelDay = (
  detail_entry_date: string,
  entry_source: string | null,
  detail_view_session_count: number,
  detail_to_view_session_count: number,
  episode_exit_event_count: number,
  avg_episode_exit_progress_ratio: number | null
): IAuthorProductDetailFunnelRow => {
  const detail_exit_session_count =
    detail_view_session_count - detail_to_view_session_count;
  return {
    detail_entry_date,
    product_id: SAMPLE_PRODUCT_ID,
    entry_source,
    detail_view_raw_count: Math.round(detail_view_session_count * 1.2),
    detail_view_session_count,
    detail_view_user_count: Math.round(detail_view_session_count * 0.92),
    detail_to_view_session_count,
    detail_to_view_user_count: Math.round(detail_to_view_session_count * 0.95),
    detail_exit_session_count,
    exit_home_session_count: Math.round(detail_exit_session_count * 0.45),
    exit_search_session_count: Math.round(detail_exit_session_count * 0.2),
    exit_other_product_detail_session_count: Math.round(detail_exit_session_count * 0.25),
    exit_other_route_session_count: Math.round(detail_exit_session_count * 0.1),
    episode_exit_event_count,
    avg_episode_exit_progress_ratio,
    created_date: `${detail_entry_date} 03:00:00`,
    updated_date: `${detail_entry_date} 03:00:00`,
  };
};

export const sampleFunnelRows: IAuthorProductDetailFunnelRow[] = [
  funnelDay("2026-05-30", "ai_taste_section", 196, 88, 70, 0.33),
  funnelDay("2026-05-29", "home_free_top", 182, 71, 64, 0.28),
  funnelDay("2026-05-28", "top50", 174, 80, 61, 0.31),
  funnelDay("2026-05-27", "search_result", 168, 99, 52, 0.41),
  funnelDay("2026-05-26", "paid_promotion", 159, 54, 73, 0.24),
  funnelDay("2026-05-25", "ranking", 151, 86, 48, 0.36),
  funnelDay("2026-05-24", "search_recommend", 147, 78, 50, 0.34),
  funnelDay("2026-05-23", "same_author_product", 138, 61, 44, 0.3),
  funnelDay("2026-05-22", "ai_chat_panel", 132, 70, 41, 0.38),
  funnelDay("2026-05-21", "home_free_top", 128, 52, 49, 0.27),
  funnelDay("2026-05-20", "recently_viewed", 121, 66, 37, 0.42),
  funnelDay("2026-05-19", "event_product", 115, 48, 41, 0.29),
];

export const sampleInflowDropoff: IAuthorProductInflowDropoffResponse = {
  product_id: SAMPLE_PRODUCT_ID,
  start_date: SAMPLE_RANGE.startDate,
  end_date: SAMPLE_RANGE.endDate,
  source_groups: sampleSourceGroups,
  episode_dropoffs: sampleEpisodeDropoffs.map((row) => ({
    product_id: row.product_id,
    episode_id: row.episode_id,
    episode_no: row.episode_no,
    episode_title: row.episode_title,
    read_start_count: row.read_start_count,
    episode_dropoff_count: row.episode_dropoff_count,
    episode_dropoff_rate: row.episode_dropoff_rate,
  })),
};

// ── 퍼널 요약 (① 카드 파생값) ──
export const sampleFunnelSummary = {
  detailInflow: 4820, // = Σ detail_session_count
  episodeEntry: 2130, // = Σ reader_session_count = 1화 read_start
  firstEpisodeComplete: sampleEpisodeDropoffs[0].near_complete_count,
  detailExit: 2580, // = Σ detail_exit_session_count
};

// ── 최근 24시간 (Recent24h 탭) ──
const sample24hEpisodesBase = Array.from(
  { length: SAMPLE_EPISODE_COUNT },
  (_, i) => {
    const n = i + 1;
    const recent = Math.max(
      8,
      Math.round(20 + (n / SAMPLE_EPISODE_COUNT) * 130 + ((n * 17) % 30))
    );
    return {
      episodeId: 90000 + n,
      episodeNo: n,
      episodeTitle: EPISODE_TITLES[n] ?? null,
      recent24hCountHit: recent,
      cumulativeCountHit: buildReadStart(n) * 12 + 600,
    };
  }
);
const sample24hTotal = sample24hEpisodesBase.reduce(
  (sum, e) => sum + e.recent24hCountHit,
  0
);

export const sampleRecent24h: IAuthorProductRecent24hResponse = {
  productId: SAMPLE_PRODUCT_ID,
  basisAt: "2026-05-30 12:00:00",
  fromAt: "2026-05-29 12:00:00",
  toAt: "2026-05-30 12:00:00",
  totalEpisodeCount: SAMPLE_EPISODE_COUNT,
  summary: {
    recent24hCountHit: sample24hTotal,
    previous24hCountHit: Math.round(sample24hTotal * 0.86),
    cumulativeCountHit: 428000,
    rankStatus: "reflected",
    rankBasisAt: "2026-05-30 12:00:00",
  },
  hourly: Array.from({ length: 24 }, (_, h) => {
    const peak = h >= 21 || h <= 1 ? 175 : h >= 18 || h <= 7 ? 45 : 75;
    return { hourLabel: `${String(h).padStart(2, "0")}시`, countHit: 90 + peak + ((h * 13) % 37) };
  }),
  episodes: sample24hEpisodesBase.map((e) => ({
    ...e,
    shareRate: sample24hTotal ? e.recent24hCountHit / sample24hTotal : 0,
  })),
};

// ── ② AI 진단 (Phase 2 미구현 → 데모용 정적 텍스트. 실제론 Claude가 작품별 생성) ──
export const sampleAiDiagnosis = {
  isSample: true,
  headline: "유입은 충분한데, 상세→1화 전환과 23화에서 새고 있어요.",
  findings: [
    {
      tag: "유입 경로",
      severity: "high" as const,
      body:
        "구좌(추천 슬롯) 유입이 1,980으로 가장 많은데 회차 전환은 27%로 최저예요. 검색·랭킹 유입은 같은 조건에서 57~60% 전환합니다.",
      prescription:
        "통쾌·회귀물 독자는 슬롯 썸네일/소개 첫 줄에서 '회차마다 능력을 훔친다'는 한 방을 기대해요. 추천 슬롯에 노출되는 소개 첫 문장을 hook 문장으로 교체해 보세요.",
    },
    {
      tag: "23화 절벽",
      severity: "high" as const,
      body:
        "23화에서 진입 독자의 58%가 이탈하고(주로 30~60% 지점), 이후 진입 수가 눈에 띄게 꺾입니다. 22화까지 12~18% 이탈과 대비돼요.",
      prescription:
        "23화 '10년 전의 진실'은 회상 비중이 큰 회차입니다. 회귀물 독자는 이쯤 '사이다 회수'를 기대하니, 회상은 압축하고 22화 말에 강한 절단신(클리프행어)을 두는 걸 권합니다.",
    },
  ],
  basis: ["유입/이탈 mart", "ai_metadata(premise·hook·style)", "23화 episode_summary"],
};
