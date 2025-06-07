// Authentication and User Data Management
document.addEventListener("DOMContentLoaded", () => {
  // Check Authentication
  const token = localStorage.getItem("token");
  const id = localStorage.getItem("userId");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Fetch User Data
  fetchUserData(id, token);
});

// Fetch User Data Function
async function fetchUserData(id, token) {
  try {
    const response = await fetch(`http://localhost:3000/user/${id}`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const data = await response.json();
    updateUserInterface(data.user);
  } catch (err) {
    console.error('ERRO:', err);
    showError('Falha ao carregar dados do usuário');
  }
}

// Update UI with User Data
function updateUserInterface(user) {
  // Update profile image
  const profileImage = document.getElementById("foto-usuario");
  if (profileImage) {
    profileImage.src = user.img || "https://i0.wp.com/digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png";
  }

  // Update username displays
  document.getElementById("nome-usuario").textContent = user.nickname;
  document.getElementById("welcome-name").textContent = user.nickname;

  // Update XP and progress
  const xpAtual = user.xp;
  const xpMaximo = 300;
  const pct = Math.min((xpAtual / xpMaximo) * 100, 100);

  // Update progress bar
  document.querySelector(".bg-gradient-to-r").style.width = `${pct}%`;

  // Update XP displays
  document.getElementById("xp-text").textContent = `XP: ${xpAtual} / ${xpMaximo}`;
  document.getElementById("xp-stat").textContent = `${xpAtual} XP`;
  document.getElementById("xp-remaining").textContent = `${xpMaximo - xpAtual}`;
}

// Error Handling
function showError(message) {
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
} 