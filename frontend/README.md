# AURA Security - Enterprise Frontend

This is the Next.js frontend application for AURA, an AI Red Teaming platform. It provides a real-time dashboard for managing LangGraph security assessments.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **State Management:** TanStack React Query
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React

## Features
- **Real-Time Polling:** Automatically polls the backend to show live agent execution progress.
- **Enterprise Dashboard:** View historical scans, risk scores, and vulnerabilities in a clean table format.
- **Dark/Light Mode:** Full theming support via 
ext-themes.
- **Dynamic Configuration:** Launch new scans targeting any LLM chatbot endpoint directly from the UI.
- **PDF Export:** Native integration with the backend's PDF report generator.

## Setup Instructions

1. Ensure the AURA backend is running (FastAPI on port 8000).
2. Install frontend dependencies:
   \\\ash
   cd frontend
   npm install
   \\\
3. Set up environment variables (copy \.env.example\ to \.env.local\):
   \\\ash
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
   \\\
4. Run the development server:
   \\\ash
   npm run dev
   \\\
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
- \pp/\ - Next.js App Router (Layouts and Pages)
- \components/ui/\ - Shadcn UI reusable components
- \components/layout/\ - Sidebar, Header, and Theme wrappers
- \services/api.ts\ - Strongly typed Axios API client
- \	ypes/api.ts\ - TypeScript interfaces matching Backend Pydantic models

## Backend Requirements
This frontend requires the AURA FastAPI backend to be running. It assumes:
1. Redis is available for state management.
2. LangGraph workflows are correctly configured in the backend orchestrator.
