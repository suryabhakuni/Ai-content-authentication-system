"""
Text Detection Module - Detects AI-generated text using transformer models
"""
import logging
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

logger = logging.getLogger(__name__)


class TextDetector:
    """Detects AI-generated text using RoBERTa-based model"""

    def __init__(self, model_name="Hello-SimpleAI/chatgpt-detector-roberta"):
        """
        Initialize the text detector with a pre-trained model
        Uses Hello-SimpleAI/chatgpt-detector-roberta which is specifically trained
        to detect ChatGPT-generated text with high accuracy
        
        Args:
            model_name: Name of the Hugging Face model to use
        """
        try:
            logger.info(f"Loading text detection model: {model_name}")
            self.model_name = model_name
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
            self.model.eval()  # Set to evaluation mode
            logger.info("Text detection model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load text detection model: {e}")
            raise RuntimeError(f"Failed to load text detection model: {e}")

    def detect(self, text):
        """
        Detect if text is AI-generated
        
        Args:
            text: Input text to analyze
            
        Returns:
            dict: Detection result with is_ai_generated and confidence
        """
        try:
            # Preprocess text
            cleaned_text = self._preprocess(text)
            
            if not cleaned_text:
                return {
                    "is_ai_generated": False,
                    "confidence": 0.0,
                    "error": "Empty text after preprocessing"
                }
            
            # Tokenize input
            inputs = self.tokenizer(
                cleaned_text,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True
            )
            
            # Run inference
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
            
            # Calculate confidence and prediction
            confidence = self._calculate_confidence(logits)
            is_ai_generated = confidence > 0.5
            
            return {
                "is_ai_generated": is_ai_generated,
                "confidence": float(confidence),
                "model_name": self.model_name
            }
            
        except Exception as e:
            logger.error(f"Error during text detection: {e}")
            return {
                "is_ai_generated": False,
                "confidence": 0.0,
                "error": str(e)
            }

    def _preprocess(self, text):
        """
        Clean and preprocess input text
        
        Args:
            text: Raw input text
            
        Returns:
            str: Cleaned text
        """
        if not text:
            return ""
        
        # Remove excessive whitespace
        cleaned = " ".join(text.split())
        
        # Truncate if too long (keep first 10000 chars)
        if len(cleaned) > 10000:
            cleaned = cleaned[:10000]
            logger.warning("Text truncated to 10000 characters")
        
        return cleaned

    def _calculate_confidence(self, logits):
        """
        Calculate confidence score from model logits
        
        Args:
            logits: Model output logits
            
        Returns:
            float: Confidence score between 0 and 1
        """
        # Apply softmax to get probabilities
        probs = torch.softmax(logits, dim=-1)
        
        # For Hello-SimpleAI/chatgpt-detector-roberta:
        # Label 0 = Human-written
        # Label 1 = AI-generated (ChatGPT)
        ai_prob = probs[0][1].item() if probs.shape[1] > 1 else probs[0][0].item()
        
        return ai_prob
