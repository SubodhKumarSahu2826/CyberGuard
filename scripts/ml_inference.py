#!/usr/bin/env python3
"""
ML Inference Script for Real-time Cyber Attack Detection
Loads trained models and provides prediction capabilities
"""

import joblib
import json
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
import os
from datetime import datetime

class CyberAttackPredictor:
    def __init__(self, model_version: str = "1.0.0"):
        self.model_version = model_version
        self.models = {}
        self.scaler = None
        self.label_encoder = None
        self.metadata = None
        self.feature_columns = []
        self.attack_types = []
        
        self.load_models()
    
    def load_models(self):
        """Load trained models and preprocessors"""
        models_dir = "models"
        
        try:
            # Load metadata
            metadata_path = f"{models_dir}/metadata_v{self.model_version}.json"
            with open(metadata_path, 'r') as f:
                self.metadata = json.load(f)
            
            self.feature_columns = self.metadata['feature_columns']
            self.attack_types = self.metadata['attack_types']
            
            # Load models
            for model_type in self.metadata['model_types']:
                model_path = f"{models_dir}/{model_type}_v{self.model_version}.pkl"
                if os.path.exists(model_path):
                    self.models[model_type] = joblib.load(model_path)
                    print(f"Loaded {model_type} model")
            
            # Load preprocessors
            scaler_path = f"{models_dir}/scaler_v{self.model_version}.pkl"
            self.scaler = joblib.load(scaler_path)
            
            encoder_path = f"{models_dir}/label_encoder_v{self.model_version}.pkl"
            self.label_encoder = joblib.load(encoder_path)
            
            print(f"Successfully loaded models version {self.model_version}")
            
        except Exception as e:
            print(f"Error loading models: {e}")
            raise
    
    def extract_features(self, url: str, additional_features: Optional[Dict] = None) -> Dict:
        """Extract features from URL for prediction"""
        try:
            from urllib.parse import urlparse, parse_qs
            import re
            import math
            
            parsed = urlparse(url)
            domain = parsed.netloc
            path = parsed.path
            query = parsed.query
            
            # Basic features
            features = {
                'url_length': len(url),
                'domain_length': len(domain),
                'path_length': len(path),
                'query_length': len(query),
                'special_char_count': len(re.findall(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', url)),
                'digit_count': len(re.findall(r'\d', url)),
                'path_depth': len([p for p in path.split('/') if p]),
                'subdomain_count': max(0, len(domain.split('.')) - 2),
                'parameter_count': len(parse_qs(query)),
                'encoded_chars_count': len(re.findall(r'%[0-9A-Fa-f]{2}', url)),
                'frequency_score': self._calculate_frequency_score(url),
                'suspicious_keyword_count': self._count_suspicious_keywords(url)
            }
            
            # Calculate entropy
            features['entropy'] = self._calculate_entropy(url)
            
            # Add additional features if provided
            if additional_features:
                features.update(additional_features)
            
            return features
            
        except Exception as e:
            print(f"Error extracting features: {e}")
            # Return default features
            return {col: 0 for col in self.feature_columns}
    
    def _calculate_entropy(self, text: str) -> float:
        """Calculate Shannon entropy of text"""
        if not text:
            return 0.0
        
        # Count character frequencies
        char_counts = {}
        for char in text:
            char_counts[char] = char_counts.get(char, 0) + 1
        
        # Calculate entropy
        entropy = 0.0
        text_length = len(text)
        
        for count in char_counts.values():
            probability = count / text_length
            entropy -= probability * math.log2(probability)
        
        return entropy
    
    def _calculate_frequency_score(self, url: str) -> float:
        """Calculate frequency score based on common patterns"""
        common_patterns = ['.com', '.org', '.net', 'www.', 'http', 'https']
        score = 0.0
        
        for pattern in common_patterns:
            if pattern in url.lower():
                score += 0.1
        
        return min(score, 1.0)
    
    def _count_suspicious_keywords(self, url: str) -> int:
        """Count suspicious keywords in URL"""
        suspicious_keywords = [
            'admin', 'root', 'password', 'passwd', 'login', 'cmd', 'shell',
            'union', 'select', 'insert', 'delete', 'drop', 'exec', 'script',
            'alert', 'prompt', 'confirm', 'javascript', 'vbscript',
            '../', '..\\', '/etc/', '/proc/', '/var/',
            '|', '&', ';', '`', '$('
        ]
        
        url_lower = url.lower()
        count = 0
        
        for keyword in suspicious_keywords:
            if keyword in url_lower:
                count += 1
        
        return count
    
    def predict(self, url: str, model_type: str = 'ensemble') -> Dict:
        """Predict attack type and confidence for a URL"""
        try:
            start_time = datetime.now()
            
            # Extract features
            features = self.extract_features(url)
            
            # Prepare feature vector
            feature_vector = []
            for col in self.feature_columns:
                feature_vector.append(features.get(col, 0))
            
            # Scale features
            feature_vector = np.array(feature_vector).reshape(1, -1)
            feature_vector_scaled = self.scaler.transform(feature_vector)
            
            # Get model
            if model_type not in self.models:
                model_type = 'ensemble'  # Fallback to ensemble
            
            model = self.models[model_type]
            
            # Make prediction
            prediction = model.predict(feature_vector_scaled)[0]
            probabilities = model.predict_proba(feature_vector_scaled)[0]
            
            # Convert prediction back to attack type
            attack_type = self.label_encoder.inverse_transform([prediction])[0]
            confidence = float(np.max(probabilities))
            
            # Get all probabilities
            all_probabilities = {}
            for i, prob in enumerate(probabilities):
                attack_name = self.label_encoder.inverse_transform([i])[0]
                all_probabilities[attack_name] = float(prob)
            
            # Determine risk level
            risk_level = self._determine_risk_level(attack_type, confidence)
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            result = {
                'url': url,
                'predicted_attack_type': attack_type,
                'confidence': confidence,
                'risk_level': risk_level,
                'all_probabilities': all_probabilities,
                'features': features,
                'model_used': model_type,
                'model_version': self.model_version,
                'processing_time_ms': processing_time,
                'timestamp': datetime.now().isoformat()
            }
            
            return result
            
        except Exception as e:
            print(f"Prediction error: {e}")
            return {
                'url': url,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def _determine_risk_level(self, attack_type: str, confidence: float) -> str:
        """Determine risk level based on attack type and confidence"""
        if attack_type == 'benign':
            return 'low'
        
        # High-risk attack types
        high_risk_attacks = ['sqli', 'xss', 'command_injection', 'web_shell', 'xxe']
        
        if attack_type in high_risk_attacks:
            if confidence >= 0.9:
                return 'critical'
            elif confidence >= 0.7:
                return 'high'
            else:
                return 'medium'
        else:
            if confidence >= 0.9:
                return 'high'
            elif confidence >= 0.7:
                return 'medium'
            else:
                return 'low'
    
    def batch_predict(self, urls: List[str], model_type: str = 'ensemble') -> List[Dict]:
        """Predict attack types for multiple URLs"""
        results = []
        
        for url in urls:
            result = self.predict(url, model_type)
            results.append(result)
        
        return results
    
    def get_model_info(self) -> Dict:
        """Get information about loaded models"""
        return {
            'version': self.model_version,
            'available_models': list(self.models.keys()),
            'feature_columns': self.feature_columns,
            'attack_types': self.attack_types,
            'metadata': self.metadata
        }

def main():
    """Test the predictor with sample URLs"""
    print("Testing ML Inference Engine")
    print("=" * 40)
    
    try:
        # Initialize predictor
        predictor = CyberAttackPredictor()
        
        # Test URLs
        test_urls = [
            "https://example.com/login",
            "https://vulnerable.com/search?q=<script>alert(1)</script>",
            "https://target.com/file.php?path=../../../etc/passwd",
            "https://site.com/admin/login.php?user=admin&pass=123",
            "https://normal-site.com/about-us",
            "https://shop.com/products?category=electronics"
        ]
        
        print(f"Testing {len(test_urls)} URLs...")
        
        for url in test_urls:
            result = predictor.predict(url)
            
            if 'error' not in result:
                print(f"\nURL: {url}")
                print(f"Predicted: {result['predicted_attack_type']}")
                print(f"Confidence: {result['confidence']:.4f}")
                print(f"Risk Level: {result['risk_level']}")
                print(f"Processing Time: {result['processing_time_ms']:.2f}ms")
            else:
                print(f"\nError processing {url}: {result['error']}")
        
        # Model info
        print(f"\nModel Info:")
        info = predictor.get_model_info()
        print(f"Version: {info['version']}")
        print(f"Available Models: {info['available_models']}")
        print(f"Supported Attack Types: {len(info['attack_types'])}")
        
    except Exception as e:
        print(f"Error: {e}")
        print("Please run ml_training.py first to train the models.")

if __name__ == "__main__":
    main()
