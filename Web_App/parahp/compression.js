// 圧縮方法の定義
const COMPRESSION_METHODS = {
    LZ: 'lz',      // LZ-String のみ
    DEFLATE: 'df', // DEFLATE のみ
    HYBRID: 'hy',  // ハイブリッド（LZ + DEFLATE）
    OPTIMIZED: 'op' // 文字列最適化 + ハイブリッド
};

// 圧縮方法の名前マッピング
const METHOD_NAMES = {
    [COMPRESSION_METHODS.LZ]: 'LZ-String',
    [COMPRESSION_METHODS.DEFLATE]: 'DEFLATE',
    [COMPRESSION_METHODS.HYBRID]: 'ハイブリッド',
    [COMPRESSION_METHODS.OPTIMIZED]: '最適化+ハイブリッド'
};

// 各圧縮方法の実装
const compressors = {
    [COMPRESSION_METHODS.LZ]: (data) => ({
        compressed: LZString.compressToEncodedURIComponent(data),
        method: COMPRESSION_METHODS.LZ
    }),

    [COMPRESSION_METHODS.DEFLATE]: (data) => {
        const deflated = pako.deflate(new TextEncoder().encode(data));
        const base64 = btoa(String.fromCharCode.apply(null, deflated));
        return {
            compressed: encodeURIComponent(base64),
            method: COMPRESSION_METHODS.DEFLATE
        };
    },

    [COMPRESSION_METHODS.HYBRID]: (data) => {
        const deflated = pako.deflate(new TextEncoder().encode(data));
        const base64 = btoa(String.fromCharCode.apply(null, deflated));
        return {
            compressed: LZString.compressToEncodedURIComponent(base64),
            method: COMPRESSION_METHODS.HYBRID
        };
    },

    [COMPRESSION_METHODS.OPTIMIZED]: (data) => {
        const optimized = optimizeString(optimizeJapanese(data));
        const deflated = pako.deflate(new TextEncoder().encode(optimized));
        const base64 = btoa(String.fromCharCode.apply(null, deflated));
        return {
            compressed: LZString.compressToEncodedURIComponent(base64),
            method: COMPRESSION_METHODS.OPTIMIZED
        };
    }
};

// 各展開方法の実装
const decompressors = {
    [COMPRESSION_METHODS.LZ]: (compressed) => 
        LZString.decompressFromEncodedURIComponent(compressed),

    [COMPRESSION_METHODS.DEFLATE]: (compressed) => {
        const base64 = decodeURIComponent(compressed);
        const binary = atob(base64);
        const data = pako.inflate(Uint8Array.from(binary, c => c.charCodeAt(0)));
        return new TextDecoder().decode(data);
    },

    [COMPRESSION_METHODS.HYBRID]: (compressed) => {
        const base64 = LZString.decompressFromEncodedURIComponent(compressed);
        const binary = atob(base64);
        const data = pako.inflate(Uint8Array.from(binary, c => c.charCodeAt(0)));
        return new TextDecoder().decode(data);
    },

    [COMPRESSION_METHODS.OPTIMIZED]: (compressed) => {
        const base64 = LZString.decompressFromEncodedURIComponent(compressed);
        const binary = atob(base64);
        const data = pako.inflate(Uint8Array.from(binary, c => c.charCodeAt(0)));
        return new TextDecoder().decode(data);
    }
};

// 最適な圧縮方法を見つける
function findBestCompression(data) {
    const results = Object.values(COMPRESSION_METHODS)
        .map(method => {
            try {
                const result = compressors[method](data);
                return {
                    ...result,
                    size: new Blob([result.compressed]).size
                };
            } catch (e) {
                console.warn(`圧縮方法 ${method} でエラー:`, e);
                return null;
            }
        })
        .filter(Boolean);

    return results.reduce((best, current) => 
        current.size < best.size ? current : best
    );
}

// 文字列の最適化
function optimizeString(str) {
    return str
        .replace(/\s+/g, ' ')      // 連続する空白を1つに
        .replace(/\n+/g, '\n')     // 連続する改行を1つに
        .replace(/[ \t]+$/gm, ''); // 行末の空白を削除
}

// 日本語文字列の最適化
function optimizeJapanese(str) {
    return str
        .replace(/　/g, ' ')         // 全角スペースを半角に
        .replace(/[、。]{2,}/g, '。'); // 連続する句読点を1つに
} 