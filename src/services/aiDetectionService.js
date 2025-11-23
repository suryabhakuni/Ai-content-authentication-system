/**
 * AI Detection Service - Handles communication with the AI detection backend API
 */
class AIDetectionService {
  constructor() {
    // Get API URL from environment variable or use default
    this.apiUrl =
      import.meta.env.VITE_AI_DETECTION_API_URL || "http://localhost:8000";
    this.enabled = import.meta.env.VITE_AI_DETECTION_ENABLED !== "false";
  }

  /**
   * Check if AI detection is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Check API health status
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.apiUrl}/api/health`);

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Health check error:", error);
      throw this._handleError(error);
    }
  }

  /**
   * Detect if text is AI-generated
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Detection result
   */
  async detectText(text) {
    if (!this.enabled) {
      return this._getMockTextResult(text);
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/detect/text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.detail || `Detection failed: ${response.statusText}`
        );
      }

      const result = await response.json();
      return {
        isAiGenerated: result.is_ai_generated,
        confidence: result.confidence,
        processingTime: result.processing_time,
        modelName: result.model_name,
        details: result.details,
      };
    } catch (error) {
      console.error("Text detection error:", error);
      throw this._handleError(error);
    }
  }

  /**
   * Detect if image is AI-generated
   * @param {File} imageFile - Image file to analyze
   * @returns {Promise<Object>} Detection result
   */
  async detectImage(imageFile) {
    if (!this.enabled) {
      return this._getMockImageResult(imageFile);
    }

    try {
      // Convert image to base64
      const base64Image = await this._convertImageToBase64(imageFile);

      const response = await fetch(`${this.apiUrl}/api/detect/image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.detail || `Detection failed: ${response.statusText}`
        );
      }

      const result = await response.json();
      return {
        isAiGenerated: result.is_ai_generated,
        confidence: result.confidence,
        processingTime: result.processing_time,
        modelName: result.model_name,
        details: result.details,
      };
    } catch (error) {
      console.error("Image detection error:", error);
      throw this._handleError(error);
    }
  }

  /**
   * Convert image file to base64 string
   * @private
   * @param {File} file - Image file
   * @returns {Promise<string>} Base64 encoded image
   */
  _convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(new Error("Failed to read image file"));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Handle and format errors
   * @private
   * @param {Error} error - Original error
   * @returns {Error} Formatted error
   */
  _handleError(error) {
    if (error.message.includes("fetch")) {
      return new Error(
        "Unable to connect to AI detection service. Please ensure the backend is running."
      );
    }

    if (error.message.includes("timeout")) {
      return new Error(
        "Detection request timed out. Please try again with a smaller file."
      );
    }

    return error;
  }

  /**
   * Get mock text detection result (for testing without backend)
   * @private
   * @param {string} text - Text to analyze
   * @returns {Object} Mock result
   */
  _getMockTextResult(text) {
    // Simple heuristic: check for common AI patterns
    const aiPatterns = [
      "as an ai",
      "i don't have personal",
      "i'm sorry, but",
      "it's important to note",
      "in conclusion",
    ];

    const lowerText = text.toLowerCase();
    const hasAiPattern = aiPatterns.some((pattern) =>
      lowerText.includes(pattern)
    );

    return {
      isAiGenerated: hasAiPattern,
      confidence: hasAiPattern ? 0.85 : 0.25,
      processingTime: 0.5,
      modelName: "mock-detector",
      details: { mode: "mock" },
    };
  }

  /**
   * Get mock image detection result (for testing without backend)
   * @private
   * @param {File} imageFile - Image file
   * @returns {Object} Mock result
   */
  _getMockImageResult(imageFile) {
    // Random result for mock
    const isAi = Math.random() > 0.5;

    return {
      isAiGenerated: isAi,
      confidence: isAi ? 0.75 : 0.3,
      processingTime: 1.2,
      modelName: "mock-detector",
      details: {
        mode: "mock",
        imageSize: [imageFile.size, imageFile.size],
      },
    };
  }
}

// Export singleton instance
const aiDetectionService = new AIDetectionService();
export default aiDetectionService;
