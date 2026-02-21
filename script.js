let selectedVoice = "David"; // Default to a clear voice
const synth = window.speechSynthesis;
let isSystemActive = false;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

/**
 * IMPROVED VOICE ENGINE
 * Maximized volume and Bluetooth wake-up tone
 */
function speak(text) {
    // 1. Cancel existing speech to prevent overlapping
    synth.cancel();

    // 2. Play a "Wake-up" beep for Bluetooth devices
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 880; 
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);

    // 3. Configure the Speech
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    
    const target = voices.find(v => v.name.includes(selectedVoice)) || voices[0];
    utterance.voice = target;

    // LOUD AND CLEAR SETTINGS
    utterance.volume = 1.0;  // Maximum Volume
    utterance.rate = 0.85;   // Slightly slower for better comprehension
    utterance.pitch = 1.1;   // Slightly higher pitch cuts through background noise
    
    synth.speak(utterance);
}

/**
 * INITIALIZATION
 */
async function initApp() {
    speak("System starting. Please allow camera access.");
    
    try {
        const video = document.getElementById('v');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } // Uses back camera on phones
        });
        video.srcObject = stream;
        
        isSystemActive = true;
        document.getElementById('status-text').innerText = "AI Monitoring Active";
        speak("System ready. Monitoring path for trees, walls, and obstacles.");
        
        // Start REAL detection
        startDetectionLoop();
        
    } catch (err) {
        speak("Camera failed. Check permissions.");
        document.getElementById('status-text').innerText = "Camera Error";
    }
}

/**
 * REAL VISION DETECTION
 * Sends camera frames to your Render/Groq backend
 */
async function analyzeObstacles() {
    if (!isSystemActive) return;

    const v = document.getElementById('v');
    const c = document.getElementById('c');
    const context = c.getContext('2d');

    // 1. Capture the frame
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    context.drawImage(v, 0, 0);
    const base64Image = c.toDataURL('image/jpeg').split(',')[1];

    try {
        // 2. Send to your Render API
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
        });

        const data = await response.json();
        const aiDescription = data.choices[0].message.content;

        // 3. Update UI and Speak the result
        const stepMatch = aiDescription.match(/\d+/);
        if (stepMatch) document.getElementById('step-count').innerText = stepMatch[0];
        
        speak(aiDescription);

    } catch (error) {
        console.error("AI Analysis failed:", error);
    }
}

function startDetectionLoop() {
    // Analyze the scene every 6 seconds to avoid API overload
    setInterval(analyzeObstacles, 6000);
}

function setVoice(gender) {
    selectedVoice = (gender === 'male') ? 'David' : 'Zira';
    speak(`Voice set to ${gender}.`);
}
