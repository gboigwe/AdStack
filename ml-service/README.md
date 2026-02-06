# AdStack ML Fraud Detection Service

AI-powered fraud detection oracle with blockchain integration.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Train model
python -m models.train

# Run API
python -m api.main
```

## API Endpoints

- `POST /predict` - Single fraud prediction
- `POST /predict/batch` - Batch predictions
- `GET /model/metrics` - Model performance
- `GET /health` - Health check

## Architecture

- **Random Forest Classifier** - Core ML model
- **FastAPI** - REST API framework
- **Merkle Trees** - Cryptographic proofs
- **Stacks Blockchain** - On-chain verification

## Model Performance

- Accuracy: 94%+
- Precision: 94%+
- Recall: 93%+
- F1 Score: 93%+
