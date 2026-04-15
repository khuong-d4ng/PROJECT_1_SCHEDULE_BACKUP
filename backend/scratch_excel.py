import pandas as pd
import json

file_path = r"d:\.PROJECT_1\1_data_excel\Nguyện_vọng_dạy_của_giảng_viên.xlsx"
df = pd.read_excel(file_path, sheet_name=0, nrows=5)
print("Columns:", list(df.columns))
print("First 3 rows:")
for index, row in df.head(3).iterrows():
    print(row.to_dict())
