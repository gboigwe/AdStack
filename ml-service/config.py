"""
Configuration for ML Service
"""

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """ML Service Configuration"""

    # API Settings
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", "8000"))
    API_WORKERS = int(os.getenv("API_WORKERS", "4"))

    # Model Settings
    MODEL_VERSION = os.getenv("MODEL_VERSION", "v1")
    MODEL_PATH = os.getenv("MODEL_PATH", "./models/fraud_detector_v1.pkl")
    MODEL_UPDATE_INTERVAL = int(os.getenv("MODEL_UPDATE_INTERVAL", "3600"))  # 1 hour

    # Training Settings
    TRAIN_DATA_PATH = os.getenv("TRAIN_DATA_PATH", "./data/training_data.csv")
    TEST_SIZE = float(os.getenv("TEST_SIZE", "0.2"))
    RANDOM_STATE = int(os.getenv("RANDOM_STATE", "42"))

    # Fraud Detection Thresholds
    FRAUD_THRESHOLD = float(os.getenv("FRAUD_THRESHOLD", "0.85"))
    CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.90"))

    # Blockchain Integration
    STACKS_API_URL = os.getenv("STACKS_API_URL", "https://api.mainnet.hiro.so")
    STACKS_NETWORK = os.getenv("STACKS_NETWORK", "mainnet")
    CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "")
    ORACLE_PRIVATE_KEY = os.getenv("ORACLE_PRIVATE_KEY", "")

    # Merkle Tree Settings
    MERKLE_TREE_DEPTH = int(os.getenv("MERKLE_TREE_DEPTH", "10"))

    # Feature Engineering
    FEATURES = [
        "impressions",
        "clicks",
        "ctr",
        "session_duration",
        "bounce_rate",
        "time_of_day",
        "day_of_week",
        "device_type",
        "geo_location",
        "referrer_type",
        "velocity_score",
        "pattern_deviation"
    ]

    # Monitoring
    PROMETHEUS_PORT = int(os.getenv("PROMETHEUS_PORT", "9090"))
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    # Performance
    BATCH_SIZE = int(os.getenv("BATCH_SIZE", "32"))
    MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
    TIMEOUT = int(os.getenv("TIMEOUT", "30"))

config = Config()
