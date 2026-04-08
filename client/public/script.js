document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    const headerTitle = document.querySelector('.top-header h1');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetSectionId = item.getAttribute('data-section');
            
            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Update visible section
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetSectionId).classList.add('active');
            
            // Update header title
            headerTitle.textContent = item.textContent.trim();
        });
    });
});
