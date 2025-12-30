// 侧边栏
document.addEventListener('DOMContentLoaded', function() {
    const sidebarHTML = `
        <div class="sidebar-overlay"></div>
        <div id="sidebar" class="sidebar-hidden">
            <div class="sidebar-content">
                <p class="sidebar-text">空白侧边栏</p>
                <p class="sidebar-text">功能正在睡觉</p>
            </div>
        </div>
        <button id="sidebar-toggle" class="sidebar-toggle" aria-label="切换侧边栏">
            <i class="fas fa-arrow-right"></i>
        </button>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    const overlay = document.querySelector('.sidebar-overlay');
    
    let isOpen = false;
    
    toggle.addEventListener('click', function() {
        isOpen = !isOpen;
        if (isOpen) {
            sidebar.classList.remove('sidebar-hidden');
            toggle.classList.add('sidebar-toggle-active');
            overlay.classList.add('active');
        } else {
            sidebar.classList.add('sidebar-hidden');
            toggle.classList.remove('sidebar-toggle-active');
            overlay.classList.remove('active');
        }
    });
    
    overlay.addEventListener('click', function() {
        isOpen = false;
        sidebar.classList.add('sidebar-hidden');
        toggle.classList.remove('sidebar-toggle-active');
        overlay.classList.remove('active');
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isOpen) {
            isOpen = false;
            sidebar.classList.add('sidebar-hidden');
            toggle.classList.remove('sidebar-toggle-active');
            overlay.classList.remove('active');
        }
    });
});