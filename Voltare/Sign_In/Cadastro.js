// Salvar em: Sign_In/cadastro.js
const CHAVE_USUARIOS = 'voltare_usuarios';

const form = document.getElementById('form-cadastro');
const mensagem = document.getElementById('mensagem');
const campoMatricula = document.getElementById('matricula');

campoMatricula.addEventListener('input', () => {
    campoMatricula.value = campoMatricula.value.replace(/\D/g, '');
});

function mostrarMensagem(texto, sucesso = false) {
    mensagem.textContent = texto;
    mensagem.style.color = sucesso ? '#3ddc84' : '#f50073';
}

async function gerarHash(matricula, senha) {
    const texto = `${matricula}:${senha}`;
    if (window.crypto && crypto.subtle) {
        const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
        return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
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

form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    try {
        const primeiroNome = document.getElementById('primeiro-nome').value.trim();
        const sobrenome = document.getElementById('sobrenome').value.trim();
        const matricula = campoMatricula.value.trim();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const senha = document.getElementById('senha').value;
        const confirmar = document.getElementById('confirmar-senha').value;

        if (!/^\d{12}$/.test(matricula)) {
            return mostrarMensagem('A matrícula deve ter exatamente 12 dígitos.');
        }
        if (senha.length < 6 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha) || !/[^A-Za-z0-9]/.test(senha)) {
            return mostrarMensagem('A senha deve ter 6+ caracteres, com letras, números e caracteres especiais.');
        }
        if (senha !== confirmar) {
            return mostrarMensagem('As senhas não coincidem.');
        }

        const usuarios = lerUsuarios();
        if (usuarios.some(u => u.matricula === matricula)) {
            return mostrarMensagem('Já existe um cadastro com essa matrícula.');
        }

        usuarios.push({
            primeiroNome,
            sobrenome,
            matricula,
            email,
            senhaHash: await gerarHash(matricula, senha)
        });
        localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios));

        mostrarMensagem(`Cadastro salvo em ${location.origin}! Redirecionando para o login...`, true);
        form.reset();
        setTimeout(() => { window.location.href = '../Login.html'; }, 1500);
    } catch (erro) {
        console.error(erro);
        mostrarMensagem('Erro ao salvar: ' + erro.message);
    }
});