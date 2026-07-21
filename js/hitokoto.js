(function () {
  function fill(retries) {
    retries = retries || 0;
    var el = document.getElementById('hitokoto-text');
    var from = document.getElementById('hitokoto-from');
    // 一言容器由侧边栏 JS 注入，可能晚于本脚本：轮询等它出现
    if (!el) {
      if (retries < 20) setTimeout(function () { fill(retries + 1); }, 200);
      return;
    }
    fetch('https://v1.hitokoto.cn/?c=a&c=b&c=c&c=d&c=e&c=h&c=i&c=j')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        el.textContent = data.hitokoto || '';
        if (from) {
          var who = (data.from_who || '').trim();
          var src = (data.from || '').trim();
          var s = '';
          if (who && src)      s = '\u2014\u2014 ' + who + '\u300a' + src + '\u300b';
          else if (src)        s = '\u2014\u2014\u300a' + src + '\u300b';
          else if (who)        s = '\u2014\u2014 ' + who;
          from.textContent = s;
        }
      })
      .catch(function () { /* 静默失败 */ });
  }
  document.addEventListener('DOMContentLoaded', function () { fill(); });
  document.addEventListener('pjax:complete', function () { fill(); });
})();
