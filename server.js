// Node.js標準の機能だけで動く、学習用のローカルサーバーです。
// この段階ではLINE、Webhook、データベース、外部公開は使用しません。
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const PORT = 3000;

// ブラウザから開いてよいファイルだけを、明示的に対応付けます。
const staticFiles = {
  '/': { file: 'index.html', contentType: 'text/html; charset=utf-8' },
  '/index.html': { file: 'index.html', contentType: 'text/html; charset=utf-8' },
  '/style.css': { file: 'style.css', contentType: 'text/css; charset=utf-8' },
  '/app.js': { file: 'app.js', contentType: 'text/javascript; charset=utf-8' }
};

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  // 練習用のAPIです。GETで報告一覧を求められたら、空のJSON配列を返します。
  // まだPOSTによる受信や保存は行いません。
  if (request.method === 'GET' && requestUrl.pathname === '/api/reports') {
    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    response.end(JSON.stringify([]));
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
