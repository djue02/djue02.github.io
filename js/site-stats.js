document.addEventListener('DOMContentLoaded', function() {
  if (typeof SITE_STATS !== 'undefined') {
    var wordEl = document.getElementById('statistic-word');
    var postEl = document.getElementById('statistic-post');
    if (wordEl) wordEl.innerHTML = SITE_STATS.words;
    if (postEl) postEl.innerHTML = SITE_STATS.posts;
  }
});