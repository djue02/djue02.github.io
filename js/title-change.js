(function() {
  let originalTitle = document.title;
  let isHidden = false;
  let isShowingWelcome = false;
  let welcomeTimer = null;
  
  const titleEl = document.querySelector('title');
  
  const handleMutation = () => {
    if (isHidden && document.title !== '你去哪啦(*´・ｖ・)') {
      document.title = '你去哪啦(*´・ｖ・)';
      return;
    }
    if (isShowingWelcome && document.title !== '你回来啦♪(^∇^*)') {
      document.title = '你回来啦♪(^∇^*)';
      return;
    }
    if (!isHidden && !isShowingWelcome) {
      originalTitle = document.title;
    }
  };
  
  const observer = new MutationObserver(handleMutation);
  const observerConfig = { childList: true, characterData: true, subtree: true };
  
  observer.observe(titleEl, observerConfig);
  
  document.addEventListener('visibilitychange', function() {
    // 清除定时器
    if (welcomeTimer) {
      clearTimeout(welcomeTimer);
      welcomeTimer = null;
    }
    
    // 暂停观察
    observer.disconnect();
    
    if (document.hidden) {
      isHidden = true;
      isShowingWelcome = false;
      document.title = '你去哪啦(*´・ｖ・)';
    } else {
      isHidden = false;
      isShowingWelcome = true;
      document.title = '你回来啦♪(^∇^*)';
      
      welcomeTimer = setTimeout(() => {
        isShowingWelcome = false;
        document.title = originalTitle;
        welcomeTimer = null;
      }, 2000);
    }
    
    // 延迟恢复观察，确保当前 title 已稳定
    setTimeout(() => {
      observer.observe(titleEl, observerConfig);
    }, 50);
  });
})();