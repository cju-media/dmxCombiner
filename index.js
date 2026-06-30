const { dmxnet } = require('dmxnet');
const sacn = require('sacn');

// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
    // Input configurations
    inputA: { protocol: 'sacn', universe: 1 },    // Options: 'artnet' or 'sacn'
    inputB: { protocol: 'artnet', universe: 2 },  // Options: 'artnet' or 'sacn'
    
    // Output configurations
    output: {
        artnet: { net: 0, subnet: 0, universe: 0, ip: '255.255.255.255' },
        sacn: { universe: 1 }
    }
};

// Internal buffers to hold the 512 channels for each source (0-255)
let bufferA = new Uint8Array(512);
let bufferB = new Uint8Array(512);

// ==========================================
// PROTOCOL INITIALIZATION
// ==========================================

// Initialize Art-Net Engine via dmxnet
const artnetEngine = new dmxnet({
    log: { level: 'info' },
    oem: 0,
    sane_sender: true
});

// Initialize sACN Receivers & Sender
const sacnReceiver = new sacn.Receiver();
const sacnSender = new sacn.Sender();

// Create Art-Net Sender
const artnetSender = artnetEngine.newSender({
    ip: CONFIG.output.artnet.ip,
    net: CONFIG.output.artnet.net,
    subnet: CONFIG.output.artnet.subnet,
    universe: CONFIG.output.artnet.universe
});

// ==========================================
// CORE MERGE & OUTPUT LOGIC
// ==========================================
function processAndTransmit() {
    const mergedData = new Uint8Array(512);

    for (let i = 0; i < 512; i++) {
        // HTP (Highest Takes Precedence) or Additive. 
        // This implements Additive with a 255 ceiling:
        const combined = bufferA[i] + bufferB[i];
        mergedData[i] = Math.min(combined, 255);
    }

    // Convert TypedArray to standard Array/Buffer expected by the libraries
    const outputArray = Array.from(mergedData);

    // 1. Output to Art-Net
    artnetSender.transmit(outputArray);

    // 2. Output to sACN
    sacnSender.send({
        universe: CONFIG.output.sacn.universe,
        payload: outputArray,
        priority: 100
    });
}

// ==========================================
// INPUT STREAM SETUP
// ==========================================

// Setup Input A
if (CONFIG.inputA.protocol === 'artnet') {
    const receiverA = artnetEngine.newReceiver({
        universe: CONFIG.inputA.universe
    });
    receiverA.on('data', (data) => {
        // dmxnet provides data as an array; copy up to 512 values
        for(let i = 0; i < Math.min(data.length, 512); i++) bufferA[i] = data[i];
        processAndTransmit();
    });
} else if (CONFIG.inputA.protocol === 'sacn') {
    sacnReceiver.join(CONFIG.inputA.universe);
    sacnReceiver.on('packet', (packet) => {
        if (packet.universe === CONFIG.inputA.universe) {
            // sacn payload is a Buffer
            for(let i = 0; i < 512; i++) bufferA[i] = packet.payload[i] || 0;
            processAndTransmit();
        }
    });
}

// Setup Input B
if (CONFIG.inputB.protocol === 'artnet') {
    const receiverB = artnetEngine.newReceiver({
        universe: CONFIG.inputB.universe
    });
    receiverB.on('data', (data) => {
        for(let i = 0; i < Math.min(data.length, 512); i++) bufferB[i] = data[i];
        processAndTransmit();
    });
} else if (CONFIG.inputB.protocol === 'sacn') {
    sacnReceiver.join(CONFIG.inputB.universe);
    sacnReceiver.on('packet', (packet) => {
        if (packet.universe === CONFIG.inputB.universe) {
            for(let i = 0; i < 512; i++) bufferB[i] = packet.payload[i] || 0;
            processAndTransmit();
        }
    });
}

console.log(`🚀 DMX Merger Engine Active.`);
console.log(`📥 Input A: ${CONFIG.inputA.protocol.toUpperCase()} Universe ${CONFIG.inputA.universe}`);
console.log(`📥 Input B: ${CONFIG.inputB.protocol.toUpperCase()} Universe ${CONFIG.inputB.universe}`);
console.log(`📤 Outputting merged streams to Art-Net (U${CONFIG.output.artnet.universe}) & sACN (U${CONFIG.output.sacn.universe})`);
