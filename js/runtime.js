function showRuntime() {
    var startTime = new Date('2025-12-17 20:08:00');
    var now = new Date();
    var diff = now - startTime;
    
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    var secs = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById("runtime_span").innerHTML = 
        "不谙世事的" + days + " 天 " + hours + " 时 " + mins + " 分 " + secs + " 秒";
}
setInterval(showRuntime, 1000);
showRuntime();