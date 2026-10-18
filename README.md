# LaunchWise AI — AI-Powered Demand Forecasting & Smart Purchasing

> **Tagline:** Predict demand. Plan purchases. Manage inventory smarter.

LaunchWise AI is an enterprise-grade retail demand forecasting and inventory management web application designed for shop owners, merchandise buyers, and inventory planners. It solves the critical cold-start demand forecasting problem for completely new products with zero sales history across their first eight weeks of launch ($W_1$ to $W_8$).

---

## 🌟 Key Features

1. **Mandatory Login & Enterprise Security:**
   - Strict unauthenticated barrier protecting all store and merchandise data.
   - PBKDF2 password hashing with salt, secure session token persistence, and role-based permissions.
   - 1-Click Demo Login (`buyer@retail.com` / `demo123`) featuring Sarah Jenkins (Lead Merchandise Planner).

2. **8-Week Cold-Start Demand Forecasting Engine:**
   - **Ensemble Model:** Combines Gower mixed-attribute analogue curve decomposition, HistGradientBoosting non-linear multi-horizon regressor, and category empirical baselines.
   - **Zero Sales Leakage Protocol:** Actual sales data is strictly isolated and never accessed during training or inference.
   - **Documented Fallback Protection:** Automatically stabilizes predictions toward category launch baselines when analogue similarity is low.

3. **Conformal Prediction Uncertainty ($P_{10}$ to $P_{90}$):**
   - Calibrated split-conformal prediction intervals with empirical coverage (PICP) $\ge 80.0\%$.

4. **Newsvendor Inventory Optimization ($Q^*$):**
   - Balances understock lost margin ($C_u$) against overstock holding & markdown loss ($C_o$).
   - Calculates recommended initial purchase orders, safety buffers, stockout risks, and supplier lead-time action dates.

5. **Store Cluster Distribution:**
   - Hamilton-Hare Largest Remainder integer allocation ensuring exact integer store distribution with zero unit discrepancies.

6. **Full Store Operations Management:**
   - **Products:** Persistent catalog management with search, filters, CRUD modals, and CSV export.
   - **Sales:** Point of Sale (POS) customer orders with real-time inventory stock auto-deduction.
   - **Inventory:** Live stock roster with status badges, adjustment modal (PO receipt, write-offs, cycle counts), and audit trail logs.
   - **Reports:** Held-out and hidden actuals benchmark evaluation (WAPE, MAE) and high-uncertainty risk watchlist.
   - **Settings:** Configurable store profiles, lead times, and financial cost parameters.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 2. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
API Documentation available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Web Application available at: [http://127.0.0.1:5173](http://127.0.0.1:5173)

### 4. Running Verification Tests
```bash
python -m pytest tests/test_pipeline.py -v
```

---

## 📊 Benchmark Accuracy Results (Blind Cold-Start on 150 SKUs)

- **LaunchWise Ensemble WAPE:** **26.61%**
- **Conformal Coverage (PICP):** **83.58%** (exceeds 80% nominal target)
- **Mean Absolute Error (MAE):** **14.28 units**
