import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

df = pd.read_csv("Fertilizer Prediction.csv")
df.columns = df.columns.str.strip()

le_soil = LabelEncoder()
le_crop = LabelEncoder()
le_fert = LabelEncoder()

df['Soil'] = le_soil.fit_transform(df['Soil'])
df['Crop'] = le_crop.fit_transform(df['Crop'])
df['Fertilizer'] = le_fert.fit_transform(df['Fertilizer'])

X = df[['Temperature','Moisture','Rainfall','PH','Nitrogen','Phosphorous','Potassium','Carbon','Soil','Crop']]
y = df['Fertilizer']

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

dt = DecisionTreeClassifier(random_state=42)
dt.fit(X_train, y_train)
dt_pred = dt.predict(X_test)

knn = KNeighborsClassifier(n_neighbors=5)
knn.fit(X_train, y_train)
knn_pred = knn.predict(X_test)

print("Random Forest Accuracy:", accuracy_score(y_test, y_pred))
print("Decision Tree Accuracy:", accuracy_score(y_test, dt_pred))
print("KNN Accuracy:", accuracy_score(y_test, knn_pred))

rf_cv = cross_val_score(model, X, y, cv=5)
dt_cv = cross_val_score(dt, X, y, cv=5)
knn_cv = cross_val_score(knn, X, y, cv=5)
print("Random Forest CV Accuracy:", rf_cv.mean())
print("Decision Tree CV Accuracy:", dt_cv.mean())
print("KNN CV:", knn_cv.mean())

from sklearn.metrics import precision_score, recall_score, f1_score

rf_prec = precision_score(y_test, y_pred, average='macro', zero_division=0)
rf_rec  = recall_score(y_test, y_pred, average='macro', zero_division=0)
rf_f1   = f1_score(y_test, y_pred, average='macro', zero_division=0)

dt_prec = precision_score(y_test, dt_pred, average='macro', zero_division=0)
dt_rec  = recall_score(y_test, dt_pred, average='macro', zero_division=0)
dt_f1   = f1_score(y_test, dt_pred, average='macro', zero_division=0)

knn_prec = precision_score(y_test, knn_pred, average='macro', zero_division=0)
knn_rec  = recall_score(y_test, knn_pred, average='macro', zero_division=0)
knn_f1   = f1_score(y_test, knn_pred, average='macro', zero_division=0)

print("\n--- FINAL METRICS ---")
print("RF -> Precision:", rf_prec, "Recall:", rf_rec, "F1:", rf_f1, "CV Std:", rf_cv.std())
print("DT -> Precision:", dt_prec, "Recall:", dt_rec, "F1:", dt_f1, "CV Std:", dt_cv.std())
print("KNN -> Precision:", knn_prec, "Recall:", knn_rec, "F1:", knn_f1, "CV Std:", knn_cv.std())

joblib.dump(model, 'fertilizer_model.pkl')
joblib.dump(le_soil, 'le_soil.pkl')
joblib.dump(le_crop, 'le_crop.pkl')
joblib.dump(le_fert, 'le_fert.pkl')

print("✅ Fertilizer model trained and saved!")
print("Fertilizers:", list(le_fert.classes_))
print("Soil types:", list(le_soil.classes_))
print("Crop types:", list(le_crop.classes_))
