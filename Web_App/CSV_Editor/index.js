function handleFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    const reader = new FileReader();

    reader.onload = function(e) {
        document.getElementById('csvInput').value = e.target.result;
    };

    reader.readAsText(file);
}

function downloadCSV() {
    const csvData = document.getElementById('csvInput').value;

    const blob = new Blob([csvData], { type: 'text/csv' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'output.csv';

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
}