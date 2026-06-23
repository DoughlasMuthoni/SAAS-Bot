"""Seed a demo organization, workspace, bot, and FAQ entries for development."""
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../services/api"))

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password, generate_public_key
from app.models import Bot, KnowledgeSource, Organization, User, Workspace
from app.utils.ids import generate_uuid


async def seed():
    async with AsyncSessionLocal() as db:
        org = Organization(
            id=generate_uuid(),
            name="Demo Company",
            slug="demo-company",
            plan="pro",
        )
        db.add(org)
        await db.flush()

        ws = Workspace(
            id=generate_uuid(),
            org_id=org.id,
            name="Demo Workspace",
            slug="demo",
        )
        db.add(ws)
        await db.flush()

        admin = User(
            id=generate_uuid(),
            org_id=org.id,
            email="admin@demo.com",
            hashed_password=hash_password("demo1234"),
            full_name="Demo Admin",
            role="owner",
        )
        db.add(admin)

        bot_key = generate_public_key()
        bot = Bot(
            id=generate_uuid(),
            workspace_id=ws.id,
            org_id=org.id,
            name="Demo Assistant",
            public_key=bot_key,
            brand_color="#6366f1",
            welcome_message="Hi! I'm the demo assistant. Ask me anything about our services!",
        )
        db.add(bot)
        await db.flush()

        faq_source = KnowledgeSource(
            id=generate_uuid(),
            workspace_id=ws.id,
            bot_id=bot.id,
            name="Demo FAQs",
            source_type="faq",
            status="pending",
            metadata_json={
                "faqs": [
                    {"question": "What is your return policy?", "answer": "We offer 30-day returns on all items."},
                    {"question": "Do you offer free shipping?", "answer": "Yes, free shipping on orders over $50."},
                    {"question": "How can I track my order?", "answer": "Use the tracking number emailed after dispatch."},
                ]
            },
        )
        db.add(faq_source)
        await db.commit()

        print(f"\n==> Demo seeded successfully!")
        print(f"    Admin email:    admin@demo.com")
        print(f"    Admin password: demo1234")
        print(f"    Bot public key: {bot_key}")
        print(f"\n    Add to demo-site/index.html:")
        print(f'    <script src="http://localhost:8000/static/widget.js" data-bot="{bot_key}"></script>')


if __name__ == "__main__":
    asyncio.run(seed())
