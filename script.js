// Common English stop words
const STOP_WORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me'
]);

// DOM Elements
const fileInput = document.getElementById('fileInput');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultsSection = document.getElementById('results');
const errorElement = document.getElementById('error');
const totalWordsElement = document.getElementById('totalWords');
const totalSentencesElement = document.getElementById('totalSentences');
const avgWordLengthElement = document.getElementById('avgWordLength');
const topWordsElement = document.getElementById('topWords');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (!fileInput) {
        console.error('File input element not found');
        return;
    }

    fileInput.addEventListener('change', handleFileSelect);
});

// File Selection Handler
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show loading spinner and hide results
    loadingSpinner.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    errorElement.classList.add('hidden');

    try {
        console.log('Processing file:', file.name);
        const text = await extractTextFromFile(file);
        console.log('Text extracted, length:', text.length);
        
        if (!text.trim()) {
            throw new Error('The file appears to be empty');
        }

        // Process the text
        const stats = analyzeText(text);
        console.log('Analysis complete:', stats);
        
        // Update UI with results
        updateResults(stats);
        
        // Show results section
        resultsSection.classList.remove('hidden');
    } catch (error) {
        console.error('Error processing file:', error);
        showError(error.message);
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

// Text Extraction Functions
async function extractTextFromFile(file) {
    const fileType = file.name.split('.').pop().toLowerCase();
    console.log('Processing file type:', fileType);

    switch (fileType) {
        case 'pdf':
            return await extractTextFromPDF(file);
        case 'doc':
        case 'docx':
            return await extractTextFromWord(file);
        case 'txt':
            return await readTextFile(file);
        default:
            throw new Error('Unsupported file type. Please upload a .txt, .pdf, .doc, or .docx file.');
    }
}

async function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Error reading file'));
        reader.readAsText(file);
    });
}

async function extractTextFromPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let text = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            text += textContent.items.map(item => item.str).join(' ') + '\n';
        }
        
        return text;
    } catch (error) {
        throw new Error('Error processing PDF file: ' + error.message);
    }
}

async function extractTextFromWord(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (error) {
        throw new Error('Error processing Word document: ' + error.message);
    }
}

// Text Analysis Functions
function analyzeText(text) {
    // Count words
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const totalWords = words.length;

    // Count sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const totalSentences = sentences.length;

    // Calculate average word length
    const avgWordLength = totalWords > 0
        ? words.reduce((sum, word) => sum + word.length, 0) / totalWords
        : 0;

    // Get word frequency (excluding stop words)
    const wordFrequency = {};
    words.forEach(word => {
        if (!STOP_WORDS.has(word)) {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
    });

    // Get top 5 words
    const topWords = Object.entries(wordFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([word, count]) => ({ word, count }));

    return {
        totalWords,
        totalSentences,
        avgWordLength: avgWordLength.toFixed(2),
        topWords
    };
}

// UI Update Functions
function updateResults(stats) {
    totalWordsElement.textContent = stats.totalWords.toLocaleString();
    totalSentencesElement.textContent = stats.totalSentences.toLocaleString();
    avgWordLengthElement.textContent = stats.avgWordLength + ' characters';

    // Update top words list
    topWordsElement.innerHTML = stats.topWords
        .map(({ word, count }) => `<li>${word}: ${count.toLocaleString()} occurrences</li>`)
        .join('');

    // Show results section with animation
    resultsSection.classList.remove('hidden');
    // Use setTimeout to ensure the display: none is removed before adding the visible class
    setTimeout(() => {
        resultsSection.classList.add('visible');
    }, 10);
}

function showError(message) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
} 