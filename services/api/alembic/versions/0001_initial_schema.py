"""Initial schema — all 17 tables

Revision ID: 0001
Revises:
Create Date: 2026-04-24
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("plan", sa.Enum("free", "pro", "enterprise", name="org_plan"), nullable=False, server_default="free"),
        sa.Column("settings", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_organizations_slug", "organizations", ["slug"])
    op.create_index("ix_organizations_deleted_at", "organizations", ["deleted_at"])

    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("org_id", sa.String(36), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("owner", "admin", "editor", "viewer", name="user_role"), nullable=False, server_default="editor"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="1"),
        sa.Column("last_login_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_users_org_id", "users", ["org_id"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "workspaces",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("org_id", sa.String(36), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_workspaces_org_id", "workspaces", ["org_id"])
    op.create_index("ix_workspaces_slug", "workspaces", ["slug"])

    op.create_table(
        "bots",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("workspace_id", sa.String(36), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("org_id", sa.String(36), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("public_key", sa.String(64), unique=True, nullable=False),
        sa.Column("brand_color", sa.String(7), nullable=False, server_default="#6366f1"),
        sa.Column("welcome_message", sa.Text, nullable=False, server_default="Hi! How can I help you?"),
        sa.Column("fallback_email", sa.String(255), nullable=True),
        sa.Column("fallback_phone", sa.String(50), nullable=True),
        sa.Column("fallback_whatsapp", sa.String(50), nullable=True),
        sa.Column("model_name", sa.String(100), nullable=True),
        sa.Column("system_prompt_override", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="1"),
        sa.Column("position", sa.Enum("bottom-right", "bottom-left", name="bot_position"), nullable=False, server_default="bottom-right"),
        sa.Column("theme", sa.Enum("light", "dark", name="bot_theme"), nullable=False, server_default="light"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_bots_workspace_id", "bots", ["workspace_id"])
    op.create_index("ix_bots_public_key", "bots", ["public_key"])

    op.create_table(
        "domains",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("bot_id", sa.String(36), sa.ForeignKey("bots.id"), nullable=False),
        sa.Column("workspace_id", sa.String(36), nullable=False),
        sa.Column("domain", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("bot_id", "domain", name="uq_bot_domain"),
    )
    op.create_index("ix_domains_bot_id", "domains", ["bot_id"])
    op.create_index("ix_domains_workspace_id", "domains", ["workspace_id"])

    op.create_table(
        "knowledge_sources",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("workspace_id", sa.String(36), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("bot_id", sa.String(36), sa.ForeignKey("bots.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("source_type", sa.Enum("text", "faq", "upload", "crawl", name="source_type"), nullable=False),
        sa.Column("status", sa.Enum("pending", "indexing", "indexed", "failed", "disabled", name="source_status"), nullable=False, server_default="pending"),
        sa.Column("content_url", sa.String(2048), nullable=True),
        sa.Column("file_path", sa.String(1024), nullable=True),
        sa.Column("file_mime_type", sa.String(100), nullable=True),
        sa.Column("file_size_bytes", sa.Integer, nullable=True),
        sa.Column("language", sa.String(10), nullable=False, server_default="en"),
        sa.Column("metadata_json", sa.JSON, nullable=True),
        sa.Column("indexed_at", sa.DateTime, nullable=True),
        sa.Column("chunk_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_knowledge_sources_workspace_id", "knowledge_sources", ["workspace_id"])
    op.create_index("ix_knowledge_sources_bot_id", "knowledge_sources", ["bot_id"])

    op.create_table(
        "source_documents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("source_id", sa.String(36), sa.ForeignKey("knowledge_sources.id"), nullable=False),
        sa.Column("workspace_id", sa.String(36), nullable=False),
        sa.Column("title", sa.String(500), nullable=False, server_default=""),
        sa.Column("raw_content", sa.Text(length=4294967295), nullable=False),
        sa.Column("normalized_content", sa.Text(length=4294967295), nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("doc_type", sa.String(50), nullable=False, server_default="text"),
        sa.Column("source_url", sa.String(2048), nullable=True),
        sa.Column("page_number", sa.Integer, nullable=True),
        sa.Column("processing_status", sa.Enum("pending", "processed", "failed", name="doc_processing_status"), nullable=False, server_default="pending"),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_source_documents_source_id", "source_documents", ["source_id"])
    op.create_index("ix_source_documents_workspace_id", "source_documents", ["workspace_id"])
    op.create_index("ix_source_documents_content_hash", "source_documents", ["content_hash"])

    op.create_table(
        "document_chunks",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("document_id", sa.String(36), sa.ForeignKey("source_documents.id"), nullable=False),
        sa.Column("source_id", sa.String(36), sa.ForeignKey("knowledge_sources.id"), nullable=False),
        sa.Column("workspace_id", sa.String(36), nullable=False),
        sa.Column("bot_id", sa.String(36), sa.ForeignKey("bots.id"), nullable=False),
        sa.Column("chunk_index", sa.Integer, nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("token_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("char_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("embedding_id", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_document_chunks_document_id", "document_chunks", ["document_id"])
    op.create_index("ix_document_chunks_source_id", "document_chunks", ["source_id"])
    op.create_index("ix_document_chunks_workspace_id", "document_chunks", ["workspace_id"])
    op.create_index("ix_document_chunks_bot_id", "document_chunks", ["bot_id"])
    op.create_index("ix_document_chunks_is_active", "document_chunks", ["is_active"])
    op.create_index("ix_chunk_retrieval", "document_chunks", ["workspace_id", "bot_id", "is_active"])

    op.create_table(
        "embeddings_metadata",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("chunk_id", sa.String(36), sa.ForeignKey("document_chunks.id"), unique=True, nullable=False),
        sa.Column("workspace_id", sa.String(36), nullable=False),
        sa.Column("embedding_provider", sa.String(50), nullable=False),
        sa.Column("embedding_model", sa.String(100), nullable=False),
        sa.Column("vector_store_id", sa.String(255), nullable=False),
        sa.Column("vector_doc_id", sa.String(255), nullable=False),
        sa.Column("dimensions", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_embeddings_metadata_workspace_id", "embeddings_metadata", ["workspace_id"])

    op.create_table(
        "conversations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("bot_id", sa.String(36), sa.ForeignKey("bots.id"), nullable=False),
        sa.Column("workspace_id", sa.String(36), nullable=False),
        sa.Column("session_id", sa.String(255), nullable=False),
        sa.Column("visitor_ip", sa.String(45), nullable=True),
        sa.Column("visitor_domain", sa.String(255), nullable=True),
        sa.Column("status", sa.Enum("active", "resolved", "lead", "unresolved", name="conversation_status"), nullable=False, server_default="active"),
        sa.Column("message_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime, nullable=False),
        sa.Column("last_message_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_conversations_bot_id", "conversations", ["bot_id"])
    op.create_index("ix_conversations_workspace_id", "conversations", ["workspace_id"])
    op.create_index("ix_conversations_session_id", "conversations", ["session_id"])

    op.create_table(
        "conversation_messages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("conversation_id", sa.String(36), sa.ForeignKey("conversations.id"), nullable=False),
        sa.Column("workspace_id", sa.String(36), nullable=False),
        sa.Column("role", sa.Enum("user", "assistant", name="message_role"), nullable=False),
        sa.Column("content", sa.Text(length=4294967295), nullable=False),
        sa.Column("retrieved_chunk_ids", sa.JSON, nullable=True),
        sa.Column("retrieval_score_json", sa.JSON, nullable=True),
        sa.Column("model_used", sa.String(100), nullable=True),
        sa.Column("input_tokens", sa.Integer, nullable=True),
        sa.Column("output_tokens", sa.Integer, nullable=True),
        sa.Column("latency_ms", sa.Integer, nullable=True),
        sa.Column("was_grounded", sa.Boolean, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_conversation_messages_conversation_id", "conversation_messages", ["conversation_id"])
    op.create_index("ix_conversation_messages_workspace_id", "conversation_messages", ["workspace_id"])

    op.create_table(
        "leads",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("workspace_id", sa.String(36), nullable=False),
        sa.Column("bot_id", sa.String(36), sa.ForeignKey("bots.id"), nullable=False),
        sa.Column("conversation_id", sa.String(36), sa.ForeignKey("conversations.id"), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("message", sa.Text, nullable=True),
        sa.Column("page_url", sa.String(2048), nullable=True),
        sa.Column("status", sa.Enum("new", "contacted", "closed", name="lead_status"), nullable=False, server_default="new"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_leads_workspace_id", "leads", ["workspace_id"])
    op.create_index("ix_leads_bot_id", "leads", ["bot_id"])

    op.create_table(
        "unresolved_queries",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("workspace_id", sa.String(36), nullable=False),
        sa.Column("bot_id", sa.String(36), sa.ForeignKey("bots.id"), nullable=False),
        sa.Column("conversation_id", sa.String(36), sa.ForeignKey("conversations.id"), nullable=True),
        sa.Column("query_text", sa.Text, nullable=False),
        sa.Column("retrieval_attempt_json", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_unresolved_queries_workspace_id", "unresolved_queries", ["workspace_id"])
    op.create_index("ix_unresolved_queries_bot_id", "unresolved_queries", ["bot_id"])

    op.create_table(
        "ingestion_jobs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("workspace_id", sa.String(36), nullable=False),
        sa.Column("source_id", sa.String(36), sa.ForeignKey("knowledge_sources.id"), nullable=False),
        sa.Column("job_type", sa.Enum("ingest", "reindex", "delete", name="job_type"), nullable=False),
        sa.Column("status", sa.Enum("queued", "running", "done", "failed", name="job_status"), nullable=False, server_default="queued"),
        sa.Column("started_at", sa.DateTime, nullable=True),
        sa.Column("completed_at", sa.DateTime, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("documents_processed", sa.Integer, nullable=False, server_default="0"),
        sa.Column("chunks_created", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ingestion_jobs_workspace_id", "ingestion_jobs", ["workspace_id"])
    op.create_index("ix_ingestion_jobs_source_id", "ingestion_jobs", ["source_id"])

    op.create_table(
        "api_keys",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("org_id", sa.String(36), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("key_prefix", sa.String(8), nullable=False),
        sa.Column("hashed_key", sa.String(64), unique=True, nullable=False),
        sa.Column("last_used_at", sa.DateTime, nullable=True),
        sa.Column("expires_at", sa.DateTime, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_api_keys_user_id", "api_keys", ["user_id"])
    op.create_index("ix_api_keys_org_id", "api_keys", ["org_id"])

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("org_id", sa.String(36), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("workspace_id", sa.String(36), nullable=True),
        sa.Column("user_id", sa.String(36), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("resource_type", sa.String(50), nullable=False),
        sa.Column("resource_id", sa.String(36), nullable=False),
        sa.Column("old_value_json", sa.JSON, nullable=True),
        sa.Column("new_value_json", sa.JSON, nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_audit_logs_org_id", "audit_logs", ["org_id"])
    op.create_index("ix_audit_logs_workspace_id", "audit_logs", ["workspace_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])

    op.create_table(
        "usage_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("workspace_id", sa.String(36), nullable=False),
        sa.Column("bot_id", sa.String(36), sa.ForeignKey("bots.id"), nullable=False),
        sa.Column("event_type", sa.Enum("chat_message", "ingestion", "retrieval", "lead_captured", name="usage_event_type"), nullable=False),
        sa.Column("tokens_input", sa.Integer, nullable=False, server_default="0"),
        sa.Column("tokens_output", sa.Integer, nullable=False, server_default="0"),
        sa.Column("latency_ms", sa.Integer, nullable=False, server_default="0"),
        sa.Column("model_used", sa.String(100), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_usage_events_workspace_id", "usage_events", ["workspace_id"])
    op.create_index("ix_usage_events_bot_id", "usage_events", ["bot_id"])


def downgrade() -> None:
    op.drop_table("usage_events")
    op.drop_table("audit_logs")
    op.drop_table("api_keys")
    op.drop_table("ingestion_jobs")
    op.drop_table("unresolved_queries")
    op.drop_table("leads")
    op.drop_table("conversation_messages")
    op.drop_table("conversations")
    op.drop_table("embeddings_metadata")
    op.drop_table("document_chunks")
    op.drop_table("source_documents")
    op.drop_table("knowledge_sources")
    op.drop_table("domains")
    op.drop_table("bots")
    op.drop_table("workspaces")
    op.drop_table("users")
    op.drop_table("organizations")
