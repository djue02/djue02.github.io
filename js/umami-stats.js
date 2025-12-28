(function() {
  const shareId = 'FK6H7l3bfRkbnKUe';
  const apiServer = 'https://umami.icome.world';
  const startTime = new Date('2025-12-17').getTime();
  
  async function getStats() {
    try {
      // 1. 获取 share token
      const shareRes = await fetch(`${apiServer}/api/share/${shareId}`);
      const shareData = await shareRes.json();
      const { websiteId, token } = shareData;
      
      // 2. 用 token 获取统计
      const endTime = Date.now();
      const statsRes = await fetch(
        `${apiServer}/api/websites/${websiteId}/stats?startAt=${startTime}&endAt=${endTime}`,
        {
          headers: {
            'x-umami-share-token': token
          }
        }
      );
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        const pvEl = document.getElementById('umami-pv');
        const uvEl = document.getElementById('umami-uv');
        if (pvEl) pvEl.innerText = data.pageviews?.value || 0;
        if (uvEl) uvEl.innerText = data.visitors?.value || 0;
      }
    } catch (e) {
      console.log('Umami stats error:', e);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', getStats);
  } else {
    getStats();
  }
})();