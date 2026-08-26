// Node.js標準の機能で動く、学習用のローカルサーバーです。
// 匿名の練習報告だけをSQLiteへ保存します。LINE、Webhook、外部公開は使用しません。
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  createReport,
  deleteAllReports,
  listReports,
  updateReportStatus
} from './db.js';

const PORT = 3000;

const validConditions = ['良好', '普通', '不良'];
const validAttendances = ['参加できる', '相談したい', '参加が難しい'];
const validContactRequests = ['不要', '希望する'];
const validStatuses = ['未対応', '対応済み'];

// ブラウザから開いてよいファイルだけを、明示的に対応付けます。
const staticFiles = {
  '/': { file: 'index.html', contentType: 'text/html; charset=utf-8' },
  '/index.html': { file: 'index.html', contentType: 'text/html; charset=utf-8' },
  '/style.css': { file: 'style.css', contentType: 'text/css; charset=utf-8' },
  '/app.js': { file: 'app.js', contentType: 'text/javascript; charset=utf-8' }
};

// POSTで届くJSON本文を文字列として読み取る関数です。
function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalSize = 0;

    request.on('data', (chunk) => {
      totalSize += chunk.length;

      // 練習用APIなので、大きすぎるデータは受け取りません。
      if (totalSize > 10_000) {
        reject(new Error('リクエストが大きすぎます。'));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    request.on('error', reject);
  });
}

// 決められた3項目と選択肢だけかを確認します。
function isValidReport(report) {
  return report
    && validConditions.includes(report.condition)
    && validAttendances.includes(report.attendance)
    && validContactRequests.includes(report.contactRequest);
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  // GETで報告一覧を求められたら、SQLiteに保存された匿名練習報告を返します。
  if (request.method === 'GET' && requestUrl.pathname === '/api/reports') {
    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    response.end(JSON.stringify(listReports()));
    return;
  }

  // 練習用のPOST APIです。匿名の練習報告だけをSQLiteへ保存します。
  if (request.method === 'POST' && requestUrl.pathname === '/api/reports') {
    try {
      const requestBody = await readRequestBody(request);
      const report = JSON.parse(requestBody);

      if (!isValidReport(report)) {
        response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ error: '決められた選択肢を選んでください。' }));
        return;
      }

      // 整理番号、受取時刻、最初の対応状態はdb.jsが決めます。
      const practiceReport = createReport(report);

      response.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(practiceReport));
    } catch {
      response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'JSON形式の報告を送ってください。' }));
    }
    return;
  }

  // 例：/api/reports/practice-report-1/status のようなURLから整理番号を取り出します。
  const statusEndpoint = requestUrl.pathname.match(/^\/api\/reports\/([^/]+)\/status$/);

  // 練習用のPATCH APIです。見つけた報告の対応状態だけを変更します。
  if (request.method === 'PATCH' && statusEndpoint) {
    try {
      const requestBody = await readRequestBody(request);
      const { status } = JSON.parse(requestBody);

      if (!validStatuses.includes(status)) {
        response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ error: '対応状態は「未対応」か「対応済み」を選んでください。' }));
        return;
      }

      const reportId = decodeURIComponent(statusEndpoint[1]);
      const report = updateReportStatus(reportId, status);

      if (!report) {
        response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ error: '指定された報告が見つかりません。' }));
        return;
      }

      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(report));
    } catch {
      response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'JSON形式で対応状態を送ってください。' }));
    }
    return;
  }

  // 練習用のDELETE APIです。SQLiteにある匿名練習報告だけを空にします。
  if (request.method === 'DELETE' && requestUrl.pathname === '/api/reports') {
    const deletedCount = deleteAllReports();

    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ deletedCount }));
    return;
  }

  const requestedFile = staticFiles[requestUrl.pathname];

  if (!requestedFile) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('ページが見つかりません。');
    return;
  }

  try {
    const fileUrl = new URL(requestedFile.file, import.meta.url);
    const fileContents = await readFile(fileURLToPath(fileUrl));

    response.writeHead(200, {
      'Content-Type': requestedFile.contentType,
      'Cache-Control': 'no-store'
    });
    response.end(fileContents);
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('ファイルの読み込み中にエラーが発生しました。');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`ローカルサーバーを起動しました: http://localhost:${PORT}`);
  console.log('停止するには、ターミナルで Control + C を押します。');
});
