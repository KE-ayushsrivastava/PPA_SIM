# app.py
import os
import time
import uuid
import json
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity, set_access_cookies, unset_jwt_cookies,get_csrf_token
)
from flask_cors import CORS
import pandas as pd
from mysql.connector import Error as MySQLError
from classes import RecordFetch, build_filter_cond, build_filter_definition, simulate_market_share, simulate_price_elasticity
from config import BrandPrice, get_connection 

# App config
app = Flask(__name__)
# Secrets - prefer env vars in production
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_SECURE"] = False            # set True in prod (HTTPS)
app.config["JWT_COOKIE_CSRF_PROTECT"] = True     # For dev; enable CSRF in prod & handle token on frontend
app.config["JWT_ACCESS_COOKIE_PATH"] = "/"
app.config["JWT_COOKIE_SAMESITE"] = "Lax"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES", "60")))

# Init extensions
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": [os.getenv("REACT_ORIGIN", "http://localhost:3000")]}})

####################
# Helper DB functions (using your get_connection from config.py)
####################
def find_user_by_email_or_username(identifier):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        sql = "SELECT id, username, email, password_hash, created_at, last_login FROM users WHERE email = %s OR username = %s LIMIT 1"
        cur.execute(sql, (identifier, identifier))
        row = cur.fetchone()
        cur.close()
        return row
    except MySQLError as e:
        app.logger.error("DB error (find_user): %s", e)
        return None
    finally:
        if conn:
            conn.close()

####################
# Auth endpoints
####################
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not email or not password:
        return jsonify({"msg": "username, email and password required"}), 400
    if len(password) < 6:
        return jsonify({"msg": "password must be at least 6 characters"}), 400

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        # check uniqueness
        cur.execute("SELECT id, email, username FROM users WHERE email = %s OR username = %s LIMIT 1", (email, username))
        existing = cur.fetchone()
        if existing:
            if existing.get("email") == email:
                cur.close()
                return jsonify({"msg": "email already registered"}), 409
            else:
                cur.close()
                return jsonify({"msg": "username already taken"}), 409

        pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
        insert_sql = "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)"
        cur.execute(insert_sql, (username, email, pw_hash))
        conn.commit()
        new_id = cur.lastrowid
        cur.close()
        return jsonify({"id": new_id, "username": username, "email": email}), 201

    except MySQLError as e:
        app.logger.error("DB error on register: %s", e)
        if conn:
            conn.rollback()
        return jsonify({"msg": "internal server error"}), 500
    finally:
        if conn:
            conn.close()

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("email") or data.get("username") or "").strip()
    password = data.get("password") or ""
    if not identifier or not password:
        return jsonify({"msg": "email/username and password required"}), 400

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id, username, email, password_hash FROM users WHERE email = %s OR username = %s LIMIT 1", (identifier, identifier))
        user = cur.fetchone()
        cur.close()
        if not user:
            return jsonify({"msg": "invalid credentials"}), 401

        if not bcrypt.check_password_hash(user["password_hash"], password):
            return jsonify({"msg": "invalid credentials"}), 401

        # update last_login
        cur = conn.cursor()
        cur.execute("UPDATE users SET last_login = %s WHERE id = %s", (datetime.utcnow(), user["id"]))
        conn.commit()
        cur.close()

        access_token = create_access_token(identity=str(user["id"]))
        resp = jsonify({"id": user["id"], "username": user["username"], "email": user["email"]})
        set_access_cookies(resp, access_token)

        csrf_token = get_csrf_token(access_token)
        resp.headers["X-CSRF-Token"] = csrf_token

        return resp, 200

    except MySQLError as e:
        app.logger.error("DB error on login: %s", e)
        if conn:
            conn.rollback()
        return jsonify({"msg": "internal server error"}), 500
    finally:
        if conn:
            conn.close()

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    resp = jsonify({"msg": "logout successful"})
    unset_jwt_cookies(resp)
    return resp, 200

@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user_id = int(user_id)
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id, username, email, created_at, last_login FROM users WHERE id = %s LIMIT 1", (user_id,))
        user = cur.fetchone()
        cur.close()
        if not user:
            return jsonify({"msg": "user not found"}), 404
        return jsonify(user), 200
    except MySQLError as e:
        app.logger.error("DB error on me: %s", e)
        return jsonify({"msg": "internal server error"}), 500
    finally:
        if conn:
            conn.close()

####################
# Scenario
####################


def parse_iso_to_mysql(dt_str):
    if not dt_str:
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except Exception as e:
        print("Datetime parse error:", e)
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
@app.route("/api/save-scenarios", methods=["POST"])

def save_scenario():
    try:
        data = request.get_json()

        # Generate UUID for scenario
        scenario_id = str(uuid.uuid4())

        conn = get_connection()
        cursor = conn.cursor()

        sql = """
        INSERT INTO scenarios 
        (id, user_id, name, description, product_selections, price_point_index, filters, filter_definition, saved_by, sample_size, created_at, updated_at) 
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """

        # Dummy values for name/description for now
        values = (
            scenario_id,
            data.get("userId","Untitled"),                 # TODO: replace with actual logged-in user_id
            data.get("name", "Untitled"),   # fallback if no name given
            data.get("description", ""),    # optional
            json.dumps(data["productSelections"]),   # ✅ convert to proper JSON
            json.dumps(data["pricePointIndex"]),     # ✅ convert to proper JSON
            json.dumps(data["filters"]),             # ✅ convert to proper JSON
            data.get("filterDef", "Overall"),
            data.get("savedBy", "Unknown"),
            data.get("sampleSize", "Unknown"),
            parse_iso_to_mysql(data.get("created_at")),  # 👈 use helper
            parse_iso_to_mysql(data.get("updated_at"))
        )

        cursor.execute(sql, values)
        conn.commit()

        return jsonify({"status": "success", "id": scenario_id}), 201

    except Exception as e:
        print("Error saving scenario:", e)
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()



@app.route("/api/fetch-scenarios", methods=["GET"])

def get_scenarios():
    try:
        user_id = request.args.get("user_id")
        is_deleted = request.args.get("is_deleted", "0")

        if not user_id:
            return jsonify({"status": "error", "message": "Missing user_id"}), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT 
                id, 
                name, 
                description, 
                created_at, 
                updated_at 
            FROM scenarios 
            WHERE saved_by = %s AND is_deleted = %s
            ORDER BY updated_at DESC
        """
        cursor.execute(query, (user_id, is_deleted))
        result = cursor.fetchall()

        return jsonify(result), 200

    except Exception as e:
        print("Error fetching scenarios:", e)
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()



@app.route("/api/scenarios/<scenario_id>", methods=["GET"])

def get_scenario_by_id(scenario_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT 
                id,
                name,
                description,
                product_selections,
                price_point_index,
                filters,
                filter_definition,
                saved_by,
                sample_size,
                created_at,
                updated_at
            FROM scenarios
            WHERE id = %s AND is_deleted = 0
        """
        cursor.execute(query, (scenario_id,))
        scenario = cursor.fetchone()

        if not scenario:
            return jsonify({"status": "error", "message": "Scenario not found"}), 404

        # Convert JSON fields properly
        scenario["product_selections"] = json.loads(scenario["product_selections"])
        scenario["price_point_index"] = json.loads(scenario["price_point_index"])
        scenario["filters"] = json.loads(scenario["filters"])

        return jsonify(scenario), 200

    except Exception as e:
        print("Error fetching scenario:", e)
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()



@app.route("/api/scenarios/<scenario_id>", methods=["PUT"])

def update_scenario(scenario_id):
    try:
        data = request.get_json()

        conn = get_connection()
        cursor = conn.cursor()
        print("Updating scenario:", scenario_id)
        sql = """
        UPDATE scenarios
        SET 
            product_selections = %s,
            price_point_index = %s,
            filters = %s,
            filter_definition = %s,
            sample_size = %s,
            updated_at = %s
        WHERE id = %s AND is_deleted = 0
        """

        values = (
            json.dumps(data["productSelections"]),
            json.dumps(data["pricePointIndex"]),
            json.dumps(data["filters"]),
            data.get("filterDef", "Overall"),
            data.get("sampleSize", "998"),
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            scenario_id
        )

        cursor.execute(sql, values)
        conn.commit()

        return jsonify({"status": "success", "message": "Scenario updated"}), 200

    except Exception as e:
        print("Error updating scenario:", e)
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

####################
# Existing route (kept as-is)
####################
@app.route("/chart_data")
def chart_data():
    start_time1 = time.time()

    prices_param = request.args.get("selectedPrices", "")
    prices = [int(p) for p in prices_param.split(",") if p.strip().isdigit()] if prices_param else []

    brand_param = request.args.get("selectedBrands", "")
    selected_brands = [int(p) for p in brand_param.split(",") if p.strip().isdigit()] if brand_param else []

    filters = {
        "Age": request.args.get("Age", "").split(",") if request.args.get("Age") else [],
        "Pregnant": request.args.get("Pregnant", "").split(",") if request.args.get("Pregnant") else [],
        "Gender": request.args.get("Gender", "").split(",") if request.args.get("Gender") else [],
        "CustomerSegment": request.args.get("CustomerSegment", "").split(",") if request.args.get("CustomerSegment") else [],
        "Income": request.args.get("Income", "").split(",") if request.args.get("Income") else [],
        "Children": request.args.get("Children", "").split(",") if request.args.get("Children") else [],
    }

    condX = build_filter_cond(filters)
    filterDef = build_filter_definition(filters)

    calc = RecordFetch(condX)
    raw_data = calc.calculate()
    raw_data_df = pd.DataFrame(raw_data)
    end_time1 = time.time()

    start_time2 = time.time()
    simulation_result = simulate_market_share(prices, raw_data_df, selected_brands, 14, 5, "MS")
    elasticity_results = simulate_price_elasticity(prices, BrandPrice, raw_data_df, selected_brands, 14, 5)
    end_time2 = time.time()

    execution_time1 = round(end_time1 - start_time1, 3)
    execution_time2 = round(end_time2 - start_time2, 3)
    approx_time = execution_time2 - execution_time1

    return jsonify({
        "raw_data": raw_data,
        "market_share": simulation_result,
        "price_elasticity": elasticity_results,
        "execution_time1": execution_time1,
        "execution_time2": execution_time2,
        "approx_time": approx_time,
        "condX": condX,
        "filterDef":filterDef
        
    })

####################
# Optionally ensure table exists on startup (dev convenience)
####################
def ensure_users_table():
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(80) NOT NULL,
          email VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME NULL,
          UNIQUE KEY uq_users_email (email),
          UNIQUE KEY uq_users_username (username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)
        conn.commit()
        cur.close()
    except Exception as e:
        app.logger.error("Could not ensure users table exists: %s", e)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    # dev convenience
    ensure_users_table()
    app.run(debug=True,port=5001)
