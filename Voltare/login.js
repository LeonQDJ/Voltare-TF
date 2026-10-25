// Salvar em: login.js (mesma pasta do Login.html)
const CHAVE_USUARIOS = 'voltare_usuarios';
const CHAVE_SESSAO = 'voltare_sessao';

// O script testa estes caminhos (relativos ao Login.html) e usa o primeiro que existir
const CAMINHOS_PRINCIPAL = [
    'Principal.html',
    'Principal/Principal.html',
    '../Principal/Principal.html',
    '../Principal.html'
];

const form = document.getElementById('form-login');
const mensagem = document.getElementById('mensagem');
const campoMatricula = document.getElementById('matricula');

campoMatricula.addEventListener('input', () => {
    campoMatricula.value = campoMatricula.value.replace(/\D/g, '');
});

function mostrarMensagem(texto, sucesso = false) {
    mensagem.textContent = texto;
    mensagem.style.color = sucesso ? '#3ddc84' : '#ff6b9d';
}

async function gerarHash(matricula, senha) {
    const texto = `${matricula}:${senha}`;
    if (window.crypto && crypto.subtle) {
        const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
        return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Alternativa para endereços sem contexto seguro (menos robusta)
    let h = 5381;
    for (let i = 0; i < texto.length; i++) h = ((h * 33) ^ texto.charCodeAt(i)) >>> 0;
    return 'f' + h.toString(16);
}

function lerUsuarios() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE_USUARIOS)) || [];
    } catch {
        return [];
    }
}

async function acharPrincipal() {
    for (const caminho of CAMINHOS_PRINCIPAL) {
        try {
            const url = new URL(caminho, window.location.href).href;
            const resposta = await fetch(url, { method: 'HEAD' });
            if (resposta.ok) return url;
        } catch { /* tenta o próximo */ }
    }
    return null;
}

form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    try {
        const matricula = campoMatricula.value.trim();
        const senha = document.getElementById('senha').value;

        const usuarios = lerUsuarios();
        if (usuarios.length === 0) {
            return mostrarMensagem(`Nenhum cadastro encontrado em ${location.origin}. Cadastre-se usando este mesmo endereço.`);
        }

        const usuario = usuarios.find(u => u.matricula === matricula);
        if (!usuario) {
            return mostrarMensagem('Matrícula não encontrada.');
        }

        if (usuario.senhaHash !== await gerarHash(matricula, senha)) {
            return mostrarMensagem('Senha incorreta.');
        }

        sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify({
            matricula: usuario.matricula,
            nome: `${usuario.primeiroNome} ${usuario.sobrenome}`
        }));

        const destino = await acharPrincipal();
        if (!destino) {
            return mostrarMensagem('Login correto, mas a Principal.html não foi encontrada. Verifique a pasta dela.');
        }

        mostrarMensagem(`Bem-vindo, ${usuario.primeiroNome}!`, true);
        window.location.href = destino;
    } catch (erro) {
        console.error(erro);
        mostrarMensagem('Erro inesperado: ' + erro.message);
    }
});