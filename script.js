let selectedVoice = null;
const synth = window.speechSynthesis;
let isSystemActive = false;

/**
 * VOICE ENGINE
 * Handles the male/female voice output
 */
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    
    if (selectedVoice) {
        // Find a voice that matches the user preference
        const target = voices.find(v => v.name.includes(selectedVoice));
        if (target) utterance.voice = target;
    }
    
    // Set pitch and rate for clarity
    utterance.rate = 0.9; 
    utterance.pitch = 1;
    synth.speak(utterance);
}

/**
 * INITIALIZATION
 * Prompts for Bluetooth/Location simulation and Camera access
 */
async function initApp() {
    speak("System initialization started. Please allow camera and location access.");
    
    try {
        // Request Camera Access (Simulating External Bluetooth Camera)
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        document.getElementById('status-text').innerText = "Camera Active";
        document.getElementById('status-text').parentElement.style.borderColor = "var(--accent)";
        
        isSystemActive = true;
        speak("Bluetooth link established. AI guidance is now active.");
        
        // Start the detection loop
        startDetectionLoop();
        
    } catch (err) {
        speak("Permission denied. Bluetooth connection failed. Exiting system.");
        document.getElementById('status-text').innerText = "Connection Failed";
        // In a real app, we would use window.close() or BackHandler.exitApp()
    }
}

/**
 * VOICE SELECTION
 */
function setVoice(gender) {
    // 'David' is usually the standard Windows Male, 'Zira' is Female.
    selectedVoice = (gender === 'male') ? 'David' : 'Zira';
    speak(`${gender} AI voice selected.`);
}

/**
 * OBSTACLE LOGIC
 * Calculates steps and gives audio directions
 */
function startDetectionLoop() {
    if (!isSystemActive) return;

    // We simulate a sensor reading every 5 seconds
    setInterval(() => {
        // Generating a random distance between 0.5 and 5 meters
        const mockDistance = (Math.random() * 4.5 + 0.5).toFixed(2);
        const steps = Math.ceil(mockDistance / 0.7); // 0.7m is avg step length
        
        document.getElementById('step-count').innerText = steps;

        if (steps <= 2) {
            speak(`Stop. Obstacle detected ${steps} steps ahead. Move slightly to your left.`);
        } else if (steps <= 5) {
            speak(`Caution. Object in ${steps} steps.`);
        }
    }, 6000);
}

// Ensure voices are loaded (some browsers need this)
window.speechSynthesis.onvoiceschanged = () => {
    console.log("System Voices Loaded");
};
