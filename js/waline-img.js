// Waline 自定义图片上传 - 使用 imgbb 图床
// 请将 YOUR_API_KEY 替换为你在 https://api.imgbb.com 获取的 API Key

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

// 隐藏 about 页面的向下箭头
if (window.location.pathname.includes('/about')) {
  document.addEventListener('DOMContentLoaded', function() {
    var arrow = document.querySelector('.scroll-down-bar');
    if (arrow) {
      arrow.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  if (!document.querySelector('.post-content')) {
    return;
  }

  const track = document.createElement('div');
  track.id = 'reading-track';
  
  const bar = document.createElement('div');
  bar.id = 'reading-bar';
  
  const runner = document.createElement('div');
  runner.id = 'pixel-runner';
  
  track.appendChild(bar);
  track.appendChild(runner);
  document.body.appendChild(track);

  runner.classList.add('ready');
  setTimeout(() => {
    runner.classList.remove('ready');
    runner.classList.add('idle');
  }, 600);

  let lastScroll = 0;
  let lastProgress = 0;
  let lastTime = Date.now();
  let isJumping = false;
  let scrollTimeout;
  
  window.addEventListener('scroll', function() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    
    const now = Date.now();
    const timeDelta = now - lastTime;
    const scrollDelta = Math.abs(progress - lastProgress);
    const speed = timeDelta > 0 ? scrollDelta / timeDelta * 100 : 0;
    
    bar.style.width = progress + '%';
    runner.style.left = `calc(${progress}% - 8px)`;
    
    if (scrollTop > lastScroll) {
      runner.style.transform = 'scaleX(1)';
    } else if (scrollTop < lastScroll) {
      runner.style.transform = 'scaleX(-1)';
    }
    
    if (progress >= 98) {
      runner.classList.remove('running', 'idle', 'jumping', 'fast', 'superfast', 'low-jump', 'high-jump');
      runner.classList.add('celebrate');
    } else {
      runner.classList.remove('celebrate');
      
      if (!isJumping) {
        runner.classList.remove('idle', 'fast', 'superfast');
        runner.classList.add('running');
        
        if (speed > 6) {
          runner.classList.add('superfast');
        } else if (speed > 2.5) {
          runner.classList.add('fast');
        }
      }
    }
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (!isJumping && progress < 98) {
        runner.classList.remove('running', 'fast', 'superfast');
        runner.classList.add('idle');
      }
    }, 120);
    
    if (scrollDelta > 1.5 && !isJumping && progress < 98 && Math.random() < 0.3) {
      isJumping = true;
      runner.classList.remove('running', 'idle', 'fast', 'superfast', 'low-jump', 'high-jump');
      runner.classList.add('jumping');
      
      let jumpDuration;
      if (speed > 5) {
        runner.classList.add('high-jump');
        jumpDuration = 520;
      } else if (speed < 2) {
        runner.classList.add('low-jump');
        jumpDuration = 320;
      } else {
        jumpDuration = 420;
      }
      
      setTimeout(() => {
        runner.classList.remove('jumping', 'low-jump', 'high-jump');
        if (progress < 98) {
          runner.classList.add('idle');
        }
        isJumping = false;
      }, jumpDuration);
    }
    
    lastScroll = scrollTop;
    lastProgress = progress;
    lastTime = now;
  });
});