// BotMarket Web Application
document.addEventListener('DOMContentLoaded', () => {
    const skills = [
        {
            id: 'vision_enhance_pro_v2',
            name: 'Vision Enhance Pro',
            description: 'Advanced image enhancement and object detection.',
            icon: '👁️',
            price: 0.05,
            priceWei: '50000000000000000',
            domains: ['vision', 'action'],
            successRate: 99.4,
            latency: 450,
            version: 'v2.1.0',
            tags: ['Computer Vision'],
            sold: 0
        },
        {
            id: 'text_analysis_pro_v3',
            name: 'Text Analysis Pro',
            description: 'Sentiment analysis, entity extraction, and summarization.',
            icon: '📝',
            price: 0.01,
            priceWei: '10000000000000000',
            domains: ['language', 'reasoning'],
            successRate: 99.8,
            latency: 320,
            version: 'v3.0.1',
            tags: ['NLP'],
            sold: 0
        },
        {
            id: 'memory_vector_store_v1',
            name: 'Memory Vector Store',
            description: 'Persistent vector storage for semantic search.',
            icon: '🧠',
            price: 0.025,
            priceWei: '25000000000000000',
            domains: ['memory', 'reasoning'],
            successRate: 99.9,
            latency: 180,
            version: 'v1.2.0',
            tags: ['Vector DB'],
            sold: 0
        },
        {
            id: 'web_search_pro_v2',
            name: 'Web Search Pro',
            description: 'Autonomous web research and fact extraction.',
            icon: '🕵️',
            price: 0.03,
            priceWei: '30000000000000000',
            domains: ['reasoning', 'action'],
            successRate: 99.7,
            latency: 850,
            version: 'v2.1.0',
            tags: ['Research'],
            sold: 0
        },
        {
            id: 'code_execution_pro_v3',
            name: 'Code Execution Pro',
            description: 'Sandboxed code execution in Python, JS, SQL.',
            icon: '💻',
            price: 0.08,
            priceWei: '80000000000000000',
            domains: ['reasoning', 'action'],
            successRate: 99.5,
            latency: 420,
            version: 'v3.0.1',
            tags: ['Programming'],
            sold: 0
        },
        {
            id: 'document_processor_pro_v2',
            name: 'Document Processor Pro',
            description: 'PDF, DOCX, OCR extraction and conversion.',
            icon: '📄',
            price: 0.04,
            priceWei: '40000000000000000',
            domains: ['action'],
            successRate: 99.3,
            latency: 680,
            version: 'v2.3.0',
            tags: ['PDF', 'OCR'],
            sold: 0
        },
        {
            id: 'email_automation_pro_v2',
            name: 'Email Automation Pro',
            description: 'Full email automation - send, read, draft, manage.',
            icon: '📧',
            price: 0.035,
            priceWei: '35000000000000000',
            domains: ['action'],
            successRate: 99.8,
            latency: 320,
            version: 'v2.0.1',
            tags: ['Email'],
            sold: 0
        },
        {
            id: 'calendar_scheduler_pro_v2',
            name: 'Calendar Scheduler Pro',
            description: 'Smart calendar and event management.',
            icon: '📅',
            price: 0.03,
            priceWei: '30000000000000000',
            domains: ['action', 'planning'],
            successRate: 99.6,
            latency: 280,
            version: 'v2.1.0',
            tags: ['Scheduling'],
            sold: 0
        },
        {
            id: 'api_integration_pro_v2',
            name: 'API Integration Pro',
            description: 'Universal REST API integration.',
            icon: '🔗',
            price: 0.045,
            priceWei: '45000000000000000',
            domains: ['action'],
            successRate: 99.4,
            latency: 220,
            version: 'v2.0.0',
            tags: ['API'],
            sold: 0
        }
    ];

    // Stats
    let totalSales = 0;
    let totalVolumeEth = 0;
    let totalFeesEth = 0;

    function updateStats() {
        document.getElementById('totalSkills').textContent = skills.length;
        document.getElementById('totalSales').textContent = totalSales;
        document.getElementById('totalVolume').textContent = totalVolumeEth.toFixed(3) + ' ETH';
        document.getElementById('platformEarnings').textContent = totalFeesEth.toFixed(4) + ' ETH';
        document.getElementById('platformEarnings').textContent = totalFeesEth.toFixed(4) + ' ETH';
    }

    // Render skills
    const skillsGrid = document.getElementById('skillsGrid');
    
    function renderSkills(filter = 'all') {
        const filtered = filter === 'all' 
            ? skills 
            : skills.filter(s => s.domains.includes(filter));
        
        skillsGrid.innerHTML = filtered.map(skill => `
            <div class="skill-card" data-domain="${skill.domains[0]}">
                <div class="skill-header">
                    <span class="skill-icon">${skill.icon}</span>
                    <span class="skill-price">${skill.price} ETH</span>
                </div>
                <div class="skill-name">${skill.name}</div>
                <div class="skill-description">${skill.description}</div>
                <div class="skill-meta">
                    <span>✅ ${skill.successRate}% success</span>
                    <span>⚡ ${skill.latency}ms</span>
                    <span>📦 ${skill.version}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem;">
                    <span style="color:#666;font-size:0.75rem;">
                        ∞ Unlimited stock
                    </span>
                    <span style="color:#00ff88;font-size:0.75rem;">
                        ${skill.sold} sold
                    </span>
                </div>
                <button class="skill-action" onclick="purchaseSkill('${skill.id}')">
                    Purchase
                </button>
            </div>
        `).join('');
    }

    // Filter tabs
    const filters = document.querySelectorAll('.filter');
    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderSkills(btn.dataset.filter);
        });
    });

    // Initial render
    renderSkills();
    updateStats();

    // Purchase function
    window.purchaseSkill = function(skillId) {
        const skill = skills.find(s => s.id === skillId);
        if (!skill) return;
        
        const modalHtml = `
            <div id="purchaseModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:9999;">
                <div style="background:#1a1a1a;padding:2rem;border-radius:16px;max-width:400px;width:90%;border:1px solid #333;">
                    <h2 style="margin-bottom:1rem;">Purchase Skill</h2>
                    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
                        <span style="font-size:2.5rem;">${skill.icon}</span>
                        <div>
                            <div style="font-weight:600;font-size:1.1rem;">${skill.name}</div>
                            <div style="color:#a0a0a0;">${skill.version}</div>
                        </div>
                    </div>
                    <div style="background:#242424;padding:1rem;border-radius:8px;margin-bottom:1rem;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
                            <span>Price:</span>
                            <span style="color:#ffd700;font-weight:600;font-size:1.1rem;">${skill.price} ETH</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;font-size:0.875rem;color:#a0a0a0;">
                            <span>Fee to platform (5%):</span>
                            <span>${(skill.price * 0.05).toFixed(4)} ETH</span>
                        </div>
                    </div>
                    <div style="background:#1a3a1a;padding:1rem;border-radius:8px;margin-bottom:1rem;border:1px solid #00ff88;">
                        <div style="color:#00ff88;font-size:0.875rem;">∞ Unlimited copies available</div>
                        <div style="color:#666;font-size:0.75rem;margin-top:0.25rem;">Each bot can buy this skill infinitely</div>
                    </div>
                    <button onclick="buySkill('${skill.id}')" style="width:100%;padding:1rem;background:#00ff88;color:#0d0d0d;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:1rem;margin-bottom:0.5rem;">
                        Confirm Purchase
                    </button>
                    <button onclick="closeModal()" style="width:100%;padding:0.75rem;background:transparent;border:1px solid #333;border-radius:8px;color:#a0a0a0;cursor:pointer;">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    // Buy skill (simulated)
    window.buySkill = function(skillId) {
        const skill = skills.find(s => s.id === skillId);
        if (!skill) return;
        
        // Simulate purchase
        skill.sold++;
        totalSales++;
        totalVolumeEth += skill.price;
        totalFeesEth += skill.price * 0.05;
        
        updateStats();
        renderSkills();
        closeModal();
        
        alert(`✅ Purchase Complete!\n\nSkill: ${skill.name}\nPrice: ${skill.price} ETH\n\nThis skill can be sold infinitely to more bots!`);
    };

    window.closeModal = function() {
        const modal = document.getElementById('purchaseModal');
        if (modal) modal.remove();
    };

    // Simulation function
    window.runSimulation = function() {
        const bots = 100;
        const purchasesPerBot = 3;
        
        alert(`🤖 Running Simulation...\n\n${bots} bots making ${purchasesPerBot} purchases each.\n\nWatch the stats!`);
        
        let delay = 0;
        for (let i = 0; i < bots; i++) {
            setTimeout(() => {
                for (let j = 0; j < purchasesPerBot; j++) {
                    const randomSkill = skills[Math.floor(Math.random() * skills.length)];
                    randomSkill.sold++;
                    totalSales++;
                    totalVolumeEth += randomSkill.price;
                    totalFeesEth += randomSkill.price * 0.05;
                }
                updateStats();
                renderSkills();
                
                // Update progress
                const progress = Math.round(((i + 1) / bots) * 100);
                document.getElementById('simulationProgress').textContent = `Simulating... ${progress}%`;
                
                if (i === bots - 1) {
                    document.getElementById('simulationProgress').textContent = `✅ ${bots} bots completed ${bots * purchasesPerBot} purchases!`;
                    document.getElementById('simulationResults').style.display = 'block';
                    document.getElementById('simTotalVolume').textContent = totalVolumeEth.toFixed(2) + ' ETH';
                    document.getElementById('simPlatformFees').textContent = totalFeesEth.toFixed(4) + ' ETH';
                    document.getElementById('simTotalSales').textContent = totalSales;
                }
            }, delay);
            delay += 50;
        }
    };

    window.resetSimulation = function() {
        totalSales = 0;
        totalVolumeEth = 0;
        totalFeesEth = 0;
        skills.forEach(s => s.sold = 0);
        updateStats();
        renderSkills();
        document.getElementById('simulationResults').style.display = 'none';
        document.getElementById('simulationProgress').textContent = '';
    };
});
