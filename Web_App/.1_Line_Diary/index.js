const diaryEntries = JSON.parse(localStorage.getItem('diaryEntries')) || [];

  const tbody = document.getElementById('diaryTable').getElementsByTagName('tbody')[0];

  function displayDiaryEntries() {
    tbody.innerHTML = '';
    diaryEntries.forEach(entry => {
      const row = tbody.insertRow();
      row.innerHTML = `<td>${formatDate(entry.date)}</td><td>${entry.text}</td>
                        <td><button onclick="editEntry(${entry.id})">編集</button>
                            <button onclick="deleteEntry(${entry.id})">削除</button></td>`;
    });
  }

  function addDiaryEntry(text) {
    const date = new Date().toLocaleString();
    const entry = { id: Date.now(), date, text };
    diaryEntries.push(entry);
    displayDiaryEntries();
    saveToLocalStorage();
  }

  function deleteEntry(id) {
    const index = diaryEntries.findIndex(entry => entry.id === id);
    diaryEntries.splice(index, 1);
    displayDiaryEntries();
    saveToLocalStorage();
  }

  function editEntry(id) {
    const index = diaryEntries.findIndex(entry => entry.id === id);
    const newText = prompt('新しい1行日記を入力してください', diaryEntries[index].text);
    if (newText !== null) {
      diaryEntries[index].text = newText;
      displayDiaryEntries();
      saveToLocalStorage();
    }
  }

  function saveToLocalStorage() {
    localStorage.setItem('diaryEntries', JSON.stringify(diaryEntries));
  }

  displayDiaryEntries();

  function promptForDiaryEntry() {
    const text = prompt('1行日記を入力してください');
    if (text !== null) {
      addDiaryEntry(text);
    }
  }

  function downloadCSV() {
    const csvContent = "data:text/csv;charset=utf-8," + diaryEntries.map(entry => [entry.date, entry.text].join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "1_Line_Diary.csv");
    document.body.appendChild(link);
    link.click();
  }

  function uploadCSV(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];
    
    if (file) {
      const reader = new FileReader();

      reader.onload = function(e) {
        const csvData = e.target.result;
        parseCSV(csvData);
      };

      reader.readAsText(file);
    }
  }

  function parseCSV(csvData) {
    const lines = csvData.split('\n');
    const newEntries = [];

    lines.forEach(line => {
      const [date, text] = line.split(',');
      if (date && text) {
        const entry = { id: Date.now(), date, text };
        newEntries.push(entry);
      }
    });

    diaryEntries.push(...newEntries);
    displayDiaryEntries();
    saveToLocalStorage();
  }

  function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' };
    return new Date(dateString).toLocaleDateString('ja-JP', options);
}
function openInputDialog() {
  document.getElementById('inputModal').style.display = 'block';
}

function closeInputDialog() {
  document.getElementById('inputModal').style.display = 'none';
}

function addDiaryEntryFromInput() {
  const text = document.getElementById('diaryInput').value;
  if (text.trim() !== '') {
    addDiaryEntry(text);
    closeInputDialog();
  } else {
    alert('入力が空白です。1行日記を入力してください。');
  }
}