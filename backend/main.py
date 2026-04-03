from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, documents, chat

app = FastAPI(title="PDF RAG Chatbox")

# Allow requests from the Next.js dev server and Vercel production domain.
# T029: Add the Vercel deploy URL to this list after deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])


@app.get("/health")
def health():
    return {"status": "ok"}
