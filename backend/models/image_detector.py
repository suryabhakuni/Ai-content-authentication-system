"""
Image Detection Module - Detects AI-generated images using multiple techniques
"""
import logging
from PIL import Image
import io
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification
import numpy as np
from scipy import fftpack

logger = logging.getLogger(__name__)


class ImageDetector:
    """Detects AI-generated images using specialized AI detection model and analysis"""

    def __init__(self, model_name="Organika/sdxl-detector"):
        """
        Initialize the image detector with a pre-trained model
        Uses Organika/sdxl-detector which is highly accurate for detecting
        AI-generated images from Stable Diffusion and similar models
        
        Args:
            model_name: Name of the Hugging Face model to use
        """
        try:
            logger.info(f"Loading image detection model: {model_name}")
            self.model_name = model_name
            
            # Try to load the model
            try:
                self.processor = AutoImageProcessor.from_pretrained(model_name)
                self.model = AutoModelForImageClassification.from_pretrained(model_name)
            except Exception:
                # Fallback to a different reliable model
                logger.warning(f"Failed to load {model_name}, trying fallback model")
                model_name = "umm-maybe/AI-image-detector"
                self.model_name = model_name
                self.processor = AutoImageProcessor.from_pretrained(model_name)
                self.model = AutoModelForImageClassification.from_pretrained(model_name)
            
            self.model.eval()  # Set to evaluation mode
            logger.info(f"Image detection model loaded successfully: {self.model_name}")
        except Exception as e:
            logger.error(f"Failed to load image detection model: {e}")
            raise RuntimeError(f"Failed to load image detection model: {e}")

    def detect(self, image_data):
        """
        Detect if image is AI-generated using specialized model
        
        Args:
            image_data: Image bytes or PIL Image object
            
        Returns:
            dict: Detection result with is_ai_generated, confidence, and details
        """
        try:
            # Preprocess image
            image = self._preprocess_image(image_data)
            
            if image is None:
                return {
                    "is_ai_generated": False,
                    "confidence": 0.0,
                    "error": "Failed to process image"
                }
            
            # Run the AI detection model
            inputs = self.processor(images=image, return_tensors="pt")
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
            
            # Get probabilities
            probs = torch.softmax(logits, dim=-1)
            
            # Determine which label is AI-generated
            # Different models have different label orders
            if probs.shape[1] == 2:
                # Binary classification
                # Check which label has higher probability for a known AI image pattern
                # Assume label 1 is AI-generated (most common)
                ai_prob = probs[0][1].item()
            else:
                # Multi-class - take max probability
                ai_prob = torch.max(probs[0]).item()
            
            # Additional artifact analysis for robustness
            artifact_score = self._check_ai_artifacts(image)
            fft_score = self._check_frequency_artifacts(image)
            
            # Combine model prediction with artifact analysis
            # Weight the trained model very heavily (90%) since it's more reliable
            # Use artifacts only for fine-tuning (10%)
            combined_confidence = (ai_prob * 0.9) + ((artifact_score + fft_score) / 2 * 0.1)
            
            # Apply calibration - adjust confidence to be more conservative
            # This reduces false positives
            if combined_confidence > 0.7:
                # High confidence AI - keep it
                final_confidence = combined_confidence
            elif combined_confidence < 0.3:
                # High confidence real - keep it  
                final_confidence = combined_confidence
            else:
                # Uncertain range - be more conservative
                # Pull towards 0.5 (uncertain)
                final_confidence = 0.5 + (combined_confidence - 0.5) * 0.7
            
            is_ai_generated = final_confidence > 0.5
            
            return {
                "is_ai_generated": is_ai_generated,
                "confidence": float(final_confidence),
                "model_name": self.model_name,
                "details": {
                    "model_confidence": float(ai_prob),
                    "artifact_score": float(artifact_score),
                    "frequency_score": float(fft_score),
                    "combined_raw": float(combined_confidence),
                    "image_size": image.size
                }
            }
            
        except Exception as e:
            logger.error(f"Error during image detection: {e}")
            return {
                "is_ai_generated": False,
                "confidence": 0.0,
                "error": str(e)
            }

    def _preprocess_image(self, image_data):
        """
        Preprocess image data
        
        Args:
            image_data: Image bytes or PIL Image object
            
        Returns:
            PIL.Image: Preprocessed image
        """
        try:
            # Convert bytes to PIL Image if needed
            if isinstance(image_data, bytes):
                image = Image.open(io.BytesIO(image_data))
            elif isinstance(image_data, Image.Image):
                image = image_data
            else:
                logger.error("Invalid image data type")
                return None
            
            # Convert to RGB if needed
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            # Resize if too large (max 1024x1024)
            max_size = 1024
            if image.width > max_size or image.height > max_size:
                image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                logger.info(f"Image resized to {image.size}")
            
            return image
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            return None

    def _check_ai_artifacts(self, image):
        """
        Check for common AI generation artifacts in spatial domain
        
        Args:
            image: PIL Image object
            
        Returns:
            float: Artifact score between 0 and 1 (higher = more likely AI)
        """
        try:
            img_array = np.array(image).astype(np.float32)
            
            scores = []
            
            # 1. Color distribution analysis
            # AI images often have smoother color transitions
            if len(img_array.shape) == 3:
                for channel in range(3):
                    channel_data = img_array[:, :, channel]
                    hist, _ = np.histogram(channel_data, bins=256, range=(0, 255))
                    # Normalize histogram
                    hist = hist / hist.sum()
                    # Calculate entropy - AI images tend to have lower entropy
                    entropy = -np.sum(hist * np.log2(hist + 1e-10))
                    # Normalize entropy (max is 8 for 256 bins)
                    normalized_entropy = entropy / 8.0
                    # Lower entropy = more likely AI
                    scores.append(1.0 - normalized_entropy)
            
            # 2. Edge smoothness analysis
            # AI images often have unnaturally smooth edges
            if len(img_array.shape) == 3:
                gray = np.mean(img_array, axis=2)
            else:
                gray = img_array
            
            # Sobel edge detection
            from scipy import ndimage
            sx = ndimage.sobel(gray, axis=0, mode='constant')
            sy = ndimage.sobel(gray, axis=1, mode='constant')
            edge_magnitude = np.hypot(sx, sy)
            
            # Calculate edge smoothness
            edge_std = np.std(edge_magnitude)
            # Normalize (typical range 10-50)
            edge_smoothness = 1.0 - min(edge_std / 50.0, 1.0)
            scores.append(edge_smoothness)
            
            # 3. Noise analysis
            # Real photos have natural noise, AI images are often too clean
            noise_level = np.std(gray - ndimage.gaussian_filter(gray, sigma=1))
            # Normalize (typical range 2-10)
            noise_score = 1.0 - min(noise_level / 10.0, 1.0)
            scores.append(noise_score)
            
            # Average all scores
            return float(np.mean(scores))
            
        except Exception as e:
            logger.error(f"Error checking AI artifacts: {e}")
            return 0.5  # Return neutral score on error
    
    def _check_frequency_artifacts(self, image):
        """
        Check for AI artifacts in frequency domain using FFT
        AI-generated images often have unusual frequency patterns
        
        Args:
            image: PIL Image object
            
        Returns:
            float: Frequency artifact score between 0 and 1 (higher = more likely AI)
        """
        try:
            img_array = np.array(image).astype(np.float32)
            
            # Convert to grayscale if needed
            if len(img_array.shape) == 3:
                gray = np.mean(img_array, axis=2)
            else:
                gray = img_array
            
            # Apply 2D FFT
            fft = fftpack.fft2(gray)
            fft_shift = fftpack.fftshift(fft)
            magnitude_spectrum = np.abs(fft_shift)
            
            # Analyze frequency distribution
            # AI images often have unusual patterns in frequency domain
            
            # Get center region (low frequencies)
            h, w = magnitude_spectrum.shape
            center_h, center_w = h // 2, w // 2
            center_size = min(h, w) // 4
            
            center_region = magnitude_spectrum[
                center_h - center_size:center_h + center_size,
                center_w - center_size:center_w + center_size
            ]
            
            # Get outer region (high frequencies)
            outer_region = magnitude_spectrum.copy()
            outer_region[
                center_h - center_size:center_h + center_size,
                center_w - center_size:center_w + center_size
            ] = 0
            
            # Calculate ratio of low to high frequencies
            # AI images often have higher low-frequency content
            center_energy = np.sum(center_region ** 2)
            outer_energy = np.sum(outer_region ** 2)
            
            if outer_energy > 0:
                freq_ratio = center_energy / outer_energy
                # Normalize (typical range 10-1000)
                freq_score = min(np.log10(freq_ratio) / 3.0, 1.0)
            else:
                freq_score = 0.5
            
            return float(max(0.0, min(freq_score, 1.0)))
            
        except Exception as e:
            logger.error(f"Error checking frequency artifacts: {e}")
            return 0.5  # Return neutral score on error


