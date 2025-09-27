// ISBNバーコードリーダーアプリケーション
class ISBNBarcodeReader {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.result = document.getElementById('result');
        this.isbnInfo = document.getElementById('isbnInfo');
        this.bookInfo = document.getElementById('bookInfo');
        this.bookDetails = document.getElementById('bookDetails');
        this.status = document.getElementById('status');
        this.clearCacheBtn = document.getElementById('clearCacheBtn');
        this.clearImageCacheBtn = document.getElementById('clearImageCacheBtn');
        this.cacheInfo = document.getElementById('cacheInfo');
        this.storageUsage = document.getElementById('storageUsage');
        
        // ページ管理
        this.scannerBtn = document.getElementById('scannerBtn');
        this.bookshelfBtn = document.getElementById('bookshelfBtn');
        this.optionsBtn = document.getElementById('optionsBtn');
        this.scannerPage = document.getElementById('scannerPage');
        this.bookshelfPage = document.getElementById('bookshelfPage');
        this.optionsPage = document.getElementById('optionsPage');
        
        // 本棚管理
        this.bookshelfList = document.getElementById('bookshelfList');
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.seriesFilter = document.getElementById('seriesFilter');
        this.bookCount = document.getElementById('bookCount');
        this.seriesCount = document.getElementById('seriesCount');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
        
        this.stream = null;
        this.detector = null;
        this.isScanning = false;
        this.lastDetectedISBN = null; // 最後に検出されたISBNを記録
        this.currentFilter = ''; // 現在の検索フィルター
        this.currentSeries = ''; // 現在のシリーズフィルター
        
        // オプション設定
        this.options = {
            autoAddMode: false,
            autoSeriesDetection: true,
            showAddDialog: true,
            excludeJAN: true,
            enableImageCache: true
        };
        
        this.initializeEventListeners();
        this.initializeBarcodeDetector();
        this.loadOptions();
        this.updateCacheInfo();
        this.updateStorageUsage();
        this.loadBookshelf();
    }

    async initializeBarcodeDetector() {
        try {
            // Sec-ant/barcode-detectorライブラリをインポート
            // const { BarcodeDetector } = await import('barcode-detector/ponyfill');
            
            // サポートされているフォーマットを確認
            const supportedFormats = await window.BarcodeDetector.getSupportedFormats();
            console.log('サポートされているフォーマット:', supportedFormats);
            
            // ISBN関連のフォーマットを設定
            const isbnFormats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'];
            const availableFormats = isbnFormats.filter(format => supportedFormats.includes(format));
            
            this.detector = new BarcodeDetector({
                formats: availableFormats
            });
            
            this.updateStatus('ready', '準備完了');
        } catch (error) {
            this.updateStatus('error', 'エラー: ' + error.message);
            this.showError('バーコード検出機能が利用できません。最新のブラウザをご利用ください。');
        }
    }

    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.startCamera());
        this.stopBtn.addEventListener('click', () => this.stopCamera());
        this.clearCacheBtn.addEventListener('click', () => this.clearCache());
        this.clearImageCacheBtn.addEventListener('click', () => this.clearImageCacheOnly());
        
        // ページ切り替え
        this.scannerBtn.addEventListener('click', () => this.showPage('scanner'));
        this.bookshelfBtn.addEventListener('click', () => this.showPage('bookshelf'));
        this.optionsBtn.addEventListener('click', () => this.showPage('options'));
        
        // 本棚管理
        this.searchBtn.addEventListener('click', () => this.searchBooks());
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.searchBooks();
        });
        this.seriesFilter.addEventListener('change', () => this.filterBySeries());
        this.selectAllBtn.addEventListener('click', () => this.toggleSelectAll());
        this.deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedBooks());
        
        // オプション管理
        document.getElementById('saveOptionsBtn').addEventListener('click', () => this.saveOptions());
        document.getElementById('resetOptionsBtn').addEventListener('click', () => this.resetOptions());
    }

    async startCamera() {
        try {
            this.updateStatus('loading', 'カメラを起動中...');
            
            // カメラストリームを取得
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // 背面カメラを優先
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            this.video.srcObject = this.stream;
            
            this.video.addEventListener('loadedmetadata', () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                this.startScanning();
            });

            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.updateStatus('scanning', 'スキャン中...');
            
        } catch (error) {
            this.updateStatus('error', 'カメラエラー');
            this.showError('カメラにアクセスできません: ' + error.message);
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.isScanning = false;
        this.video.srcObject = null;
        
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.updateStatus('ready', '準備完了');
        
        this.clearResult();
    }

    startScanning() {
        if (!this.detector) {
            this.showError('バーコード検出器が初期化されていません');
            return;
        }

        this.isScanning = true;
        this.scanFrame();
    }

    async scanFrame() {
        if (!this.isScanning) return;

        try {
            // ビデオフレームをキャンバスに描画
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // バーコードを検出（Sec-ant/barcode-detectorライブラリのAPI）
            const barcodes = await this.detector.detect(this.canvas);
            
            if (barcodes.length > 0) {
                this.handleBarcodeDetected(barcodes[0]);
            }
            
            // 次のフレームをスキャン
            requestAnimationFrame(() => this.scanFrame());
            
        } catch (error) {
            console.error('スキャンエラー:', error);
            this.updateStatus('error', 'スキャンエラー');
        }
    }

    handleBarcodeDetected(barcode) {
        console.log('検出されたバーコード:', barcode);
        
        const isbn = this.extractISBN(barcode.rawValue, barcode.format);
        
        if (isbn) {
            // 同じISBNが連続して検出された場合はスキップ
            if (this.lastDetectedISBN === isbn) {
                console.log('同じISBNが検出されました。スキップします。');
                return;
            }
            
            this.lastDetectedISBN = isbn;
            this.displayISBN(isbn, barcode);
            this.updateStatus('success', 'ISBN検出完了');
            
            // 書籍情報を検索
            this.searchBookInfo(isbn);
            
            // 検出後、少し待ってから再開（連続検出を防ぐ）
            setTimeout(() => {
                this.isScanning = true;
            }, 2000);
        } else {
            this.showError(`ISBNコードではありません (${barcode.format}): ${barcode.rawValue}`);
        }
    }

    extractISBN(barcodeValue, format) {
        // ISBNの検証と正規化
        const cleaned = barcodeValue.replace(/[^0-9X]/g, '');
        
        // JANコード（192で始まる）を除外
        if (cleaned.startsWith('192')) {
            console.log('JANコード（192で始まる）を除外:', cleaned);
            return null;
        }
        
        // フォーマットに基づく判定
        if (format === 'ean_13' || format === 'upc_a') {
            // EAN-13やUPC-Aの場合、ISBN-13として扱う
            if (cleaned.length === 13 && (cleaned.startsWith('978') || cleaned.startsWith('979'))) {
                return cleaned;
            }
        } else if (format === 'ean_8' || format === 'upc_e') {
            // EAN-8やUPC-Eの場合、ISBN-10として扱う可能性がある
            if (cleaned.length === 8 || cleaned.length === 6) {
                // 短いバーコードはISBN-10の可能性が低い
                return null;
            }
        }
        
        // ISBN-10またはISBN-13のチェック
        if (this.isValidISBN10(cleaned) || this.isValidISBN13(cleaned)) {
            return cleaned;
        }
        
        // EAN-13からISBN-13への変換を試行（978または979で始まる13桁）
        if (cleaned.length === 13 && (cleaned.startsWith('978') || cleaned.startsWith('979'))) {
            return cleaned;
        }
        
        return null;
    }

    isValidISBN10(isbn) {
        if (isbn.length !== 10) return false;
        
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(isbn[i]) * (10 - i);
        }
        
        const checkDigit = isbn[9] === 'X' ? 10 : parseInt(isbn[9]);
        return (sum + checkDigit) % 11 === 0;
    }

    isValidISBN13(isbn) {
        if (isbn.length !== 13) return false;
        
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
        }
        
        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit === parseInt(isbn[12]);
    }

    displayISBN(isbn, barcode) {
        this.result.innerHTML = `
            <div class="success-message">
                <h3>✅ ISBN検出成功！</h3>
                <div class="isbn-display">${this.formatISBN(isbn)}</div>
                <div class="barcode-info">
                    <small>フォーマット: ${barcode.format} | 生データ: ${barcode.rawValue}</small>
                </div>
            </div>
        `;

        // ISBN情報を表示
        document.getElementById('isbnValue').textContent = this.formatISBN(isbn);
        document.getElementById('detectionTime').textContent = new Date().toLocaleString('ja-JP');
        document.getElementById('format').textContent = `${isbn.length === 10 ? 'ISBN-10' : 'ISBN-13'} (${barcode.format})`;
        
        this.isbnInfo.style.display = 'block';
    }

    formatISBN(isbn) {
        if (isbn.length === 10) {
            return `${isbn.slice(0, 1)}-${isbn.slice(1, 4)}-${isbn.slice(4, 9)}-${isbn.slice(9)}`;
        } else if (isbn.length === 13) {
            return `${isbn.slice(0, 3)}-${isbn.slice(3, 4)}-${isbn.slice(4, 7)}-${isbn.slice(7, 12)}-${isbn.slice(12)}`;
        }
        return isbn;
    }

    showError(message) {
        this.result.innerHTML = `
            <div class="error-message">
                <h3>❌ エラー</h3>
                <p>${message}</p>
            </div>
        `;
    }

    clearResult() {
        this.result.innerHTML = '<p class="placeholder">バーコードをカメラに向けてください</p>';
        this.isbnInfo.style.display = 'none';
    }

    updateStatus(type, message) {
        const statusDot = this.status.querySelector('.status-dot');
        const statusText = this.status.querySelector('.status-text');
        
        statusDot.className = `status-dot ${type}`;
        statusText.textContent = message;
    }

    // Google Books API検索機能
    async searchBookInfo(isbn) {
        try {
            // キャッシュをチェック
            const cachedBook = this.getCachedBook(isbn);
            if (cachedBook) {
                console.log('キャッシュから書籍情報を取得:', cachedBook);
                this.displayBookInfo(cachedBook);
                // キャッシュから表示する場合も追加ダイアログを表示
                this.showAddToBookshelfDialog(cachedBook);
                return;
            }

            // 書籍情報エリアを表示
            this.bookInfo.style.display = 'block';
            this.bookDetails.innerHTML = '<div class="book-loading">検索中...</div>';

            // Google Books API検索
            const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`レスポンスステータス: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.items || !result.items.length) {
                this.bookDetails.innerHTML = '<div class="book-not-found">書籍情報が見つかりません</div>';
                return;
            }

            const bookData = result.items[0].volumeInfo;
            let thumbnailUrl = bookData.imageLinks ? bookData.imageLinks.thumbnail : null;
            
            // 画像をキャッシュしてURLを取得
            let cachedThumbnailUrl = null;
            if (thumbnailUrl) {
                cachedThumbnailUrl = await this.cacheImage(thumbnailUrl, isbn);
            }

            const bookInfo = {
                isbn: isbn,
                title: bookData.title || 'タイトル不明',
                authors: bookData.authors || ['著者不明'],
                publisher: bookData.publisher || '出版社不明',
                publishedDate: bookData.publishedDate || '発行日不明',
                description: bookData.description || '説明なし',
                thumbnail: cachedThumbnailUrl || thumbnailUrl,
                originalThumbnail: thumbnailUrl, // 元のURLも保存
                pageCount: bookData.pageCount || 'ページ数不明',
                language: bookData.language || '言語不明',
                categories: bookData.categories || [],
                searchDate: new Date().toISOString()
            };

            // キャッシュに保存
            this.cacheBook(bookInfo);
            this.updateCacheInfo();
            this.updateStorageUsage();

            // 書籍情報を表示
            this.displayBookInfo(bookInfo);
            
            // 本棚に追加するかどうか確認
            this.showAddToBookshelfDialog(bookInfo);

        } catch (error) {
            console.error('書籍検索エラー:', error);
            this.bookDetails.innerHTML = `<div class="book-error">エラー: ${error.message}</div>`;
        }
    }

    // 書籍情報を表示
    displayBookInfo(bookInfo) {
        const authors = Array.isArray(bookInfo.authors) ? bookInfo.authors.join(', ') : bookInfo.authors;
        const categories = Array.isArray(bookInfo.categories) ? bookInfo.categories.join(', ') : bookInfo.categories;
        
        this.bookDetails.innerHTML = `
            <div class="book-card">
                <div class="book-header">
                    ${bookInfo.thumbnail ? `<img src="${bookInfo.thumbnail}" alt="${bookInfo.title}" class="book-thumbnail">` : ''}
                    <div class="book-title-section">
                        <h4 class="book-title">${bookInfo.title}</h4>
                        <p class="book-authors">著者: ${authors}</p>
                        <p class="book-publisher">出版社: ${bookInfo.publisher}</p>
                    </div>
                </div>
                <div class="book-details-content">
                    <p class="book-description">${bookInfo.description}</p>
                    <div class="book-meta">
                        <span class="book-meta-item">発行日: ${bookInfo.publishedDate}</span>
                        <span class="book-meta-item">ページ数: ${bookInfo.pageCount}</span>
                        <span class="book-meta-item">言語: ${bookInfo.language}</span>
                    </div>
                    ${categories ? `<p class="book-categories">カテゴリ: ${categories}</p>` : ''}
                </div>
            </div>
        `;
    }

    // キャッシュ機能
    getCachedBook(isbn) {
        try {
            const cacheKey = `book_${isbn}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const bookData = JSON.parse(cached);
                // キャッシュの有効期限をチェック（7日間）
                const cacheDate = new Date(bookData.searchDate);
                const now = new Date();
                const daysDiff = (now - cacheDate) / (1000 * 60 * 60 * 24);
                
                if (daysDiff < 7) {
                    return bookData;
                } else {
                    // 期限切れのキャッシュを削除
                    localStorage.removeItem(cacheKey);
                }
            }
        } catch (error) {
            console.error('キャッシュ読み込みエラー:', error);
        }
        return null;
    }

    cacheBook(bookInfo) {
        try {
            const cacheKey = `book_${bookInfo.isbn}`;
            localStorage.setItem(cacheKey, JSON.stringify(bookInfo));
        } catch (error) {
            console.error('キャッシュ保存エラー:', error);
        }
    }

    clearCache() {
        try {
            const keys = Object.keys(localStorage);
            const bookKeys = keys.filter(key => key.startsWith('book_'));
            const imageKeys = keys.filter(key => key.startsWith('image_'));
            
            // 書籍キャッシュを削除
            bookKeys.forEach(key => localStorage.removeItem(key));
            
            // 画像キャッシュを削除
            const deletedImageCount = this.clearImageCache();
            
            this.updateCacheInfo();
            this.updateStorageUsage();
            this.bookInfo.style.display = 'none';
            this.bookDetails.innerHTML = '<div class="book-loading">検索中...</div>';
            
            alert(`キャッシュを削除しました。\n削除された書籍: ${bookKeys.length}件\n削除された画像: ${deletedImageCount}件`);
        } catch (error) {
            console.error('キャッシュ削除エラー:', error);
            alert('キャッシュの削除に失敗しました。');
        }
    }

    updateCacheInfo() {
        try {
            const keys = Object.keys(localStorage);
            const bookKeys = keys.filter(key => key.startsWith('book_'));
            const imageKeys = keys.filter(key => key.startsWith('image_'));
            this.cacheInfo.textContent = `キャッシュされた書籍: ${bookKeys.length}件 | 画像: ${imageKeys.length}件`;
        } catch (error) {
            console.error('キャッシュ情報更新エラー:', error);
        }
    }

    // ストレージ使用量を更新
    updateStorageUsage() {
        try {
            const usage = this.getStorageUsage();
            this.storageUsage.textContent = `ストレージ使用量: ${usage.totalSizeKB}KB (${usage.totalSizeMB}MB)`;
        } catch (error) {
            console.error('ストレージ使用量更新エラー:', error);
        }
    }

    // 画像キャッシュのみ削除
    clearImageCacheOnly() {
        try {
            const deletedCount = this.clearImageCache();
            this.updateCacheInfo();
            this.updateStorageUsage();
            
            alert(`画像キャッシュを削除しました。\n削除された画像: ${deletedCount}件`);
        } catch (error) {
            console.error('画像キャッシュ削除エラー:', error);
            alert('画像キャッシュの削除に失敗しました。');
        }
    }

    // 画像キャッシュ機能
    async cacheImage(imageUrl, isbn) {
        try {
            // 既にキャッシュされているかチェック
            const cachedImageUrl = this.getCachedImageUrl(isbn);
            if (cachedImageUrl) {
                console.log('キャッシュされた画像を使用:', isbn);
                return cachedImageUrl;
            }

            console.log('画像をキャッシュ中:', imageUrl);
            
            // 画像を取得
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`画像取得エラー: ${response.status}`);
            }
            
            const blob = await response.blob();
            
            // BlobをBase64に変換
            const base64 = await this.blobToBase64(blob);
            
            // キャッシュに保存
            const imageData = {
                url: imageUrl,
                data: base64,
                mimeType: blob.type,
                cacheDate: new Date().toISOString(),
                size: blob.size
            };
            
            const imageKey = `image_${isbn}`;
            localStorage.setItem(imageKey, JSON.stringify(imageData));
            
            // Blob URLを作成
            const blobUrl = URL.createObjectURL(blob);
            
            console.log('画像をキャッシュしました:', isbn, `(${Math.round(blob.size / 1024)}KB)`);
            return blobUrl;
            
        } catch (error) {
            console.error('画像キャッシュエラー:', error);
            // エラーの場合は元のURLを返す
            return imageUrl;
        }
    }

    // キャッシュされた画像URLを取得
    getCachedImageUrl(isbn) {
        try {
            const imageKey = `image_${isbn}`;
            const cached = localStorage.getItem(imageKey);
            
            if (cached) {
                const imageData = JSON.parse(cached);
                
                // キャッシュの有効期限をチェック（30日間）
                const cacheDate = new Date(imageData.cacheDate);
                const now = new Date();
                const daysDiff = (now - cacheDate) / (1000 * 60 * 60 * 24);
                
                if (daysDiff < 30) {
                    // Base64からBlobに変換してBlob URLを作成
                    const blob = this.base64ToBlob(imageData.data, imageData.mimeType);
                    return URL.createObjectURL(blob);
                } else {
                    // 期限切れのキャッシュを削除
                    localStorage.removeItem(imageKey);
                }
            }
        } catch (error) {
            console.error('キャッシュ画像取得エラー:', error);
        }
        return null;
    }

    // BlobをBase64に変換
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Base64をBlobに変換
    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    // 画像キャッシュをクリア
    clearImageCache() {
        try {
            const keys = Object.keys(localStorage);
            const imageKeys = keys.filter(key => key.startsWith('image_'));
            
            imageKeys.forEach(key => {
                const imageData = JSON.parse(localStorage.getItem(key));
                // Blob URLを解放
                if (imageData.blobUrl) {
                    URL.revokeObjectURL(imageData.blobUrl);
                }
                localStorage.removeItem(key);
            });
            
            console.log(`画像キャッシュをクリアしました: ${imageKeys.length}件`);
            return imageKeys.length;
        } catch (error) {
            console.error('画像キャッシュクリアエラー:', error);
            return 0;
        }
    }

    // ストレージ使用量を取得
    getStorageUsage() {
        try {
            let totalSize = 0;
            const keys = Object.keys(localStorage);
            
            keys.forEach(key => {
                const item = localStorage.getItem(key);
                totalSize += item.length;
            });
            
            return {
                totalSize: totalSize,
                totalSizeKB: Math.round(totalSize / 1024),
                totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
                itemCount: keys.length
            };
        } catch (error) {
            console.error('ストレージ使用量取得エラー:', error);
            return { totalSize: 0, totalSizeKB: 0, totalSizeMB: 0, itemCount: 0 };
        }
    }

    // ページ切り替え
    showPage(page) {
        // すべてのページを非アクティブに
        this.scannerPage.classList.remove('active');
        this.bookshelfPage.classList.remove('active');
        this.optionsPage.classList.remove('active');
        
        // すべてのボタンを非アクティブに
        this.scannerBtn.classList.remove('active');
        this.bookshelfBtn.classList.remove('active');
        this.optionsBtn.classList.remove('active');
        
        if (page === 'scanner') {
            this.scannerPage.classList.add('active');
            this.scannerBtn.classList.add('active');
        } else if (page === 'bookshelf') {
            this.bookshelfPage.classList.add('active');
            this.bookshelfBtn.classList.add('active');
            this.refreshBookshelf();
            this.updateSeriesFilter(); // シリーズフィルターを再読み込み
        } else if (page === 'options') {
            this.optionsPage.classList.add('active');
            this.optionsBtn.classList.add('active');
            this.loadOptionsToUI();
        }
    }

    // 本棚に追加ダイアログを表示
    showAddToBookshelfDialog(bookInfo) {
        // 既に本棚にあるかチェック
        if (this.isBookInBookshelf(bookInfo.isbn)) {
            this.bookDetails.innerHTML += `
                <div class="add-to-bookshelf">
                    <p class="already-added">✅ この本は既に本棚に追加されています</p>
                </div>
            `;
            return;
        }

        // 自動追加モードの場合（シリーズ選択のみ）
        if (this.options.autoAddMode) {
            this.showSeriesSelectionDialog(bookInfo);
            return;
        }

        this.showAddDialog(bookInfo);
    }

    // シリーズ選択ダイアログを表示（自動追加モード用）
    showSeriesSelectionDialog(bookInfo) {
        const existingSeries = this.getAllSeries();
        const suggestedSeries = this.options.autoSeriesDetection ? 
            this.detectSeriesName(bookInfo.title) : 'その他';

        let seriesOptions = existingSeries.map(series => 
            `<option value="${series}">${series}</option>`
        ).join('');
        
        seriesOptions += '<option value="__new__">新しいシリーズを作成</option>';

        this.bookDetails.innerHTML += `
            <div class="add-to-bookshelf">
                <h4>シリーズを選択してください</h4>
                <div class="series-selection">
                    <label for="seriesSelect">シリーズ名:</label>
                    <select id="seriesSelect" class="series-select">
                        ${seriesOptions}
                    </select>
                    <input type="text" id="newSeriesName" placeholder="新しいシリーズ名を入力" style="display: none;">
                </div>
                <div class="add-actions">
                    <button class="btn btn-primary" id="addToBookshelfBtn">追加する</button>
                    <button class="btn btn-secondary" id="hideAddDialogBtn">キャンセル</button>
                </div>
            </div>
        `;

        // シリーズ選択のイベントリスナー
        const seriesSelect = document.getElementById('seriesSelect');
        const newSeriesInput = document.getElementById('newSeriesName');
        
        seriesSelect.addEventListener('change', () => {
            if (seriesSelect.value === '__new__') {
                newSeriesInput.style.display = 'block';
                newSeriesInput.focus();
            } else {
                newSeriesInput.style.display = 'none';
            }
        });

        // イベントリスナーを追加
        document.getElementById('addToBookshelfBtn').addEventListener('click', () => {
            const selectedSeries = seriesSelect.value;
            const seriesName = selectedSeries === '__new__' ? 
                newSeriesInput.value.trim() : selectedSeries;
            
            if (seriesName) {
                this.addToBookshelfWithSeries(bookInfo.isbn, seriesName);
            } else {
                alert('シリーズ名を入力してください。');
            }
        });
        
        document.getElementById('hideAddDialogBtn').addEventListener('click', () => {
            this.hideAddToBookshelfDialog();
        });
    }

    // 追加ダイアログを表示
    showAddDialog(bookInfo, suggestedSeries = '') {
        this.bookDetails.innerHTML += `
            <div class="add-to-bookshelf">
                <h4>本棚に追加しますか？</h4>
                <div class="series-input">
                    <label for="seriesName">シリーズ名（任意）:</label>
                    <input type="text" id="seriesName" placeholder="例: ハリー・ポッターシリーズ" value="${suggestedSeries}">
                </div>
                <div class="add-actions">
                    <button class="btn btn-primary" id="addToBookshelfBtn">追加する</button>
                    <button class="btn btn-secondary" id="hideAddDialogBtn">追加しない</button>
                </div>
            </div>
        `;

        // イベントリスナーを追加
        document.getElementById('addToBookshelfBtn').addEventListener('click', () => {
            const seriesName = document.getElementById('seriesName').value.trim();
            this.addToBookshelfWithSeries(bookInfo.isbn, seriesName);
        });
        
        document.getElementById('hideAddDialogBtn').addEventListener('click', () => {
            this.hideAddToBookshelfDialog();
        });
    }

    hideAddToBookshelfDialog() {
        const addDialog = this.bookDetails.querySelector('.add-to-bookshelf');
        if (addDialog) {
            addDialog.remove();
        }
    }

    // 本棚に追加（シリーズ名指定）
    addToBookshelfWithSeries(isbn, seriesName) {
        try {
            const bookData = this.getCachedBook(isbn);
            
            if (!bookData) {
                alert('書籍データが見つかりません。');
                return;
            }

            const bookshelfItem = {
                ...bookData,
                addedDate: new Date().toISOString(),
                series: seriesName || 'その他'
            };

            const bookshelfKey = `bookshelf_${isbn}`;
            localStorage.setItem(bookshelfKey, JSON.stringify(bookshelfItem));
            
            this.hideAddToBookshelfDialog();
            this.refreshBookshelf();
            this.updateBookshelfStats();
            
            if (this.options.autoAddMode && !this.options.showAddDialog) {
                this.updateStatus('success', `自動追加完了: ${bookData.title}`);
            } else {
                alert('本棚に追加しました！');
            }
        } catch (error) {
            console.error('本棚追加エラー:', error);
            alert('本棚への追加に失敗しました。');
        }
    }

    // 本棚に追加（従来の方法）
    addToBookshelf(isbn) {
        const seriesName = document.getElementById('seriesName').value.trim();
        this.addToBookshelfWithSeries(isbn, seriesName);
    }

    // シリーズ名を自動検出
    detectSeriesName(title) {
        // 一般的なシリーズパターンを検出
        const patterns = [
            // 巻数パターン（例: "ハリー・ポッター 1巻"）
            /^(.+?)\s*第?(\d+)[巻冊]?/,
            // シリーズ名 + 数字（例: "ハリー・ポッター 1"）
            /^(.+?)\s+(\d+)$/,
            // 括弧内の数字（例: "ハリー・ポッター (1)"）
            /^(.+?)\s*\((\d+)\)/,
            // シリーズ名 + サブタイトル（例: "ハリー・ポッター 賢者の石"）
            /^(.+?)\s+[^0-9]+$/
        ];

        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match && match[1]) {
                const seriesName = match[1].trim();
                // 短すぎる場合は除外
                if (seriesName.length >= 2) {
                    return seriesName;
                }
            }
        }

        return 'その他';
    }

    // 本棚に本があるかチェック
    isBookInBookshelf(isbn) {
        const bookshelfKey = `bookshelf_${isbn}`;
        return localStorage.getItem(bookshelfKey) !== null;
    }

    // 全シリーズを取得
    getAllSeries() {
        const books = this.getAllBookshelfBooks();
        return [...new Set(books.map(book => book.series))].sort();
    }

    // 本棚を読み込み
    loadBookshelf() {
        this.refreshBookshelf();
        this.updateBookshelfStats();
        this.updateSeriesFilter();
    }

    // 本棚を更新
    refreshBookshelf() {
        try {
            const books = this.getAllBookshelfBooks();
            const filteredBooks = this.filterBooks(books);
            this.displayBookshelf(filteredBooks);
        } catch (error) {
            console.error('本棚更新エラー:', error);
        }
    }

    // 本棚の全書籍を取得
    getAllBookshelfBooks() {
        const books = [];
        const keys = Object.keys(localStorage);
        const bookshelfKeys = keys.filter(key => key.startsWith('bookshelf_'));
        
        bookshelfKeys.forEach(key => {
            try {
                const bookData = JSON.parse(localStorage.getItem(key));
                books.push(bookData);
            } catch (error) {
                console.error('書籍データ読み込みエラー:', error);
            }
        });
        
        return books;
    }

    // 書籍をフィルタリング
    filterBooks(books) {
        let filtered = books;
        
        // 検索フィルター
        if (this.currentFilter) {
            const filter = this.currentFilter.toLowerCase();
            filtered = filtered.filter(book => 
                book.title.toLowerCase().includes(filter) ||
                book.authors.some(author => author.toLowerCase().includes(filter)) ||
                book.isbn.includes(filter)
            );
        }
        
        // シリーズフィルター
        if (this.currentSeries) {
            filtered = filtered.filter(book => book.series === this.currentSeries);
        }
        
        // あいうえお順でソート
        return filtered.sort((a, b) => {
            const titleA = this.getSortKey(a.title);
            const titleB = this.getSortKey(b.title);
            return titleA.localeCompare(titleB, 'ja');
        });
    }

    // ソート用のキーを取得（ひらがなに変換）
    getSortKey(text) {
        return text.replace(/[ァ-ヶ]/g, s => String.fromCharCode(s.charCodeAt(0) - 0x60));
    }

    // 本棚を表示
    displayBookshelf(books) {
        if (books.length === 0) {
            this.bookshelfList.innerHTML = `
                <div class="empty-bookshelf">
                    <p>📚 まだ本が登録されていません</p>
                    <p>スキャナーでISBNを読み取って本を追加してください</p>
                </div>
            `;
            return;
        }

        const booksHTML = books.map(book => this.createBookCard(book)).join('');
        this.bookshelfList.innerHTML = booksHTML;
        
        // チェックボックスのイベントリスナーを追加
        this.bookshelfList.querySelectorAll('.book-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateDeleteButton();
            });
        });
    }

    // 書籍カードを作成
    createBookCard(book) {
        const authors = Array.isArray(book.authors) ? book.authors.join(', ') : book.authors;
        const addedDate = new Date(book.addedDate).toLocaleDateString('ja-JP');
        
        return `
            <div class="book-card" data-isbn="${book.isbn}">
                <div class="book-card-header">
                    <input type="checkbox" class="book-checkbox" data-isbn="${book.isbn}">
                    <div class="book-card-info">
                        <h4 class="book-card-title">${book.title}</h4>
                        <p class="book-card-authors">著者: ${authors}</p>
                        <p class="book-card-isbn">ISBN: ${this.formatISBN(book.isbn)}</p>
                        <p class="book-card-series">シリーズ: ${book.series}</p>
                        <p class="book-card-date">追加日: ${addedDate}</p>
                    </div>
                    ${book.thumbnail ? `<img src="${book.thumbnail}" alt="${book.title}" class="book-card-thumbnail">` : ''}
                </div>
            </div>
        `;
    }

    // 検索機能
    searchBooks() {
        this.currentFilter = this.searchInput.value.trim();
        this.refreshBookshelf();
    }

    // シリーズでフィルタリング
    filterBySeries() {
        this.currentSeries = this.seriesFilter.value;
        this.refreshBookshelf();
    }

    // シリーズフィルターを更新
    updateSeriesFilter() {
        const books = this.getAllBookshelfBooks();
        const series = [...new Set(books.map(book => book.series))].sort();
        
        this.seriesFilter.innerHTML = '<option value="">すべてのシリーズ</option>';
        series.forEach(seriesName => {
            const option = document.createElement('option');
            option.value = seriesName;
            option.textContent = seriesName;
            this.seriesFilter.appendChild(option);
        });
    }

    // 全選択/全解除
    toggleSelectAll() {
        const checkboxes = this.bookshelfList.querySelectorAll('.book-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
        });
        
        this.updateDeleteButton();
        this.selectAllBtn.textContent = allChecked ? 'すべて選択' : 'すべて解除';
    }

    // 選択された書籍を削除
    deleteSelectedBooks() {
        const selectedCheckboxes = this.bookshelfList.querySelectorAll('.book-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            alert('削除する本を選択してください。');
            return;
        }
        
        if (confirm(`${selectedCheckboxes.length}冊の本を削除しますか？`)) {
            selectedCheckboxes.forEach(checkbox => {
                const isbn = checkbox.dataset.isbn;
                const bookshelfKey = `bookshelf_${isbn}`;
                localStorage.removeItem(bookshelfKey);
            });
            
            this.refreshBookshelf();
            this.updateBookshelfStats();
            this.updateSeriesFilter();
            this.updateDeleteButton();
        }
    }

    // 削除ボタンの状態を更新
    updateDeleteButton() {
        const selectedCount = this.bookshelfList.querySelectorAll('.book-checkbox:checked').length;
        this.deleteSelectedBtn.disabled = selectedCount === 0;
        this.deleteSelectedBtn.textContent = `選択削除 (${selectedCount})`;
    }

    // 本棚統計を更新
    updateBookshelfStats() {
        const books = this.getAllBookshelfBooks();
        const series = [...new Set(books.map(book => book.series))];
        
        this.bookCount.textContent = `登録書籍: ${books.length}冊`;
        this.seriesCount.textContent = `シリーズ数: ${series.length}`;
    }

    // オプション管理
    loadOptions() {
        try {
            const saved = localStorage.getItem('app_options');
            if (saved) {
                this.options = { ...this.options, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('オプション読み込みエラー:', error);
        }
    }

    saveOptions() {
        try {
            this.loadOptionsFromUI();
            localStorage.setItem('app_options', JSON.stringify(this.options));
            alert('設定を保存しました！');
        } catch (error) {
            console.error('オプション保存エラー:', error);
            alert('設定の保存に失敗しました。');
        }
    }

    resetOptions() {
        if (confirm('設定をデフォルトに戻しますか？')) {
            this.options = {
                autoAddMode: false,
                autoSeriesDetection: true,
                showAddDialog: true,
                excludeJAN: true,
                enableImageCache: true
            };
            this.loadOptionsToUI();
            this.saveOptions();
        }
    }

    loadOptionsToUI() {
        document.getElementById('autoAddMode').checked = this.options.autoAddMode;
        document.getElementById('autoSeriesDetection').checked = this.options.autoSeriesDetection;
        document.getElementById('showAddDialog').checked = this.options.showAddDialog;
        document.getElementById('excludeJAN').checked = this.options.excludeJAN;
        document.getElementById('enableImageCache').checked = this.options.enableImageCache;
    }

    // オプションをUIから読み込み
    loadOptionsFromUI() {
        this.options.autoAddMode = document.getElementById('autoAddMode').checked;
        this.options.autoSeriesDetection = document.getElementById('autoSeriesDetection').checked;
        this.options.showAddDialog = document.getElementById('showAddDialog').checked;
        this.options.excludeJAN = document.getElementById('excludeJAN').checked;
        this.options.enableImageCache = document.getElementById('enableImageCache').checked;
    }
}

// アプリケーション初期化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ISBNBarcodeReader();
    // グローバルスコープに設定（デバッグ用）
    window.app = app;
});
