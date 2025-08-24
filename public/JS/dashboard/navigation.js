// Page Navigation Functions
function showPage(pageId) {
  document.getElementById(pageId).classList.remove('hidden');
}
      
function hidePage(pageId) {
  document.getElementById(pageId).classList.add('hidden');
}

// Initialize Navigation Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Sidebar Navigation
  document.getElementById("ranking-link")?.addEventListener("click", e => {
    e.preventDefault();
    showPage('ranking-page');
  });
  
  document.getElementById("community-link")?.addEventListener("click", e => {
    e.preventDefault();
    showPage('community-page');
  });
  
  document.getElementById("achievements-link")?.addEventListener("click", e => {
    e.preventDefault();
    showPage('achievements-page');
  });
  
  document.getElementById("stats-link")?.addEventListener("click", e => {
    e.preventDefault();
    showPage('stats-page');
  });
  
  document.getElementById("settings-link")?.addEventListener("click", e => {
    e.preventDefault();
    showPage('settings-page');
  });
  
  document.getElementById("logout-link")?.addEventListener("click", e => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = "login.html";
  });
}); 