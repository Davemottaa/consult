// Header fixo ao scroll
window.onscroll = () => {
    const header = document.getElementById('header');
    if (window.scrollY > 80) header.style.background = "rgba(10, 10, 10, 0.95)";
    else header.style.background = "transparent";
};




// Contadores Animados
const counters = document.querySelectorAll('.counter');
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            const counter = entry.target;
            const target = +counter.getAttribute('data-target');
            const update = () => {
                const count = +counter.innerText.replace(/\D/g,'');
                const inc = target / 100;
                if(count < target) {
                    counter.innerText = Math.ceil(count + inc).toLocaleString('pt-BR');
                    setTimeout(update, 20);
                } else { counter.innerText = target.toLocaleString('pt-BR'); }
            };
            update();
            observer.unobserve(counter);
        }
    });
});
counters.forEach(c => observer.observe(c));

const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let particles = [];
const particleCount = 120;

function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 1) * 1;
        this.vy = (Math.random() - 1) * 1;
        this.radius = Math.random() * 1;
    }

    draw() {
        ctx.fillStyle = '#00E5FF';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
}

function createParticles() {
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function connectParticles() {
    for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
            let dx = particles[a].x - particles[b].x;
            let dy = particles[a].y - particles[b].y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                ctx.strokeStyle = `rgba(0, 229, 255, ${1 - distance/150})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    connectParticles();
    requestAnimationFrame(animate);
}

window.addEventListener('resize', initCanvas);

// Iniciar animação
initCanvas();
createParticles();
animate();

// FAQ Accordion
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');

    question.addEventListener('click', () => {
        faqItems.forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
            }
        });

        item.classList.toggle('active');
    });
});



// Chat IA estilo WhatsApp
const aiChatToggle = document.getElementById('aiChatToggle');
const aiChatContainer = document.getElementById('aiChatContainer');
const aiChatClose = document.getElementById('aiChatClose');
const aiChatBody = document.getElementById('aiChatBody');
const aiChatForm = document.getElementById('aiChatForm');
const aiChatInput = document.getElementById('aiChatInput');

const chatMessages = [];
let chatInitialized = false;

const appendMessage = (role, text) => {
    const message = document.createElement('div');
    message.className = `chat-message ${role}`;
    message.textContent = text;
    aiChatBody.appendChild(message);
    aiChatBody.scrollTop = aiChatBody.scrollHeight;
};

const appendTyping = () => {
    const typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.id = 'aiTyping';
    typing.textContent = 'Digitando...';
    aiChatBody.appendChild(typing);
    aiChatBody.scrollTop = aiChatBody.scrollHeight;
};

const removeTyping = () => {
    const typing = document.getElementById('aiTyping');
    if (typing) typing.remove();
};

const openChat = () => {
    aiChatContainer.classList.add('open');
    aiChatContainer.setAttribute('aria-hidden', 'false');
    if (!chatInitialized) {
        appendMessage(
            'ai',
            'Oi! Sou a IA da 360° AURA. Qual sua duvida sobre vendas, trafego ou marketplaces?'
        );
        chatInitialized = true;
    }
    setTimeout(() => aiChatInput?.focus(), 100);
};

const closeChat = () => {
    aiChatContainer.classList.remove('open');
    aiChatContainer.setAttribute('aria-hidden', 'true');
};

if (aiChatToggle && aiChatContainer) {
    aiChatToggle.addEventListener('click', openChat);
}

if (aiChatClose) {
    aiChatClose.addEventListener('click', closeChat);
}

if (aiChatForm && aiChatInput) {
    aiChatForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const text = aiChatInput.value.trim();
        if (!text) return;

        aiChatInput.value = '';
        appendMessage('user', text);
        chatMessages.push({ role: 'user', content: text });

        const history = chatMessages.slice(-10);
        appendTyping();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history })
            });

            const data = await response.json();
            removeTyping();

            if (!response.ok) {
                appendMessage('ai', data.error || 'Erro ao responder.');
                return;
            }

            const reply = data.text || 'Sem resposta.';
            chatMessages.push({ role: 'assistant', content: reply });
            appendMessage('ai', reply);
        } catch (err) {
            removeTyping();
            appendMessage('ai', 'Erro de conexao. Tente novamente.');
        }
    });
}
