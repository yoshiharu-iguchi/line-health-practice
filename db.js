// 匿名の練習報告をSQLiteへ保存するためのファイルです。
// 実在の個人情報、LINE連携、外部公開には使用しません。
import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const dataDirectoryUrl = new URL('./data/', import.meta.url);
mkdirSync(fileURLToPath(dataDirectoryUrl), { recursive: true });

const databaseFileUrl = new URL('line-health-practice.sqlite', dataDirectoryUrl);
const database = new DatabaseSync(fileURLToPath(databaseFileUrl));

// 「reports」という表がなければ、最初の起動時に作ります。
database.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL,
    condition TEXT NOT NULL,
    attendance TEXT NOT NULL,
    contact_request TEXT NOT NULL
  )
`);

function toReport(row) {
  if (!row) {
    return undefined;
  }

  return {
    id: `practice-report-${row.id}`,
    createdAt: row.created_at,
    status: row.status,
    condition: row.condition,
    attendance: row.attendance,
    contactRequest: row.contact_request
  };
}

function toDatabaseId(reportId) {
  const matchedId = /^practice-report-(\d+)$/.exec(reportId);
  return matchedId ? Number(matchedId[1]) : undefined;
}

export function listReports() {
  const rows = database
    .prepare('SELECT * FROM reports ORDER BY id ASC')
    .all();

  return rows.map(toReport);
}

export function createReport({ condition, attendance, contactRequest }) {
  const createdAt = new Date().toISOString();
  const result = database
    .prepare(`
      INSERT INTO reports (created_at, status, condition, attendance, contact_request)
      VALUES (?, '未対応', ?, ?, ?)
    `)
    .run(createdAt, condition, attendance, contactRequest);

  const row = database
    .prepare('SELECT * FROM reports WHERE id = ?')
    .get(Number(result.lastInsertRowid));

  return toReport(row);
}

export function updateReportStatus(reportId, status) {
  const databaseId = toDatabaseId(reportId);

  if (!databaseId) {
    return undefined;
  }

  const result = database
    .prepare('UPDATE reports SET status = ? WHERE id = ?')
    .run(status, databaseId);

  if (result.changes === 0) {
    return undefined;
  }

  const row = database
    .prepare('SELECT * FROM reports WHERE id = ?')
    .get(databaseId);

  return toReport(row);
}

export function deleteAllReports() {
  const deletedCount = database
    .prepare('SELECT COUNT(*) AS count FROM reports')
    .get().count;

  database.exec('DELETE FROM reports');
  return Number(deletedCount);
}
