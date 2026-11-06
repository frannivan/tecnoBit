// bridge.cjs — Servidor Puente de Ejecución Local para TecnoBit Cockpit Terminal
const http = require('http');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 9099;
const TECNOBIT_DIR = fs.existsSync(path.join(__dirname, 'tecnoBit')) 
    ? path.join(__dirname, 'tecnoBit') 
    : __dirname;

let currentProcess = null;
let sseClients = [];

function broadcast(type, message) {
    const data = JSON.stringify({
        type,
        message,
        timestamp: new Date().toISOString()
    });
    sseClients.forEach(client => {
        try {
            client.res.write(`data: ${data}\n\n`);
        } catch (e) {
            // Cliente desconectado
        }
    });
}

const server = http.createServer((req, res) => {
    // Cabeceras CORS universales
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);

    // 1. SSE Stream
    if (url.pathname === '/stream') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        res.write('\n');

        const clientId = Date.now();
        const newClient = { id: clientId, res };
        sseClients.push(newClient);

        // Mensaje de bienvenida
        const welcome = JSON.stringify({
            type: 'system',
            message: `🚀 Bridge Local Online (PID: ${process.pid}) en puerto ${PORT}. Directorio: ${TECNOBIT_DIR}`,
            timestamp: new Date().toISOString()
        });
        res.write(`data: ${welcome}\n\n`);

        req.on('close', () => {
            sseClients = sseClients.filter(c => c.id !== clientId);
        });
        return;
    }

    // 2. Ejecutar comando
    if (url.pathname === '/run' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const parsed = JSON.parse(body || '{}');
                const command = parsed.command;

                if (!command) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Comando requerido' }));
                    return;
                }

                if (currentProcess) {
                    res.writeHead(409, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Ya hay un proceso en ejecución', pid: currentProcess.pid }));
                    broadcast('warning', `⚠️ Ya hay un proceso activo en ejecución (PID: ${currentProcess.pid}). Deténlo antes de lanzar otro.`);
                    return;
                }

                broadcast('info', `🚀 Ejecutando en tu Mac: ${command}`);
                console.log(`[EXEC] ${command} (cwd: ${TECNOBIT_DIR})`);

                const isDev = command.includes('npm run dev');
                const child = spawn(command, {
                    shell: true,
                    cwd: TECNOBIT_DIR,
                    env: { ...process.env, FORCE_COLOR: '1' }
                });

                currentProcess = child;

                child.stdout.on('data', data => {
                    const lines = data.toString().split('\n');
                    lines.forEach(line => {
                        if (line.trim()) broadcast('stdout', line);
                    });
                });

                child.stderr.on('data', data => {
                    const lines = data.toString().split('\n');
                    lines.forEach(line => {
                        if (line.trim()) broadcast('stderr', line);
                    });
                });

                child.on('error', err => {
                    broadcast('error', `❌ Error al lanzar proceso: ${err.message}`);
                    currentProcess = null;
                });

                child.on('close', code => {
                    if (code === 0) {
                        broadcast('success', `✅ Finalizado con éxito (Código: ${code})`);
                    } else {
                        broadcast('error', `⚠️ Proceso terminado con código: ${code}`);
                    }
                    currentProcess = null;
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'STARTED', pid: child.pid, command }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // 3. Detener comando actual
    if (url.pathname === '/stop' && req.method === 'POST') {
        if (currentProcess) {
            broadcast('warning', `🛑 Deteniendo proceso activo (PID: ${currentProcess.pid})...`);
            try {
                process.kill(-currentProcess.pid, 'SIGTERM');
            } catch (e) {
                try { currentProcess.kill('SIGTERM'); } catch (e2) {}
            }
            currentProcess = null;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'STOPPED' }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'NO_PROCESS' }));
        }
        return;
    }

    // 4. Estado de Git y Puertos
    if (url.pathname === '/status' && req.method === 'GET') {
        let branch = 'develop';
        let commit = '';
        let message = '';
        let date = '';

        try {
            branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: TECNOBIT_DIR }).toString().trim();
            commit = execSync('git rev-parse --short HEAD', { cwd: TECNOBIT_DIR }).toString().trim();
            message = execSync('git log -1 --pretty=%s', { cwd: TECNOBIT_DIR }).toString().trim();
            date = execSync('git log -1 --pretty=%cr', { cwd: TECNOBIT_DIR }).toString().trim();
        } catch (e) {}

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ONLINE',
            branch,
            commit,
            message,
            date,
            hasActiveProcess: !!currentProcess,
            timestamp: new Date().toISOString()
        }));
        return;
    }

    // 5. Servir terminal.html estático por defecto
    const htmlPath = path.join(__dirname, 'terminal.html');
    if (fs.existsSync(htmlPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fs.readFileSync(htmlPath));
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('TecnoBit Terminal Bridge Activo');
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`\n🎧 TecnoBit Terminal Bridge corriendo en http://127.0.0.1:${PORT}`);
    console.log(`📂 Raíz del proyecto: ${TECNOBIT_DIR}`);
    console.log(`🌐 Abre http://127.0.0.1:${PORT} en tu navegador para ver la terminal en vivo.`);
});
