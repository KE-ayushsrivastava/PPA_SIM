import pandas as pd
import numpy as np
from config import get_connection
from config import FILTER_MAP, COLUMNS, FILTER_LABELS


def build_filter_cond(filters: dict) -> str:
    cond_parts = []
    for key, col in FILTER_MAP.items():
        if filters.get(key):
            vals = ",".join([f"'{v}'" for v in filters[key]])
            cond_parts.append(f"{col} IN ({vals})")
    return " AND ".join(cond_parts) if cond_parts else "1=1"

def build_filter_definition(filters: dict) -> str:
    cond_parts = []
    for key, codes in filters.items():
        if codes:  # agar filter mei kuch select hua hai
            labels = []
            for code in codes:
                if code in FILTER_LABELS.get(key, {}):
                    labels.append(FILTER_LABELS[key][code])
            if labels:
                # labels ko join karke string bana lo
                vals = ",".join([f"'{v}'" for v in labels])
                cond_parts.append(f"{key} IN ({vals})")
    return " AND ".join(cond_parts) if cond_parts else "Overall"


class QuestionBase:
    def __init__(self, condX):
        self.condX = condX

    def run_query(self, sql, fetch="all"):
        """Pool se connection le, query run kare aur auto close kare"""
        conn = get_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(sql)
            if fetch == "one":
                result = cursor.fetchone()
            else:
                result = cursor.fetchall()
            return result or []
        finally:
            cursor.close()
            conn.close()  # release back to pool


class RecordFetch(QuestionBase):
    def __init__(self, condX, table="tbl_simulator"):
        super().__init__(condX)
        self.table = table

    def calculate(self):
        data = {}
        for col in COLUMNS:
            sql = f"SELECT {col} FROM {self.table} WHERE {self.condX}"
            rows = self.run_query(sql, fetch="all")
            data[col] = [row[col] for row in rows if row.get(col) is not None]
        return data


def simulate_market_share(selected_values, data_path, selected_brands , n_products, n_price_points, type="MS"):
    # --- Handle input ---
    if isinstance(data_path, str):
        # Case 1: path to CSV file
        df = pd.read_csv(data_path, usecols=COLUMNS)
    else:
        # Case 2: already a DataFrame (from DB query)
        df = data_path.copy()

    # --- Extract weights ---
    filter_weight = df["filter_weight"].astype(int).values
    filter_weight_sum = filter_weight.sum()

    # --- Utilities array ---
    dfX = df.drop(columns=["respondent_id", "filter_weight"])
    data_arrX = np.array(dfX.values, dtype=float)

    # --- Product coding array ---
    def create_product_coding_array(selected_values, n_products, n_price_points):
        total_cols = n_products + (n_products * n_price_points) + 1
        total_rows = n_products + 1
        arr = [[0] * total_cols for _ in range(total_rows)]

        for i, sel in enumerate(selected_values):
            if sel == 0:
                continue
            arr[i][i] = 1
            price_col_index = n_products + (n_price_points * i) + (sel - 1)
            arr[i][price_col_index] = 1

        arr[-1][-1] = 1  # NONE row
        return np.array(arr)

    productCodingArray = create_product_coding_array(selected_values, n_products, n_price_points)

    # --- Calculations ---
    multiplyResult = np.exp(data_arrX @ productCodingArray.T)
    sumResult = multiplyResult.T

    sumResultX = np.array(sumResult)
    selected_brandsX = np.array(selected_brands)
    
    checkboxFilteration = sumResultX * selected_brandsX[:, None]

    sumResultArrSum = checkboxFilteration.sum(axis=0)

    shareCalculationResult = checkboxFilteration / sumResultArrSum

    transposeShareCalculationResult = shareCalculationResult.T
    
    filter_weightX = np.array(filter_weight)

    multiplycalculateArr = transposeShareCalculationResult * filter_weightX[:, None]

    frontpagesumResult = multiplycalculateArr.sum(axis=0)

    if type == "MS":
        finalResult = np.round((frontpagesumResult / filter_weight_sum) * 100, 2)
        # finalResult = sumResult
    else:
        finalResult = (frontpagesumResult / filter_weight_sum)

    return finalResult.tolist()


def simulate_price_elasticity(selected_values, brandPrice2, data_path, selected_brands, n_products, n_price_points): 
    # --- Handle input ---
    if isinstance(data_path, str):
        # Case 1: CSV path
        df = pd.read_csv(data_path, usecols=COLUMNS)
    elif isinstance(data_path, list):
        # Case 2: list of dicts or list of rows
        df = pd.DataFrame(data_path)
    else:
        # Case 3: already a DataFrame (from DB)
        df = data_path.copy()

    results = {}

    for prod_idx in range(n_products):
        product_ms = []
        for pp in range(1, n_price_points+1):
            temp_selected = selected_values.copy()
            temp_selected[prod_idx] = pp

            # Call market share in raw mode
            shares = simulate_market_share(
                temp_selected,
                data_path=df,  # 👈 pass DataFrame here
                n_products=n_products,
                n_price_points=n_price_points,
                selected_brands=selected_brands,
                type="Elasticity"  # raw fractions
            )
            product_ms.append(shares[prod_idx])

        # calculate elasticity for this product
        pp_list = brandPrice2[prod_idx]
        results[f"{prod_idx+1}"] = calculate_arc_elasticity(product_ms, pp_list)

    return results


def calculate_arc_elasticity(ms_list, pp_list):
    outputs = []
    for i in range(len(ms_list)-1):  # MS1..MS4
        if ms_list[i] == 0 or ms_list[i+1] == 0:
            outputs.append(0)
            continue
        
        ms_diff = ms_list[i] - ms_list[i+1]
        ms_avg = (ms_list[i] + ms_list[i+1]) / 2
        pp_diff = pp_list[i] - pp_list[i+1]
        pp_avg = (pp_list[i] + pp_list[i+1]) / 2

        if pp_diff == 0 or pp_avg == 0:
            outputs.append(0)
        else:
            elasticity = (ms_diff/ms_avg) / (pp_diff/pp_avg)
            outputs.append(round(elasticity, 4))
    
    return np.round(sum(outputs)/len(outputs),2) if outputs else 0