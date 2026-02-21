// --- CONFIGURATION ---
let selectedVoice = "David"; 
const synth = window.speechSynthesis;
let isSystemActive = false;
let audioCtx = null;

/**
 * LOUD AUDIO ENGINE
 */
function speak(text) {
    if (!text) return;
    synth.cancel(); // Interrupt old messages for safety

    // Wake-up tone for Bluetooth
    if (audioCtx && audioCtx.state === 'running') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    utterance.voice = voices.find(v => v.name.includes(selectedVoice)) || voices[0];
    
    // Maximized for outdoor/Bluetooth use
    utterance.volume = 1.0; 
    utterance.rate = 0.85; 
    utterance.pitch = 1.0;

    synth.speak(utterance);
}

/**
 * INITIALIZATION (Fixed Camera & Audio Logic)
 */
async function initApp() {
    const statusEl = document.getElementById('status-text');
    
    // 1. Force Audio Wake-up
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }

    statusEl.innerText = "STARTING...";
    speak("Initializing camera. Please look for a permission popup.");

    // 2. Flexible Camera Constraints
    const constraints = {
        video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "environment" // Try back camera, falls back to front
        }
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = document.getElementById('v');
        video.srcObject = stream;
        
        // Ensure video actually starts playing
        video.onloadedmetadata = () => {
            video.play();
            isSystemActive = true;
            statusEl.innerText = "AI ACTIVE";
            statusEl.parentElement.style.borderColor = "#00f2ff";
            speak("System ready. Vision monitoring is now live.");
            startDetectionLoop();
        };

    } catch (err) {
        console.error("Camera Error:", err);
        statusEl.innerText = "CAMERA ERROR";
        speak("Camera failed. Please ensure you are using HTTPS and have granted permissions.");
    }
}

/**
 * AI DETECTION
 */
async function analyzeObstacles() {
    if (!isSystemActive) return;

    const v = document.getElementById('v');
    const c = document.getElementById('c');
    const context = c.getContext('2d');

    // Capture Frame
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    context.drawImage(v, 0, 0);
    const base64Image = c.toDataURL('image/jpeg', 0.7).split(',')[1];

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            const aiDescription = data.choices[0].message.content;
            
            // Update Step Display
            const steps = aiDescription.match(/\d+/);
            if (steps) document.getElementById('step-count').innerText = steps[0];

            speak(aiDescription);
        }
    } catch (error) {
        console.error("AI Fetch Error:", error);
    }
}

function startDetectionLoop() {
    // Run every 7 seconds for stability
    setInterval(analyzeObstacles, 7000);
}

function setVoice(gender) {
    selectedVoice = (gender === 'male') ? 'David' : 'Zira';
    speak(gender + " voice selected.");
}

// Critical for Chrome voice loading
window.speechSynthesis.onvoiceschanged = () => { synth.getVoices(); };
