/* ============================================================
 * ① Waline 自定义图片上传 - 使用 imgbb 图床（原逻辑，未改动）
 * ============================================================ */
window.walineOptions = window.walineOptions || {};
window.walineOptions.imageUploader = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch('https://api.imgbb.com/1/upload?key=71de7a48dbd352fc1427d32157dd302f', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      return data.data.url;
    } else {
      throw new Error('上传失败');
    }
  } catch (err) {
    console.error('图片上传错误:', err);
    throw err;
  }
};

/* 小工具：无论脚本在 DOMContentLoaded 前后加载都能正确执行 */
function __whenReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

/* ============================================================
 * ② 隐藏 about 页面的向下箭头（原逻辑）
 * ============================================================ */
if (window.location.pathname.includes('/about')) {
  __whenReady(function () {
    var arrow = document.querySelector('.scroll-down-bar');
    if (arrow) {
      arrow.style.display = 'none';
    }
  });
}

/* ============================================================
 * ③ 马里奥阅读进度条 v2.1
 * ------------------------------------------------------------
 * · 位置：rAF 循环 + 阻尼插值 + transform（帧率无关，合成器直出）
 * · 跳跃：真实物理（起跳速度 + 重力），高度随滚动幅度连续变化
 * · 步频：随速度连续变化（不再有 slow/fast/superfast 边界抖动）
 * · 细节：反向转身、高速前倾、落地扬尘、疾跑拖尘、页尾三连跳庆祝
 * · 空闲：所有运动收敛后挂起 rAF 省电
 * · 彩蛋：点马里奥本体会跳一下
 * · a11y：prefers-reduced-motion 下降级为静态定位
 * ============================================================ */
__whenReady(function () {
  'use strict';

  if (!document.querySelector('.post-content')) return;
  if (document.getElementById('reading-track')) return;

  /* ---------- DOM ---------- */
  function el(cls) { var d = document.createElement('div'); d.className = cls; return d; }

  var track  = document.createElement('div'); track.id = 'reading-track';
  track.setAttribute('aria-hidden', 'true');
  var bar    = document.createElement('div'); bar.id = 'reading-bar';
  var runner = document.createElement('div'); runner.id = 'pixel-runner';

  var flip   = el('mario-flip');
  var airbox = el('mario-air');
  var sprite = el('mario-sprite');

  airbox.appendChild(sprite);
  flip.appendChild(airbox);
  runner.appendChild(flip);

  /* 尘土挂在 track 上（世界坐标），不再是 runner 的子元素——
     否则尘土会跟着马里奥一起平移，"拖尾"变成"黏在脚上" */
  var dustPool = [], dustIdx = 0;

  track.appendChild(bar);
  for (var i = 0; i < 4; i++) {
    var d = el('mario-dust');
    track.appendChild(d);          /* 在 runner 之前插入 → 绘制在马里奥身后 */
    dustPool.push(d);
  }
  track.appendChild(runner);
  /* body 挂载在初始化末尾、与测量/定位同一同步任务内完成——浏览器不会在任务
     中间绘制，首帧即正确，无需任何隐藏机制 */

  /* ---------- 常量 ---------- */
  var F_IDLE = 0, F_RUN1 = 1, F_RUN2 = 2, F_RISE = 3, F_AIR = 4, F_LAND = 5, F_CHEER = 6;
  var TAU  = 90;     // ms，位置阻尼时间常数（越小追得越紧）
  var VTAU = 110;    // ms，速度/前倾平滑
  var GRAV = 2600;   // px/s²，跳跃重力
  var CHEER_IN = 98.4, CHEER_OUT = 96.5;   // 庆祝进入/退出阈值（迟滞防抖）

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 状态 ---------- */
  var target = 0, disp = 0, vel = 0;
  var y = 0, vy = 0, airborne = false;
  var facing = 1, shownFacing = 1, lean = 0;
  var runToggle = false, runTimer = 0;
  var landUntil = 0, runDustAt = 0, jumpCdAt = 0;
  var cheering = false, cheerHops = 0, cheerHopAt = 0, cheerFlipAt = 0, cheerOn = true;
  var lastInput = 0, lastFrame = -1;
  var trackW = 0, marioW = 0, lastCx = 0;
  var rafId = 0, lastT = 0;
  /* ---- 刷新方案：旧方案骨架（隐藏启动 + 四路 reveal）+ 一条守则 ----
     restored / shown / revealTimer：excerpt 版原样——readyState 已 complete 立即现身；
       否则 restore scroll 120ms 去抖后现身；load / 800ms 兜底。
     lastY：守则基线。scrollY 没动的 scroll 事件一律无视——它们只来自文档高度
       变化（图片/评论/字体加载），百分比被稀释但页面没动；站着不动是唯一
       不可见的处理。这正是旧方案时代"现身后向左漂移"的根治，仅 3 行。
     bootQuietUntil：现身后 600ms 内不触发跳跃（由 reveal 设置） */
  var restored = (document.readyState === 'complete');
  var shown = false;
  var revealTimer = 0;
  var lastY = 0;
  var bootQuietUntil = 0;

  /* ---------- 工具 ---------- */
  function progress() {
    var de = document.documentElement;
    var max = de.scrollHeight - de.clientHeight;
    if (max <= 0) return 0;
    var p = (window.scrollY || de.scrollTop || 0) / max * 100;
    return p < 0 ? 0 : p > 100 ? 100 : p;
  }

  function measure() {
    trackW = track.clientWidth;
    marioW = runner.offsetWidth || parseFloat(getComputedStyle(runner).width) || 31;
  }

  function visibility() {
    var de = document.documentElement;
    track.style.display = (de.scrollHeight - de.clientHeight > 4) ? '' : 'none';
  }

  function setFrame(i) {
    if (i === lastFrame) return;
    lastFrame = i;
    /* 7 帧 = 6 步；background-size 700%；每帧向左 100%/6 */
    sprite.style.backgroundPositionX = (i * 100 / 6) + '%';
  }

  function puff(big) {
    var p = dustPool[dustIdx++ % dustPool.length];
    p.classList.remove('play', 'big');
    p.style.left = lastCx.toFixed(1) + 'px';   /* 固定在落点，不随马里奥平移 */
    void p.offsetWidth;
    if (big) p.classList.add('big');
    p.classList.add('play');
  }

  function launch(v) { airborne = true; vy = v; }

  function writeX() {
    var half = marioW / 2;
    var cx = (disp / 100) * trackW;
    if (cx < half) cx = half;
    if (cx > trackW - half) cx = trackW - half;
    lastCx = cx;
    runner.style.transform = 'translate3d(' + (cx - half).toFixed(1) + 'px,0,0)';
    bar.style.transform = 'scaleX(' + (disp / 100).toFixed(4) + ')';
  }

  /* 首次显示（旧方案）：hidden 期间从不写 transform；reveal 读取此刻最新 progress()、
     写入位置、void offsetWidth 强制 flush 到合成层，然后才解除隐藏——
     可见的第一帧必然在正确位置 */
  function reveal() {
    if (shown) return;
    if (revealTimer) { clearTimeout(revealTimer); revealTimer = 0; }
    shown = true;
    restored = true;
    bootQuietUntil = performance.now() + 600;
    lastY = window.scrollY || document.documentElement.scrollTop || 0;
    prevTarget = target = disp = progress();
    vel = 0;
    writeX();
    void runner.offsetWidth;
    runner.style.visibility = '';
    runner.style.opacity = '';
    if (!reduced) wake();
  }

  /* ---------- 降级模式：直接定位，无动画 ---------- */
  function renderStatic() {
    disp = target;
    writeX();
    setFrame(F_IDLE);
  }

  /* ---------- 主循环 ---------- */
  function loop(t) {
    rafId = 0;
    var dt = lastT ? Math.min(Math.max(t - lastT, 0.5), 64) / 1000 : 1 / 60;  /* 下限 0.5ms：个别浏览器会给重复 rAF 时间戳，dt=0 会让 vel 算出 NaN */
    lastT = t;

    var k  = 1 - Math.exp(-dt * 1000 / TAU);
    var kv = 1 - Math.exp(-dt * 1000 / VTAU);
    var prev = disp;
    disp += (target - disp) * k;
    if (Math.abs(target - disp) < 0.004) disp = target;
    vel += ((disp - prev) / dt - vel) * kv;

    if (cheering) facing = 1;
    else if (vel > 1.2) facing = 1;
    else if (vel < -1.2) facing = -1;

    if (!cheering && target >= CHEER_IN && disp >= 98) {
      cheering = true; cheerHops = 3; cheerHopAt = t;
      cheerOn = true; cheerFlipAt = t + 300;   /* 首次翻转推后 300ms，开场即举手帧 */
    } else if (cheering && target < CHEER_OUT) {
      cheering = false;
    }

    if (airborne) {
      /* 顶点悬停：接近顶点时（|vy|<80）重力打 0.65 折，制造马里奥式的漂浮手感。
         峰值高度基本不变，但顶点附近多停 ~90ms，跳跃全程更有"呼吸"感 */
      var g = (Math.abs(vy) < 80) ? GRAV * 0.65 : GRAV;
      vy -= g * dt;
      y += vy * dt;
      if (y <= 0) {
        y = 0; airborne = false;
        var impact = -vy; vy = 0;
        if (impact > 390 && !reduced) {          /* 390：让点击彩蛋（起跳 400）也有落地反馈 */
          puff(impact > 760);
          landUntil = t + 95;
        }
        if (cheering) cheerHopAt = t + 130;
      }
    } else if (cheering && cheerHops > 0 && t >= cheerHopAt) {
      launch(280);
      cheerHops--;
    }

    var leanT = vel * 0.085;
    if (leanT > 9) leanT = 9; else if (leanT < -9) leanT = -9;
    lean += (leanT - lean) * kv;
    if (Math.abs(lean) < 0.05 && Math.abs(leanT) < 0.05) lean = 0;

    var frame;
    var active = Math.abs(target - disp) > 0.06 || Math.abs(vel) > 1.0 || (t - lastInput) < 140;
    if (cheering) {
      if (cheerHops > 0 || airborne) {
        if (t >= cheerFlipAt) { cheerOn = !cheerOn; cheerFlipAt = t + 300; }
        frame = cheerOn ? F_CHEER : F_IDLE;
      } else {
        frame = F_CHEER;
      }
    } else if (airborne) {
      /* 帧由垂直速度驱动：上升有力时（vy>50）举手 F_RISE，接近顶点及下落切换到滞空姿 F_AIR。
         视觉与物理严格贴合——跳得多高，举手多久 */
      frame = (vy > 50) ? F_RISE : F_AIR;
    } else if (t < landUntil) {
      frame = F_LAND;
    } else if (active) {
      runTimer += dt * 1000;
      var spd = Math.abs(vel);
      var interval = 2400 / (6 + spd);
      if (interval < 75) interval = 75; else if (interval > 260) interval = 260;
      if (runTimer >= interval) { runToggle = !runToggle; runTimer = 0; }
      frame = runToggle ? F_RUN2 : F_RUN1;
      if (spd > 55 && t > runDustAt) {
        puff(false);
        runDustAt = t + 170;
      }
    } else {
      frame = F_IDLE;
      runToggle = false; runTimer = 0;
    }

    writeX();
    if (facing !== shownFacing) {
      shownFacing = facing;
      flip.style.transform = 'scaleX(' + facing + ')';
    }
    airbox.style.transform =
      'translate3d(0,' + (-y).toFixed(1) + 'px,0) rotate(' + lean.toFixed(2) + 'deg)';
    setFrame(frame);

    var busy = airborne || t < landUntil ||
               (cheering && cheerHops > 0) ||
               Math.abs(target - disp) > 0.02 || Math.abs(vel) > 0.4 ||
               Math.abs(lean) > 0.2 || (t - lastInput) < 420;
    if (busy) rafId = requestAnimationFrame(loop);
    else lastT = 0;
  }

  function wake() {
    if (!shown) return;   /* 隐藏期不启动主循环 */
    if (!rafId) { lastT = 0; rafId = requestAnimationFrame(loop); }
  }

  /* ---------- 事件 ---------- */
  var prevTarget = 0;

  window.addEventListener('scroll', function () {
    /* 唯一守则：scrollY 没有真实位移的 scroll 事件一律无视。
       这类事件只来自文档高度变化（图片/评论/字体加载）——百分比被稀释但页面
       没动，站着不动是唯一不可见的处理；数值的"过时"会在下一次真实滚动时
       随运动无感刷新。真实位移（用户滚动/restore/锚定）则正常映射：
       页面动他才动、同向同帧，永远协调 */
    var de = document.documentElement;
    var y = window.scrollY || de.scrollTop || 0;
    if (y === lastY) return;
    lastY = y;

    var p = progress();
    var evDelta = p - prevTarget;
    prevTarget = p;
    target = p;
    lastInput = performance.now();

    /* 恢复期（旧方案）：只记账、不显示；每个"有真实位移"的 scroll 都重置
       120ms 计时器，稳定后 reveal。高度稀释事件已被上面的守则挡掉，
       不会虚假地推迟现身 */
    if (!restored) {
      disp = target; vel = 0;
      if (!shown) {
        if (revealTimer) clearTimeout(revealTimer);
        revealTimer = setTimeout(reveal, 120);
      }
      return;
    }

    if (reduced) { renderStatic(); return; }

    /* 现身后 600ms 内不触发跳跃：迟到的小校正平滑跑过去 */
    if (!airborne && !cheering && lastInput > bootQuietUntil) {
      var gap = Math.abs(target - disp);
      var now = lastInput;
      if (gap > 7 && now > jumpCdAt) {
        launch(Math.min(560, 250 + gap * 8));
        jumpCdAt = now + 650;
      } else if (Math.abs(evDelta) > 1.4 && Math.random() < 0.22 && now > jumpCdAt) {
        launch(280 + Math.random() * 80);
        jumpCdAt = now + 520;
      }
    }
    wake();
  }, { passive: true });

  /* 彩蛋：点身体跳一下（.mario-sprite 有 pointer-events:auto） */
  sprite.addEventListener('click', function (ev) {
    ev.stopPropagation();
    if (reduced || airborne) return;
    launch(400);
    wake();
  });

  /* 窗口尺寸变化（拖动窗口/转屏）：用户主动行为，几何和 scrollY 都可能变——
     同步基线并允许平滑校正 */
  function onResize() {
    measure();
    visibility();
    lastY = window.scrollY || document.documentElement.scrollTop || 0;
    prevTarget = target = progress();
    if (!shown) { disp = target; vel = 0; return; }
    if (reduced) renderStatic(); else wake();
  }
  window.addEventListener('resize', onResize);

  /* 文档高度变化（图片/评论加载撑高页面）：只更新几何量与可见性，不驱动马里奥。
     百分比稀释由 scroll handler 的唯一守则处理（scrollY 没动的事件被无视） */
  if (window.ResizeObserver) {
    new ResizeObserver(function () {
      measure();
      visibility();
    }).observe(document.body);
  }

  /* ---------- 初始化（旧方案）：隐藏启动，reveal 统一定位 ---------- */
  document.body.appendChild(track);
  measure();
  visibility();
  lastY = window.scrollY || document.documentElement.scrollTop || 0;
  runner.style.visibility = 'hidden';
  runner.style.opacity = '0';
  setFrame(F_IDLE);

  /* reveal 路径：readyState 已 complete → 立即；restore scroll 120ms 去抖；
     load 兜底（Safari 偶尔不为 restore 发 scroll）；800ms 极端兜底 */
  if (restored) {
    reveal();
  } else {
    var settle = function () { if (!shown) reveal(); };
    window.addEventListener('load', settle);
    setTimeout(settle, 800);
  }
});
