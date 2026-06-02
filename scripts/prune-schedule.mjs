// 지나간 일정 자동 제거 — npm run scan 체인 끝에 호출.
// 어제 이전 날짜의 이벤트를 삭제하고, 오늘 이벤트는 시간까지 비교해 끝난 것 제거.
import { readFile, writeFile } from 'node:fs/promises';

const SCHEDULE_PATH = 'src/data/schedule.json';

const data = JSON.parse(await readFile(SCHEDULE_PATH, 'utf-8'));
const events = Array.isArray(data.events) ? data.events : [];

const now = Date.now();
const before = events.length;

const kept = events.filter((e) => {
  if (!e?.date) return false;
  const time = e.time ?? '23:59';
  const dt = new Date(`${e.date}T${time}:00+09:00`);
  if (isNaN(dt.getTime())) return true;
  return dt.getTime() >= now;
});

const removed = before - kept.length;

if (removed > 0) {
  data.events = kept;
  data.asOf = new Date().toISOString().slice(0, 10);
  await writeFile(SCHEDULE_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`[prune-schedule] removed ${removed} past events (kept ${kept.length})`);
} else {
  console.log(`[prune-schedule] nothing to prune (${kept.length} events).`);
}
