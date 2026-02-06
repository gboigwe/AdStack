"""
Model Training Pipeline
Train and evaluate the fraud detection model
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
import logging
import argparse
from pathlib import Path
import json
from datetime import datetime

from fraud_detector import FraudDetector
from ..config import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_synthetic_data(n_samples: int = 10000) -> pd.DataFrame:
    """
    Generate synthetic training data for fraud detection

    Args:
        n_samples: Number of samples to generate

    Returns:
        DataFrame with features and fraud labels
    """
    logger.info(f"Generating {n_samples} synthetic samples...")

    np.random.seed(42)

    # Generate normal traffic
    n_normal = int(n_samples * 0.7)
    normal_data = {
        'impressions': np.random.randint(100, 10000, n_normal),
        'clicks': np.random.randint(2, 500, n_normal),
        'session_duration': np.random.randint(30, 600, n_normal),
        'bounce_rate': np.random.uniform(0.3, 0.8, n_normal),
        'time_of_day': np.random.randint(0, 24, n_normal),
        'day_of_week': np.random.randint(0, 7, n_normal),
        'is_fraud': [0] * n_normal
    }

    # Generate fraudulent traffic
    n_fraud = n_samples - n_normal
    fraud_data = {
        'impressions': np.random.randint(5000, 50000, n_fraud),
        'clicks': np.random.randint(500, 5000, n_fraud),
        'session_duration': np.random.randint(1, 30, n_fraud),
        'bounce_rate': np.random.uniform(0.8, 1.0, n_fraud),
        'time_of_day': np.random.randint(0, 24, n_fraud),
        'day_of_week': np.random.randint(0, 7, n_fraud),
        'is_fraud': [1] * n_fraud
    }

    # Combine and shuffle
    df_normal = pd.DataFrame(normal_data)
    df_fraud = pd.DataFrame(fraud_data)
    df = pd.concat([df_normal, df_fraud], ignore_index=True)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    logger.info(f"Generated dataset: {len(df)} samples ({n_normal} normal, {n_fraud} fraud)")

    return df


def load_training_data(filepath: str) -> pd.DataFrame:
    """
    Load training data from CSV

    Args:
        filepath: Path to CSV file

    Returns:
        DataFrame with training data
    """
    try:
        df = pd.read_csv(filepath)
        logger.info(f"Loaded {len(df)} samples from {filepath}")
        return df
    except FileNotFoundError:
        logger.warning(f"Training data not found at {filepath}, generating synthetic data")
        return generate_synthetic_data()


def train_model(
    train_data_path: str = None,
    model_save_path: str = None,
    test_size: float = 0.2
) -> FraudDetector:
    """
    Train fraud detection model

    Args:
        train_data_path: Path to training data CSV
        model_save_path: Path to save trained model
        test_size: Proportion of data to use for testing

    Returns:
        Trained FraudDetector
    """
    # Load data
    data_path = train_data_path or config.TRAIN_DATA_PATH
    df = load_training_data(data_path)

    # Separate features and labels
    y = df['is_fraud']
    X = df.drop('is_fraud', axis=1)

    # Initialize model
    detector = FraudDetector()

    # Feature engineering
    X_features = detector.prepare_features(X)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_features,
        y,
        test_size=test_size,
        random_state=config.RANDOM_STATE,
        stratify=y
    )

    X_train, X_val, y_train, y_val = train_test_split(
        X_train,
        y_train,
        test_size=0.2,
        random_state=config.RANDOM_STATE,
        stratify=y_train
    )

    logger.info(f"Training set: {len(X_train)} samples")
    logger.info(f"Validation set: {len(X_val)} samples")
    logger.info(f"Test set: {len(X_test)} samples")

    # Train model
    train_metrics = detector.train(X_train, y_train, X_val, y_val)

    logger.info("\nTraining Metrics:")
    for metric, value in train_metrics.items():
        if metric != 'confusion_matrix':
            logger.info(f"  {metric}: {value:.4f}")

    # Evaluate on test set
    test_metrics = detector.evaluate(X_test, y_test)

    logger.info("\nTest Metrics:")
    for metric, value in test_metrics.items():
        if metric != 'confusion_matrix':
            logger.info(f"  {metric}: {value:.4f}")

    # Feature importance
    importance = detector.get_feature_importance()
    logger.info("\nTop 10 Important Features:")
    logger.info(importance.head(10).to_string(index=False))

    # Save model
    save_path = model_save_path or config.MODEL_PATH
    Path(save_path).parent.mkdir(parents=True, exist_ok=True)
    detector.save(save_path)

    # Save metrics
    metrics_path = save_path.replace('.pkl', '_metrics.json')
    all_metrics = {
        'train': train_metrics,
        'test': test_metrics,
        'timestamp': datetime.now().isoformat(),
        'model_version': config.MODEL_VERSION,
        'data_size': len(df),
        'feature_count': len(detector.feature_names)
    }

    with open(metrics_path, 'w') as f:
        json.dump(all_metrics, f, indent=2, default=str)

    logger.info(f"\nMetrics saved to {metrics_path}")

    return detector


def main():
    """Main training function"""
    parser = argparse.ArgumentParser(description='Train fraud detection model')
    parser.add_argument('--data', type=str, help='Path to training data CSV')
    parser.add_argument('--output', type=str, help='Path to save trained model')
    parser.add_argument('--test-size', type=float, default=0.2, help='Test set proportion')

    args = parser.parse_args()

    detector = train_model(
        train_data_path=args.data,
        model_save_path=args.output,
        test_size=args.test_size
    )

    logger.info("\nTraining pipeline completed successfully!")


if __name__ == '__main__':
    main()
