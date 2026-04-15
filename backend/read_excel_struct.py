import pandas as pd
import sys
import json

df = pd.read_excel(r'd:\.PROJECT_1\1_data_excel\Nguyện_vọng_dạy_của_giảng_viên.xlsx')
cols = list(df.columns)
print(json.dumps(cols, ensure_ascii=False))
rows = []
for i, row in df.head(3).iterrows():
    rows.append({c: str(row[c]) for c in cols})
print(json.dumps(rows, ensure_ascii=False))
