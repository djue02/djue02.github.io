<script>
var OriginTitle = document.title;
var titleTime;

document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        document.title = '你去哪啦 (✿◡‿◡)';
        clearTimeout(titleTime);
    } else {
        document.title = '你回来啦 (￣▽￣)～■干杯□～(￣▽￣)';
        titleTime = setTimeout(function () {
            document.title = OriginTitle;
        }, 2000);
    }
});
</script>