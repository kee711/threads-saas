/**
 * 시간 변환 유틸리티 함수들
 * 모든 시간 처리를 UTC 기준으로 통일하고, 사용자 화면에서만 로컬 시간으로 변환
 */

/**
 * 로컬 시간을 UTC ISO 문자열로 변환
 * @param localTime - HH:MM 형태의 로컬 시간
 * @param date - 기준이 될 날짜 (기본: 오늘)
 * @returns UTC ISO 문자열
 */
export function localTimeToUTCISO(localTime: string, date: Date = new Date()): string {
  if (!localTime || typeof localTime !== 'string') {
    throw new Error('Invalid local time format');
  }

  const timeParts = localTime.split(':');
  if (timeParts.length !== 2) {
    throw new Error('Invalid local time format. Expected HH:MM');
  }

  const [hours, minutes] = timeParts.map(Number);
  
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time values');
  }

  const utcDate = new Date(date);
  utcDate.setHours(hours, minutes, 0, 0);
  
  return utcDate.toISOString();
}

/**
 * 로컬 시간을 UTC HH:MM 형태로 변환
 * @param localTime - HH:MM 형태의 로컬 시간
 * @returns UTC HH:MM 문자열
 */
export function localTimeToUTCTime(localTime: string): string {
  if (!localTime || typeof localTime !== 'string') {
    throw new Error('Invalid local time format');
  }

  const timeParts = localTime.split(':');
  if (timeParts.length !== 2) {
    throw new Error('Invalid local time format. Expected HH:MM');
  }

  const [hours, minutes] = timeParts.map(Number);
  
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time values');
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  
  return `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`;
}

/**
 * UTC ISO 문자열을 로컬 시간으로 변환
 * @param utcISOString - UTC ISO 문자열
 * @returns 로컬 HH:MM 문자열
 */
export function utcISOToLocalTime(utcISOString: string): string {
  if (!utcISOString || typeof utcISOString !== 'string') {
    throw new Error('Invalid UTC ISO string');
  }

  const date = new Date(utcISOString);
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid UTC ISO string format');
  }

  const localHours = date.getHours();
  const localMinutes = date.getMinutes();
  
  return `${localHours.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}`;
}

/**
 * UTC HH:MM 시간을 로컬 HH:MM 시간으로 변환
 * @param utcTime - UTC HH:MM 형태의 시간
 * @returns 로컬 HH:MM 문자열
 */
export function utcTimeToLocalTime(utcTime: string): string {
  if (!utcTime || typeof utcTime !== 'string') {
    throw new Error('Invalid UTC time format');
  }

  const timeParts = utcTime.split(':');
  if (timeParts.length !== 2) {
    throw new Error('Invalid UTC time format. Expected HH:MM');
  }

  const [utcHours, utcMinutes] = timeParts.map(Number);
  
  if (isNaN(utcHours) || isNaN(utcMinutes) || utcHours < 0 || utcHours > 23 || utcMinutes < 0 || utcMinutes > 59) {
    throw new Error('Invalid UTC time values');
  }

  const date = new Date();
  date.setUTCHours(utcHours, utcMinutes, 0, 0);
  
  const localHours = date.getHours();
  const localMinutes = date.getMinutes();
  
  return `${localHours.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}`;
}

/**
 * UTC 시간과 날짜를 결합하여 UTC ISO 문자열 생성
 * @param utcTime - UTC HH:MM 형태의 시간
 * @param date - 기준이 될 날짜 (기본: 오늘)
 * @returns UTC ISO 문자열
 */
export function combineUTCTimeAndDate(utcTime: string, date: Date = new Date()): string {
  if (!utcTime || typeof utcTime !== 'string') {
    throw new Error('Invalid UTC time format');
  }

  const timeParts = utcTime.split(':');
  if (timeParts.length !== 2) {
    throw new Error('Invalid UTC time format. Expected HH:MM');
  }

  const [utcHours, utcMinutes] = timeParts.map(Number);
  
  if (isNaN(utcHours) || isNaN(utcMinutes) || utcHours < 0 || utcHours > 23 || utcMinutes < 0 || utcMinutes > 59) {
    throw new Error('Invalid UTC time values');
  }

  const utcDate = new Date(date);
  utcDate.setUTCHours(utcHours, utcMinutes, 0, 0);
  
  return utcDate.toISOString();
}

/**
 * 현재 시간을 UTC ISO 문자열로 반환
 * @returns UTC ISO 문자열
 */
export function getCurrentUTCISO(): string {
  return new Date().toISOString();
}

/**
 * 시간 문자열이 UTC ISO 형태인지 확인
 * @param timeString - 확인할 시간 문자열
 * @returns boolean
 */
export function isUTCISOString(timeString: string): boolean {
  if (!timeString || typeof timeString !== 'string') {
    return false;
  }
  
  return timeString.includes('T') && timeString.includes('Z');
}

/**
 * 시간 문자열이 HH:MM 형태인지 확인
 * @param timeString - 확인할 시간 문자열
 * @returns boolean
 */
export function isTimeFormat(timeString: string): boolean {
  if (!timeString || typeof timeString !== 'string') {
    return false;
  }
  
  const timeParts = timeString.split(':');
  if (timeParts.length !== 2) {
    return false;
  }
  
  const [hours, minutes] = timeParts.map(Number);
  return !isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * 로컬 시간으로 포맷팅된 날짜 문자열 반환
 * @param utcISOString - UTC ISO 문자열
 * @param options - Intl.DateTimeFormatOptions
 * @returns 포맷팅된 로컬 날짜 문자열
 */
export function formatLocalDateTime(utcISOString: string, options?: Intl.DateTimeFormatOptions): string {
  if (!utcISOString || typeof utcISOString !== 'string') {
    throw new Error('Invalid UTC ISO string');
  }

  const date = new Date(utcISOString);
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid UTC ISO string format');
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options
  };

  return new Intl.DateTimeFormat('ko-KR', defaultOptions).format(date);
}