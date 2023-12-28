var previewOnly = false;

function updatePreview() {
    var previewFrame = document.getElementById('preview');
    var html = document.getElementById('editor').value;
    previewFrame.contentWindow.document.open();
    previewFrame.contentWindow.document.write(html);
    previewFrame.contentWindow.document.close();
}

updatePreview()

function save() {
    localStorage.setItem('html', document.getElementById('editor').value);
}

function load() {
    document.getElementById('editor').value = localStorage.getItem('html');
    updatePreview();
}

function download() {
    var a = document.createElement('a');
    var file = new Blob([document.getElementById('editor').value], { type: 'text/html' });
    a.href = URL.createObjectURL(file);
    a.download = 'index.html';
    a.click();
}

function upload() {
    var file = document.getElementById('upload').files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('editor').value = e.target.result;
        updatePreview();
    }
    reader.readAsText(file);
}

function togglePreviewOnly() {
    var editor = document.getElementById('editor');
    var preview = document.getElementById('preview');
    if (previewOnly) {
        editor.style.display = 'block';
        preview.style.width = '50%';
        previewOnly = false;
    } else {
        editor.style.display = 'none';
        preview.style.width = '100%';
        previewOnly = true;
    }
}