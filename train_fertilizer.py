import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

df = pd.read_csv("Fertilizer Prediction.csv")
df.columns = df.columns.str.strip()

le_soil = LabelEncoder()
le_crop = LabelEncoder()
le_fert = LabelEncoder()

df['Soil Type'] = le_soil.fit_transform(df['Soil Type'])
df['Crop Type'] = le_crop.fit_transform(df['Crop Type'])
df['Fertilizer Name'] = le_fert.fit_transform(df['Fertilizer Name'])

X = df[['Temparature','Humidity','Moisture','Soil Type','Crop Type','Nitrogen','Potassium','Phosphorous']]
y = df['Fertilizer Name']

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

joblib.dump(model, 'fertilizer_model.pkl')
joblib.dump(le_soil, 'le_soil.pkl')
joblib.dump(le_crop, 'le_crop.pkl')
joblib.dump(le_fert, 'le_fert.pkl')

print("✅ Fertilizer model trained and saved!")
print("Fertilizers:", list(le_fert.classes_))
print("Soil types:", list(le_soil.classes_))
print("Crop types:", list(le_crop.classes_))
