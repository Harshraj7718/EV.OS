"""Baseline job-marketplace listings — idempotent by `job_code`, mirrors
`app/modules/investors/seed.py`'s EV-asset seeding.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.modules.riders.models import Job

JOB_DEFINITIONS: list[dict] = [
    {
        "job_code": "JOB-BLR-0001",
        "title": "Airport pickup — Whitefield to KIA",
        "description": "Single passenger ride-hailing trip, luggage included.",
        "pickup_location": "Whitefield, Bengaluru",
        "dropoff_location": "Kempegowda International Airport",
        "fare_amount": 650,
    },
    {
        "job_code": "JOB-DEL-0002",
        "title": "Same-day parcel delivery — Connaught Place to Dwarka",
        "description": "Small parcel delivery for a local e-commerce partner.",
        "pickup_location": "Connaught Place, New Delhi",
        "dropoff_location": "Dwarka Sector 21, New Delhi",
        "fare_amount": 320,
    },
    {
        "job_code": "JOB-MUM-0003",
        "title": "Food delivery — Bandra to Andheri",
        "description": "Restaurant order delivery for a food-delivery partner.",
        "pickup_location": "Bandra West, Mumbai",
        "dropoff_location": "Andheri East, Mumbai",
        "fare_amount": 180,
    },
    {
        "job_code": "JOB-HYD-0004",
        "title": "Corporate shuttle — HITEC City to Gachibowli",
        "description": "Scheduled ride for a corporate leasing partner's employee.",
        "pickup_location": "HITEC City, Hyderabad",
        "dropoff_location": "Gachibowli, Hyderabad",
        "fare_amount": 240,
    },
    {
        "job_code": "JOB-PUN-0005",
        "title": "Last-mile grocery delivery — Kothrud to Baner",
        "description": "Grocery delivery batch for a quick-commerce fleet partner.",
        "pickup_location": "Kothrud, Pune",
        "dropoff_location": "Baner, Pune",
        "fare_amount": 150,
    },
]


def seed_jobs(db: Session) -> None:
    created = 0
    for definition in JOB_DEFINITIONS:
        existing = db.scalar(select(Job).where(Job.job_code == definition["job_code"]))
        if existing is not None:
            continue
        db.add(Job(**definition))
        created += 1

    db.commit()
    logger.info(
        "Job marketplace seed complete: %d created, %d already present",
        created,
        len(JOB_DEFINITIONS) - created,
    )
