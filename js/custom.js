jQuery(document).ready(function($) {
    // 1. 移除分类列表链接的 title 属性 (之前的代码)
    $(".list-group-item").removeAttr("title");

    // 2. 关闭搜索框的浏览器自动填充/历史记录 (新增的代码)
    $("#local-search-input").attr("autocomplete", "off");
});