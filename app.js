// HTMLから、操作に使う部品を取得します。
const form = document.querySelector('#health-report-form');
const confirmation = document.querySelector('#confirmation');
const addToListButton = document.querySelector('#add-to-list-button');
const reportList = document.querySelector('#report-list');
const emptyListMessage = document.querySelector('#empty-list-message');
const filterButtons = document.querySelectorAll('.filter-button');
const resetButton = document.querySelector('#reset-button');
const totalCount = document.querySelector('#total-count');
const pendingCount = document.querySelector('#pending-count');
const completedCount = document.querySelector('#completed-count');
const studentScreen = document.querySelector('#student-screen');
const teacherScreen = document.querySelector('#teacher-screen');
const openTeacherButton = document.querySelector('#open-teacher-button');
const openStudentButton = document.querySelector('#open-student-button');
const serverReportList = document.querySelector('#server-report-list');
const serverReportMessage = document.querySelector('#server-report-message');

// localStorage内で、この練習用アプリだけが使う名前です。
const STORAGE_KEY = 'line-health-practice-data';

// 保存済みの練習用データを安全に読み込みます。
function loadSavedData() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
      return { reports: [], selectedFilter: 'all' };
    }

    const parsedData = JSON.parse(savedData);
    return {
      reports: Array.isArray(parsedData.reports) ? parsedData.reports : [],
      selectedFilter: ['all', '未対応', '対応済み'].includes(parsedData.selectedFilter)
        ? parsedData.selectedFilter
        : 'all'
    };
  } catch {
    // 保存データを読めない場合は、空の練習データとして始めます。
    return { reports: [], selectedFilter: 'all' };
  }
}

const savedData = loadSavedData();
const reports = savedData.reports;
let selectedFilter = savedData.selectedFilter;

// 現在の一覧と絞り込み条件を、ブラウザ内だけに保存します。
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ reports, selectedFilter }));
}

function updateFilterButtons() {
  filterButtons.forEach((filterButton) => {
    const isActive = filterButton.dataset.filter === selectedFilter;
    filterButton.classList.toggle('is-active', isActive);
    filterButton.setAttribute('aria-pressed', String(isActive));
  });
}

// 報告を追加した時刻を、日本で読みやすい形の文字列にします。
function formatReportDateTime() {
  return new Date().toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// 表示用の日時文字列を、並び替えに使える時刻へ変換します。
// 日時がない古い練習データは 0 として、同じ状態の中で最後に表示します。
function getReportTime(report) {
  if (!report.createdAt) {
    return 0;
  }

  const matchedDate = report.createdAt.match(
    /^(\d{4})\/(\d{2})\/(\d{2})\s(\d{2}):(\d{2})$/
  );

  if (!matchedDate) {
    return 0;
  }

  const [, year, month, day, hour, minute] = matchedDate;
  return new Date(year, Number(month) - 1, day, hour, minute).getTime();
}

// サーバーが記録した共通時刻を、日本で読みやすい形へ変換します。
function formatServerDateTime(createdAt) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return '日時なし';
  }

  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Tokyo'
  });
}

// GET APIへ一覧をお願いし、サーバーにある匿名練習報告を別の一覧へ表示します。
async function loadServerReports() {
  serverReportList.innerHTML = '';
  serverReportMessage.hidden = false;
  serverReportMessage.textContent = 'サーバーから読み込んでいます。';

  try {
    const response = await fetch('/api/reports');

    if (!response.ok) {
      throw new Error('サーバーから正しい返事が届きませんでした。');
    }

    const serverReports = await response.json();

    if (!Array.isArray(serverReports)) {
      throw new Error('一覧の形式が正しくありません。');
    }

    if (serverReports.length === 0) {
      serverReportMessage.textContent = 'サーバーには練習用の報告がありません。';
      return;
    }

    serverReports.forEach((report) => {
      const item = document.createElement('li');
      item.className = 'report-item';

      const reportId = document.createElement('p');
      reportId.textContent = `整理番号：${report.id}`;
      const createdAt = document.createElement('p');
      createdAt.textContent = `報告日時：${formatServerDateTime(report.createdAt)}`;
      const condition = document.createElement('p');
      condition.textContent = `体調：${report.condition}`;
      const attendance = document.createElement('p');
      attendance.textContent = `予定への参加：${report.attendance}`;
      const contactRequest = document.createElement('p');
      contactRequest.textContent = `教員からの連絡希望：${report.contactRequest}`;
      const status = document.createElement('p');
      status.textContent = `対応状態：${report.status}`;

      item.append(reportId, createdAt, condition, attendance, contactRequest, status);
      serverReportList.append(item);
    });

    serverReportMessage.hidden = true;
  } catch {
    serverReportMessage.textContent =
      'サーバーから読み込めません。http://localhost:3000 で開き、サーバーを起動してください。';
  }
}

// フォームのボタンが押されたときに実行する処理です。
form.addEventListener('submit', (event) => {
  // 本来のフォーム送信によるページ再読み込みを止めます。
  event.preventDefault();

  // 選択欄の現在の値を、確認欄へ表示します。
  document.querySelector('#result-condition').textContent =
    document.querySelector('#condition').value;
  document.querySelector('#result-attendance').textContent =
    document.querySelector('#attendance').value;
  document.querySelector('#result-contact-request').textContent =
    document.querySelector('#contact-request').value;

  // hidden属性を外して、確認欄を画面に表示します。
  confirmation.hidden = false;
});

// 配列の内容を、教員用の一覧として画面へ表示する関数です。
function renderReports() {
  reportList.innerHTML = '';

  // 絞り込みの前に、全報告の件数を集計します。
  totalCount.textContent = reports.length;
  pendingCount.textContent = reports.filter((report) => report.status === '未対応').length;
  completedCount.textContent = reports.filter((report) => report.status === '対応済み').length;

  // 「all」なら全件、それ以外なら対応状態が一致する報告だけを残します。
  const filteredReports = selectedFilter === 'all'
    ? reports
    : reports.filter((report) => report.status === selectedFilter);

  // コピーを作ってから、未対応を優先し、同じ状態では日時の新しい順へ並べます。
  const visibleReports = [...filteredReports].sort((first, second) => {
    const firstStatusOrder = first.status === '未対応' ? 0 : 1;
    const secondStatusOrder = second.status === '未対応' ? 0 : 1;

    if (firstStatusOrder !== secondStatusOrder) {
      return firstStatusOrder - secondStatusOrder;
    }

    return getReportTime(second) - getReportTime(first);
  });

  visibleReports.forEach((report) => {
    const item = document.createElement('li');
    item.className = 'report-item';

    const needsAttention = report.condition === '不良'
      || report.contactRequest === '希望する';

    if (needsAttention) {
      const attentionBadge = document.createElement('strong');
      attentionBadge.className = 'attention-badge';
      attentionBadge.textContent = '要確認';
      item.append(attentionBadge);
    }

    const createdAt = document.createElement('p');
    createdAt.textContent = `報告日時：${report.createdAt ?? '日時なし'}`;
    const condition = document.createElement('p');
    condition.textContent = `体調：${report.condition}`;
    const attendance = document.createElement('p');
    attendance.textContent = `予定への参加：${report.attendance}`;
    const contactRequest = document.createElement('p');
    contactRequest.textContent = `教員からの連絡希望：${report.contactRequest}`;
    const status = document.createElement('p');
    status.textContent = `対応状態：${report.status}`;

    // 現在の状態に応じて、ボタンの言葉を切り替えます。
    const statusButton = document.createElement('button');
    statusButton.type = 'button';
    statusButton.className = 'status-button';
    statusButton.textContent = report.status === '未対応'
      ? '対応済みにする'
      : '未対応へ戻す';

    // 押された報告だけの状態を切り替え、一覧をもう一度表示します。
    statusButton.addEventListener('click', () => {
      report.status = report.status === '未対応' ? '対応済み' : '未対応';
      saveData();
      renderReports();
    });

    item.append(createdAt, condition, attendance, contactRequest, status, statusButton);
    reportList.append(item);
  });

  emptyListMessage.hidden = visibleReports.length > 0;
  emptyListMessage.textContent = reports.length === 0
    ? 'まだ追加された練習用の報告はありません。'
    : 'この条件に一致する練習用の報告はありません。';

  updateFilterButtons();
}

// 確認済みの内容を、匿名の練習用データとして一覧へ追加します。
addToListButton.addEventListener('click', () => {
  reports.push({
    createdAt: formatReportDateTime(),
    condition: document.querySelector('#condition').value,
    attendance: document.querySelector('#attendance').value,
    contactRequest: document.querySelector('#contact-request').value,
    status: '未対応'
  });

  saveData();
  renderReports();
});

// 絞り込みボタンが押されたら、条件を変更して一覧を表示し直します。
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedFilter = button.dataset.filter;
    saveData();
    renderReports();
  });
});

// 初期化では、このアプリ専用キーのデータだけを削除します。
resetButton.addEventListener('click', () => {
  const shouldReset = window.confirm(
    '練習用の報告と絞り込み条件をすべて初期化します。よろしいですか？'
  );

  if (!shouldReset) {
    return;
  }

  reports.splice(0, reports.length);
  selectedFilter = 'all';
  localStorage.removeItem(STORAGE_KEY);
  renderReports();
});

// 練習用として、学生用画面と教員用画面の表示だけを切り替えます。
openTeacherButton.addEventListener('click', () => {
  studentScreen.hidden = true;
  teacherScreen.hidden = false;
  loadServerReports();
});

openStudentButton.addEventListener('click', () => {
  teacherScreen.hidden = true;
  studentScreen.hidden = false;
});

// ページを開いた直後にも、保存済みの一覧と絞り込み条件を表示します。
renderReports();
