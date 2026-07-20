jQuery(document).ready(function($) {
    // 1. 移除分类列表链接的 title 属性
    $(".list-group-item").removeAttr("title");

    // 2. 关闭搜索框的自动填充
    $("#local-search-input").attr("autocomplete", "off");


/* SubtitleSeal.js —— 放 source/js/,custom_js 引入 */
(function(){
  var TARGET='面';                      // 想改染哪个字,改这里
  function mark(){
    var el=document.getElementById('subtitle');
    if(!el||el.dataset.seal)return;
    el.dataset.seal='1';
    el.innerHTML=el.innerHTML.replace(TARGET,'<span class="accent-char">'+TARGET+'</span>');
  }
  document.readyState!=='loading'?mark():document.addEventListener('DOMContentLoaded',mark);
  document.addEventListener('pjax:complete',mark);
})();