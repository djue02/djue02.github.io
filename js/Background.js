document.querySelector('#web_bg').style.backgroundImage = `${document.querySelector('.banner').style.background.split(' ')[0]}`;
document.querySelector("#banner").style.background = 'url()'
document.querySelector("#banner .mask").style.backgroundColor = 'rgba(0,0,0,0)'
document.getElementById('toggle-background-mode-icon').className = "fa-solid fa-toggle-on";
['#toc', '.category-list'].forEach(selector => {
    if (document.querySelector(selector)) {
        document.querySelector(selector).style.backgroundColor = "var(--board-bg-color)";
    }
});

if (localStorage.getItem('BackgroundMode') === 'false' || !localStorage.getItem('BackgroundMode') || window.innerWidth < window.innerHeight) {
    document.querySelector("#banner").style.background = document.querySelector('#web_bg').style.backgroundImage + " center center / cover no-repeat";
    document.querySelector('#web_bg').style.backgroundImage = 'url()';
    document.querySelector("#banner .mask").style.backgroundColor = 'rgba(0,0,0,0.3)';
    document.getElementById('toggle-background-mode-icon').className = "fa-solid fa-toggle-off";
    ['#toc', '.category-list'].forEach(selector => {
        if (document.querySelector(selector)) {
            document.querySelector(selector).style.removeProperty('background-color');
        }
    });
    localStorage.setItem('BackgroundMode', 'false');
}