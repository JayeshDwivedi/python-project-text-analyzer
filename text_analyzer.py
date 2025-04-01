#!/usr/bin/env python3
import argparse
import re
from collections import Counter
from typing import List, Tuple
import sys
import os
from pathlib import Path
import PyPDF2
import docx
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Common English stop words
STOP_WORDS = {
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me'
}

def read_text_file(file_path: str) -> str:
    """Read and return the contents of a text file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        logger.error(f"Error reading text file: {e}")
        raise

def read_pdf_file(file_path: str) -> str:
    """Read and return the contents of a PDF file."""
    try:
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        logger.error(f"Error reading PDF file: {e}")
        raise

def read_word_file(file_path: str) -> str:
    """Read and return the contents of a Word document."""
    try:
        doc = docx.Document(file_path)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])
    except Exception as e:
        logger.error(f"Error reading Word file: {e}")
        raise

def count_words(text: str) -> int:
    """Count the total number of words in the text."""
    words = re.findall(r'\b\w+\b', text.lower())
    return len(words)

def get_word_frequency(text: str, top_n: int = 5) -> List[Tuple[str, int]]:
    """Get the top N most frequent words, excluding stop words."""
    words = re.findall(r'\b\w+\b', text.lower())
    # Filter out stop words and count frequencies
    word_counts = Counter(word for word in words if word not in STOP_WORDS)
    return word_counts.most_common(top_n)

def calculate_average_word_length(text: str) -> float:
    """Calculate the average word length in the text."""
    words = re.findall(r'\b\w+\b', text.lower())
    if not words:
        return 0.0
    return sum(len(word) for word in words) / len(words)

def count_sentences(text: str) -> int:
    """Count the number of sentences in the text."""
    # Split on sentence endings followed by space or newline
    sentences = re.split(r'[.!?]+[\s\n]+', text)
    return len(sentences)

def generate_report(file_path: str) -> None:
    """Generate and display a text analysis report."""
    try:
        # Determine file type and read content
        file_extension = Path(file_path).suffix.lower()
        if file_extension == '.txt':
            text = read_text_file(file_path)
        elif file_extension == '.pdf':
            text = read_pdf_file(file_path)
        elif file_extension in ['.doc', '.docx']:
            text = read_word_file(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")
        
        # Calculate statistics
        total_words = count_words(text)
        top_words = get_word_frequency(text)
        avg_word_length = calculate_average_word_length(text)
        total_sentences = count_sentences(text)
        
        # Generate report
        print("\n=== Text Analysis Report ===")
        print(f"File: {file_path}")
        print("\nStatistics:")
        print(f"Total Words: {total_words:,}")
        print(f"Total Sentences: {total_sentences:,}")
        print(f"Average Word Length: {avg_word_length:.2f} characters")
        
        print("\nTop 5 Most Frequent Words (excluding stop words):")
        for word, count in top_words:
            print(f"- {word}: {count:,} occurrences")
            
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(
        description="Analyze a text file, PDF, or Word document and generate a summary report."
    )
    parser.add_argument(
        "file_path",
        help="Path to the file to analyze (supports .txt, .pdf, .doc, .docx)"
    )
    
    args = parser.parse_args()
    generate_report(args.file_path)

if __name__ == "__main__":
    main() 