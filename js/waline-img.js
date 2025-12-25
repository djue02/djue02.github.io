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
  // 只在文章页显示（Fluid 文章页有 .post-content）
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

  let lastScroll = 0;
  
  window.addEventListener('scroll', function() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    
    bar.style.width = progress + '%';
    runner.style.left = `calc(${progress}% - 8px)`;
    
    if (scrollTop > lastScroll) {
      runner.style.transform = 'scaleX(1)';
    } else if (scrollTop < lastScroll) {
      runner.style.transform = 'scaleX(-1)';
    }
    lastScroll = scrollTop;
    
    if (progress >= 99) {
      runner.classList.add('celebrate');
    } else {
      runner.classList.remove('celebrate');
    }
  });
});
