// HTMLから、操作に使う部品を取得します。
const form = document.querySelector('#health-report-form');
const confirmation = document.querySelector('#confirmation');
const addToListButton = document.querySelector('#add-to-list-button');
const reportList = document.querySelector('#report-list');
const emptyListMessage = document.querySelector('#empty-list-message');
const filterButtons = document.querySelectorAll('.filter-button');
const resetButton = document.querySelector('#reset-button');

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

  // 「all」なら全件、それ以外なら対応状態が一致する報告だけを残します。
  const visibleReports = selectedFilter === 'all'
    ? reports
    : reports.filter((report) => report.status === selectedFilter);

  visibleReports.forEach((report) => {
    const item = document.createElement('li');
    item.className = 'report-item';

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

    item.append(condition, attendance, contactRequest, status, statusButton);
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

// ページを開いた直後にも、保存済みの一覧と絞り込み条件を表示します。
renderReports();
