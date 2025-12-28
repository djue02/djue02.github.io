(function() {
    // 检测深色模式的辅助函数 - 直接检查data-user-color-scheme属性
    function isDarkMode() {
        const htmlElement = document.documentElement;
        const userScheme = htmlElement.getAttribute('data-user-color-scheme');
        const defaultScheme = htmlElement.getAttribute('data-default-color-scheme');
        // 如果用户手动设置了主题，优先使用用户设置
        if (userScheme) {
            return userScheme === 'dark';
        }
        // 否则使用默认主题设置
        if (defaultScheme) {
            return defaultScheme === 'dark';
        }
        // 如果都没有设置，检查系统偏好
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // 获取元素属性的辅助函数
    function getAttr(el, attr, defaultValue) {
        return el.getAttribute(attr) || defaultValue;
    }

    // 获取标签元素的辅助函数
    function getTags(tag) {
        return document.getElementsByTagName(tag);
    }

    // 获取配置信息，根据深色模式设置不同的线条颜色
    function getConfig() {
        var scripts = getTags("script");
        var lastScript = scripts[scripts.length - 1];

        // 根据深色模式状态设置线条颜色
        const lineColor = isDarkMode() ? "255,255,255" : "0,0,0";

        return {
            l: scripts.length,
            z: getAttr(lastScript, "zIndex", -1),
            o: getAttr(lastScript, "opacity", 0.5),
            c: getAttr(lastScript, "color", lineColor),
            n: getAttr(lastScript, "count", 99)
        };
    }

    // 设置Canvas尺寸
    function setCanvasSize() {
        width = canvas.width = window.innerWidth ||
            document.documentElement.clientWidth ||
            document.body.clientWidth;
        height = canvas.height = window.innerHeight ||
            document.documentElement.clientHeight ||
            document.body.clientHeight;
    }

    // 绘制函数
    function draw() {
        ctx.clearRect(0, 0, width, height);
        var allPoints = [mouse].concat(points);

        points.forEach(function(p) {
            p.x += p.xa;
            p.y += p.ya;
            p.xa *= (p.x > width || p.x < 0) ? -1 : 1;
            p.ya *= (p.y > height || p.y < 0) ? -1 : 1;
            ctx.fillRect(p.x - 0.5, p.y - 0.5, 1, 1);

            for (var v = 0; v < allPoints.length; v++) {
                var q = allPoints[v];
                if (p !== q && q.x !== null && q.y !== null) {
                    var dx = p.x - q.x;
                    var dy = p.y - q.y;
                    var dist = dx * dx + dy * dy;
                    if (dist < q.max) {
                        if (q === mouse && dist >= q.max / 2) {
                            p.x -= 0.03 * dx;
                            p.y -= 0.03 * dy;
                        }
                        var ratio = (q.max - dist) / q.max;
                        ctx.beginPath();
                        ctx.lineWidth = ratio / 2;
                        ctx.strokeStyle = "rgba(" + config.c + "," + (ratio + 0.2) + ")";
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.stroke();
                    }
                }
            }
            allPoints.splice(allPoints.indexOf(p), 1);
        });

        animation(draw);
    }

    // 主题变化时更新Canvas配置
    function updateCanvasTheme() {
        const newColor = isDarkMode() ? "255,255,255" : "0,0,0";
        if (config.c !== newColor) {
            config.c = newColor;
            console.log("主题已切换，线条颜色更新为:", newColor === "255,255,255" ? "白色" : "黑色");
        }
    }

    var canvas = document.createElement("canvas"),
        config = getConfig(),
        canvasId = "c_n" + config.l,
        ctx = canvas.getContext("2d"),
        width, height,
        animation = window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(fn) { window.setTimeout(fn, 1000 / 45); },
        random = Math.random,
        mouse = { x: null, y: null, max: 20000 };

    canvas.id = canvasId;
    canvas.style.cssText =
        "position:fixed;top:0;left:0;display:none;z-index:" + config.z + ";opacity:" + config.o;
    getTags("body")[0].appendChild(canvas);

    setCanvasSize();
    window.onresize = setCanvasSize;

    window.onmousemove = function(e) {
        e = e || window.event;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    };
    window.onmouseout = function() {
        mouse.x = null;
        mouse.y = null;
    };

    var points = [];
    for (var i = 0; i < config.n; i++) {
        var x = random() * width,
            y = random() * height,
            xa = 2 * random() - 1,
            ya = 2 * random() - 1;
        points.push({ x: x, y: y, xa: xa, ya: ya, max: 6000 });
    }

    // 初始设置线条颜色
    updateCanvasTheme();

    // 监听data-user-color-scheme和data-default-color-scheme属性变化
    if (window.MutationObserver) {
        new MutationObserver(updateCanvasTheme).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-user-color-scheme', 'data-default-color-scheme']
        });
    }

    // 监听系统主题变化
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateCanvasTheme);
    }

    setTimeout(function() {
        draw();
    }, 100);
})();