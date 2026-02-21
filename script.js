function speak(text) {
    // 1. Cancel any current speech so it doesn't overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 2. Find the voices available on the device
    const voices = window.speechSynthesis.getVoices();
    
    // 3. Set your preferred AI voice (Male/Female logic)
    if (selectedVoice) {
        utterance.voice = voices.find(v => v.name.includes(selectedVoice));
    }

    // 4. Boost volume and clarity for Bluetooth headsets
    utterance.volume = 1.0; 
    utterance.rate = 0.95; // Slightly slower is better for the blind
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
}
