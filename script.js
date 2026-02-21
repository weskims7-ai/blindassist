/**
 * OBSTACLE DETECTION (REAL)
 * Captures visual data and sends it to the Render backend for Groq analysis
 */
async function captureAndAnalyze() {
    if (!isSystemActive) return;

    const video = document.getElementById('v'); // Your video element
    const canvas = document.getElementById('c'); // Your hidden canvas
    const context = canvas.getContext('2d');

    // 1. Capture current frame from webcam
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    // 2. Convert to Base64 to send over the internet
    const imageData = canvas.toDataURL('image/jpeg').split(',')[1];

    document.getElementById('status-text').innerText = "AI Analyzing...";

    try {
        // 3. Send to your RENDER backend
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData })
        });

        const data = await response.json();
        
        // Groq returns a description like: "Wall ahead, 3 steps. Turn right."
        const aiMessage = data.choices[0].message.content;

        // 4. Update UI and Voice Output
        document.getElementById('status-text').innerText = "Monitoring Path";
        
        // Extract distance if the AI provided a number
        const stepMatch = aiMessage.match(/\d+/);
        if (stepMatch) {
            document.getElementById('step-count').innerText = stepMatch[0];
        }

        speak(aiMessage);

    } catch (error) {
        console.error("Detection Error:", error);
        document.getElementById('status-text').innerText = "AI Offline";
    }
}

function startDetectionLoop() {
    if (!isSystemActive) return;

    // Run a real visual check every 7 seconds
    // (Don't run too fast or you will hit Groq API limits)
    setInterval(captureAndAnalyze, 7000);
}
