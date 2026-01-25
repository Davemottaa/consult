// Header fixo ao scroll
window.onscroll = () => {
    const header = document.getElementById('header');
    if (window.scrollY > 80) header.style.background = "rgba(10, 10, 10, 0.95)";
    else header.style.background = "transparent";
};

// Toggle Chat IA
function toggleChat() {
    document.getElementById('ai-chat').classList.toggle('closed');
}

// Simulação de Respostas da IA Akuma
function askAI() {
    const input = document.getElementById('user-input');
    const content = document.getElementById('chat-content');
    if(!input.value) return;

    content.innerHTML += `<div class="msg user">${input.value}</div>`;
    const query = input.value.toLowerCase();
    input.value = "";

    setTimeout(() => {
        let reply = "Essa é uma excelente pergunta! Na nossa consultoria focamos em ROAS positivo. Vamos conversar no WhatsApp?";
        if(query.includes("google")) reply = "No Google Ads, configuramos o GA4 e GTM para que você saiba exatamente de onde vêm suas vendas.";
        if(query.includes("marketplace") || query.includes("shopee")) reply = "Integramos sua loja com os maiores marketplaces do Brasil para você vender em múltiplos canais simultaneamente.";
        
        content.innerHTML += `<div class="msg bot">${reply}</div>`;
        content.scrollTop = content.scrollHeight;
    }, 700);
}

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
const particleCount = 80;

function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2;
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