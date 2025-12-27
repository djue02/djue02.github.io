(function() {
  const apiServer = 'https://umami.icome.world';
  const websiteId = '951264e5-5220-41c5-af4e-b2a69964c9e4';
  const token = 'ATym05TfsjHB66WOj8h1y75ssc8xt1Sc8t7cmr4XxniK0A20rfsjFEoaR7OV9OfgsEI9kh+PwCBhnM38aVcy0vXVWI1G5Hizbx+R7acLyhuOwK4J3oLuD1sM7KJRXrs61hTB8oFzb5B2XaE7jCrJ9oMGqSTH7Y74IzKOljCxVuwG6+4M7nSFausCrWFmNPhDZniunq0sJ8z7D080+RG+peqSUrD4gZXwlVcM09YXpCOkvCYwaaTRFO05v/RQqWWfAbvBnjy0VR7ahg1HXN+xoHcEMQ+u/7cjjZB1+toNah+YwdfIlEk5r1ydqHPKvaxFDvE6U1K4Mnep5DomDj2iZPEhUaUz592Jxdzeme+uGxki3RHbnngHQ4q407RjSBvxZcpb';
  const startTime = new Date('2025-12-17').getTime();
  
  async function getStats() {
    const endTime = Date.now();
    const url = `${apiServer}/api/websites/${websiteId}/stats?startAt=${startTime}&endAt=${endTime}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
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