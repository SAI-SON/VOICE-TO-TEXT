// DOM elements
const startRecordingBtn = document.getElementById('startRecording');
const stopRecordingBtn = document.getElementById('stopRecording');
const pauseRecordingBtn = document.getElementById('pauseRecording');
const clearTextBtn = document.getElementById('clearText');
const copyTextBtn = document.getElementById('copyText');
const downloadTextBtn = document.getElementById('downloadText');
const shareTextBtn = document.getElementById('shareText');
const formatTextBtn = document.getElementById('formatText');
const capitalizeTextBtn = document.getElementById('capitalizeText');
const spellCheckBtn = document.getElementById('spellCheck');
const exportTxtBtn = document.getElementById('exportTxt');
const exportDocxBtn = document.getElementById('exportDocx');
const exportPdfBtn = document.getElementById('exportPdf');
const outputText = document.getElementById('outputText');
const statusElement = document.getElementById('status');
const confidenceElement = document.getElementById('confidence');
const confidenceThreshold = document.getElementById('confidenceThreshold');
const confidenceValue = document.getElementById('confidenceValue');
const autoPunctuation = document.getElementById('autoPunctuation');
const autoScroll = document.getElementById('autoScroll');
const wordCountElement = document.getElementById('wordCount');
const darkModeToggle = document.getElementById('darkModeToggle');
const settingsToggle = document.getElementById('settingsToggle');
const languageSelect = document.getElementById('languageSelect');
const visualizer = document.getElementById('visualizer');
const toast = document.getElementById('toast');

// Speech recognition setup
let recognition;
let isRecording = false;
let isPaused = false;
let transcript = '';
let audioContext;
let analyser;
let microphone;
let canvasContext;
let animationId;
let lastPunctuationIndex = 0;
let confidenceScore = 1.0;

// Initialize speech recognition
function initSpeechRecognition() {
    // Check if the browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.', 'error');
        startRecordingBtn.disabled = true;
        return;
    }

    // Create speech recognition instance
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = languageSelect.value; // Get language from select element

    // Event handlers
    recognition.onstart = () => {
        isRecording = true;
        isPaused = false;
        updateUI();
        setupAudioVisualization();
    };

    recognition.onend = () => {
        if (isRecording && !isPaused) {
            // If still recording but recognition stopped, restart it
            recognition.start();
        } else {
            stopAudioVisualization();
        }
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        let hadResults = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
                confidenceScore = result[0].confidence;
                updateConfidenceMeter(confidenceScore);
                
                // Only add results that meet confidence threshold
                if (confidenceScore >= parseFloat(confidenceThreshold.value)) {
                    let transcriptPart = result[0].transcript;
                    
                    // Apply auto-punctuation if enabled
                    if (autoPunctuation.checked) {
                        transcriptPart = applyAutoPunctuation(transcriptPart);
                    }
                    
                    finalTranscript += transcriptPart;
                    hadResults = true;
                }
            } else {
                interimTranscript += result[0].transcript;
                hadResults = true;
            }
        }

        // Update transcript with final results
        if (finalTranscript) {
            transcript += finalTranscript + ' ';
            outputText.value = transcript;
            updateWordCount();
            
            // Auto scroll to bottom if enabled
            if (autoScroll.checked) {
                outputText.scrollTop = outputText.scrollHeight;
            }
        }

        // Show interim results
        if (interimTranscript) {
            outputText.value = transcript + interimTranscript;
        }
        
        // If we had results but nothing met the confidence threshold, show feedback
        if (hadResults && !finalTranscript && !interimTranscript) {
            showToast('Speech detected but below confidence threshold. Try speaking more clearly.', 'warning');
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        statusElement.textContent = `Error: ${event.error}`;
        showToast(`Recognition error: ${event.error}`, 'error');
        stopRecording();
    };
}

// Apply basic auto-punctuation to text
function applyAutoPunctuation(text) {
    if (!text) return text;
    
    // Capitalize first letter of sentences
    text = text.trim();
    if (text && (transcript.endsWith('.') || transcript.endsWith('!') || transcript.endsWith('?') || transcript === '')) {
        text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    
    // Add periods for natural pauses (if text doesn't already end with punctuation)
    const lastChar = text.trim().slice(-1);
    if (!['.', ',', '!', '?', ';', ':'].includes(lastChar)) {
        // Check for natural sentence endings by looking for common patterns
        const sentenceEndingPatterns = [
            /\b(okay|so|well|anyway|anyhow|thus|therefore|hence|consequently|in conclusion)\b$/i,
            /\b(first|second|third|fourth|fifth|finally|lastly)\b$/i,
            /\b(for example|for instance|namely|specifically|in particular)\b$/i
        ];
        
        for (const pattern of sentenceEndingPatterns) {
            if (pattern.test(text.trim())) {
                text += '.';
                break;
            }
        }
    }
    
    return text;
}

// Start recording
function startRecording() {
    transcript = outputText.value || '';
    lastPunctuationIndex = transcript.length;
    
    // Update language setting before starting
    if (recognition) {
        recognition.lang = languageSelect.value;
    }
    
    try {
        recognition.start();
        statusElement.textContent = `Listening in ${getLanguageName(languageSelect.value)}...`;
        statusElement.classList.add('recording');
        showToast('Recording started', 'success');
    } catch (error) {
        console.error('Error starting recognition:', error);
        showToast(`Failed to start recording: ${error.message}`, 'error');
    }
}

// Stop recording
function stopRecording() {
    isRecording = false;
    isPaused = false;
    if (recognition) {
        recognition.stop();
    }
    stopAudioVisualization();
    updateUI();
    showToast('Recording stopped', 'info');
}

// Pause recording
function pauseRecording() {
    if (isRecording && !isPaused) {
        isPaused = true;
        if (recognition) {
            recognition.stop();
        }
        stopAudioVisualization();
        updateUI();
        showToast('Recording paused', 'info');
    } else if (isRecording && isPaused) {
        isPaused = false;
        try {
            recognition.start();
            setupAudioVisualization();
            updateUI();
            showToast('Recording resumed', 'success');
        } catch (error) {
            console.error('Error resuming recognition:', error);
            showToast(`Failed to resume: ${error.message}`, 'error');
        }
    }
}

// Clear text
function clearText() {
    transcript = '';
    outputText.value = '';
    updateWordCount();
    updateUI();
    showToast('Text cleared', 'info');
}

// Copy text to clipboard
function copyToClipboard() {
    if (!outputText.value.trim()) {
        showToast('Nothing to copy', 'warning');
        return;
    }
    
    outputText.select();
    document.execCommand('copy');
    
    // Visual feedback
    showToast('Text copied to clipboard', 'success');
}

// Download text as a file
function downloadText(format = 'txt') {
    if (!outputText.value.trim()) {
        showToast('Nothing to download', 'warning');
        return;
    }
    
    // Create a blob with the text content
    const blob = new Blob([outputText.value], { type: 'text/plain' });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Create a filename with date and time
    const now = new Date();
    const fileName = `voice-text-${now.getFullYear()}-${(now.getMonth() + 1)
        .toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now
        .getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}.${format}`;
    
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Visual feedback
    showToast(`Text downloaded as ${format.toUpperCase()} file`, 'success');
}

// Format text
function formatText() {
    if (!outputText.value.trim()) {
        showToast('No text to format', 'warning');
        return;
    }
    
    let text = outputText.value;
    
    // Basic text formatting
    
    // Fix spaces before punctuation
    text = text.replace(/ +([.,;:!?])/g, '$1');
    
    // Add space after punctuation if not already present
    text = text.replace(/([.,;:!?])([a-zA-Z])/g, '$1 $2');
    
    // Remove multiple spaces
    text = text.replace(/ +/g, ' ');
    
    // Fix capitalization at the start of sentences
    text = text.replace(/([.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    
    // Make sure the first character is capitalized
    text = text.charAt(0).toUpperCase() + text.slice(1);
    
    // Update text
    outputText.value = text;
    transcript = text;
    
    showToast('Text formatted', 'success');
}

// Capitalize sentences
function capitalizeText() {
    if (!outputText.value.trim()) {
        showToast('No text to capitalize', 'warning');
        return;
    }
    
    let text = outputText.value;
    
    // Basic sentence capitalization
    text = text.replace(/([.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    text = text.charAt(0).toUpperCase() + text.slice(1);
    
    // Update text
    outputText.value = text;
    transcript = text;
    
    showToast('Text capitalized', 'success');
}

// Spell check highlighting
function spellCheck() {
    if (!outputText.value.trim()) {
        showToast('No text to check spelling', 'warning');
        return;
    }
    
    // Toggle spellcheck attribute
    outputText.spellcheck = !outputText.spellcheck;
    
    // Force the browser to re-check spelling
    const text = outputText.value;
    outputText.value = '';
    setTimeout(() => {
        outputText.value = text;
        outputText.focus();
    }, 10);
    
    showToast(
        outputText.spellcheck ? 'Spell check enabled' : 'Spell check disabled', 
        outputText.spellcheck ? 'success' : 'info'
    );
}

// Share text
function shareText() {
    if (!outputText.value.trim()) {
        showToast('No text to share', 'warning');
        return;
    }
    
    if (navigator.share) {
        navigator.share({
            title: 'Voice to Text Transcription',
            text: outputText.value
        })
        .then(() => showToast('Shared successfully', 'success'))
        .catch(error => {
            console.error('Error sharing:', error);
            showToast(`Couldn't share: ${error.message}`, 'error');
        });
    } else {
        showToast('Web Share API not supported in your browser', 'warning');
        copyToClipboard(); // Fallback to copy
    }
}

// Get language name from code
function getLanguageName(langCode) {
    const options = languageSelect.options;
    for (let i = 0; i < options.length; i++) {
        if (options[i].value === langCode) {
            return options[i].text;
        }
    }
    return langCode;
}

// Update confidence meter display
function updateConfidenceMeter(confidence) {
    // Update the visual confidence meter
    const percentage = Math.round(confidence * 100);
    confidenceElement.style.width = `${percentage}%`;
    
    // Set color based on confidence level
    if (percentage > 80) {
        confidenceElement.style.backgroundColor = '#34a853'; // Green for high confidence
    } else if (percentage > 60) {
        confidenceElement.style.backgroundColor = '#fbbc05'; // Yellow for medium confidence
    } else {
        confidenceElement.style.backgroundColor = '#ea4335'; // Red for low confidence
    }
}

// Update word count
function updateWordCount() {
    const text = outputText.value.trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    wordCountElement.textContent = wordCount;
}

// Setup audio visualization
function setupAudioVisualization() {
    if (!visualizer) return;
    
    try {
        // Check if we need to create a new audio context
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            canvasContext = visualizer.getContext('2d');
        }
        
        // Setup canvas
        visualizer.width = visualizer.offsetWidth;
        visualizer.height = visualizer.offsetHeight;
        
        // Get microphone access
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                microphone = audioContext.createMediaStreamSource(stream);
                microphone.connect(analyser);
                
                // Start visualizing
                visualize();
                visualizer.classList.add('active');
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                showToast(`Couldn't access microphone: ${error.message}`, 'error');
            });
    } catch (error) {
        console.error('Error setting up audio visualization:', error);
    }
}

// Stop audio visualization
function stopAudioVisualization() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    if (microphone) {
        microphone.disconnect();
        microphone = null;
    }
    
    if (visualizer) {
        visualizer.classList.remove('active');
        // Clear canvas
        if (canvasContext) {
            canvasContext.clearRect(0, 0, visualizer.width, visualizer.height);
        }
    }
}

// Visualize audio
function visualize() {
    if (!analyser || !canvasContext) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        animationId = requestAnimationFrame(draw);
        
        analyser.getByteFrequencyData(dataArray);
        
        canvasContext.clearRect(0, 0, visualizer.width, visualizer.height);
        canvasContext.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-color') || '#4285f4';
        
        const barWidth = (visualizer.width / bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * visualizer.height;
            
            canvasContext.fillRect(x, visualizer.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }
    
    draw();
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    showToast(isDarkMode ? 'Dark mode enabled' : 'Light mode enabled', 'info');
}

// Toggle settings panel
function toggleSettings() {
    const settingsContent = document.querySelector('.settings-content');
    settingsContent.classList.toggle('open');
    
    const chevron = settingsToggle.querySelector('.fa-chevron-down');
    chevron.classList.toggle('fa-chevron-up');
}

// Show toast notification
function showToast(message, type = 'info') {
    if (!toast) return;
    
    // Clear any existing timeout
    clearTimeout(toast.timeout);
    
    // Set toast class based on type
    toast.className = 'toast';
    toast.classList.add(type);
    
    // Set toast message
    toast.textContent = message;
    
    // Show toast
    toast.classList.add('show');
    
    // Hide toast after 3 seconds
    toast.timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Update UI based on current state
function updateUI() {
    startRecordingBtn.disabled = isRecording;
    stopRecordingBtn.disabled = !isRecording;
    pauseRecordingBtn.disabled = !isRecording;
    
    if (isPaused) {
        pauseRecordingBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        pauseRecordingBtn.classList.add('resume');
        statusElement.textContent = 'Paused';
        statusElement.classList.remove('recording');
    } else {
        pauseRecordingBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        pauseRecordingBtn.classList.remove('resume');
    }
    
    if (isRecording && !isPaused) {
        statusElement.textContent = `Listening in ${getLanguageName(languageSelect.value)}...`;
        statusElement.classList.add('recording');
    } else if (!isRecording) {
        statusElement.textContent = 'Ready';
        statusElement.classList.remove('recording');
    }
    
    // Disable language selection during recording
    languageSelect.disabled = isRecording;
    confidenceThreshold.disabled = isRecording;
    
    // Update word count
    updateWordCount();
}

// Export as DOCX (simulation)
function exportAsDocx() {
    if (!outputText.value.trim()) {
        showToast('No text to export', 'warning');
        return;
    }
    
    showToast('DOCX export would require additional libraries', 'info');
    downloadText('txt');
}

// Export as PDF (simulation)
function exportAsPdf() {
    if (!outputText.value.trim()) {
        showToast('No text to export', 'warning');
        return;
    }
    
    showToast('PDF export would require additional libraries', 'info');
    downloadText('txt');
}

// Event listeners
startRecordingBtn.addEventListener('click', startRecording);
stopRecordingBtn.addEventListener('click', stopRecording);
pauseRecordingBtn.addEventListener('click', pauseRecording);
clearTextBtn.addEventListener('click', clearText);
copyTextBtn.addEventListener('click', copyToClipboard);
downloadTextBtn.addEventListener('click', () => downloadText('txt'));
shareTextBtn.addEventListener('click', shareText);
formatTextBtn.addEventListener('click', formatText);
capitalizeTextBtn.addEventListener('click', capitalizeText);
spellCheckBtn.addEventListener('click', spellCheck);
exportTxtBtn.addEventListener('click', (e) => {
    e.preventDefault();
    downloadText('txt');
});
exportDocxBtn.addEventListener('click', (e) => {
    e.preventDefault();
    exportAsDocx();
});
exportPdfBtn.addEventListener('click', (e) => {
    e.preventDefault();
    exportAsPdf();
});

// Settings event listeners
languageSelect.addEventListener('change', () => {
    if (isRecording) {
        // Restart recognition with new language
        stopRecording();
        startRecording();
    }
});

confidenceThreshold.addEventListener('input', () => {
    confidenceValue.textContent = confidenceThreshold.value;
});

darkModeToggle.addEventListener('change', toggleDarkMode);
settingsToggle.addEventListener('click', toggleSettings);

// Text area events
outputText.addEventListener('input', updateWordCount);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize speech recognition
    initSpeechRecognition();
    
    // Apply saved dark mode setting
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
    
    // Initial UI update
    updateUI();
    
    // Set initial confidence value display
    confidenceValue.textContent = confidenceThreshold.value;
    
    // Set up visualizer size
    if (visualizer) {
        visualizer.width = visualizer.offsetWidth;
        visualizer.height = visualizer.offsetHeight;
    }
}); 