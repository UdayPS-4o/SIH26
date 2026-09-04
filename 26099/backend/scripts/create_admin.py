"""One-off script: create an admin user and seed demo materials for local review."""

from app.database import SessionLocal, init_db
from app.models.user import User, Role
from scripts.seed_data import seed_demo_data

init_db()
db = SessionLocal()

if not db.query(User).filter(User.username == "admin").first():
    admin = User(
        username="admin",
        email="admin@example.com",
        full_name="Admin",
        hashed_password=User.hash_password("admin123"),
        role=Role.ADMIN,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    print("Created admin user: admin / admin123")
else:
    print("Admin user already exists")

result = seed_demo_data(db)
print("Seed result:", result)

db.close()
