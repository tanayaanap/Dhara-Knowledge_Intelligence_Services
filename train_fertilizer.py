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

from sklearn.model_selection import train_test_split,cross_val_score
from sklearn.metrics import accuracy_score
from sklearn.tree import DecisionTreeClassifier

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)


# Test model
y_pred = model.predict(X_test)

# ---------------- DECISION TREE ----------------
dt = DecisionTreeClassifier(random_state=42)
dt.fit(X_train, y_train)
dt_pred = dt.predict(X_test)

# ---------------- ACCURACY ----------------
print("Random Forest Accuracy:", accuracy_score(y_test, y_pred))
print("Decision Tree Accuracy:", accuracy_score(y_test, dt_pred))

# ---------------- CROSS VALIDATION ----------------
rf_cv = cross_val_score(model, X, y, cv=5)
dt_cv = cross_val_score(dt, X, y, cv=5)

print("Random Forest CV Accuracy:", rf_cv.mean())
print("Decision Tree CV Accuracy:", dt_cv.mean())

joblib.dump(model, 'fertilizer_model.pkl')
joblib.dump(le_soil, 'le_soil.pkl')
joblib.dump(le_crop, 'le_crop.pkl')
joblib.dump(le_fert, 'le_fert.pkl')

print("✅ Fertilizer model trained and saved!")
print("Fertilizers:", list(le_fert.classes_))
print("Soil types:", list(le_soil.classes_))
print("Crop types:", list(le_crop.classes_))
