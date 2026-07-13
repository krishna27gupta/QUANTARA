import json
import os

# Define the precise known historical exclusions from the NIFTY 50 (2016-2025)
# This mapping dictates what changes occurred and when they became effective.
# Each entry specifies a year-month and the exact list of additions and deletions for that period.
INDEX_CHANGES = {
    # Sources: NSE Indices Press Releases for index reconstitution
    "2024-09": {"added": ["TRENT", "BEL"], "removed": ["DIVISLAB", "LTIM"]},
    "2024-03": {"added": ["SHRIRAMFIN"], "removed": ["UPL"]},
    "2023-09": {"added": ["LTIM"], "removed": ["HDFC"]},
    "2022-09": {"added": ["ADANIENT"], "removed": ["SHREECEM"]},
    "2022-03": {"added": ["APOLLOHOSP"], "removed": ["IOC"]},
    "2020-09": {"added": ["DIVISLAB", "SBILIFE"], "removed": ["INFRATEL", "ZEEL"]},
    "2020-03": {"added": ["SHREECEM"], "removed": ["YESBANK"]},
    "2019-09": {"added": ["NESTLEIND"], "removed": ["IBULHSGFIN"]},
    "2019-03": {"added": ["BRITANNIA"], "removed": ["HPCL"]},
    "2018-09": {"added": ["JSWSTEEL"], "removed": ["LUPIN"]},
    "2018-03": {"added": ["BAJAJFINSV", "TITAN", "GRASIM"], "removed": ["AMBUJACEM", "BOSCHLTD", "AUROPHARMA"]},
    "2017-09": {"added": ["HPCL", "UPL", "BAJFINANCE"], "removed": ["ACC", "BANKBARODA", "TATAMTRDVR"]},
    "2017-03": {"added": ["IOC", "IBULHSGFIN"], "removed": ["BHEL", "IDEA"]},
    "2016-09": {"added": ["EICHERMOT"], "removed": ["VEDL", "GAIL"]}, 
}

# The baseline current NIFTY 50 universe (2025-01)
CURRENT_NIFTY_50 = {
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "TRENT", "SBIN",
    "BHARTIARTL", "ITC", "HINDUNILVR", "LT", "HCLTECH", "SUNPHARMA", "AXISBANK",
    "KOTAKBANK", "MARUTI", "ULTRACEMCO", "NTPC", "TATASTEEL", "POWERGRID",
    "COALINDIA", "M&M", "JSWSTEEL", "ASIANPAINT", "HINDALCO", "TATAMOTORS",
    "NESTLEIND", "ONGC", "ADANIPORTS", "JIOFIN", "ADANIENT", "BPCL", "GRASIM",
    "SBILIFE", "WIPRO", "EICHERMOT", "INDUSINDBK", "HDFCLIFE", "CIPLA",
    "SHRIRAMFIN", "APOLLOHOSP", "TATACONSUM", "BAJAJ-AUTO", "BAJFINANCE",
    "BAJAJFINSV", "HEROMOTOCO", "BEL", "BRITANNIA", "TITAN", "TECHM"
}

def build_historical_mapping():
    current_universe = set(CURRENT_NIFTY_50)
    mapping = {}
    
    for year in range(2025, 2015, -1):
        for month in range(12, 0, -1):
            ym = f"{year}-{month:02d}"
            
            if ym in INDEX_CHANGES:
                changes = INDEX_CHANGES[ym]
                for added in changes["added"]:
                    if added in current_universe:
                        current_universe.remove(added)
                for removed in changes["removed"]:
                    current_universe.add(removed)
                    
            mapping[ym] = sorted(list(current_universe))
            
    current_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(current_dir, "historical_constituents.json")
    with open(out_path, "w") as f:
        json.dump(mapping, f, indent=2)
        
    print(f"Generated {out_path} with {len(mapping)} months of point-in-time data.")
    print("Total unique constituents across 10 years:", len(set(stock for month_list in mapping.values() for stock in month_list)))

if __name__ == "__main__":
    build_historical_mapping()
