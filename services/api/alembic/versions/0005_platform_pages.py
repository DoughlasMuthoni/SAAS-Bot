"""Create platform_pages table for editable legal/policy pages

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-24
"""
from alembic import op
import sqlalchemy as sa

revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None

PRIVACY_CONTENT = """<h2>Privacy Policy</h2>
<p><em>Last updated: June 2026</em></p>

<h3>1. Information We Collect</h3>
<p>We collect information you provide directly to us when you register for an account, create a chatbot, or contact us for support. This includes your name, email address, and organisation details.</p>

<h3>2. How We Use Your Information</h3>
<p>We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions.</p>

<h3>3. Information Sharing</h3>
<p>We do not sell, trade, or otherwise transfer your personally identifiable information to third parties without your consent, except as described in this policy or as required by law.</p>

<h3>4. Data Security</h3>
<p>We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction.</p>

<h3>5. Data Retention</h3>
<p>We retain your personal information for as long as necessary to provide you with our services and as required by applicable law.</p>

<h3>6. Your Rights</h3>
<p>You have the right to access, correct, or delete your personal data. To exercise these rights, please contact us at the email address below.</p>

<h3>7. Contact Us</h3>
<p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@dgchatbot.com">support@dgchatbot.com</a>.</p>"""

TERMS_CONTENT = """<h2>Terms of Service</h2>
<p><em>Last updated: June 2026</em></p>

<h3>1. Acceptance of Terms</h3>
<p>By accessing and using DG ChatBot, you accept and agree to be bound by the terms and provision of this agreement.</p>

<h3>2. Use of Service</h3>
<p>You may use our service only for lawful purposes and in accordance with these Terms. You agree not to use the service in any way that violates applicable local, national, or international law or regulation.</p>

<h3>3. Account Registration</h3>
<p>To access certain features of our service, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.</p>

<h3>4. Intellectual Property</h3>
<p>The service and its original content, features, and functionality are and will remain the exclusive property of DG ChatBot and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.</p>

<h3>5. Termination</h3>
<p>We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason, including if you breach these Terms.</p>

<h3>6. Limitation of Liability</h3>
<p>In no event shall DG ChatBot, its directors, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the service.</p>

<h3>7. Changes to Terms</h3>
<p>We reserve the right to modify or replace these Terms at any time. We will provide notice of any significant changes by updating the date at the top of this page.</p>

<h3>8. Contact Us</h3>
<p>If you have any questions about these Terms, please contact us at <a href="mailto:support@dgchatbot.com">support@dgchatbot.com</a>.</p>"""

SECURITY_CONTENT = """<h2>Security</h2>
<p><em>Last updated: June 2026</em></p>

<h3>Our Security Commitment</h3>
<p>Security is a core part of how we build and operate DG ChatBot. We are committed to protecting your data and the data of your customers.</p>

<h3>Infrastructure Security</h3>
<p>Our platform is hosted on secure cloud infrastructure. We use industry-standard encryption for data in transit (TLS 1.2+) and at rest. Our servers are protected by firewalls and access controls.</p>

<h3>Application Security</h3>
<ul>
  <li>All API endpoints require authentication and authorisation</li>
  <li>Multi-tenant data isolation ensures your data is never accessible to other tenants</li>
  <li>Passwords are hashed using bcrypt with salt</li>
  <li>JWT tokens are short-lived and securely signed</li>
  <li>Rate limiting protects against abuse</li>
  <li>Input validation and sanitisation prevent injection attacks</li>
</ul>

<h3>Data Protection</h3>
<p>We implement the principle of least privilege — our team only accesses customer data when necessary for support purposes, and all access is logged.</p>

<h3>Responsible Disclosure</h3>
<p>If you discover a security vulnerability in our platform, please report it responsibly to <a href="mailto:security@dgchatbot.com">security@dgchatbot.com</a>. We will acknowledge your report within 48 hours and work to resolve valid issues promptly.</p>

<h3>Compliance</h3>
<p>We follow industry best practices and work towards compliance with relevant data protection regulations. We conduct regular security reviews of our codebase and infrastructure.</p>"""


def upgrade() -> None:
    op.create_table(
        'platform_pages',
        sa.Column('slug', sa.String(64), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('content', sa.Text().with_variant(sa.Text(length=4294967295), 'mysql'), nullable=False, server_default=''),
        sa.Column('updated_by', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Seed default pages
    conn = op.get_bind()
    conn.execute(
        sa.text("INSERT INTO platform_pages (slug, title, content) VALUES (:slug, :title, :content)"),
        [
            {"slug": "privacy", "title": "Privacy Policy", "content": PRIVACY_CONTENT},
            {"slug": "terms", "title": "Terms of Service", "content": TERMS_CONTENT},
            {"slug": "security", "title": "Security", "content": SECURITY_CONTENT},
        ]
    )


def downgrade() -> None:
    op.drop_table('platform_pages')
