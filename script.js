// --- GLOBAL SETTINGS ---
let selectedVoice = "David"; 
const synth = window.speechSynthesis;
let isSystemActive = false;
let audioCtx = null;

/**
 * HIGH-VOLUME AUDIO ENGINE
 */
function speak(text) {
    if (!text) return;
    
    // Interrupt any current talking
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Load voices
    const voices = synth.getVoices();
    const target = voices.find(v => v.name.includes(selectedVoice)) || voices[0];
    
    utterance.voice = target;
    utterance.volume = 1.0; // MAX LOUDNESS
    utterance.rate = 0.9;   // SLIGHTLY SLOWER FOR CLARITY
    utterance.pitch = 1.0;

    synth.speak(utterance);
}

/**
 * INITIALIZATION (THE FIX)
 */
async function initApp() {
    const statusText = document.getElementById('status-text');
    
    // 1. RESUME AUDIO ENGINE (Browser requirement)
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    await audioCtx.resume();

    statusText.innerText = "CONNECTING...";

    try {
        // 2. SIMPLEST CAMERA REQUEST (Fixes most "Error" issues)
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
        });

        const video = document.getElementById('v');
        video.srcObject = stream;
        
        // Ensure the video plays
        video.onloadedmetadata = () => {
            video.play();
            isSystemActive = true;
            statusText.innerText = "AI ACTIVE";
            speak("System initialized. Monitoring for obstacles.");
            
            // Start the loop
            startDetectionLoop();
        };

    } catch (err) {
        // 3. ERROR LOGGING (Check your browser console (F12) for the exact error)
        console.error("Camera access failed:", err);
        statusText.innerText = "ERROR";
        speak("Camera failed. Please check permissions in your browser bar.");
    }
}

/**
 * AI DETECTION LOOP
 */
async function analyzeObstacles() {
    if (!isSystemActive) return;

    const v = document.getElementById('v');
    const c = document.getElementById('c');
    const context = c.getContext('2d');

    // Capture the frame
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    context.drawImage(v, 0, 0);
    
    // Convert to Base64
    const base64Image = c.toDataURL('image/jpeg').split(',')[1];

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
        });

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Update Dashboard Steps
        const stepMatch = aiResponse.match(/\d+/);
        if (stepMatch) {
            document.getElementById('step-count').innerText = stepMatch[0];
        }

        // Output Sound
        speak(aiResponse);

    } catch (error) {
        console.error("AI Link Error:", error);
    }
}

function startDetectionLoop() {
    // Run every 6 seconds
    setInterval(analyzeObstacles, 6000);
}

function setVoice(gender) {
    selectedVoice = (gender === 'male') ? 'David' : 'Zira';
    speak(gender + " voice active.");
}

// Fix for Chrome voice loading
window.speechSynthesis.onvoiceschanged = () => { synth.getVoices(); };
