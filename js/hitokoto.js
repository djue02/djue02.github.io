(function () {
  function loadHitokoto() {
    var el = document.getElementById('hitokoto-text');
    if (!el) return;
    fetch('https://v1.hitokoto.cn/?c=b')
      .then(function (res) { return res.json(); })
      .then(function (data) { el.textContent = data.hitokoto; });
  }
  document.addEventListener('DOMContentLoaded', loadHitokoto);
  document.addEventListener('pjax:complete', loadHitokoto);
})();
