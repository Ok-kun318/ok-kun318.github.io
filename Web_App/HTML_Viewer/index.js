function loadFile() {
    const fileInput = document.getElementById('fileInput');
    const fileFrame = document.getElementById('fileFrame');

    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const content = e.target.result;
            fileFrame.srcdoc = content;
        };

        reader.readAsText(file, 'UTF-8');
    }
    const element = document.getElementById('fileInput'); 
    element.remove();

}
