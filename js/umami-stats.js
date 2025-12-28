document.addEventListener('DOMContentLoaded', () => {
  umiTongji();
});

function umiTongji() {
  var umiToken = "ATym05TfsjHB66WOj8h1y75ssc8xt1Sc8t7cmr4XxniK0A20rfsjFEoaR7OV9OfgsEI9kh+PwCBhnM38aVcy0vXVWI1G5Hizbx+R7acLyhuOwK4J3oLuD1sM7KJRXrs61hTB8oFzb5B2XaE7jCrJ9oMGqSTH7Y74IzKOljCxVuwG6+4M7nSFausCrWFmNPhDZniunq0sJ8z7D080+RG+peqSUrD4gZXwlVcM09YXpCOkvCYwaaTRFO05v/RQqWWfAbvBnjy0VR7ahg1HXN+xoHcEMQ+u/7cjjZB1+toNah+YwdfIlEk5r1ydqHPKvaxFDvE6U1K4Mnep5DomDj2iZPEhUaUz592Jxdzeme+uGxki3RHbnngHQ4q407RjSBvxZcpb";
  var umiId = "c48f9a0c-b3f7-450d-a9ff-52252405c8cc";
  var umiTime = Date.now();
  var startTime = new Date('2025-12-17').getTime();
  var umiUrl = "https://umami.icome.world/api/websites/" + umiId + "/stats?startAt=" + startTime + "&endAt=" + umiTime;
  
  fetch(umiUrl, {
    method: 'GET',
    mode: 'cors',
    cache: 'default',
    headers: {
      'Authorization': 'Bearer ' + umiToken,
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(resdata => {
    document.querySelector('#umami-pv').innerHTML = resdata.pageviews.value;
    document.querySelector('#umami-uv').innerHTML = resdata.visitors.value;
  })
  .catch(err => {
    console.log('Umami error:', err);
  });
}