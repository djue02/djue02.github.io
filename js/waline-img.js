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

  var dustPool = [], dustIdx = 0;
  for (var i = 0; i < 4; i++) {
    var d = el('mario-dust');
    runner.appendChild(d);
    dustPool.push(d);
  }

  track.appendChild(bar);
  track.appendChild(runner);
  document.body.appendChild(track);

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
  var y = 0, vy = 0, airborne = false, jumpT = 0;
  var facing = 1, shownFacing = 1, lean = 0;
  var runToggle = false, runTimer = 0;
  var landUntil = 0, runDustAt = 0, jumpCdAt = 0;
  var cheering = false, cheerHops = 0, cheerHopAt = 0, cheerFlipAt = 0, cheerOn = true;
  var lastInput = 0, lastFrame = -1;
  var trackW = 0, marioW = 0;
  var rafId = 0, lastT = 0;
  /* restored：浏览器 scroll restoration 完成前，屏蔽跳跃触发，防止首次 scroll 事件被误当追赶跳 */
  var restored = (document.readyState === 'complete');
  /* shown：runner 是否已解除隐藏。所有 writeX 和主循环启动都推迟到 shown 变 true 后，
     确保用户能看到的第一帧就是正确位置，不存在"先出现在 0% 再瞬移"的中间态 */
  var shown = false;
  /* revealRaf：restore 可能分多阶段触发多次 scroll 事件。每次 scroll 都重置一个
     2 帧 rAF 链，链完成才 reveal——rAF 只会在所有排队的 scroll task 处理完后触发，
     所以 rAF 到达 = restore 一定稳定了 */
  var revealRaf = 0;

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
    void p.offsetWidth;
    if (big) p.classList.add('big');
    p.classList.add('play');
  }

  function launch(v) { airborne = true; vy = v; jumpT = 0; }

  function writeX() {
    var half = marioW / 2;
    var cx = (disp / 100) * trackW;
    if (cx < half) cx = half;
    if (cx > trackW - half) cx = trackW - half;
    runner.style.transform = 'translate3d(' + (cx - half).toFixed(1) + 'px,0,0)';
    bar.style.transform = 'scaleX(' + (disp / 100).toFixed(4) + ')';
  }

  /* 首次显示：hidden 期间从不 writeX，只有到 reveal 才把最新 progress() snap 进去
     并解除隐藏。writeX 先跑 + void offsetWidth 强制 flush 到合成层，然后再改
     visibility/opacity，确保 reveal 帧看到的一定是当前位置的 transform */
  function reveal() {
    if (shown) return;
    if (revealRaf) { cancelAnimationFrame(revealRaf); revealRaf = 0; }
    shown = true;
    restored = true;
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
    var dt = lastT ? Math.min(t - lastT, 64) / 1000 : 1 / 60;
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
      cheering = true; cheerHops = 3; cheerHopAt = t; cheerFlipAt = t; cheerOn = true;
    } else if (cheering && target < CHEER_OUT) {
      cheering = false;
    }

    if (airborne) {
      /* 顶点悬停：接近顶点时（|vy|<80）重力打 0.65 折，制造马里奥式的漂浮手感。
         峰值高度基本不变，但顶点附近多停 ~90ms，跳跃全程更有"呼吸"感 */
      var g = (Math.abs(vy) < 80) ? GRAV * 0.65 : GRAV;
      vy -= g * dt;
      y += vy * dt;
      jumpT += dt;
      if (y <= 0) {
        y = 0; airborne = false;
        var impact = -vy; vy = 0;
        if (impact > 420 && !reduced) {
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
    /* hidden 期间彻底不启动主循环。onResize/ResizeObserver 在页面加载中会被 body 高度变化
       反复触发，这道防护确保它们不会在 reveal 之前偷偷跑一遍 writeX/airbox transform */
    if (!shown) return;
    if (!rafId) { lastT = 0; rafId = requestAnimationFrame(loop); }
  }

  /* ---------- 事件 ---------- */
  var prevTarget = 0;

  window.addEventListener('scroll', function () {
    var p = progress();
    var evDelta = p - prevTarget;
    prevTarget = p;
    target = p;
    lastInput = performance.now();

    if (reduced) { renderStatic(); return; }

    /* 恢复期：浏览器可能分多阶段触发 scroll 事件（Chrome 一次，Firefox/Safari 可能两三次）。
       只更新状态、不 reveal 也不 writeX；每次 scroll 都重置 rAF 链，链走完（2 帧 rAF，
       约 32ms）才 reveal——rAF 只在所有排队的 scroll task 处理完后触发，链走完就说明
       restore 一定稳定 */
    if (!restored) {
      disp = target; vel = 0;
      if (!shown) {
        if (revealRaf) cancelAnimationFrame(revealRaf);
        revealRaf = requestAnimationFrame(function () {
          revealRaf = requestAnimationFrame(function () {
            revealRaf = 0;
            reveal();
          });
        });
      }
      return;
    }

    if (!airborne && !cheering) {
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

  function onResize() {
    measure();
    visibility();
    prevTarget = target = progress();
    disp = target; vel = 0;   /* 尺寸变化时也就地 snap，避免 body 高度变了触发追赶跳 */
    if (reduced) renderStatic(); else wake();
  }
  window.addEventListener('resize', onResize);
  if (window.ResizeObserver) {
    new ResizeObserver(onResize).observe(document.body);
  }

  /* ---------- 初始化 ---------- */
  measure();
  visibility();
  /* 无条件先隐藏，且此时不写 transform、不启动主循环。
     所有位置/主循环启动都由 reveal 统一处理，保证第一帧可见时就是正确位置 */
  runner.style.visibility = 'hidden';
  runner.style.opacity = '0';
  setFrame(F_IDLE);
  /* 图片延迟加载时如果 measure 太早，宽度可能为 0；等图片就绪后再校一次 */
  var probe = new Image();
  probe.onload = function () { measure(); if (shown) writeX(); };
  probe.src = '/img/mario-runner.png';

  /* reveal 触发时机：
       1. 脚本运行时 readyState 已 complete → load 已完成，restore 一定完成，立即 reveal
       2. 否则：scroll 事件 120ms 去抖（restore 引起的 scroll 稳定后触发）
       3. load 事件兜底
       4. 800ms 兜底
     注意：不能用 `progress() > 0.5` 之类的启发式来提前 reveal——浏览器 restore 有时是
     渐进的（scrollY 会分几步涨到最终值），启发式检查那一刻的 progress() 可能只是中间值，
     会导致马里奥锁死在错误位置 */
  if (restored) {
    reveal();
  } else {
    var settle = function () {
      if (shown) return;
      reveal();
    };
    window.addEventListener('load', settle);
    setTimeout(settle, 800);
  }
});
