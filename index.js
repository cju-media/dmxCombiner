const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { dmxnet } = require('dmxnet');
const sacn = require('sacn');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 8500;

// Serve static frontend files from /public directory
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// STATE MANAGEMENT & DATA BUFFERS
// ==========================================
const CONFIG_FILE = path.join(__dirname, 'config.json');

let CONFIG = {
    inputA: { protocol: 'sacn', universe: 1 },
    inputB: { protocol: 'artnet', universe: 2 },
    output: {
        artnet: { target_type: 'specific', net: 0, subnet: 0, universe: 0, ip: '255.255.255.255' },
        sacn: { universe: 1 }
    }
};

// Load saved config on boot
try {
    if (fs.existsSync(CONFIG_FILE)) {
        const savedConfig = fs.readFileSync(CONFIG_FILE, 'utf8');
        CONFIG = { ...CONFIG, ...JSON.parse(savedConfig) };
        console.log('✅ Loaded saved configuration from config.json');
    }
} catch (err) {
    console.error('Error reading config.json, using defaults:', err);
}

let bufferA = new Uint8Array(512);
let bufferB = new Uint8Array(512);

// Engine and dynamic socket references
let artnetEngine = null;
let artnetSenders = [];
let sacnSender = null;
let activeArtnetReceivers = [];
let activeSacnReceivers = [];

// ==========================================
// DMX CORE PROCESSING & ROUTING MATRIX
// ==========================================
function initDMXCore() {
    // 1. Tidy up and close existing sockets to prevent port binding collisions
    activeArtnetReceivers = [];
    activeSacnReceivers.forEach(rx => {
        try { rx.close(); } catch(e) { console.error("Error closing sACN stream:", e); }
    });
    activeSacnReceivers = [];

    if (sacnSender) {
        // No explicit close for sender required by library, let GC handle re-assignment
        sacnSender = null;
    }

    // 2. Spin up fresh protocol engine instances
    artnetEngine = new dmxnet({ log: { level: 'error' }, sane_sender: true });
    sacnSender = new sacn.Sender({ universe: parseInt(CONFIG.output.sacn.universe) });

    // 3. Configure Output Art-Net Sender destinations
    artnetSenders = [];
    if (CONFIG.output.artnet.target_type === 'all') {
        // Broadcast on all available network interfaces
        if (artnetEngine.ip4 && artnetEngine.ip4.length > 0) {
            artnetEngine.ip4.forEach(interfaceInfo => {
                artnetSenders.push(artnetEngine.newSender({
                    ip: interfaceInfo.broadcast,
                    net: parseInt(CONFIG.output.artnet.net),
                    subnet: parseInt(CONFIG.output.artnet.subnet),
                    universe: parseInt(CONFIG.output.artnet.universe)
                }));
            });
        }
    } else {
        // Specific IP Target
        artnetSenders.push(artnetEngine.newSender({
            ip: CONFIG.output.artnet.ip,
            net: parseInt(CONFIG.output.artnet.net),
            subnet: parseInt(CONFIG.output.artnet.subnet),
            universe: parseInt(CONFIG.output.artnet.universe)
        }));
    }

    // 4. Bind decoupled Input Streams
    setupInputStream(CONFIG.inputA, bufferA);
    setupInputStream(CONFIG.inputB, bufferB);
}

function setupInputStream(inputConfig, targetBuffer) {
    const targetUniverse = parseInt(inputConfig.universe);

    if (inputConfig.protocol === 'artnet') {
        const rx = artnetEngine.newReceiver({ universe: targetUniverse });
        rx.on('data', (data) => {
            for(let i = 0; i < Math.min(data.length, 512); i++) {
                targetBuffer[i] = data[i];
            }
            processAndTransmit();
        });
        activeArtnetReceivers.push(rx);
    } else if (inputConfig.protocol === 'sacn') {
        // Instantiate passing options block wrapper to satisfy destructuring contract
        const rx = new sacn.Receiver({ universes: [targetUniverse] });
        
        rx.on('packet', (packet) => {
            if (packet.universe === targetUniverse) {
                for(let i = 0; i < 512; i++) {
                    targetBuffer[i] = packet.payload[i] || 0;
                }
                processAndTransmit();
            }
        });
        activeSacnReceivers.push(rx);
    }
}

function processAndTransmit() {
    const mergedData = new Uint8Array(512);

    // Dynamic linear adding with absolute value cap at 255
    for (let i = 0; i < 512; i++) {
        mergedData[i] = Math.min(bufferA[i] + bufferB[i], 255);
    }
    const outputArray = Array.from(mergedData);

    // Sync out to targets
    artnetSenders.forEach(sender => sender.transmit(outputArray));
    if (sacnSender) {
        sacnSender.send({
            universe: parseInt(CONFIG.output.sacn.universe),
            payload: outputArray,
            priority: 100
        });
    }
}

// Kick off initial matrix state
initDMXCore();

// ==========================================
// SOCKET.IO CONTROL PIPE
// ==========================================
io.on('connection', (socket) => {
    // Deliver baseline current config to new dashboard client
    socket.emit('currentConfig', CONFIG);

    // Process real-time update requests submitted from UI
    socket.on('updateConfig', (newConfig) => {
        // Server-side validation to avoid feedback loops
        const isLoop = (input) => {
            const inUniv = parseInt(input.universe, 10);
            if (input.protocol === 'sacn' && parseInt(newConfig.output.sacn.universe, 10) === inUniv) {
                return true;
            }
            if (input.protocol === 'artnet' &&
                parseInt(newConfig.output.artnet.universe, 10) === inUniv &&
                parseInt(newConfig.output.artnet.subnet, 10) === 0 &&
                parseInt(newConfig.output.artnet.net, 10) === 0) {
                return true;
            }
            return false;
        };

        if (isLoop(newConfig.inputA)) {
            socket.emit('configError', "Error: Input A creates a feedback loop with Output.");
            return;
        }

        if (isLoop(newConfig.inputB)) {
            socket.emit('configError', "Error: Input B creates a feedback loop with Output.");
            return;
        }

        console.log('🔄 Reloading Core Routing Engines Matrix...');
        CONFIG = newConfig;

        // Persist config invisibly to the user
        fs.writeFile(CONFIG_FILE, JSON.stringify(CONFIG, null, 4), (err) => {
            if (err) console.error('Failed to save config.json:', err);
        });
        
        // Dynamic re-binding execution
        initDMXCore();
        
        // Push state update verification globally to all clients
        io.emit('currentConfig', CONFIG);
    });
});

server.listen(PORT, () => {
    console.log(`🌐 Matrix Engine Control UI running at http://localhost:${PORT}`);
});