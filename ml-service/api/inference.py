"""
Inference Service
Real-time fraud prediction service
"""

import pandas as pd
import numpy as np
import hashlib
import logging
from typing import Dict
from pathlib import Path
import json

from ..models.fraud_detector import FraudDetector
from ..utils.merkle import MerkleTree

logger = logging.getLogger(__name__)


class InferenceService:
    """Real-time inference service for fraud detection"""

    def __init__(self, model_path: str):
        """
        Initialize inference service

        Args:
            model_path: Path to trained model file
        """
        self.model_path = model_path
        self.model: FraudDetector = None
        self.metrics: Dict = {}
        self.load_model()

    def load_model(self):
        """Load model from disk"""
        try:
            logger.info(f"Loading model from {self.model_path}")
            self.model = FraudDetector.load(self.model_path)

            # Load metrics if available
            metrics_path = self.model_path.replace('.pkl', '_metrics.json')
            if Path(metrics_path).exists():
                with open(metrics_path, 'r') as f:
                    metrics_data = json.load(f)
                    self.metrics = metrics_data.get('test', {})

            logger.info("Model loaded successfully")

        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def reload_model(self):
        """Reload model from disk"""
        logger.info("Reloading model...")
        self.load_model()

    def is_ready(self) -> bool:
        """Check if service is ready"""
        return self.model is not None and self.model.is_trained

    async def predict(self, data: Dict) -> Dict:
        """
        Make fraud prediction

        Args:
            data: Traffic data dictionary

        Returns:
            Prediction result with fraud score and confidence
        """
        if not self.is_ready():
            raise RuntimeError("Inference service not ready")

        try:
            # Convert to DataFrame
            df = pd.DataFrame([data])

            # Prepare features
            features = self.model.prepare_features(df)

            # Make prediction
            predictions, fraud_scores, confidence = self.model.predict_with_confidence(features)

            is_fraud = bool(predictions[0])
            fraud_score = float(fraud_scores[0])
            confidence_score = float(confidence[0])

            # Determine risk level
            risk_level = self._calculate_risk_level(fraud_score, confidence_score)

            # Generate features hash
            features_hash = self._hash_features(features)

            # Generate Merkle proof
            merkle_root = self._generate_merkle_proof(data, fraud_score)

            result = {
                'is_fraud': is_fraud,
                'fraud_score': fraud_score,
                'confidence': confidence_score,
                'risk_level': risk_level,
                'features_hash': features_hash,
                'merkle_root': merkle_root
            }

            logger.info(f"Prediction: fraud={is_fraud}, score={fraud_score:.4f}, confidence={confidence_score:.4f}")

            return result

        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise

    def _calculate_risk_level(self, fraud_score: float, confidence: float) -> str:
        """
        Calculate risk level based on fraud score and confidence

        Args:
            fraud_score: Fraud probability (0-1)
            confidence: Confidence score (0-1)

        Returns:
            Risk level: "low", "medium", "high", "critical"
        """
        # High confidence and high fraud score
        if fraud_score >= 0.85 and confidence >= 0.90:
            return "critical"
        elif fraud_score >= 0.70 and confidence >= 0.80:
            return "high"
        elif fraud_score >= 0.50 and confidence >= 0.70:
            return "medium"
        else:
            return "low"

    def _hash_features(self, features: pd.DataFrame) -> str:
        """
        Generate hash of input features

        Args:
            features: Feature DataFrame

        Returns:
            SHA256 hash of features
        """
        # Convert features to string and hash
        features_str = features.to_json(orient='records')
        return hashlib.sha256(features_str.encode()).hexdigest()

    def _generate_merkle_proof(self, data: Dict, fraud_score: float) -> str:
        """
        Generate Merkle root for verification

        Args:
            data: Input data
            fraud_score: Predicted fraud score

        Returns:
            Merkle root hash
        """
        # Create leaf data
        leaves = [
            f"campaign_id:{data['campaign_id']}",
            f"publisher_id:{data['publisher_id']}",
            f"impressions:{data['impressions']}",
            f"clicks:{data['clicks']}",
            f"fraud_score:{fraud_score:.4f}"
        ]

        # Build Merkle tree
        tree = MerkleTree(leaves)
        return tree.get_root()

    def get_metrics(self) -> Dict:
        """
        Get model performance metrics

        Returns:
            Dictionary of metrics
        """
        return self.metrics

    def get_feature_importance(self) -> Dict:
        """
        Get feature importance rankings

        Returns:
            Feature importance dictionary
        """
        if not self.is_ready():
            raise RuntimeError("Model not loaded")

        importance_df = self.model.get_feature_importance()
        return importance_df.to_dict(orient='records')
