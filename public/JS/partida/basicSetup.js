const apiUrl = 'http://localhost:3000';
const socket = io();
import Game from './game.js';

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    document.getElementById('errorText').textContent = message;
    errorElement.classList.remove('hidden');
    errorElement.classList.add('error-message');

    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}

let game = null;
let match = {};

socket.on('connect', () => {
    console.clear();
    socket.on("matchEndedByDisconnection", ({winner, disconnectedPlayer}) => {
        console.log(`Partida finalizada por desconexão do oponente${disconnectedPlayer}. Vencedor: ${winner}`);
        openFinishModal(winner, disconnectedPlayer);
    });
    console.clear();
    console.log('Socket reconectado com id:', socket.id);

    const userId = localStorage.getItem('userId');
    const matchId = localStorage.getItem('matchInfo');
  
    if (userId && matchId) {
      // Envia para o servidor para associar socket à room do match
      socket.emit('inGame', {
        socketId: socket.id,
        userId, 
        matchId,
      });
      socket.data = { userId };                   // Debug
      window.socketReady = true;
    }

    game = new Game(socket, userId, matchId);
});

document.addEventListener('DOMContentLoaded', async () =>{
    try {
        const matchId = localStorage.getItem('matchInfo');
        match = await getMatchInfo(matchId);

        if (match.status === 'finished') {
            await openFinishModal(match.winner, match.loser);
            return; // impede que o restante da lógica rode
        }

        loadMatchInfo();
        enterGameScreen();
    } catch (error) {
        showError(error.message || 'Erro ao carregar informações da partida');
    }    
});

function enterGameScreen(){
    setTimeout(() => { 
        const startScreenContent = document.getElementById("startScreenContent");
        startScreenContent.classList.add('hidden');
        const gameScreenContent = document.getElementById("gameContent");
        gameScreenContent.classList.remove('hidden')
    } , 5000);
}

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

async function getMatchInfo(matchId){
    const token = localStorage.getItem('token')
    if (!token) {
        throw new Error('Token de autenticação não encontrado.');
    }

    try {
        const response = await fetch(`${apiUrl}/challenge/${matchId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar informações da partida.');
        }
        let winner = null;
        let loser = null;
        const data = await response.json();
        if(data.challenge.opponent == data.challenge.winner){
            winner = data.challenge.opponent;
            loser = data.challenge.challenger;
        } else if (data.challenge.challenger == data.challenge.winner){
            winner = data.challenge.challenger;
            loser = data.challenge.opponent;
        }

        return {
            status: data.challenge.status,
            winner: winner,
            loser: loser,
        };
    } catch (error) {
        console.error('Erro em getMatchInfo:', error);
        throw error;
    }
}

async function openFinishModal(winner, loser){
    const token = localStorage.getItem('token');
    try {
        // Buscar dados do vencedor
        const winnerResponse = await fetch(`${apiUrl}/user/${winner}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Buscar dados do perdedor
        const loserResponse = await fetch(`${apiUrl}/user/${loser}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!winnerResponse.ok || !loserResponse.ok) {
            throw new Error('Erro ao buscar nomes do vencedor ou perdedor.');
        }

        const winnerData = await winnerResponse.json();
        const loserData = await loserResponse.json();

        const winnerName = winnerData.user.nickname || `Jogador ${winnerId}`;
        const loserName = loserData.user.nickname || `Jogador ${loserId}`;

        // Preencher nomes no modal
        document.getElementById('matchWinnerId').textContent = winnerName;
        document.getElementById('matchLoserId').textContent = loserName;

        // Exibir modal
        const modal = document.getElementById('matchResultModal');
        modal.classList.remove('hidden');

        // Botão de fechar
        const closeBtn = document.getElementById('closeModalBtn');
        closeBtn.addEventListener('click', () => {
            window.location.href = "../Pasta HTML/dashboard.html";
        });

    } catch (err) {
        console.error('Erro ao abrir modal de final de partida:', err);
        showError('Erro ao exibir resultado da partida');
    }
}
