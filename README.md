# Notes of Matcha
 
A personal matcha journal app to track and rate your matcha experiences.
 
## Prerequisites
 
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (required for local Supabase)
 
## How to Run Locally
 
### 1. Clone the repo and install dependencies
 
```bash
git clone https://github.com/alexyehhh/notes-of-matcha.git
cd notes-of-matcha
npm install
```
 
### 2. Set up Supabase locally
 
Install the Supabase CLI (if not already installed):
 
```bash
npm install supabase --save-dev
```
 
Make sure Docker Desktop is open and running, then start the local Supabase instance:
 
```bash
npx supabase start
```
 
This will print out a list of local credentials. Copy the **Project URL** and **Publishable (anon) key**.
 
### 3. Set up environment variables
 
Create a `.env.local` file in the project root:
 
**Mac/Linux:**
```bash
cp .env.example .env.local
```
 
**Windows:**
```bash
copy .env.example .env.local
```
 
Fill in your credentials from step 2:
 
```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3b. Configure UserCheck (optional but recommended)

UserCheck runs through a Supabase Edge Function so the API key stays server-side.

1. Create a function secret in Supabase:
```bash
npx supabase secrets set USERCHECK_API_KEY=your_usercheck_api_key
```
2. Deploy the function:
```bash
npx supabase functions deploy usercheck
```
 
### 4. Apply database migrations
 
```bash
npx supabase db reset
```
 
### 5. Run the app
 
```bash
npm run dev
```
 
Open [http://localhost:5173](http://localhost:5173) in your browser.
 
## Tech Stack
 
- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Framer Motion
- React DnD
