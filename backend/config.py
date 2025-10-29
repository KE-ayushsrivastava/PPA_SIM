import mysql.connector
from mysql.connector import pooling

# Connection Pool Setup
# dbconfig = {
#     "host": "localhost",
#     "user": "root",
#     "password": "pass@123",
#     "database": "online_simulator"
# }


dbconfig = {
    "host": "localhost",
    "user": "kepython",
    "password": "KePython@12345",
    "database": "online_simulator"
}

# Pool create (size tumhare concurrent users ke hisaab se adjust karna)
connection_pool = pooling.MySQLConnectionPool(
    pool_name="online_simulator_pool",
    pool_size=5,     # ek time pe max 5 connections
    **dbconfig
)

def get_connection():
    """Get a pooled connection"""
    return connection_pool.get_connection()

FILTER_MAP = {
    "Age": "Age",
    "Pregnant": "Pregnant",
    "Gender": "Gender",
    "CustomerSegment": "CustomerSegment",
    # "Income": "Income",
    "Children": "Children",
}

FILTER_LABELS = {
    "Age": {
        "1": "18-25 Years",
        "2": "26-35 Years",
        "3": "36-45 Years",
        "4": "46-55 Years",
        "5": "55+ Years"
    },
    "Pregnant": {
        "1": "Yes",
        "2": "No"
    },
    "Gender": {
        "1": "Female",
        "2": "Male"
    },
    "CustomerSegment": {
        "1": "LIVELY MUM",
        "2": "HONEYMOON PHASE",
        "3": "LOVING GUARDIAN",
        "4": "ORGANISED LIBERTINE",
        "5": "PRIDEFUL EXPERT"
    },
    # "Income": {
    #     "1": "$50,000-$60,000",
    #     "2": "$60,000-$70,000",
    #     "3": "$70,000-$80,000",
    #     "4": "$80,000-$90,000",
    #     "5": "$90,000-$100,000",
    #     "6": "More than $100,000"
    # },
    "Children": {
        "1": "Yes",
        "2": "No"
    }
}

COLUMNS = [
    "respondent_id","Stokke_Xplory_Stroller_only","Stokke_Xplory_with_Carry_Cot",
    "Babyzen_Yoyo2_Stroller_only","Babyzen_Yoyo2_with_Carry_Cot","Cybex_Priam","Mima_Xari",
    "Joolz_Day","Bugaboo_Fox_3","Uppababy_Vista_V2","Joolz_Aer","Bugaboo_Butterfly","Nuna_TRVL",
    "Cybex_Eezy_S_2","Easywalker_Jackey","p1_1","p1_2","p1_3","p1_4","p1_5","p2_1","p2_2",
    "p2_3","p2_4","p2_5","p3_1","p3_2","p3_3","p3_4","p3_5","p4_1","p4_2","p4_3","p4_4",
    "p4_5","p5_1","p5_2","p5_3","p5_4","p5_5","p6_1","p6_2","p6_3","p6_4","p6_5","p7_1",
    "p7_2","p7_3","p7_4","p7_5","p8_1","p8_2","p8_3","p8_4","p8_5","p9_1","p9_2","p9_3",
    "p9_4","p9_5","p10_1","p10_2","p10_3","p10_4","p10_5","p11_1","p11_2","p11_3","p11_4",
    "p11_5","p12_1","p12_2","p12_3","p12_4","p12_5","p13_1","p13_2","p13_3","p13_4","p13_5",
    "p14_1","p14_2","p14_3","p14_4","p14_5","NONE","filter_weight"
]

BrandPrice = [[859,969,1079,1189,1299],
[1039,1169,1298,1429,1559],
[359,399,449,489,539],
[569,639,709,779,849],
[839,939,1050,1149,1259],
[959,1079,1199,1319,1439],
[1039,1169,1299,1429,1559],
[1019,1149,1279,1399,1529],
[979,1099,1230,1349,1479],
[359,399,449,489,539],
[349,399,439,479,529],
[319,359,400,439,479],
[299,339,380,419,459],
[279,319,350,389,419]]