let selectedVoice = "David"; 
const synth = window.speechSynthesis;
let isSystemActive = false;

// Initialize Audio Context (don't start it yet)
let audioCtx;

/**
 * VOICE ENGINE
 */
function speak(text) {
    if (!text) return;

    // 1. Clear any pending speech
    synth.cancel();

    // 2. Wake up Bluetooth/Audio hardware with a quick beep
    if (audioCtx) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880; 
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }

    // 3. Configure the Speech
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();

    // Find the voice or fallback to the first available
    const target = voices.find(v => v.name.includes(selectedVoice)) || voices[0];
    if (target) utterance.voice = target;

    // LOUD AND CLEAR SETTINGS
    utterance.volume = 1.0;  // Max Volume
    utterance.rate = 0.85;   // Clarity speed
    utterance.pitch = 1.1;   // High pitch for noise cutting

    synth.speak(utterance);
}

/**
 * INITIALIZATION (Triggered by Button Click)
 */
async function initApp() {
    // MANDATORY: Resume audio context on user gesture
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }

    speak("System starting.");

    try {
        const video = document.getElementById('v');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
        });
        video.srcObject = stream;

        isSystemActive = true;
        document.getElementById('status-text').innerText = "AI Monitoring Active";
        speak("System ready. Bluetooth connected.");

        startDetectionLoop();
    } catch (err) {
        console.error(err);
        speak("Camera failed. Please check permissions.");
    }
}

/**
 * VISION DETECTION
 */
async function analyzeObstacles() {
    if (!isSystemActive) return;

    const v = document.getElementById('v');
    const c = document.getElementById('c');
    if (!v || !c) return;

    const context = c.getContext('2d');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    context.drawImage(v, 0, 0);
    
    const base64Image = c.toDataURL('image/jpeg').split(',')[1];

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
        });

        const data = await response.json();
        const aiDescription = data.choices[0].message.content;

        // Update UI
        const stepMatch = aiDescription.match(/\d+/);
        if (stepMatch) document.getElementById('step-count').innerText = stepMatch[0];

        // Output Sound
        speak(aiDescription);

    } catch (error) {
        console.error("AI Analysis failed:", error);
    }
}

function startDetectionLoop() {
    setInterval(analyzeObstacles, 7000);
}

function setVoice(gender) {
    selectedVoice = (gender === 'male') ? 'David' : 'Zira';
    speak(`Voice set to ${gender}.`);
}

// Critical for Chrome: ensures voices are loaded before first use
window.speechSynthesis.onvoiceschanged = () => {
    synth.getVoices();
};
