// --- CONFIGURATION ---
let selectedVoice = "David"; 
const synth = window.speechSynthesis;
let isSystemActive = false;
let audioCtx = null;

/**
 * RECOMMENDATION 1: WAKE-UP TONE
 * Plays a quick beep to ensure Bluetooth speakers are "awake" 
 * and to confirm the audio engine is running.
 */
function playWakeUpTone(frequency = 440, volume = 0.1) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

/**
 * FIXED VOICE ENGINE
 */
function speak(text) {
    if (!text) return;

    // Interrupt current speech for real-time safety
    synth.cancel();

    // Recommendation: Wake the hardware before speaking
    playWakeUpTone(880, 0.05);

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();

    // Select Voice
    const target = voices.find(v => v.name.includes(selectedVoice)) || voices[0];
    utterance.voice = target;

    // Audio Quality Settings
    utterance.volume = 1.0;  // Max Loudness
    utterance.rate = 0.85;   // Clear pacing
    utterance.pitch = 1.0;

    synth.speak(utterance);
}

/**
 * INITIALIZATION
 */
async function initApp() {
    // REQUIRED: Resume AudioContext on click
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    await audioCtx.resume();

    speak("Initializing Vision System.");

    try {
        const video = document.getElementById('v');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
        });
        video.srcObject = stream;

        isSystemActive = true;
        document.getElementById('status-text').innerText = "AI ACTIVE";
        
        speak("System ready. Bluetooth link established. Monitoring path.");
        
        // Start the detection loop
        startDetectionLoop();
    } catch (err) {
        speak("System failure. Camera access denied.");
        document.getElementById('status-text').innerText = "ERROR";
    }
}

/**
 * AI DETECTION LOGIC
 */
async function analyzeObstacles() {
    if (!isSystemActive) return;

    const v = document.getElementById('v');
    const c = document.getElementById('c');
    const context = c.getContext('2d');

    // Capture Frame
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
        
        // RECOMMENDATION 2: VERBAL ERROR HANDLING
        if (!data.choices) {
            speak("AI connection lost. Retrying.");
            return;
        }

        const aiDescription = data.choices[0].message.content;

        // Update Dashboard
        const stepMatch = aiDescription.match(/\d+/);
        if (stepMatch) document.getElementById('step-count').innerText = stepMatch[0];

        // Output Sound
        speak(aiDescription);

    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

function startDetectionLoop() {
    // Run every 6 seconds to keep path updated
    setInterval(analyzeObstacles, 6000);
}

function setVoice(gender) {
    selectedVoice = (gender === 'male') ? 'David' : 'Zira';
    speak(`${gender} voice active.`);
}

// Fix for Chrome voice loading
window.speechSynthesis.onvoiceschanged = () => { synth.getVoices(); };
