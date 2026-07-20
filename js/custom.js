jQuery(document).ready(function($) {
    // 1. 移除分类列表链接的 title 属性
    $(".list-group-item").removeAttr("title");

    // 2. 关闭搜索框的自动填充
    $("#local-search-input").attr("autocomplete", "off");

