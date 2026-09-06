# Korea Finance Tracker - Setup Guide

Welcome to the Korea Finance Tracker! Since you're a beginner, this guide will walk you through setting up all the necessary accounts, API keys, and running the application step-by-step.

---

## Step 1: Set Up Supabase (Database & Authentication)

Supabase is a free platform that gives us a PostgreSQL database and user authentication.

1. Go to [Supabase](https://supabase.com/) and create a free account.
2. Click **"New Project"**, give it a name (e.g., `korea-finance-tracker`), and set a strong database password. Wait a few minutes for the project to finish provisioning.
3. **Get your Keys:**
   - Go to your Project Settings (the gear icon) -> **API**.
   - You will see a **Project URL**. Keep this handy.
   - You will see a `anon` `public` key.
   - You will see a `service_role` `secret` key.
4. **Create the Database Table:**
   - On the left sidebar, click on **SQL Editor**.
   - Click **"New Query"**.
   - Open the file located in your project at `apps/api/supabase/migrations/0001_init.sql`.
   - Copy all the SQL code inside that file, paste it into the Supabase SQL Editor, and click **Run**. This creates your `transactions` table and the security policies!

---

## Step 2: Get Your API Keys

We need two external APIs to power the "magic" in the backend.

### 1. Google Gemini AI (For cleaning up merchant names)
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **"Get API Key"** on the left menu, and click **"Create API Key"**. 
4. Copy the generated key.

### 2. Kakao Developers (For getting GPS locations of Korean stores)
1. Go to [Kakao Developers](https://developers.kakao.com/) and log in (you need a Kakao account).
2. Click **"My Application"** at the top, then **"Add an application"**.
3. Give it a name and company name (you can just put your name).
4. Click on the app you just created. You will see an **"App Keys"** section.
5. Copy the **REST API Key**.
6. **Important:** On the left sidebar under your app settings, go to **App Settings** -> **Advanced**, or look for **Map / Local API**. You must explicitly **Enable** the map/local API service for your application (it might be labeled as "OPEN_MAP_AND_LOCAL service").

---

## Step 3: Configure Environment Variables

Environment variables are hidden files that store your secret keys so they don't get uploaded to GitHub. 

### 1. Backend API (`apps/api/.env`)
Open the file `apps/api/.env` (create it if it doesn't exist) and fill it out like this:

```env
# From Step 1
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# From Step 2
GEMINI_API_KEY=your_gemini_api_key
KAKAO_REST_API_KEY=your_kakao_rest_api_key

# Make up a random secret password here (e.g. MySuperSecretWebhookToken)
# You will use this in Apple Shortcuts to authenticate your requests.
API_BEARER_TOKEN=MySuperSecretWebhookToken
```

### 2. Frontend Web App (`apps/web/.env`)
Open the file `apps/web/.env` (create it if it doesn't exist) and fill it out like this:

```env
# From Step 1
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
```

---

## Step 4: Run the Application

You need to run two servers: the backend API and the frontend web app.

1. Open your terminal in the root folder of the project (`/home/joel/code/korea-finance-tracker`).
2. Run this command to start the backend API:
   ```bash
   npm run dev:api
   ```
   *(It should say "Server is running on port 3000")*
3. **Open a SECOND terminal window** in the same root folder.
4. Run this command to start the frontend web app:
   ```bash
   npm run dev:web
   ```
   *(It should give you a local link, usually `http://localhost:5173`)*

---

## Step 5: How to Use the App

1. Open `http://localhost:5173` in your browser.
2. You will see the sleek yellow-and-black Login screen.
3. Type in an email and password, and click **"CREATE ACCOUNT"**.
4. You will be logged into your empty dashboard. (Keep note of the email you used!).

### How to send a test transaction
Since this tracker is meant to receive webhooks (like from Apple Shortcuts), you can simulate a bank transfer using your terminal!

1. Go to your Supabase Dashboard -> **Authentication** -> **Users** and find the `User UID` (a long string like `123e4567-e89b-12d3...`) of the account you just created.
2. Open a third terminal window.
3. Run this command (make sure to replace `YOUR_USER_ID` and `YOUR_API_BEARER_TOKEN`!):

```bash
curl -X POST http://localhost:3000/api/v1/transactions/ingest \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_API_BEARER_TOKEN" \
-d '{
  "source": "maribank",
  "user_id": "YOUR_USER_ID",
  "raw_body": "{\"merchant\": \"GS25 SeoulTech\", \"amount\": \"3500\", \"currency\": \"KRW\"}"
}'
```

4. If it says `{"success":true}`, refresh your web browser. You will see the AI has automatically figured out it's a "Convenience Store", converted the currency to PHP, found the location on a map, and displayed it beautifully on your dashboard!
