"""
Fraud Detection ML Model
Random Forest Classifier for detecting fraudulent ad traffic
"""

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)
from sklearn.preprocessing import StandardScaler
from typing import Tuple, Dict
import logging

logger = logging.getLogger(__name__)


class FraudDetector:
    """
    Fraud Detection Model using Random Forest
    """

    def __init__(self, model_params: Dict = None):
        """
        Initialize fraud detector

        Args:
            model_params: Parameters for Random Forest model
        """
        self.model_params = model_params or {
            'n_estimators': 100,
            'max_depth': 10,
            'min_samples_split': 5,
            'min_samples_leaf': 2,
            'random_state': 42
        }

        self.model = RandomForestClassifier(**self.model_params)
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_names = []
        self.metrics = {}

    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Feature engineering for fraud detection

        Args:
            df: Input dataframe

        Returns:
            DataFrame with engineered features
        """
        features = df.copy()

        # CTR (Click-Through Rate)
        features['ctr'] = (features['clicks'] / features['impressions']).fillna(0)
        features['ctr'] = features['ctr'].clip(0, 1)

        # Velocity features (rate of change)
        features['impression_velocity'] = features['impressions'] / (features['session_duration'] + 1)
        features['click_velocity'] = features['clicks'] / (features['session_duration'] + 1)

        # Time-based features
        if 'timestamp' in features.columns:
            features['timestamp'] = pd.to_datetime(features['timestamp'])
            features['hour'] = features['timestamp'].dt.hour
            features['day_of_week'] = features['timestamp'].dt.dayofweek
            features['is_weekend'] = features['day_of_week'].isin([5, 6]).astype(int)

        # Categorical encoding
        if 'device_type' in features.columns:
            features = pd.get_dummies(features, columns=['device_type'], prefix='device')

        if 'referrer_type' in features.columns:
            features = pd.get_dummies(features, columns=['referrer_type'], prefix='ref')

        # Anomaly indicators
        features['high_ctr'] = (features['ctr'] > 0.10).astype(int)  # CTR > 10%
        features['low_bounce'] = (features['bounce_rate'] < 0.20).astype(int)  # Bounce < 20%
        features['short_session'] = (features['session_duration'] < 5).astype(int)  # < 5 seconds

        return features

    def train(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: pd.DataFrame = None,
        y_val: pd.Series = None
    ) -> Dict:
        """
        Train the fraud detection model

        Args:
            X_train: Training features
            y_train: Training labels
            X_val: Validation features (optional)
            y_val: Validation labels (optional)

        Returns:
            Training metrics
        """
        logger.info("Starting model training...")

        # Store feature names
        self.feature_names = X_train.columns.tolist()

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)

        # Train model
        self.model.fit(X_train_scaled, y_train)
        self.is_trained = True

        # Cross-validation
        cv_scores = cross_val_score(
            self.model,
            X_train_scaled,
            y_train,
            cv=5,
            scoring='accuracy'
        )

        # Predictions on training set
        y_train_pred = self.model.predict(X_train_scaled)

        # Calculate metrics
        metrics = {
            'train_accuracy': accuracy_score(y_train, y_train_pred),
            'train_precision': precision_score(y_train, y_train_pred),
            'train_recall': recall_score(y_train, y_train_pred),
            'train_f1': f1_score(y_train, y_train_pred),
            'cv_mean_accuracy': cv_scores.mean(),
            'cv_std_accuracy': cv_scores.std(),
        }

        # Validation metrics if provided
        if X_val is not None and y_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            y_val_pred = self.model.predict(X_val_scaled)
            y_val_proba = self.model.predict_proba(X_val_scaled)[:, 1]

            metrics.update({
                'val_accuracy': accuracy_score(y_val, y_val_pred),
                'val_precision': precision_score(y_val, y_val_pred),
                'val_recall': recall_score(y_val, y_val_pred),
                'val_f1': f1_score(y_val, y_val_pred),
                'val_roc_auc': roc_auc_score(y_val, y_val_proba),
            })

            # Confusion matrix
            cm = confusion_matrix(y_val, y_val_pred)
            metrics['confusion_matrix'] = cm.tolist()

        self.metrics = metrics
        logger.info(f"Training complete. Accuracy: {metrics['train_accuracy']:.4f}")

        return metrics

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Predict fraud labels

        Args:
            X: Input features

        Returns:
            Binary predictions (0=legitimate, 1=fraud)
        """
        if not self.is_trained:
            raise ValueError("Model is not trained yet")

        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Predict fraud probabilities

        Args:
            X: Input features

        Returns:
            Fraud probabilities for each class
        """
        if not self.is_trained:
            raise ValueError("Model is not trained yet")

        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)

    def predict_with_confidence(self, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Predict with fraud score and confidence

        Args:
            X: Input features

        Returns:
            Tuple of (predictions, fraud_scores, confidence_scores)
        """
        probas = self.predict_proba(X)
        fraud_scores = probas[:, 1]  # Probability of fraud
        confidence_scores = np.max(probas, axis=1)  # Max probability
        predictions = (fraud_scores >= 0.5).astype(int)

        return predictions, fraud_scores, confidence_scores

    def get_feature_importance(self) -> pd.DataFrame:
        """
        Get feature importance scores

        Returns:
            DataFrame with feature names and importance scores
        """
        if not self.is_trained:
            raise ValueError("Model is not trained yet")

        importance_df = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)

        return importance_df

    def save(self, filepath: str):
        """
        Save model to disk

        Args:
            filepath: Path to save the model
        """
        if not self.is_trained:
            raise ValueError("Cannot save untrained model")

        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'metrics': self.metrics,
            'model_params': self.model_params
        }

        joblib.dump(model_data, filepath)
        logger.info(f"Model saved to {filepath}")

    @classmethod
    def load(cls, filepath: str) -> 'FraudDetector':
        """
        Load model from disk

        Args:
            filepath: Path to the saved model

        Returns:
            Loaded FraudDetector instance
        """
        model_data = joblib.load(filepath)

        detector = cls(model_params=model_data['model_params'])
        detector.model = model_data['model']
        detector.scaler = model_data['scaler']
        detector.feature_names = model_data['feature_names']
        detector.metrics = model_data['metrics']
        detector.is_trained = True

        logger.info(f"Model loaded from {filepath}")
        return detector

    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> Dict:
        """
        Evaluate model on test data

        Args:
            X_test: Test features
            y_test: Test labels

        Returns:
            Evaluation metrics
        """
        predictions, fraud_scores, confidence = self.predict_with_confidence(X_test)

        metrics = {
            'accuracy': accuracy_score(y_test, predictions),
            'precision': precision_score(y_test, predictions),
            'recall': recall_score(y_test, predictions),
            'f1_score': f1_score(y_test, predictions),
            'roc_auc': roc_auc_score(y_test, fraud_scores),
            'avg_confidence': confidence.mean(),
        }

        # Confusion matrix
        cm = confusion_matrix(y_test, predictions)
        metrics['confusion_matrix'] = cm.tolist()
        metrics['true_negatives'] = int(cm[0, 0])
        metrics['false_positives'] = int(cm[0, 1])
        metrics['false_negatives'] = int(cm[1, 0])
        metrics['true_positives'] = int(cm[1, 1])

        return metrics
