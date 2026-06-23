"""End-to-end bot test: fix domain, index content, test chat."""
import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal
from app.repositories.source_repository import SourceRepository
from app.services.ingestion_service import IngestionService


SAMPLE_CONTENT = """
DG ChatBot is an AI-powered website chatbot platform built by Douglas Githui Tech Creatives.

WHAT IS DG CHATBOT?
DG ChatBot lets you add an intelligent AI assistant to any website in minutes.
The bot answers questions strictly from content you approve — it will never make up information.

PRICING PLANS:
- Free Plan: KES 0 forever — 1 chatbot, 5 knowledge sources, 500 conversations per month
- Pro Plan: KES 6,000 per month — 3 chatbots, 15 knowledge sources, 500 conversations/month,
  custom branding, 2 team members, email support
- Enterprise Plan: Custom pricing — unlimited chatbots, unlimited sources, unlimited conversations,
  white-label widget, unlimited team members, dedicated support and SLA

HOW TO INSTALL THE WIDGET:
Paste this one-line script tag before your closing </body> tag:
  <script src="https://yourdomain.com/widget.js" data-bot="YOUR_BOT_KEY"></script>
Works on WordPress, Shopify, plain HTML, Laravel, Webflow, React and Next.js sites.

SUPPORTED CONTENT TYPES:
Upload PDFs, paste plain text, add FAQ pairs, or crawl a website. The bot only answers from
the approved content you upload.

LEAD CAPTURE:
When the bot cannot answer a question, it offers to collect the visitor contact details
(name, email, phone) so your team can follow up. Leads appear in the admin dashboard.

DOMAIN ALLOWLIST:
Each bot only works on domains you explicitly authorize. No unauthorized site can embed your bot.

MULTI-TENANT ISOLATION:
Every workspace has its own isolated knowledge base. One bot can never see another workspace's content.

CONTACT US:
Email: info@doughlas.africa
WhatsApp: +254707264913
Website: https://doughlas.africa

ABOUT THE COMPANY:
Douglas Githui Tech Creatives is a Kenyan technology company specializing in AI-powered tools
for businesses across Africa. Founded with the mission to make enterprise-grade AI accessible
to every business on the continent.
"""


async def main():
    async with AsyncSessionLocal() as db:
        # 1. Get bot details
        r = await db.execute(text("SELECT id, public_key, workspace_id, org_id FROM bots WHERE deleted_at IS NULL LIMIT 1"))
        bot_row = list(r)[0]
        bot_id, pub_key, ws_id, org_id = bot_row
        print(f"Bot id        : {bot_id}")
        print(f"Public key    : {pub_key}")
        print(f"Workspace     : {ws_id}")

        # 2. Fix domain entry — store just the hostname
        await db.execute(
            text("UPDATE domains SET domain = 'localhost' WHERE bot_id = :bid"),
            {"bid": bot_id}
        )
        print("Domain fixed  : localhost")

        # 3. Clear old pending/failed sources so we start clean
        await db.execute(text("DELETE FROM ingestion_jobs WHERE workspace_id = :ws"), {"ws": ws_id})
        await db.execute(text("DELETE FROM knowledge_sources WHERE workspace_id = :ws"), {"ws": ws_id})
        print("Old sources   : cleared")

        # 4. Create text source
        source = await SourceRepository.create(
            db,
            workspace_id=ws_id,
            bot_id=bot_id,
            name="DG ChatBot Product Info",
            source_type="text",
            metadata_json={"name": "DG ChatBot Product Info", "content": SAMPLE_CONTENT},
        )
        job = await SourceRepository.create_job(db, ws_id, source.id, "ingest")
        await db.commit()
        print(f"Source created: {source.id}")

        # 5. Run ingestion synchronously
        print("Ingesting...  (embedding via Anthropic/Voyage, may take a moment)")
        await IngestionService.run_ingestion_job(db, job.id)
        await db.commit()

        # 6. Verify
        r = await db.execute(
            text("SELECT COUNT(*) FROM document_chunks WHERE workspace_id = :ws"), {"ws": ws_id}
        )
        chunk_count = list(r)[0][0]

        r = await db.execute(
            text("SELECT status, chunk_count FROM knowledge_sources WHERE id = :sid"), {"sid": source.id}
        )
        src_row = list(r)[0]
        print(f"Source status : {src_row[0]}  chunks={src_row[1]}")
        print(f"Total chunks  : {chunk_count}")

        if chunk_count == 0:
            print("\nERROR: No chunks were indexed. Check embedding provider config.")
            return

        print("\n=== CONTENT INDEXED SUCCESSFULLY ===")
        print(f"Public key for widget testing: {pub_key}")
        print(f"Test URL: http://localhost:3002")


asyncio.run(main())
