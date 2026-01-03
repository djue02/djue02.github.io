// 侧边栏
document.addEventListener('DOMContentLoaded', function() {
    const sidebarHTML = `
        <div class="sidebar-overlay"></div>
        <div id="sidebar" class="sidebar-hidden">
            <div class="sidebar-content">
                <!-- 头像区域 -->
                <div class="sidebar-avatar-wrapper">
                    <div class="sidebar-avatar-container">
                        <img src="/img/头像.png" alt="Avatar" class="sidebar-avatar-img">
                    </div>
                    <div class="sidebar-social">
                        <a href="mailto:20251211@icome.world" class="sidebar-social-link" aria-label="邮箱">
                            <i class="fas fa-envelope"></i>
                        </a>
                    </div>
                </div>
                
                <!-- 友情链接 -->
                <div class="sidebar-links">
                    <div class="sidebar-links-btn">
                        <i class="fas fa-user-friends"></i>
                        <span>友情链接</span>
                    </div>
                    <div class="sidebar-links-list">
                        <a href="https://linaiai.com" target="_blank" class="sidebar-link-item">
                            <i class="fas fa-quote-left"></i>
                            <span>linaiai</span>
                        </a>
                    </div>
                </div>
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
    let isAnimating = false;
    
    toggle.addEventListener('click', function() {
        if (isAnimating) return;
        isAnimating = true;
        
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
        
        setTimeout(() => { isAnimating = false; }, 350);
    });
    
    overlay.addEventListener('click', function() {
        if (isAnimating) return;
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
