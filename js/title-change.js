// 标签页标题切换效果
var OriginTitle = document.title;
var titleTime;

document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        // 页面被隐藏时
        document.title = '你去哪啦 (@* ○ *@)';
        clearTimeout(titleTime);
    } else {
        // 页面被激活时
        document.title = '你回来啦 (^▽^*)';
        titleTime = setTimeout(function () {
            document.title = OriginTitle;
        }, 2000); // 2秒后恢复原标题
    }
});