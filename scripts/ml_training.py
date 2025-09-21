#!/usr/bin/env python3
"""
ML Training Script for Cyber Attack Detection
Trains ensemble models (Random Forest + XGBoost) for URL-based attack detection
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import xgboost as xgb
import joblib
import json
import os
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class CyberAttackMLTrainer:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.label_encoders = {}
        self.feature_columns = [
            'url_length', 'domain_length', 'path_length', 'query_length',
            'special_char_count', 'digit_count', 'entropy', 'path_depth',
            'subdomain_count', 'parameter_count', 'encoded_chars_count',
            'frequency_score', 'suspicious_keyword_count'
        ]
        
    def generate_synthetic_data(self, n_samples=10000):
        """Generate synthetic training data for demonstration"""
        print(f"Generating {n_samples} synthetic training samples...")
        
        np.random.seed(42)
        data = []
        
        # Attack type mapping
        attack_types = [
            'sqli', 'xss', 'directory_traversal', 'command_injection',
            'ssrf', 'file_inclusion', 'credential_stuffing', 'brute_force',
            'http_parameter_pollution', 'xxe', 'web_shell', 'typosquatting'
        ]
        
        for i in range(n_samples):
            # Randomly select attack type (80% attacks, 20% benign)
            is_attack = np.random.random() < 0.8
            
            if is_attack:
                attack_type = np.random.choice(attack_types)
                # Generate features based on attack type
                features = self._generate_attack_features(attack_type)
            else:
                attack_type = 'benign'
                features = self._generate_benign_features()
            
            features['attack_type'] = attack_type
            data.append(features)
        
        return pd.DataFrame(data)
    
    def _generate_attack_features(self, attack_type):
        """Generate features for specific attack types"""
        base_features = {
            'url_length': np.random.normal(150, 50),
            'domain_length': np.random.normal(15, 5),
            'path_length': np.random.normal(30, 15),
            'query_length': np.random.normal(50, 25),
            'special_char_count': np.random.poisson(8),
            'digit_count': np.random.poisson(5),
            'entropy': np.random.normal(4.5, 0.8),
            'path_depth': np.random.poisson(3),
            'subdomain_count': np.random.poisson(1),
            'parameter_count': np.random.poisson(3),
            'encoded_chars_count': np.random.poisson(2),
            'frequency_score': np.random.beta(2, 5),
            'suspicious_keyword_count': np.random.poisson(2)
        }
        
        # Modify features based on attack type
        if attack_type == 'sqli':
            base_features['special_char_count'] += np.random.poisson(5)
            base_features['suspicious_keyword_count'] += np.random.poisson(3)
            base_features['query_length'] += np.random.normal(30, 10)
            
        elif attack_type == 'xss':
            base_features['special_char_count'] += np.random.poisson(8)
            base_features['suspicious_keyword_count'] += np.random.poisson(2)
            base_features['encoded_chars_count'] += np.random.poisson(3)
            
        elif attack_type == 'directory_traversal':
            base_features['path_length'] += np.random.normal(40, 15)
            base_features['path_depth'] += np.random.poisson(2)
            base_features['suspicious_keyword_count'] += np.random.poisson(1)
            
        elif attack_type == 'command_injection':
            base_features['special_char_count'] += np.random.poisson(6)
            base_features['suspicious_keyword_count'] += np.random.poisson(2)
            
        # Ensure positive values
        for key in base_features:
            if key != 'frequency_score':
                base_features[key] = max(0, base_features[key])
            else:
                base_features[key] = max(0, min(1, base_features[key]))
        
        return base_features
    
    def _generate_benign_features(self):
        """Generate features for benign URLs"""
        return {
            'url_length': np.random.normal(80, 20),
            'domain_length': np.random.normal(12, 3),
            'path_length': np.random.normal(20, 8),
            'query_length': np.random.normal(15, 10),
            'special_char_count': np.random.poisson(2),
            'digit_count': np.random.poisson(3),
            'entropy': np.random.normal(3.8, 0.5),
            'path_depth': np.random.poisson(2),
            'subdomain_count': np.random.poisson(0),
            'parameter_count': np.random.poisson(1),
            'encoded_chars_count': np.random.poisson(0),
            'frequency_score': np.random.beta(5, 2),
            'suspicious_keyword_count': 0
        }
    
    def prepare_data(self, df):
        """Prepare data for training"""
        print("Preparing data for training...")
        
        # Separate features and target
        X = df[self.feature_columns].copy()
        y = df['attack_type'].copy()
        
        # Handle missing values
        X = X.fillna(0)
        
        # Scale features
        self.scalers['features'] = StandardScaler()
        X_scaled = self.scalers['features'].fit_transform(X)
        X_scaled = pd.DataFrame(X_scaled, columns=self.feature_columns)
        
        # Encode labels
        self.label_encoders['attack_type'] = LabelEncoder()
        y_encoded = self.label_encoders['attack_type'].fit_transform(y)
        
        return X_scaled, y_encoded, y
    
    def train_random_forest(self, X, y):
        """Train Random Forest model"""
        print("Training Random Forest model...")
        
        # Hyperparameter tuning
        param_grid = {
            'n_estimators': [100, 200, 300],
            'max_depth': [10, 20, None],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4]
        }
        
        rf = RandomForestClassifier(random_state=42, n_jobs=-1)
        grid_search = GridSearchCV(rf, param_grid, cv=3, scoring='f1_weighted', n_jobs=-1)
        grid_search.fit(X, y)
        
        self.models['random_forest'] = grid_search.best_estimator_
        print(f"Best RF parameters: {grid_search.best_params_}")
        
        return grid_search.best_estimator_
    
    def train_xgboost(self, X, y):
        """Train XGBoost model"""
        print("Training XGBoost model...")
        
        # Hyperparameter tuning
        param_grid = {
            'n_estimators': [100, 200, 300],
            'max_depth': [6, 8, 10],
            'learning_rate': [0.01, 0.1, 0.2],
            'subsample': [0.8, 0.9, 1.0]
        }
        
        xgb_model = xgb.XGBClassifier(random_state=42, n_jobs=-1)
        grid_search = GridSearchCV(xgb_model, param_grid, cv=3, scoring='f1_weighted', n_jobs=-1)
        grid_search.fit(X, y)
        
        self.models['xgboost'] = grid_search.best_estimator_
        print(f"Best XGB parameters: {grid_search.best_params_}")
        
        return grid_search.best_estimator_
    
    def create_ensemble(self, X, y):
        """Create ensemble model"""
        print("Creating ensemble model...")
        
        from sklearn.ensemble import VotingClassifier
        
        ensemble = VotingClassifier(
            estimators=[
                ('rf', self.models['random_forest']),
                ('xgb', self.models['xgboost'])
            ],
            voting='soft'
        )
        
        ensemble.fit(X, y)
        self.models['ensemble'] = ensemble
        
        return ensemble
    
    def evaluate_models(self, X_test, y_test, y_test_original):
        """Evaluate all models"""
        print("\nEvaluating models...")
        
        results = {}
        
        for model_name, model in self.models.items():
            print(f"\n{model_name.upper()} Results:")
            
            # Predictions
            y_pred = model.predict(X_test)
            y_pred_proba = model.predict_proba(X_test)
            
            # Metrics
            accuracy = accuracy_score(y_test, y_pred)
            
            # Convert back to original labels for classification report
            y_test_labels = self.label_encoders['attack_type'].inverse_transform(y_test)
            y_pred_labels = self.label_encoders['attack_type'].inverse_transform(y_pred)
            
            print(f"Accuracy: {accuracy:.4f}")
            print("\nClassification Report:")
            print(classification_report(y_test_labels, y_pred_labels))
            
            results[model_name] = {
                'accuracy': accuracy,
                'predictions': y_pred,
                'probabilities': y_pred_proba
            }
        
        return results
    
    def save_models(self, model_version="1.0.0"):
        """Save trained models and preprocessors"""
        print(f"\nSaving models (version {model_version})...")
        
        # Create models directory
        models_dir = "models"
        os.makedirs(models_dir, exist_ok=True)
        
        # Save models
        for model_name, model in self.models.items():
            model_path = f"{models_dir}/{model_name}_v{model_version}.pkl"
            joblib.dump(model, model_path)
            print(f"Saved {model_name} to {model_path}")
        
        # Save preprocessors
        scaler_path = f"{models_dir}/scaler_v{model_version}.pkl"
        joblib.dump(self.scalers['features'], scaler_path)
        
        encoder_path = f"{models_dir}/label_encoder_v{model_version}.pkl"
        joblib.dump(self.label_encoders['attack_type'], encoder_path)
        
        # Save metadata
        metadata = {
            'version': model_version,
            'feature_columns': self.feature_columns,
            'attack_types': list(self.label_encoders['attack_type'].classes_),
            'created_at': datetime.now().isoformat(),
            'model_types': list(self.models.keys())
        }
        
        metadata_path = f"{models_dir}/metadata_v{model_version}.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Saved metadata to {metadata_path}")
        
        return models_dir

def main():
    """Main training pipeline"""
    print("Starting ML Training Pipeline for Cyber Attack Detection")
    print("=" * 60)
    
    trainer = CyberAttackMLTrainer()
    
    # Generate synthetic data
    df = trainer.generate_synthetic_data(n_samples=10000)
    print(f"Generated dataset shape: {df.shape}")
    print(f"Attack type distribution:\n{df['attack_type'].value_counts()}")
    
    # Prepare data
    X, y, y_original = trainer.prepare_data(df)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"\nTraining set size: {X_train.shape[0]}")
    print(f"Test set size: {X_test.shape[0]}")
    
    # Train models
    trainer.train_random_forest(X_train, y_train)
    trainer.train_xgboost(X_train, y_train)
    trainer.create_ensemble(X_train, y_train)
    
    # Evaluate models
    results = trainer.evaluate_models(X_test, y_test, y_original)
    
    # Save models
    models_dir = trainer.save_models()
    
    print(f"\nTraining completed! Models saved to {models_dir}/")
    print("Best performing model: ensemble")
    
    return trainer, results

if __name__ == "__main__":
    trainer, results = main()
