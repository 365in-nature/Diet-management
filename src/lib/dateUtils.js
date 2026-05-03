// =============================================
// 한국 공휴일 (2025-2027)
// =============================================
const HOLIDAYS = new Set([
  // 2025
  "2025-01-01","2025-01-28","2025-01-29","2025-01-30",
  "2025-03-01","2025-05-05","2025-05-06","2025-06-06",
  "2025-08-15","2025-10-03","2025-10-06","2025-10-07","2025-10-08","2025-10-09",
  "2025-12-25",
  // 2026
  "2026-01-01","2026-01-28","2026-01-29","2026-01-30",
  "2026-03-01","2026-05-05","2026-06-06",
  "2026-08-17","2026-09-24","2026-09-25","2026-09-26",
  "2026-10-03","2026-10-09","2026-12-25",
  // 2027
  "2027-01-01","2027-02-08","2027-02-09","2027-02-10",
  "2027-03-01","2027-05-05","2027-06-06",
  "2027-08-16","2027-09-14","2027-09-15","2027-09-16",
  "2027-10-04","2027-10-09","2027-12-25",
]);

// =============================================
// 기본 날짜 유틸
// =============================================

export function today() {
  return new Date().toISOString().split("T")[0];
}

export function isToday(dateStr) {
  return dateStr === today();
}

export function isTodayOrPast(dateStr) {
  return dateStr && dateStr <= today();
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
}

export function formatDateKo(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const days = ["일","월","화","수","목","금","토"];
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

export function diffDays(dateStrA, dateStrB) {
  const a = new Date(dateStrA);
  const b = new Date(dateStrB);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

// =============================================
// 영업일 계산 (해피콜용 — 공휴일 + 일요일 제외)
// =============================================

export function isBusinessDay(date) {
  const d = new Date(date);
  const day = d.getDay();
  const str = d.toISOString().split("T")[0];
  return day !== 0 && !HOLIDAYS.has(str); // 일요일, 공휴일 제외
}

export function addBusinessDays(dateStr, days) {
  let d = new Date(dateStr);
  let count = 0;
  while (count < days) {
    d.setDate(d.getDate() + 1);
    if (isBusinessDay(d)) count++;
  }
  return d.toISOString().split("T")[0];
}

export function subtractBusinessDays(dateStr, days) {
  let d = new Date(dateStr);
  let count = 0;
  while (count < days) {
    d.setDate(d.getDate() - 1);
    if (isBusinessDay(d)) count++;
  }
  return d.toISOString().split("T")[0];
}

// =============================================
// 교통사고 환자 치료 가능 구간 계산
// =============================================

/**
 * 사고일 기준 주(週) 번호 반환
 * 사고일 요일부터 한 주 시작
 * @param {string} accidentDate - 사고일 (YYYY-MM-DD)
 * @param {string} targetDate   - 확인할 날짜 (YYYY-MM-DD)
 * @returns {number} 몇 번째 주인지 (1부터 시작)
 */
export function getWeekNumber(accidentDate, targetDate) {
  const acc = new Date(accidentDate);
  const tgt = new Date(targetDate);
  const diffMs = tgt - acc;
  const diffDaysVal = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDaysVal < 0) return -1; // 사고 이전
  return Math.floor(diffDaysVal / 7) + 1;
}

/**
 * 사고일 기준 현재 주의 시작일/종료일 반환
 * @param {string} accidentDate - 사고일 (YYYY-MM-DD)
 * @param {string} targetDate   - 확인할 날짜 (YYYY-MM-DD)
 * @returns {{ start: string, end: string }}
 */
export function getWeekRange(accidentDate, targetDate) {
  const acc = new Date(accidentDate);
  const tgt = new Date(targetDate);
  const diffMs = tgt - acc;
  const diffDaysVal = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weekIndex = Math.floor(diffDaysVal / 7);

  const start = new Date(acc);
  start.setDate(acc.getDate() + weekIndex * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

/**
 * 사고일 기준 특정 날짜의 치료 허용 횟수/구간 반환
 * @param {string} accidentDate - 사고일
 * @param {string} targetDate   - 확인할 날짜
 * @param {boolean} isSevere    - 중증 여부
 * @returns {{ zone: string, maxPerWeek: number | 'daily' }}
 *   zone: 'daily' | 'week3' | 'week2' | 'week1'
 *   maxPerWeek: 7(매일) | 3 | 2 | 1
 */
export function getTreatmentZone(accidentDate, targetDate, isSevere = false) {
  const acc = new Date(accidentDate);
  const tgt = new Date(targetDate);
  const diffMs = tgt - acc;
  const diffDaysVal = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDaysVal < 0) {
    return { zone: "before", maxPerWeek: 0 };
  }

  const diffWeeks = diffDaysVal / 7;

  // 0~3주 (21일): 매일
  if (diffDaysVal < 21) {
    return { zone: "daily", maxPerWeek: 7 };
  }

  // 중증 환자: 3주 이후 계속 주 3회
  if (isSevere) {
    return { zone: "week3", maxPerWeek: 3 };
  }

  // 일반 환자
  // 3주~11주: 주 3회
  if (diffWeeks < 11) {
    return { zone: "week3", maxPerWeek: 3 };
  }

  // 11주~6개월(26주): 주 2회
  if (diffWeeks < 26) {
    return { zone: "week2", maxPerWeek: 2 };
  }

  // 6개월 이상: 주 1회
  return { zone: "week1", maxPerWeek: 1 };
}

/**
 * 오늘 치료 가능 여부 판단
 * @param {string} accidentDate  - 사고일
 * @param {boolean} isSevere     - 중증 여부
 * @param {string[]} visitDates  - 이미 내원한 날짜 목록 (YYYY-MM-DD[])
 * @param {string} targetDate    - 확인할 날짜 (기본: 오늘)
 * @returns {boolean}
 */
export function canTreatToday(accidentDate, isSevere, visitDates, targetDate = today()) {
  const { zone, maxPerWeek } = getTreatmentZone(accidentDate, targetDate, isSevere);

  if (zone === "before") return false;

  // 매일 구간: 항상 가능
  if (zone === "daily") return true;

  // 이번 주 범위 계산
  const { start, end } = getWeekRange(accidentDate, targetDate);

  // 이번 주 내원 횟수
  const visitsThisWeek = visitDates.filter(d => d >= start && d <= end).length;

  return visitsThisWeek < maxPerWeek;
}

/**
 * 치료 가능 슬롯 기준 연속 미내원 횟수 계산
 * @param {string} accidentDate  - 사고일
 * @param {boolean} isSevere     - 중증 여부
 * @param {string[]} visitDates  - 내원 날짜 목록
 * @returns {number} 연속 미내원 슬롯 수
 */
export function getConsecutiveMissedSlots(accidentDate, isSevere, visitDates) {
  const todayStr = today();
  const acc = new Date(accidentDate);
  const tgt = new Date(todayStr);
  const totalDays = Math.floor((tgt - acc) / (1000 * 60 * 60 * 24));

  if (totalDays < 0) return 0;

  // 사고일부터 오늘까지 치료 가능 슬롯 목록 생성
  const slots = [];
  const weekVisitCount = {}; // key: weekStart, value: count

  for (let i = 0; i <= totalDays; i++) {
    const d = new Date(acc);
    d.setDate(acc.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const { zone, maxPerWeek } = getTreatmentZone(accidentDate, dateStr, isSevere);

    if (zone === "before") continue;

    if (zone === "daily") {
      slots.push(dateStr);
    } else {
      // 주 단위 슬롯: 해당 주에 maxPerWeek개까지만 슬롯 추가
      const { start } = getWeekRange(accidentDate, dateStr);
      if (!weekVisitCount[start]) weekVisitCount[start] = 0;
      if (weekVisitCount[start] < maxPerWeek) {
        slots.push(dateStr);
        weekVisitCount[start]++;
      }
    }
  }

  // 슬롯 기준 연속 미내원 계산 (뒤에서부터)
  let consecutive = 0;
  for (let i = slots.length - 1; i >= 0; i--) {
    if (visitDates.includes(slots[i])) break;
    consecutive++;
  }

  return consecutive;
}

/**
 * 자보 한약 처방 가능 여부 및 D-day 반환
 * @param {string | null} herbPrescribedAt - 마지막 한약 처방일
 * @returns {{ canPrescribe: boolean, dDay: number | null }}
 *   canPrescribe: 처방 가능 여부
 *   dDay: 양수면 D-day(며칠 후), 0이면 오늘 가능, 음수면 이미 지남
 */
export function getHerbStatus(herbPrescribedAt) {
  if (!herbPrescribedAt) return { canPrescribe: false, dDay: null };

  const nextDate = addDays(herbPrescribedAt, 7);
  const diff = diffDays(today(), nextDate);

  return {
    canPrescribe: diff <= 0,
    dDay: diff,
  };
}

// =============================================
// 패키지 계산 (다이어트 & 탕약 공통)
// =============================================

/**
 * 전체 패키지 합산 종료일 계산
 * @param {Array} pkgs - 패키지 목록
 * @param {number} extraMonths - 추가 개월수
 * @param {string | null} extraStart - 추가 시작일
 * @returns {string | null}
 */
export function calcTotalEndDate(pkgs, extraMonths = 0, extraStart = null) {
  const list = [...(pkgs || [])];
  if (extraMonths && extraStart) list.push({ start_date: extraStart, package_months: extraMonths });
  if (list.length === 0) return null;
  const firstStart = list.slice().sort((a, b) => a.start_date.localeCompare(b.start_date))[0].start_date;
  const totalDays = list.reduce((s, p) => s + Number(p.package_months) * 30, 0);
  return addDays(firstStart, totalDays);
}

/**
 * 잔여 개월수 계산
 * @param {Array} pkgs - 패키지 목록
 * @param {Array} prescriptions - 처방 목록
 * @returns {number}
 */
export function calcRemainingMonths(pkgs, prescriptions) {
  if (!pkgs || pkgs.length === 0) return 0;
  const totalMonths = pkgs.reduce((s, p) => s + Number(p.package_months), 0);
  const usedDays = (prescriptions || []).reduce((sum, rx) => {
    if (rx.is_completed) return sum + Number(rx.duration_days || 0);
    return sum;
  }, 0);
  const usedMonths = usedDays / 30;
  return Math.max(0, totalMonths - usedMonths);
}

// =============================================
// 백업 관련
// =============================================

/**
 * 마지막 백업으로부터 경과 일수
 * @param {string | null} lastBackupAt - ISO 날짜 문자열
 * @returns {number} 경과 일수 (백업 없으면 999)
 */
export function daysSinceBackup(lastBackupAt) {
  if (!lastBackupAt) return 999;
  const last = new Date(lastBackupAt);
  const now = new Date();
  return Math.floor((now - last) / (1000 * 60 * 60 * 24));
}
