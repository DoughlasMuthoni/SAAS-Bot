"""Live end-to-end chat test against the running API."""
import httpx, json, sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE = "http://localhost:8000/api/v1"
PUBLIC_KEY = "I35lvHLo5bYq7A2tPALm1FhmrFegGEhu"
DOMAIN = "localhost"

QUESTIONS = [
    "What is DG ChatBot?",
    "How much does the Pro plan cost?",
    "How do I install the widget on my website?",
    "What is the contact email address?",
    "Can you book a flight for me?",   # out-of-scope — should admit it doesn't know
]


def hr(char="-", n=60):
    print(char * n)


def test_session() -> str:
    print(f"\nCreating session for bot {PUBLIC_KEY}...")
    r = httpx.post(f"{BASE}/widget/session", json={"public_key": PUBLIC_KEY, "domain": DOMAIN}, timeout=10)
    if r.status_code != 200:
        print(f"  FAIL {r.status_code}: {r.text}")
        sys.exit(1)
    token = r.json()["session_token"]
    session_id = r.json()["session_id"]
    print(f"  OK  session_id={session_id[:16]}...")
    return token


def test_chat(token: str, message: str, history: list) -> tuple[str, dict]:
    hr()
    print(f"Q: {message}")
    payload = {"session_token": token, "message": message, "history": history}

    full_text = ""
    metadata = {}

    headers = {"Referer": "http://localhost:3002/", "Origin": "http://localhost:3002"}
    with httpx.stream("POST", f"{BASE}/widget/chat", json=payload, headers=headers, timeout=60) as resp:
        if resp.status_code != 200:
            body = resp.read()
            print(f"  FAIL {resp.status_code}: {body}")
            return "", {}

        for line in resp.iter_lines():
            if not line.startswith("data:"):
                continue
            raw = line[5:].strip()
            try:
                evt = json.loads(raw)
            except Exception:
                continue

            if evt["type"] == "token":
                full_text += evt["data"]
                print(evt["data"], end="", flush=True)
            elif evt["type"] == "correct":
                full_text = evt["data"]
            elif evt["type"] == "metadata":
                metadata = evt["data"]
            elif evt["type"] == "error":
                print(f"\n  STREAM ERROR: {evt['data']}")
            elif evt["type"] == "done":
                break

    print()  # newline after streaming
    grounded = metadata.get("was_grounded", "?")
    unresolved = metadata.get("unresolved", "?")
    citations = metadata.get("citations", [])
    print(f"\n  grounded={grounded}  unresolved={unresolved}  citations={len(citations)}")
    if citations:
        for c in citations[:2]:
            print(f"  📄 {c['source_name']} (score={c['score']:.3f}): {c['snippet'][:80]}…")
    return full_text, metadata


def main():
    hr("=")
    print("DG ChatBot End-to-End Test")
    hr("=")

    token = test_session()
    history = []

    for question in QUESTIONS:
        answer, meta = test_chat(token, question, history)
        if answer:
            history.append({"role": "user", "content": question})
            history.append({"role": "assistant", "content": answer})

    hr("=")
    print(f"Test complete. {len(QUESTIONS)} questions sent.")
    hr("=")


if __name__ == "__main__":
    main()
