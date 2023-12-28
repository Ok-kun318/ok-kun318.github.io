function searchMDN() {
    var searchWord = document.getElementById('searchInput').value;
    var googleSearchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(searchWord) + '+site:developer.mozilla.org';
    window.open(googleSearchUrl, '_blank');
}

document.getElementById('searchInput').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        searchMDN();
    }
});