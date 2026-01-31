# Sport Tournament Manager

## Why you see "Connection error"

The app needs **one running process** that serves both the API and the frontend. If you see a connection error, it means that process is not running (you haven’t started it, or you closed the terminal where it was running).

## How to run the app

1. Open a terminal in the project folder: `h:\Projects\Sport-Tournament-Manager`
2. Run: **`npm run dev`**
3. Wait until you see: **`serving on port 5000`**
4. In your browser, open: **http://localhost:5000**
5. **Keep that terminal open** while you use the app. If you close it or stop the process, you’ll get a connection error again.

**Do not use** `npm run dev:client` by itself — that only runs the frontend; the API runs only with `npm run dev`.
