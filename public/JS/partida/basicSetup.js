async function loadMatchInfo() {
    const token = localStorage.getItem('token');

    // Mostrar animação de carregamento
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('errorMessage').classList.add('hidden');

    if (!token) {
        showError('Você precisa estar autenticado para ver esta página');
        return;
    }

    const challengeId = localStorage.getItem('matchInfo');
    console.log('ID do desafio:', challengeId);

    try {
        // Buscar dados do desafio
        const challenge = await fetch(`http://localhost:3000/challenge/${challengeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });

        if (!challenge.ok) {
            throw new Error('Falha ao carregar informações do desafio!');
        }

        const challengeData = await challenge.json()
        const challengerId = challengeData.challenge.challenger
        const opponentId = challengeData.challenge.opponent
        const type = challengeData.challenge.type

        console.log('Challenge data:', challengeData);
        console.log('ID do desafiante:', challengeData.challenge.challenger);
        console.log('ID do oponente:', opponentId);
        
        // Buscar dados do desafiante
        const challengerResponse = await fetch(`http://localhost:3000/user/${challengerId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });

        if (!challengerResponse.ok) {
            throw new Error('Falha ao carregar informações do desafiante!');
        }

        const challengerData = await challengerResponse.json();

        // Buscar dados do oponente
        const opponentResponse = await fetch(`http://localhost:3000/user/${opponentId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });

        if (!opponentResponse.ok) {
            throw new Error('Falha ao carregar informações do oponente!');
        }

        const opponentData = await opponentResponse.json();

        // Atualizar o HTML com as informações
         // Atualizar a foto do desafiante
        document.getElementById('challengerImage').src = challengerData.user.img;

        // Atualizar a foto do oponente
        document.getElementById('opponentImage').src = opponentData.user.img;

        document.getElementById('challengerName').textContent = challengerData.user?.nickname || `Desafiante ${challengerId}`;
        document.getElementById('challengerMatchType').textContent = type === "casual" ? "Casual" : "Ranqueada";

        document.getElementById('opponentName').textContent = opponentData.user?.nickname || `Oponente ${opponentId}`;
        document.getElementById('opponentMatchType').textContent = type === "casual" ? "Casual" : "Ranqueada";

        // Atualizar detalhes da partida
        const now = new Date();
        document.getElementById('matchDate').textContent = now.toLocaleDateString();
        document.getElementById('matchTime').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById('matchPrize').textContent = type === "casual" ? "100 pontos" : "500 pontos";

        // Esconder animação de carregamento
        document.getElementById('loading').style.display = 'none';

    } catch (error) {
        console.error('Erro ao carregar as informações:', error);
        showError(error.message || 'Erro ao carregar informações da partida');
        document.getElementById('loading').style.display = 'none';
    }
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    document.getElementById('errorText').textContent = message;
    errorElement.classList.remove('hidden');
    errorElement.classList.add('error-message');

    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}

document.addEventListener('DOMContentLoaded', loadMatchInfo);
/*
let countdown = 5;
const countdownElement = document.getElementById('countdown');

const interval = setInterval(() => {
    countdownElement.textContent = `A partida começa em ${countdown} segundos...`;
    countdown--;

    if (countdown < 0) {
        clearInterval(interval);
        startMatch(); // Chama a função para ir para a partida
    }
}, 1000);

function startMatch() {
    const challengeId = localStorage.getItem('matchInfo');
    window.location.href = `/match.html?challengeId=${challengeId}`;
}
*/